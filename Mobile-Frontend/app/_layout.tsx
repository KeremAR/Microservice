import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { GluestackUIProvider, Spinner, Box } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Keep preventing auto-hide at the top level
SplashScreen.preventAutoHideAsync();

export default function RootLayoutNav() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // This RootLayoutNav only handles font loading now
  if (!fontsLoaded) {
    return null; // Don't render anything until fonts are loaded
  }

  // Fonts are loaded, proceed to render the main layout with AuthProvider
  return (
    <AuthProvider>
      <GluestackUIProvider config={config}>
        <RootLayout /> 
      </GluestackUIProvider>
    </AuthProvider>
  );
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isNavigationComplete, setIsNavigationComplete] = useState(false);

  // Effect for navigation based on auth state
  useEffect(() => {
    console.log("Auth Effect Running - isLoading:", isLoading, "accessToken:", !!accessToken, "segments:", segments);
    
    if (isLoading) {
        console.log("Auth Effect: Still loading, doing nothing.");
        setIsNavigationComplete(false); 
        return; 
    }

    const inAuthGroup = segments[0] === '(app)';
    let navigated = false;

    // Check segments length to avoid errors on initial load if segments are empty
    if (segments.length > 0) { 
        if (accessToken && !inAuthGroup) {
          console.log("Auth Effect: Signed in, replacing route to (app)");
          router.replace('/(app)'); 
          navigated = true;
        } else if (!accessToken && inAuthGroup) {
          console.log("Auth Effect: Signed out, replacing route to login");
          router.replace('/login');
          navigated = true;
        }
    }
    
    // If no navigation happened but accessToken is loaded, 
    // ensure navigation state is marked complete.
    if (!navigated) {
         console.log("Auth Effect: No navigation needed or initial load.");
    }

    setIsNavigationComplete(true);
    console.log(`Auth Effect: Navigation check complete. (Navigated: ${navigated})`);

  }, [isLoading, accessToken, segments, router]);

  // Effect for hiding the splash screen *after* loading and navigation check
  useEffect(() => {
    if (!isLoading && isNavigationComplete) {
      console.log("Conditions met to hide Splash Screen. Waiting slightly...");
      // Introduce a small delay before hiding the splash screen
      const timer = setTimeout(() => {
        console.log("Hiding Splash Screen now!");
        SplashScreen.hideAsync();
      }, 100); // Delay in milliseconds (adjust if needed)

      // Clear the timer if the component unmounts or dependencies change
      return () => clearTimeout(timer);
    }
  }, [isLoading, isNavigationComplete]);


  // Render loading spinner OR the main stack based on loading/navigation state
  if (isLoading || !isNavigationComplete) {
    console.log(`RootLayout: Rendering Loading Spinner (isLoading: ${isLoading}, isNavigationComplete: ${isNavigationComplete})`);
    // Render spinner within necessary providers
    return (
       <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Box flex={1} justifyContent="center" alignItems="center">
             <Spinner size="large" />
          </Box>
      </ThemeProvider>
    );
  }
  
  console.log("RootLayout: Rendering main stack structure");
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" /> 
        <Stack.Screen name="login" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
