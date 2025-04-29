import React, { useState } from 'react';
import {
  Box,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  VStack,
  Heading,
  FormControl,
  Pressable,
  Icon, // To wrap the lucide icon
} from '@gluestack-ui/themed';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Alert, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native'; // Import Alert for feedback and other necessary imports
import { useAuth } from '../context/AuthContext'; // Auth0 hook'unu ekleyelim

export default function SignUpScreen() {
  const router = useRouter();
  const { login, isLoading: auth0Loading } = useAuth(); // Auth0 hook'undan login fonksiyonunu alalım

  // State for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Get API Base URL (consistent with login.tsx)
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8082/api';

  const handleSignup = async () => {
    // Basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        Alert.alert('Signup Failed', 'Please fill in all fields.');
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert('Signup Failed', 'Passwords do not match.');
        return;
    }

    setIsLoading(true);
    try {
        console.log(`Attempting signup for ${email} to ${apiBaseUrl}/auth/signup`);
        const response = await fetch(`${apiBaseUrl}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                firstName, 
                lastName, 
                email, 
                password 
            }),
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log("Signup successful:", responseData);
            Alert.alert('Signup Successful', 'Your account has been created. Please log in.');
            router.push('/login'); // Redirect to login screen
        } else {
            console.error("Signup failed:", response.status, responseData);
            const errorMessage = responseData?.message || 'Could not create account. Please try again.';
            Alert.alert('Signup Failed', errorMessage);
        }
    } catch (error) {
        console.error("Signup error:", error);
        Alert.alert('Signup Error', 'An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // Auth0 ile kayıt ol/giriş yap
  const handleAuth0Signup = async () => {
    try {
      // Auth0 login işlemi, kayıt ekranını da içerir
      await login();
      // Başarılı giriş sonrası router işlemi AuthContext tarafından yönetilir
    } catch (error) {
      console.error("Auth0 signup/login error:", error);
      Alert.alert('Auth0 Error', 'Failed to connect to Auth0. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }} 
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Box flex={1} bg="$white" p="$5" justifyContent="center">
            <Stack.Screen options={{ headerShown: false }} />

            <VStack space="lg">
              <Pressable onPress={() => router.back()} mb="$4" position="absolute" top={40} left={20} zIndex={1}>
                <Icon as={ChevronLeft} size="xl" color="$black" />
              </Pressable>

              <Heading size="xl" textAlign="center" mt={Platform.OS === 'ios' ? 60 : 40}>Create an Account</Heading>

              <Text size="md" textAlign="center">
                Welcome! Fill out the information below to create a new account and get started right away.
              </Text>

              {/* Auth0 Signup Button */}
              <Button 
                size="lg" 
                variant="solid" 
                action="primary" 
                bg="$blue600" 
                mt="$5"
                onPress={handleAuth0Signup}
                isDisabled={isLoading || auth0Loading}
              >
                <ButtonText>{auth0Loading ? 'Processing...' : 'Sign Up with Auth0'}</ButtonText>
              </Button>

              <Box flexDirection="row" alignItems="center" w="100%" my="$4">
                <Box flex={1} h="$px" bg="$trueGray300" />
                <Text mx="$3" color="$trueGray500">OR</Text>
                <Box flex={1} h="$px" bg="$trueGray300" />
              </Box>

              <VStack space="md" mt="$5">
                <FormControl isDisabled={isLoading}>
                  <Input variant="underlined">
                    <InputField 
                      placeholder="Name" 
                      type="text" 
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </Input>
                </FormControl>
                <FormControl isDisabled={isLoading}>
                  <Input variant="underlined">
                    <InputField 
                      placeholder="Surname" 
                      type="text" 
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </Input>
                </FormControl>
                <FormControl isDisabled={isLoading}>
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
                <FormControl isDisabled={isLoading}>
                  <Input variant="underlined">
                    <InputField 
                      placeholder="Password" 
                      type="password" 
                      value={password}
                      onChangeText={setPassword}
                    />
                  </Input>
                </FormControl>
                <FormControl isDisabled={isLoading}>
                  <Input variant="underlined">
                    <InputField 
                      placeholder="Confirm Password" 
                      type="password" 
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </Input>
                </FormControl>
              </VStack>

              <Button 
                size="lg" 
                variant="solid" 
                action="primary" 
                bg="$blue800" 
                mt="$10"
                onPress={handleSignup}
                isDisabled={isLoading}
              >
                <ButtonText>{isLoading ? 'Signing Up...' : 'Sign Up'}</ButtonText>
              </Button>
            </VStack>
          </Box>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 