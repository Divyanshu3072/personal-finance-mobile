import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform, DeviceEventEmitter } from 'react-native';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

type AuthContextType = {
  token: string | null;
  userId: string | null;
  login: (token: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
        const storedUserId = Platform.OS === 'web' ? localStorage.getItem('userId') : await SecureStore.getItemAsync('userId');
        if (storedToken && storedUserId) {
          setToken(storedToken);
          setUserId(storedUserId);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('EXPIRED_TOKEN', () => {
      logout();
    });
    return () => sub.remove();
  }, []);

  const login = async (newToken: string, newUserId: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('userToken', newToken);
      localStorage.setItem('userId', newUserId);
    } else {
      await SecureStore.setItemAsync('userToken', newToken);
      await SecureStore.setItemAsync('userId', newUserId);
    }
    setToken(newToken);
    setUserId(newUserId);
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userId');
    } else {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userId');
    }
    setToken(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useProtectedRoute = () => {
  const segments = useSegments();
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/');
    }
  }, [token, segments, isLoading, navigationState]);
};
