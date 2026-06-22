import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { User, LoginRequest, LoginResponse } from '../types/api';
import { api, ApiException } from '../lib/apiClient';

interface AuthState {
  user: User | null;
  isLoading: boolean;   
  error: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,   
    error: null,
  });

 
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setState({ user: null, isLoading: false, error: null });
      return;
    }
    api
      .get<User>('/api/v1/auth/me')
      .then((user) => setState({ user, isLoading: false, error: null }))
      .catch(() => {
        localStorage.removeItem('jwt');
        setState({ user: null, isLoading: false, error: null });
      });
  }, []);

  const login = useCallback(async (creds: LoginRequest) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const { token } = await api.post<LoginResponse>('/api/v1/auth/login', creds);
      localStorage.setItem('jwt', token);
      const user = await api.get<User>('/api/v1/auth/me');
      setState({ user, isLoading: false, error: null });
    } catch (e) {
      const msg = e instanceof ApiException ? e.data.message : 'Error de conexión';
      setState({ user: null, isLoading: false, error: msg });
      throw e; // el componente puede capturarlo si necesita
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setState({ user: null, isLoading: false, error: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, isAuthenticated: !!state.user, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
