import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import { SESSION_EXPIRED_EVENT, tokens } from '../lib/http';
import type { User } from '../types/api';

interface AuthValue {
  user: User | null;
  /** true until the first /users/me check has finished */
  loading: boolean;
  login: (identity: string, password: string) => Promise<void>;
  register: (body: { email: string; username: string; display_name: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthValue>(null as unknown as AuthValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(tokens.access() || tokens.refresh()));

  const refreshUser = useCallback(async () => {
    if (!tokens.access() && !tokens.refresh()) { setUser(null); return; }
    try {
      setUser(await api.getMe());
    } catch (err) {
      // Only drop the session when the server says it is invalid; a network blip keeps you signed in.
      if ((err as { status?: number }).status === 401) { tokens.clear(); setUser(null); }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [refreshUser]);

  const accept = (pair: Awaited<ReturnType<typeof api.login>>) => {
    tokens.save(pair);
    setUser(pair.user);
  };

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    login: async (identity, password) => accept(await api.login(identity, password)),
    register: async (body) => accept(await api.register(body)),
    logout: async () => {
      await api.logout();
      tokens.clear();
      setUser(null);
    },
    refreshUser,
  }), [user, loading, refreshUser]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
