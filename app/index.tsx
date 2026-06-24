import { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteTransaction } from '../src/utils/api';
import { useAuth } from '../src/context/AuthContext';
import { useData } from '../src/context/DataContext';

export default function Dashboard() {
  const [filterType, setFilterType] = useState('ALL'); // ALL, TODAY, THIS_WEEK, THIS_MONTH
  const router = useRouter();
  const { token } = useAuth();
  
  const { 
    transactions, 
    accounts, 
    userProfile,
    isInitializing, 
    isRefreshing, 
    forceRefresh,
    refreshTransactionsAndAccounts,
    lastUpdatedText,
    refreshFailed
  } = useData();

  useEffect(() => {
    if (!isInitializing && userProfile && userProfile.onboardingCompleted === false && (!accounts || accounts.length === 0)) {
      router.replace('/onboarding');
    }
  }, [userProfile, accounts, isInitializing]);

  if (isInitializing || !token) {
    return (
      <View className="flex-1 bg-notion-bg items-center justify-center">
        <ActivityIndicator size="large" color="#37352F" />
      </View>
    );
  }

  const totalBalance = (accounts || []).reduce((sum, acc) => sum + (Number(acc?.startingBalance) || 0), 0);

  const filteredTransactions = (transactions || []).filter(t => {
    if (filterType === 'ALL') return true;
    const tDate = new Date(t.transactionDate || t.createdAt);
    const today = new Date();
    
    if (filterType === 'TODAY') {
      return tDate.toDateString() === today.toDateString();
    }
    
    if (filterType === 'THIS_WEEK') {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      return tDate >= firstDay;
    }
    
    if (filterType === 'THIS_MONTH') {
      return tDate.getMonth() === new Date().getMonth() && tDate.getFullYear() === new Date().getFullYear();
    }
    return true;
  });

  const handleLongPress = (item: any) => {
    Alert.alert(
      "Transaction Options",
      `Manage transaction for ${item.reason || 'General'}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Edit", 
          onPress: () => router.push({ pathname: '/edit-transaction', params: { ...item } }) 
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            Alert.alert("Confirm", "Are you sure you want to delete this transaction?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => {
                  try {
                    await deleteTransaction(item.id);
                    await refreshTransactionsAndAccounts();
                  } catch (e) {
                    Alert.alert("Error", "Could not delete transaction");
                  }
              }}
            ]);
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-notion-bg">
      {/* Sticky Header */}
      <View className="px-6 py-8 border-b border-notion-border/50 bg-notion-bg z-10 shadow-sm">
        <View className="flex-row justify-between items-end mb-6">
          <View>
            <Text className="text-notion-gray text-xs font-bold uppercase tracking-widest mb-2">Total Balance</Text>
            <Text className="text-notion-text text-5xl font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalBalance)}</Text>
          </View>
          <View className="flex-row items-center gap-4 pb-2">
            {accounts.length === 0 && (
              <Pressable onPress={() => router.push('/onboarding')}>
                <Text className="text-notion-blue font-medium">Setup</Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.push('/profile')}>
              <Text className="text-notion-text font-medium">Profile</Text>
            </Pressable>
          </View>
        </View>
        
        {accounts.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {accounts.map((acc: any) => (
              <View key={acc.id} className="w-[31%] bg-white p-3 rounded-lg border border-notion-border shadow-sm mb-2">
                <Text className="text-notion-gray text-[10px] font-bold uppercase tracking-wider mb-1" numberOfLines={1}>{acc.name}</Text>
                <Text className="text-notion-text font-bold text-xs" numberOfLines={1}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(acc.balance ?? acc.startingBalance))}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Filters */}
      <View className="px-6 py-4 bg-notion-bg border-b border-notion-border/50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'].map(f => (
            <Pressable 
              key={f}
              onPress={() => setFilterType(f)}
              className={`mr-2 px-4 py-2 rounded-full border ${filterType === f ? 'bg-notion-text border-notion-text' : 'bg-notion-bg border-notion-border'}`}
            >
              <Text className={`text-xs font-bold ${filterType === f ? 'text-white' : 'text-notion-gray'}`}>
                {f.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      
      {refreshFailed && (
        <View className="bg-red-100 px-6 py-2">
          <Text className="text-red-600 text-xs text-center font-medium">Could not refresh. Showing saved data.</Text>
        </View>
      )}
      
      {!!lastUpdatedText && !refreshFailed && (
        <View className="px-6 py-2">
          <Text className="text-notion-gray text-xs text-center">{lastUpdatedText}</Text>
        </View>
      )}

      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={forceRefresh} />}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleLongPress(item)} className="flex-row justify-between items-center py-4 border-b border-notion-border/50 active:opacity-60">
            <View>
              <Text className="text-notion-text font-medium text-lg">{item.reason || 'Transaction'}</Text>
              <Text className="text-notion-gray text-sm mt-1">{item.category || 'General'} • {new Date(item.transactionDate || item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text className={`font-semibold text-lg ${item.type === 'INCOMING' ? 'text-green-600' : 'text-red-600'}`}>
              {item.type === 'INCOMING' ? '+' : '-'}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(Number(item.amount) || 0))}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <Text className="text-notion-gray text-base">No transactions yet.</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <Pressable 
        className="absolute bottom-8 right-6 bg-notion-text w-14 h-14 rounded-full items-center justify-center shadow-lg active:opacity-80"
        onPress={() => router.push('/add-transaction')}
      >
        <Text className="text-white text-3xl font-light leading-none mb-1">+</Text>
      </Pressable>
    </View>
  );
}
