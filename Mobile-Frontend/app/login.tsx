import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Image,
  Input,
  InputField,
  Button,
  ButtonText,
  Link,
  LinkText,
  VStack, // Vertical Stack for layout
  Heading, // For the main title
  FormControl, // For Input labels (optional but good practice)
  Divider, // Import Divider
} from '@gluestack-ui/themed';
import { Stack, useRouter, Redirect } from 'expo-router'; // Import Redirect
import { Alert } from 'react-native'; // Import Alert for feedback
import { useAuth } from '../context/AuthContext'; // Import useAuth

// Assuming the logo path is correct relative to the root
const logo = require('../assets/images/au-logo.png');
// Placeholder for the flag image/component
// const flag = require('../assets/images/uk-flag.png'); // Example

// Mock user data
// const MOCK_EMAIL = 'test@test.com';
// const MOCK_PASSWORD = 'Password';

export default function LoginScreen() {
  const router = useRouter(); // Initialize router
  const { login, isLoading, isAuthenticated } = useAuth();

  // Auth0 ile giriş başarılı olduğunda direkt (app) yönlendirmesi
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Login Screen: User is authenticated, redirecting to app");
      router.replace('/(app)');
    }
  }, [isAuthenticated, router]);

  return (
    <Box flex={1} justifyContent="center" alignItems="center" bg="$white" p="$5">
      {/* Hide the header for this screen */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Use VStack for easier vertical spacing */}
      <VStack space="xl" alignItems="center" w="100%">
        {/* Logo */}
        <Image
          source={logo}
          alt="Akdeniz University Logo"
          size="xl" // Adjust size as needed (e.g., 'xl', '2xl' or specify width/height)
          resizeMode="contain"
        />

        {/* Title */}
        <Heading size="2xl">Campus Caution</Heading>

        {/* Auth0 Login Button */}
        <Button
          size="lg"
          variant="solid"
          action="primary"
          bg="$blue800"
          onPress={() => login()} // Call the login function from AuthContext
          isDisabled={isLoading} // Disable while auth is loading
          w="100%" // Make button full width
        >
          <ButtonText>{isLoading ? 'Loading...' : 'Sign In with Auth0'}</ButtonText>
        </Button>

        {/* Sign Up Button */}
        <Button 
          size="lg" 
          variant="outline" 
          action="secondary" 
          onPress={() => router.push('/signup')} 
          w="100%" 
          isDisabled={isLoading}
        >
          <ButtonText>Sign Up</ButtonText>
        </Button>

        {/* Language Selector Placeholder */}
        {/* Replace with actual flag image/component */}
        <Box mt="$10">
           {/* <Image source={flag} alt="Language" size="xs" /> Placeholder */}
           {/* <Text>🇬🇧 ▼</Text> */}
        </Box>

      </VStack>
    </Box>
  );
} 