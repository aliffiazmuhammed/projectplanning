import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { IUser, SignInRequest, SignUpRequest } from '@project-planner/types';
import { api } from '../api/client.js';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: SignInRequest) => Promise<void>;
  signup: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session on app initialization via HTTP-only cookie
  useEffect(() => {
    async function verifySession() {
      try {
        const { user: freshUser } = await api.auth.getMe();
        setUser(freshUser);
      } catch {
        // No valid cookie session
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = useCallback(async (data: SignInRequest) => {
    const res = await api.auth.login(data);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (data: SignUpRequest) => {
    const res = await api.auth.signup(data);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Best-effort logout
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
