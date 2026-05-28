import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { registerPushToken } from '../services/pushService';
import { TokenResponse, Usuario } from '../types';

interface AuthContextData {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string, pushToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing session on mount
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const { data } = await api.get<Usuario>('/usuarios/me');
        setUser(data);
      }
    } catch {
      // Token expired or invalid — clear storage
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, senha: string, pushToken?: string) => {
    const { data } = await api.post<TokenResponse>('/auth/login', {
      email,
      senha,
      push_token: pushToken,
    });

    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);

    const { data: userData } = await api.get<Usuario>('/usuarios/me');
    setUser(userData);

    // Register push token after successful login (non-blocking)
    registerPushToken();
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // Ignore logout errors — clear local state anyway
    } finally {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<Usuario>('/usuarios/me');
      setUser(data);
    } catch {
      // If refresh fails, user stays as-is
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
