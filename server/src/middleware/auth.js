import { supabase } from '../lib/supabase.js';
import { HttpError, asyncHandler, unwrap } from '../lib/errors.js';

const STUDENT_DOMAIN = (process.env.STUDENT_EMAIL_DOMAIN || 'mail.kmutt.ac.th').toLowerCase();

export const isStudentEmail = (email) => email.endsWith(`@${STUDENT_DOMAIN}`);

/**
 * Verifies the Supabase access token (from Google sign-in), checks the email
 * domain and loads the user's profile row.
 *
 * Sets:
 *   req.authUser  { id, email, name }   - the Google identity
 *   req.profile   row of public.users, or null if not linked yet
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Missing access token');

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.email) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid or expired session');
  }

  const authUser = {
    id: data.user.id,
    email: data.user.email.toLowerCase(),
    name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
  };

  let profile = unwrap(
    await supabase.from('users').select('*').eq('auth_user_id', authUser.id).maybeSingle()
  );

  // First sign-in: link automatically if the email is already on file
  // (pre-registered advisors, or students whose email came from the roster).
  if (!profile) {
    profile = unwrap(
      await supabase
        .from('users')
        .update({ auth_user_id: authUser.id })
        .eq('email', authUser.email)
        .is('auth_user_id', null)
        .select('*')
        .maybeSingle()
    );
  }

  const allowed = isStudentEmail(authUser.email) || profile?.role === 'ADVISOR';
  if (!allowed) {
    throw new HttpError(403, 'DOMAIN_NOT_ALLOWED', `Please sign in with your @${STUDENT_DOMAIN} account`);
  }

  req.authUser = authUser;
  req.profile = profile;
  next();
});

/** Requires a linked profile, optionally with one of the given roles. */
export const requireProfile = (...roles) => (req, _res, next) => {
  if (!req.profile) {
    return next(new HttpError(409, 'NEEDS_LINK', 'Link your student ID before continuing'));
  }
  if (roles.length && !roles.includes(req.profile.role)) {
    return next(new HttpError(403, 'FORBIDDEN', 'You do not have access to this resource'));
  }
  next();
};
