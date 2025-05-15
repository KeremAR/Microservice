import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useCallback } from 'react';
import 'react-native-reanimated';

import firebase from '@react-native-firebase/app';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { 
  registerForPushNotificationsAsync, 
  addNotificationListener,
  addNotificationResponseListener
} from '@/services/notificationService';
import * as Notifications from 'expo-notifications';
import { NotificationBackground } from '@/components/NotificationBackground';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Initialize Firebase App at the module level
if (firebase.apps.length === 0) {
  try {
    // @ts-ignore - Parameterless call is correct for default app auto-init
    firebase.initializeApp(); // For the default app
    console.log('[Firebase] App initialized successfully in app/_layout.tsx (top level).');
    console.log('[Firebase] Existing apps after init:', firebase.apps.map(app => app.name).join(', ') || 'None');
  } catch (e: any) {
    console.error('[Firebase] Error initializing app in app/_layout.tsx (top level):', e.message, e);
  }
} else {
  console.log('[Firebase] App already initialized. Existing apps:', firebase.apps.map(app => app.name).join(', ') || 'None');
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Firebase initialization is now done at the top level of this module.
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
