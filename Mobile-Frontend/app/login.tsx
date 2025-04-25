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
  // Icon, // Could be used for the flag dropdown later
} from '@gluestack-ui/themed';
import { Stack, useRouter } from 'expo-router'; // Import useRouter
import { Alert } from 'react-native'; // Import Alert for feedback

// Assuming the logo path is correct relative to the root
const logo = require('../assets/images/au-logo.png');
// Placeholder for the flag image/component
// const flag = require('../assets/images/uk-flag.png'); // Example

// Mock user data
const MOCK_EMAIL = 'test@test.com';
const MOCK_PASSWORD = 'Password';

export default function LoginScreen() {
  const router = useRouter(); // Initialize router
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email.toLowerCase() === MOCK_EMAIL && password === MOCK_PASSWORD) {
      // Navigate to the main app screen group
      router.replace('/(app)'); // Reverted back to group path
    } else {
      Alert.alert('Login Failed', 'Invalid email or password.');
    }
  };

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
            />
          </Input>
          {/* Use onPress on the Link instead of href for navigation */}
          <Link onPress={() => router.push('/forgot-password')} alignSelf="flex-end" mt="$2">
            <LinkText size="sm">I Forget My Password</LinkText>
          </Link>
        </FormControl>

        {/* Buttons */}
        <VStack space="md" w="100%" mt="$5">
          <Button
            size="lg"
            variant="solid"
            action="primary"
            bg="$blue800"
            onPress={handleLogin}
          >
            <ButtonText>Sign In</ButtonText>
          </Button>
          <Button size="lg" variant="outline" action="secondary" onPress={() => router.push('/signup')}>
            <ButtonText>Sign Up</ButtonText>
          </Button>
        </VStack>

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