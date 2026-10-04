import { createClient } from '@supabase/supabase-js';

// Used only for Google sign-in. Data access goes through the Express API.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const STUDENT_EMAIL_DOMAIN = import.meta.env.VITE_STUDENT_EMAIL_DOMAIN || 'mail.kmutt.ac.th';

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      // "hd" pre-filters Google's account picker; the server enforces the domain.
      queryParams: { hd: STUDENT_EMAIL_DOMAIN, prompt: 'select_account' },
    },
  });
}
