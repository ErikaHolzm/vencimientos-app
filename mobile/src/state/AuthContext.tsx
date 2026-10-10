import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { clearNotifications } from '../lib/notifications';
import { tokenStorage } from '../lib/storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: AuthStatus;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Guarda la sesión. El token va en un almacén seguro (ver lib/storage.ts), no en almacenamiento común. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    tokenStorage
      .get()
      .then((saved) => {
        setToken(saved);
        setStatus(saved ? 'signedIn' : 'signedOut');
      })
      .catch(() => setStatus('signedOut'));
  }, []);

  const startSession = useCallback(async (newToken: string) => {
    await tokenStorage.set(newToken);
    setToken(newToken);
    setStatus('signedIn');
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      await startSession(res.token);
    },
    [startSession],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.register(email, password);
      await startSession(res.token);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    await tokenStorage.clear().catch(() => undefined);
    await clearNotifications().catch(() => undefined);
    setToken(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(() => ({ status, token, login, register, logout }), [status, token, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
