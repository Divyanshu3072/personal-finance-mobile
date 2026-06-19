import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { api } from '../src/utils/api';

export default function Signup() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/register', { email, password });
      await login(response.data.token, response.data.userId);
      // Wait for AuthContext routing to kick in, or forcefully go to onboarding
      router.replace('/onboarding');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-notion-bg justify-center p-8"
    >
      <Text className="text-4xl font-bold text-notion-text mb-2">Create Account</Text>
      <Text className="text-lg text-notion-gray mb-10">Start tracking your finances today.</Text>

      {error ? <Text className="text-red-500 mb-4 font-medium">{error}</Text> : null}

      <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Email</Text>
      <TextInput
        className="text-xl font-medium text-notion-text mb-6 py-2 border-b border-notion-border/50"
        placeholder="your@email.com"
        placeholderTextColor="#E9E9E7"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Password</Text>
      <TextInput
        className="text-xl font-medium text-notion-text mb-10 py-2 border-b border-notion-border/50"
        placeholder="••••••••"
        placeholderTextColor="#E9E9E7"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable 
        onPress={handleSignup}
        disabled={loading}
        className={`bg-notion-text py-4 rounded-xl items-center ${loading ? 'opacity-50' : 'active:opacity-80'}`}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Sign Up</Text>}
      </Pressable>

      <Pressable onPress={() => router.push('/login')} className="mt-8 items-center">
        <Text className="text-notion-gray font-medium">
          Already have an account? <Text className="text-notion-blue">Log in</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
