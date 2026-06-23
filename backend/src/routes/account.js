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

export default router;
