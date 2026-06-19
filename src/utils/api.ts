import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform, DeviceEventEmitter } from 'react-native';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.error('CRITICAL: EXPO_PUBLIC_API_URL environment variable is undefined!');
} else {
  console.log('API Client successfully bound to endpoint:', process.env.EXPO_PUBLIC_API_URL);
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!process.env.EXPO_PUBLIC_API_URL) {
      console.error('Network Request Failed: EXPO_PUBLIC_API_URL is undefined. Cannot route API calls.');
    } else if (error.message === 'Network Error') {
      console.error(`Network Error: Ensure the backend is running and accessible at ${process.env.EXPO_PUBLIC_API_URL}`);
    } else {
      console.error('API Error:', error.message);
    }
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Token invalid or expired, emitting EXPIRED_TOKEN event.');
      DeviceEventEmitter.emit('EXPIRED_TOKEN');
    }
    
    return Promise.reject(error);
  }
);

api.interceptors.request.use(async (config) => {
  try {
    const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
    if (token) {
      console.log('Auth token found: yes');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('Auth token found: no');
    }
  } catch (e) {
    console.error('Error fetching token for request', e);
  }
  return config;
});

export const getTransactions = async () => {
  try {
    const response = await api.get('/transactions');
    return response.data;
  } catch (error) {
    console.error('Failed to get transactions', error);
    return [];
  }
};

export const getAccounts = async () => {
  try {
    const response = await api.get('/accounts');
    return response.data;
  } catch (error) {
    console.error('Failed to get accounts', error);
    return [];
  }
};

export const addAccount = async (account: { name: string; startingBalance: number }) => {
  try {
    const response = await api.post('/accounts', account);
    return response.data;
  } catch (error) {
    console.error('Failed to add account', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Failed to get categories', error);
    return [];
  }
};

export const addTransaction = async (transaction: any) => {
  try {
    const response = await api.post('/transactions', transaction);
    return response.data;
  } catch (error) {
    console.error('Failed to add transaction', error);
    throw error;
  }
};

export const deleteAccount = async (id: string) => {
  try {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete account', error);
    throw error;
  }
};

export const getAuthMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Failed to get auth me', error);
    throw error;
  }
};

export const updateAuthMe = async (data: any) => {
  try {
    const response = await api.put('/auth/me', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update auth me', error);
    throw error;
  }
};

export const addCategory = async (category: { name: string }) => {
  try {
    const response = await api.post('/categories', category);
    return response.data;
  } catch (error) {
    console.error('Failed to add category', error);
    throw error;
  }
};

export const updateCategory = async (id: string, name: string) => {
  try {
    const response = await api.put(`/categories/${id}`, { name });
    return response.data;
  } catch (error) {
    console.error('Failed to update category', error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete category', error);
    throw error;
  }
};

export const updateTransaction = async (id: string, transaction: any) => {
  try {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  } catch (error) {
    console.error('Failed to update transaction', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete transaction', error);
    throw error;
  }
};
