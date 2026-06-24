import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updateTransaction } from '../src/utils/api';
import { useAuth } from '../src/context/AuthContext';
import { useData } from '../src/context/DataContext';

export default function EditTransaction() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  
  const { accounts, categories, isInitializing, refreshTransactionsAndAccounts } = useData();
  
  const [amount, setAmount] = useState(params.amount ? String(Math.abs(Number(params.amount))) : '');
  const [reason, setReason] = useState(params.reason ? String(params.reason) : '');
  const [type, setType] = useState(params.type ? String(params.type) : 'OUTGOING');
  const [txDate, setTxDate] = useState(
    params.transactionDate 
      ? String(params.transactionDate).split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  
  const [selectedAccountId, setSelectedAccountId] = useState(params.accountId ? String(params.accountId) : '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(params.categoryId ? String(params.categoryId) : '');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isInitializing && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
    if (!isInitializing && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [accounts, categories, isInitializing, selectedAccountId, selectedCategoryId]);

  const handleSubmit = async () => {
    if (!amount || !reason || !selectedAccountId || !selectedCategoryId || !txDate || !params.id) return;
    setLoading(true);
    try {
      const dateObj = new Date(txDate);
      await updateTransaction(String(params.id), {
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
        amount: Number(amount),
        reason,
        type,
        transactionDate: dateObj.toISOString()
      });
      await refreshTransactionsAndAccounts();
      router.back();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (isInitializing || !token) {
    return (
      <View className="flex-1 bg-notion-bg items-center justify-center">
        <ActivityIndicator size="large" color="#37352F" />
      </View>
    );
  }

  const isValid = amount && reason && selectedAccountId && selectedCategoryId && txDate;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-notion-bg"
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
      
        <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Amount</Text>
        <TextInput
          className="text-5xl font-bold text-notion-text mb-8 py-2 border-b border-notion-border/50"
          placeholder="0.00"
          placeholderTextColor="#E9E9E7"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Reason</Text>
        <TextInput
          className="text-xl text-notion-text mb-8 py-2 border-b border-notion-border/50"
          placeholder="What was this for?"
          placeholderTextColor="#9B9A97"
          value={reason}
          onChangeText={setReason}
        />

        <Text className="text-xs font-bold text-notion-gray mb-3 uppercase tracking-widest">Date (YYYY-MM-DD)</Text>
        <TextInput
          className="text-xl text-notion-text mb-8 py-2 border-b border-notion-border/50"
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9B9A97"
          value={txDate}
          onChangeText={setTxDate}
        />

        <Text className="text-xs font-bold text-notion-gray mb-3 uppercase tracking-widest">Type</Text>
        <View className="flex-row gap-4 mb-8">
          {['OUTGOING', 'INCOMING'].map(t => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 py-3 rounded-xl border items-center ${type === t ? 'border-notion-text bg-notion-text' : 'border-notion-border bg-notion-bg'}`}
            >
              <Text className={`font-semibold ${type === t ? 'text-white' : 'text-notion-text'}`}>{t === 'OUTGOING' ? 'Expense' : 'Income'}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-bold text-notion-gray mb-3 uppercase tracking-widest">Account</Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {accounts.map(acc => (
             <Pressable
               key={acc.id}
               onPress={() => setSelectedAccountId(acc.id)}
               className={`px-4 py-2 rounded-full border ${selectedAccountId === acc.id ? 'border-notion-blue bg-notion-blue/10' : 'border-notion-border bg-notion-bg'}`}
             >
               <Text className={`font-medium ${selectedAccountId === acc.id ? 'text-notion-blue' : 'text-notion-gray'}`}>{acc.name}</Text>
             </Pressable>
          ))}
          {accounts.length === 0 && <Text className="text-notion-gray text-sm">No accounts found.</Text>}
        </View>

        <Text className="text-xs font-bold text-notion-gray mb-3 uppercase tracking-widest">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-12">
          {categories.map(cat => (
             <Pressable
               key={cat.id}
               onPress={() => setSelectedCategoryId(cat.id)}
               className={`px-4 py-2 rounded-full border ${selectedCategoryId === cat.id ? 'border-notion-text bg-notion-text/10' : 'border-notion-border bg-notion-bg'}`}
             >
               <Text className={`font-medium capitalize ${selectedCategoryId === cat.id ? 'text-notion-text' : 'text-notion-gray'}`}>{cat.name}</Text>
             </Pressable>
          ))}
          {categories.length === 0 && <Text className="text-notion-gray text-sm">No categories found.</Text>}
        </View>

        <Pressable 
          onPress={handleSubmit}
          disabled={loading || !isValid}
          className={`bg-notion-text py-4 rounded-xl items-center ${(loading || !isValid) ? 'opacity-50' : 'active:opacity-80'}`}
        >
          <Text className="text-white font-bold text-lg">{loading ? 'Saving...' : 'Update Transaction'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
