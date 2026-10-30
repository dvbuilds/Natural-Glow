import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/admin.js';
import { setUnauthorizedHandler, tokenStore } from '../api/client.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [admin, setAdmin] = useState(null);
  // 'checking' while a stored token is being verified with GET /admin/auth/me
  const [status, setStatus] = useState(tokenStore.get() ? 'checking' : 'anonymous');

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    // Any 401 on an authenticated call (expired token, deactivated admin) signs the admin out.
    setUnauthorizedHandler(() => {
      clearSession();
      toast.info('Your session has ended. Please sign in again.');
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, toast]);

  useEffect(() => {
    if (status !== 'checking') return undefined;
    let active = true;
    adminApi
      .me()
      .then((r) => {
        if (!active) return;
        setAdmin(r.data);
        setStatus('authenticated');
      })
      .catch(() => active && clearSession());
    return () => {
      active = false;
    };
  }, [status, clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await adminApi.login({ email, password });
    tokenStore.set(data.token);
    setAdmin(data.admin);
    setStatus('authenticated');
  }, []);

  const value = useMemo(
    () => ({ admin, status, login, logout: clearSession, isAuthenticated: status === 'authenticated' }),
    [admin, status, login, clearSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
