/**
 * Account Lifecycle API Routes
 *
 * DELETE /api/account — Hard-delete authenticated user account
 *
 * Separates auth lifecycle concerns from batch/data routes,
 * following existing pattern (fraud.js exists for similar separation). 
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../db.js';

const router = Router();

/**
 * DELETE /api/account
 *
 * Hard-delete the authenticated user's account using service-role privileges.
 * 
 * Process:
 * 1. Hard-delete auth.users record via supabase.auth.admin.deleteUser()
 * 2. Database cascades: profiles CASCADE deleted, batches.farmer_id SET NULL
 * 3. Create audit log entry (best-effort - log failure does not block success)
 *
 * Response:
 *   200 { success: true, message: "Account deleted successfully" }
 *   401 Missing or invalid JWT token (handled by requireAuth middleware)
 *   500 Internal error (deletion failed)
 */
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Hard-delete auth.users record using service-role client
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[account] deleteUser failed:', deleteError.message);
      return res.status(500).json({
        error: 'Failed to delete account',
        details: deleteError.message,
      });
    }

    // Step 2: Create audit log entry (best-effort after successful deletion)
    // Log failure must NOT block the 200 response (deletion already happened)
    try {
      const { error: logError } = await supabase
        .from('account_deletion_log')
        .insert({ user_id: userId });

      if (logError) {
        console.warn('[account] Audit log insert failed (non-blocking):', logError.message);
      }
    } catch (auditError) {
      console.warn('[account] Audit logging error (non-blocking):', auditError.message);
    }

    // Return success response
    return res.status(200).json({
      ok: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('[account] Unexpected error:', error);
    return res.status(500).json({
      error: 'Failed to delete account',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/account
 *
 * Update the authenticated user's username and/or email address.
 *
 * Request body:
 *   { username?: string, email?: string }
 *
 * Response:
 *   200 { ok: true, message: "Profile updated successfully", profile: { ... } }
 *   400 Validation errors
 *   409 Unique constraint violations (username taken or email in use)
 *   500 Internal error
 */
router.patch('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  // Validate request
  const errors = [];
  if (username !== undefined) {
    const trimmedUsername = String(username).trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      errors.push({ field: 'username', message: 'Username must be between 3 and 30 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      errors.push({ field: 'username', message: 'Username can only contain alphanumeric characters, underscores, and hyphens' });
    }
  }

  if (email !== undefined) {
    const trimmedEmail = String(email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    let profileUpdate = {};

    if (username !== undefined) {
      profileUpdate.username = username.trim();
    }

    // 1. If updating email
    if (email !== undefined) {
      const targetEmail = email.trim();
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: targetEmail
      });

      if (authError) {
        console.error('[account] auth email update failed:', authError.message);
        if (authError.message.includes('already exists') || authError.message.includes('unique') || authError.status === 422) {
          return res.status(409).json({ error: 'Email address is already in use by another account' });
        }
        return res.status(400).json({ error: authError.message });
      }
    }

    // 2. If updating username
    if (Object.keys(profileUpdate).length > 0) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error('[account] profile update failed:', profileError.message);
        if (profileError.code === '23505' || profileError.message.includes('unique')) {
          return res.status(409).json({ error: 'Username is already taken' });
        }
        return res.status(400).json({ error: profileError.message });
      }
    }

    // 3. Fetch updated profile
    const { data: updatedProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (getError) throw getError;

    return res.status(200).json({
      ok: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('[account] update unexpected error:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

export default router;

