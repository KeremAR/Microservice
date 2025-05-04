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
  VStack,
  Heading,
  FormControl,
  HStack,
  Pressable,
  ScrollView,
} from '@gluestack-ui/themed';
const logo = require('../assets/images/au-logo.png');

import { Stack, useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Maintain existing login logic
    if (email.toLowerCase() === 'test@test.com' && password === 'Password') {
      router.replace('/(app)');
    } else {
      Alert.alert('Login Failed', 'Invalid email or password.');
    }
  };

  return (
    <Box flex={1} bg="$white">
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Box flex={1} alignItems="center" justifyContent="center" p="$4">
          <Image
            source={logo}
            alt="Akdeniz University Logo"
            size="lg"
            resizeMode="contain"
          />
          <VStack space="md" alignItems="center" w="100%" maxWidth={400}>
            {/* Logo and tagline */}
            <Box alignItems="center" mb="$3">
              <HStack alignItems="center">
                <Text fontSize="$3xl" fontWeight="$bold" color="$gray900">Campus</Text>
                <Text fontSize="$3xl" fontWeight="$bold" color="$blue800">Caution</Text>
              </HStack>
            </Box>

            {/* Login Card */}
            <Box 
              bg="$white" 
              w="100%" 
              p="$4" 
              borderRadius="$2xl" 
              style={{
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              <Heading size="xl" textAlign="center" mb="$4">Login</Heading>

              {/* Email field */}
              <FormControl w="100%" mb="$3">
                <Text mb="$1" color="$gray700" fontWeight="$bold" fontSize="$sm">Email</Text>
                <Input 
                  style={{
                    backgroundColor: '#F7F7f7',
                    borderWidth: 0.7,
                    height: 45
                  }}
                  borderRadius="$lg"
                  mb="$1"
                  size="sm"
                >
                  <InputField
                    placeholder="Enter your email"
                    type="text"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    fontWeight="medium"
                    fontSize="$sm"
                  />
                </Input>
              </FormControl>

              {/* Password field */}
              <FormControl w="100%" mb="$2">
                <Text mb="$1" color="$gray700" fontWeight="$bold" fontSize="$sm">Password</Text>
                <Input 
                  style={{
                    backgroundColor: '#F7F7f7',
                    borderWidth: 0.7,
                    height: 45
                  }}
                  borderRadius="$lg"
                  mb="$1"
                  size="sm"
                >
                  <InputField
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChangeText={setPassword}
                    fontWeight="medium"
                    fontSize="$sm"
                  />
                </Input>
              </FormControl>

              {/* Forgot password */}
              <Box alignItems="flex-end" mb="$3">
                <Link onPress={() => router.push('/forgot-password')}>
                  <LinkText 
                    size="sm" 
                    color="$blue500" 
                    fontWeight="$bold"
                    textDecorationLine="none"
                  >
                    Forgot Password?
                  </LinkText>
                </Link>
              </Box>

              {/* Login button */}
              <Button
                size="md"
                variant="solid"
                bg="$blue800"
                borderRadius="$lg"
                onPress={handleLogin}
                mb="$3"
              >
                <ButtonText fontSize="$sm">Login</ButtonText>
              </Button>

              {/* Or divider */}
              <Text textAlign="center" color="$gray500" fontSize="$sm" my="$3">or</Text>

              {/* Sign up */}
              <HStack justifyContent="center" space="sm">
                <Text color="$gray700" fontSize="$sm">Don't have an account?</Text>
                <Pressable onPress={() => router.push('/signup')}>
                  <Text color="$blue800" fontWeight="$medium" fontSize="$sm">Sign Up</Text>
                </Pressable>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
} 