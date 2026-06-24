import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getTransactions, getAccounts, getCategories, getAuthMe } from '../utils/api';
import { useAuth } from './AuthContext';
import { 
  getCachedData, 
  setCachedData, 
  shouldRefresh, 
  updateRefreshTimestamp,
  getLastRefreshTimestamp 
} from '../utils/cache';

type DataContextType = {
  transactions: any[];
  accounts: any[];
  categories: any[];
  userProfile: any;
  isInitializing: boolean;
  isRefreshing: boolean;
  lastUpdatedText: string;
  forceRefresh: () => Promise<void>;
  refreshTransactionsAndAccounts: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshAccountsAndProfile: () => Promise<void>;
  refreshFailed: boolean;
};

const DataContext = createContext<DataContextType>({
  transactions: [],
  accounts: [],
  categories: [],
  userProfile: null,
  isInitializing: true,
  isRefreshing: false,
  lastUpdatedText: '',
  forceRefresh: async () => {},
  refreshTransactionsAndAccounts: async () => {},
  refreshAccounts: async () => {},
  refreshCategories: async () => {},
  refreshUserProfile: async () => {},
  refreshAccountsAndProfile: async () => {},
  refreshFailed: false,
});

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, userId, isLoading: authLoading } = useAuth();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedText, setLastUpdatedText] = useState('');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    if (
      d.getDate() === today.getDate() && 
      d.getMonth() === today.getMonth() && 
      d.getFullYear() === today.getFullYear()
    ) {
      return `Last updated today, ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    return `Last updated ${d.toLocaleDateString()}, ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  const loadData = useCallback(async (force: boolean) => {
    if (!userId || !token) return;
    
    // If not forcing, check cache
    if (!force) {
      setIsInitializing(true);
      const [cAccounts, cTransactions, cCategories, cProfile, cLastRefresh] = await Promise.all([
        getCachedData('cachedAccounts', userId),
        getCachedData('cachedTransactions', userId),
        getCachedData('cachedCategories', userId),
        getCachedData('cachedUserProfile', userId),
        getLastRefreshTimestamp(userId)
      ]);
      
      let hasAnyCache = false;
      if (cAccounts) { setAccounts(cAccounts); hasAnyCache = true; }
      if (cTransactions) { setTransactions(cTransactions); hasAnyCache = true; }
      if (cCategories) { setCategories(cCategories); hasAnyCache = true; }
      if (cProfile) { setUserProfile(cProfile); hasAnyCache = true; }
      
      if (cLastRefresh) {
        setLastUpdatedText(formatTime(cLastRefresh));
      }
      
      setIsInitializing(false);
      setHasLoadedInitial(true);
      
      const needsRefresh = await shouldRefresh(userId);
      if (!needsRefresh && hasAnyCache) {
        return; // Cache is fresh enough
      }
    }
    
    // Fetch from backend
    setIsRefreshing(true);
    setRefreshFailed(false);
    try {
      const [tx, accs, cats, auth] = await Promise.all([
        getTransactions().catch(() => null),
        getAccounts().catch(() => null),
        getCategories().catch(() => null),
        getAuthMe().catch(() => null)
      ]);
      
      let success = false;
      if (tx) { setTransactions(tx); await setCachedData('cachedTransactions', userId, tx); success = true; }
      if (accs) { setAccounts(accs); await setCachedData('cachedAccounts', userId, accs); success = true; }
      if (cats) { setCategories(cats); await setCachedData('cachedCategories', userId, cats); success = true; }
      if (auth) { setUserProfile(auth); await setCachedData('cachedUserProfile', userId, auth); success = true; }
      
      if (success) {
        await updateRefreshTimestamp(userId);
        const now = new Date().toISOString();
        setLastUpdatedText(formatTime(now));
      } else {
        setRefreshFailed(true);
      }
    } catch (e) {
      console.error('Failed to refresh data', e);
      setRefreshFailed(true);
    } finally {
      setIsRefreshing(false);
      setIsInitializing(false);
      setHasLoadedInitial(true);
    }
  }, [userId, token]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!token || !userId) {
      // Clear in-memory state on logout
      setTransactions([]);
      setAccounts([]);
      setCategories([]);
      setUserProfile(null);
      setLastUpdatedText('');
      setHasLoadedInitial(false);
      setIsInitializing(true);
      return;
    }
    
    // Only load if we haven't loaded for this user yet
    if (!hasLoadedInitial) {
      loadData(false);
    }
  }, [token, userId, authLoading, hasLoadedInitial, loadData]);

  const forceRefresh = async () => {
    await loadData(true);
  };

  const refreshTransactionsAndAccounts = async () => {
    if (!userId || !token) return;
    setIsRefreshing(true);
    try {
      const [tx, accs] = await Promise.all([
        getTransactions().catch(() => null),
        getAccounts().catch(() => null)
      ]);
      if (tx) { setTransactions(tx); await setCachedData('cachedTransactions', userId, tx); }
      if (accs) { setAccounts(accs); await setCachedData('cachedAccounts', userId, accs); }
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshAccounts = async () => {
    if (!userId || !token) return;
    setIsRefreshing(true);
    try {
      const accs = await getAccounts().catch(() => null);
      if (accs) { setAccounts(accs); await setCachedData('cachedAccounts', userId, accs); }
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshCategories = async () => {
    if (!userId || !token) return;
    setIsRefreshing(true);
    try {
      const cats = await getCategories().catch(() => null);
      if (cats) { setCategories(cats); await setCachedData('cachedCategories', userId, cats); }
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshUserProfile = async () => {
    if (!userId || !token) return;
    setIsRefreshing(true);
    try {
      const auth = await getAuthMe().catch(() => null);
      if (auth) { setUserProfile(auth); await setCachedData('cachedUserProfile', userId, auth); }
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshAccountsAndProfile = async () => {
    if (!userId || !token) return;
    setIsRefreshing(true);
    try {
      const [accs, auth] = await Promise.all([
        getAccounts().catch(() => null),
        getAuthMe().catch(() => null)
      ]);
      if (accs) { setAccounts(accs); await setCachedData('cachedAccounts', userId, accs); }
      if (auth) { setUserProfile(auth); await setCachedData('cachedUserProfile', userId, auth); }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <DataContext.Provider value={{
      transactions,
      accounts,
      categories,
      userProfile,
      isInitializing,
      isRefreshing,
      lastUpdatedText,
      forceRefresh,
      refreshTransactionsAndAccounts,
      refreshAccounts,
      refreshCategories,
      refreshUserProfile,
      refreshAccountsAndProfile,
      refreshFailed,
    }}>
      {children}
    </DataContext.Provider>
  );
};
