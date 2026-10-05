import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { api } from './api';
import { errorText } from './errors';

export const AuthContext = createContext(null);

/**
 * state: loading | signedOut | needsLink | ready
 * error: { code, message, email } from the last failed sign-in (e.g. wrong domain)
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState('loading');
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);

  const loadMe = useCallback(async (session) => {
    if (!session) {
      setMe(null);
      setState('signedOut');
      return;
    }
    try {
      const data = await api.me();
      setMe(data);
      setError(null);
      setState(data.needsLink ? 'needsLink' : 'ready');
    } catch (err) {
      setError({ code: err.code, message: errorText(err), email: session.user?.email ?? null });
      await supabase.auth.signOut();
      setMe(null);
      setState('signedOut');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => loadMe(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') loadMe(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadMe]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadMe(data.session);
  }, [loadMe]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return (
    <AuthContext.Provider value={{ state, me, profile: me?.profile, error, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
