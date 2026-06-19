import { Stack } from 'expo-router';
import '../global.css'; // Import NativeWind global css
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useProtectedRoute } from '../src/context/AuthContext';

function RootLayoutInner() {
  useProtectedRoute();
  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
      },
      headerShadowVisible: false,
      headerTintColor: '#37352F',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      contentStyle: {
        backgroundColor: '#FFFFFF',
      }
    }}>
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ title: 'Welcome', presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="add-transaction" options={{ title: 'New Transaction', presentation: 'modal' }} />
      <Stack.Screen name="edit-transaction" options={{ title: 'Edit Transaction', presentation: 'modal' }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
