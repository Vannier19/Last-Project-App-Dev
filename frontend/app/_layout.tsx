import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 🐛 Debug: Show API URL on app startup
  useEffect(() => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
    
    console.log('🚀 App Started!');
    console.log('📍 API URL:', apiUrl || 'NOT SET (using fallback)');
    console.log('🔥 Firebase Project:', firebaseProjectId || 'NOT SET');
    console.log('📱 Platform:', Platform.OS);
    
    // Show alert hanya di mobile (tidak di web)
    if (Platform.OS !== 'web') {
      setTimeout(() => {
        Alert.alert(
          '🐛 Debug Info',
          `API URL: ${apiUrl || 'NOT SET'}\n\nFirebase: ${firebaseProjectId || 'NOT SET'}\n\nPlatform: ${Platform.OS}`,
          [{ text: 'OK' }]
        );
      }, 1000);
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
