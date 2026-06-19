import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { addAccount, updateAuthMe } from '../src/utils/api';

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State for dynamic accounts
  const [accountsData, setAccountsData] = useState([{ name: '', startingBalance: '' }]);

  const handleUpdateAccount = (index: number, field: 'name' | 'startingBalance', value: string) => {
    const newData = [...accountsData];
    newData[index][field] = value;
    setAccountsData(newData);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await Promise.all(
        accountsData.map(acc => 
          addAccount({
            name: acc.name || `Account ${Math.floor(Math.random() * 1000)}`,
            startingBalance: Number(acc.startingBalance) || 0
          })
        )
      );
      try {
        await updateAuthMe({ onboardingCompleted: true });
      } catch (err) {
        console.error('Failed to update onboarding on backend, using local fallback', err);
      }
      
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('onboardingCompleted', 'true');
      }

      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    } catch (e) {
      console.error(e);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-notion-bg"
    >
      <ScrollView contentContainerStyle={{ padding: 32, flexGrow: 1, paddingTop: 60, paddingBottom: 60 }}>
        <Text className="text-4xl font-bold text-notion-text mb-4">Welcome.</Text>
        <Text className="text-lg text-notion-gray mb-12">Let's set up your bank accounts.</Text>

        {accountsData.map((acc, index) => (
          <View key={index} className="mb-10 p-4 border border-notion-border/50 rounded-xl bg-notion-bg">
            <Text className="text-sm font-bold text-notion-text mb-6">Account {index + 1}</Text>
            
            <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Account Name</Text>
            <TextInput
              className="text-xl font-medium text-notion-text mb-8 py-2 border-b border-notion-border/50"
              placeholder="e.g. Checking"
              placeholderTextColor="#E9E9E7"
              value={acc.name}
              onChangeText={(t) => handleUpdateAccount(index, 'name', t)}
            />

            <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Starting Balance</Text>
            <TextInput
              className="text-xl font-medium text-notion-text mb-4 py-2 border-b border-notion-border/50"
              placeholder="0.00"
              placeholderTextColor="#E9E9E7"
              keyboardType="numeric"
              value={acc.startingBalance}
              onChangeText={(t) => handleUpdateAccount(index, 'startingBalance', t)}
            />
          </View>
        ))}

        <Pressable 
          onPress={() => setAccountsData([...accountsData, { name: '', startingBalance: '' }])}
          className="py-4 border border-notion-border border-dashed rounded-xl items-center active:opacity-80 mb-6"
        >
          <Text className="text-notion-gray font-bold text-lg">+ Add Another Account</Text>
        </Pressable>

        <Pressable 
          onPress={handleComplete}
          disabled={loading}
          className={`bg-notion-text py-4 mt-4 rounded-xl items-center ${loading ? 'opacity-50' : 'active:opacity-80'}`}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Continue to Dashboard</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
