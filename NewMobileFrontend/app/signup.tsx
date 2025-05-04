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
  HStack,
  Link,
  LinkText,
  Image,
  ScrollView,
} from '@gluestack-ui/themed';
import { Stack, useRouter } from 'expo-router';

// Import the same logo as in login
const logo = require('../assets/images/au-logo.png');

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

            {/* Sign Up Card */}
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
              <Heading size="xl" textAlign="center" mb="$4">Sign Up</Heading>

              {/* Full Name field */}
              <FormControl w="100%" mb="$3">
                <Text mb="$1" color="$gray700" fontWeight="$bold" fontSize="$sm">Full Name</Text>
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
                    placeholder="Enter your full name"
                    type="text"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    fontWeight="medium"
                    fontSize="$sm"
                  />
                </Input>
              </FormControl>

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
              <FormControl w="100%" mb="$3">
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
                    placeholder="Create a password"
                    type="password"
                    value={password}
                    onChangeText={setPassword}
                    fontWeight="medium"
                    fontSize="$sm"
                  />
                </Input>
              </FormControl>

              {/* Confirm Password field */}
              <FormControl w="100%" mb="$3">
                <Text mb="$1" color="$gray700" fontWeight="$bold" fontSize="$sm">Confirm Password</Text>
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
                    placeholder="Confirm your password"
                    type="password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    fontWeight="medium"
                    fontSize="$sm"
                  />
                </Input>
              </FormControl>

              {/* Sign Up button */}
              <Button
                size="md"
                variant="solid"
                bg="$blue800"
                borderRadius="$lg"
                mb="$3"
              >
                <ButtonText fontSize="$sm">Sign Up</ButtonText>
              </Button>

              {/* Simple or text */}
              <Text textAlign="center" color="$gray500" fontSize="$sm" my="$3">or</Text>

              {/* Login link */}
              <HStack justifyContent="center" space="sm">
                <Text color="$gray700" fontSize="$sm">Already have an account?</Text>
                <Pressable onPress={() => router.push('/login')}>
                  <Text color="$blue800" fontWeight="$medium" fontSize="$sm">Login</Text>
                </Pressable>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
} 