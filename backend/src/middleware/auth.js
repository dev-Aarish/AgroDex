import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/config.js';
import { supabase as dbClient } from '../db.js';

// Create Supabase client for auth verification
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Middleware to verify Supabase JWT token
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request object
    req.user = user;

    dbClient
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)
      .then(({ error: updateErr }) => {
        if (updateErr) {
          console.error('[auth] last_active_at update failed:', updateErr.message);
        }
      });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
}

/**
 * Optional auth middleware - allows both authenticated and anonymous access
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token && token !== 'undefined' && token !== 'null') {
        const { data } = await supabase.auth.getUser(token);
        req.user = data?.user || null;
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}
