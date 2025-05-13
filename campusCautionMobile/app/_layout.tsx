import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import firebase from '@react-native-firebase/app';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Firebase initialization
if (!firebase.apps.length) {
  try {
    const firebaseConfig = {
      apiKey: 'AIzaSyBRvp3vb3IhP7eUHpZ0Qa4P5zmkLAJX5KA',
      appId: '1:465128947457:android:409417f2b06dc19c2e6500',
      projectId: 'user-service-a8931',
      storageBucket: 'user-service-a8931.firebasestorage.app',
      messagingSenderId: '465128947457',
    };
    
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase explicitly initialized in _layout.tsx');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

console.log('Firebase app count after initialization:', firebase.apps.length);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
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
