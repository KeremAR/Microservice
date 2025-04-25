import React, { useState } from 'react';
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
  const { signIn, isLoading: isAuthLoading, accessToken } = useAuth(); // Get auth state and functions

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailPasswordLoading, setIsEmailPasswordLoading] = useState(false); // Separate loading state for email/password

  const handleEmailPasswordLogin = () => {
    setIsEmailPasswordLoading(true);
    // Replace mock logic with actual API call if needed
    // For now, just show an alert or disable it
    Alert.alert('Info', 'Email/Password login needs to be implemented.');
    setIsEmailPasswordLoading(false);
    // if (email.toLowerCase() === MOCK_EMAIL && password === MOCK_PASSWORD) {
    //   router.replace('/(tabs)'); // Navigate on success
    // } else {
    //   Alert.alert('Login Failed', 'Invalid email or password.');
    // }
  };

  // No need for explicit redirect here, layout handles it based on accessToken
  // if (accessToken) {
  //     return <Redirect href="/(app)" />;
  // }

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

        {/* Microsoft Login Button */}
        <Button
          size="lg"
          variant="solid"
          action="primary"
          bg="$blueGray600" // Or a Microsoft-like blue?
          onPress={() => signIn()} // Call the signIn function from AuthContext
          isDisabled={isAuthLoading} // Disable while auth is loading
          w="100%" // Make button full width
        >
          {/* You can add a Microsoft logo here if desired */}
          <ButtonText>{isAuthLoading ? 'Loading...' : 'Sign In with Microsoft'}</ButtonText>
        </Button>

        {/* Divider */}
        <Box flexDirection="row" alignItems="center" w="100%" my="$4">
          <Divider flex={1} />
          <Text mx="$3" color="$textLight500">OR</Text>
          <Divider flex={1} />
        </Box>

        {/* Email Input */}
        <FormControl w="100%">
          {/* Optional: Add <FormControlLabel><FormControlLabelText>Email</FormControlLabelText></FormControlLabel> */}
          <Input variant="underlined">
            <InputField
              placeholder="Email"
              type="text"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              $disabled={isAuthLoading || isEmailPasswordLoading}
            />
          </Input>
        </FormControl>

        {/* Password Input */}
        <FormControl w="100%">
          {/* Optional: Add <FormControlLabel><FormControlLabelText>Password</FormControlLabelText></FormControlLabel> */}
          <Input variant="underlined">
            {/* Add InputSlot and Icon for show/hide password later if needed */}
            <InputField
              placeholder="Password"
              type="password"
              value={password}
              onChangeText={setPassword}
              $disabled={isAuthLoading || isEmailPasswordLoading}
            />
          </Input>
          {/* Use onPress on the Link instead of href for navigation */}
          <Link onPress={() => router.push('/forgot-password')} alignSelf="flex-end" mt="$2">
            <LinkText size="sm">I Forget My Password</LinkText>
          </Link>
        </FormControl>

        {/* Email/Password Sign In Button */}
        <Button
          size="lg"
          variant="solid"
          action="primary"
          bg="$blue800"
          onPress={handleEmailPasswordLogin}
          isDisabled={isAuthLoading || isEmailPasswordLoading}
          w="100%"
        >
          <ButtonText>{isEmailPasswordLoading ? 'Signing In...' : 'Sign In'}</ButtonText>
        </Button>

        <Button size="lg" variant="outline" action="secondary" onPress={() => router.push('/signup')} w="100%" isDisabled={isAuthLoading || isEmailPasswordLoading}>
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