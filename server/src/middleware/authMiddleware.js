import { supabaseAdmin, createUserSupabaseClient } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or malformed Authorization header with Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Check for demo bypass token if explicitly testing in local demo mode
    if (token === 'demo-test-token' && process.env.NODE_ENV !== 'production') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo-supermart@shelfpulse.ai',
        user_metadata: {
          store_name: 'Apna Supermart Demo',
          owner_name: 'Stage Presenter'
        }
      };
      req.token = token;
      req.supabase = supabaseAdmin;
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: error?.message || 'Unauthorized: Invalid or expired Supabase authentication token.'
      });
    }

    // Attach verified user and per-request RLS-scoped Supabase client
    req.user = user;
    req.token = token;
    req.supabase = createUserSupabaseClient(token);

    next();
  } catch (err) {
    console.error('Auth Middleware Exception:', err);
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failure.'
    });
  }
}
