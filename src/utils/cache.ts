import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Track if we have already warned about the cache being unavailable in this session
let hasWarnedAboutCache = false;

const handleCacheError = () => {
  if (!hasWarnedAboutCache) {
    console.warn("Local cache unavailable in this environment. Using live backend data.");
    hasWarnedAboutCache = true;
  }
};

export const setCachedData = async (key: string, userId: string, data: any) => {
  try {
    const namespacedKey = `${key}_${userId}`;
    const stringifiedData = JSON.stringify(data);
    if (isWeb) {
      localStorage.setItem(namespacedKey, stringifiedData);
    } else {
      await AsyncStorage.setItem(namespacedKey, stringifiedData);
    }
  } catch (e) {
    handleCacheError();
  }
};

export const getCachedData = async (key: string, userId: string) => {
  try {
    const namespacedKey = `${key}_${userId}`;
    let data = null;
    if (isWeb) {
      data = localStorage.getItem(namespacedKey);
    } else {
      data = await AsyncStorage.getItem(namespacedKey);
    }
    return data ? JSON.parse(data) : null;
  } catch (e) {
    handleCacheError();
    return null;
  }
};

export const clearUserCache = async (userId: string) => {
  const keysToClear = [
    `cachedAccounts_${userId}`,
    `cachedTransactions_${userId}`,
    `cachedCategories_${userId}`,
    `cachedUserProfile_${userId}`,
    `lastDataRefreshAt_${userId}`,
  ];

  try {
    if (isWeb) {
      keysToClear.forEach(key => localStorage.removeItem(key));
    } else {
      await Promise.all(keysToClear.map(key => AsyncStorage.removeItem(key)));
    }
  } catch (e) {
    handleCacheError();
  }
};

export const updateRefreshTimestamp = async (userId: string) => {
  await setCachedData('lastDataRefreshAt', userId, new Date().toISOString());
};

export const getLastRefreshTimestamp = async (userId: string) => {
  return await getCachedData('lastDataRefreshAt', userId);
};

export const shouldRefresh = async (userId: string) => {
  const lastRefresh = await getLastRefreshTimestamp(userId);
  if (!lastRefresh) return true;

  const lastRefreshDate = new Date(lastRefresh);
  const today = new Date();

  return (
    lastRefreshDate.getDate() !== today.getDate() ||
    lastRefreshDate.getMonth() !== today.getMonth() ||
    lastRefreshDate.getFullYear() !== today.getFullYear()
  );
};
