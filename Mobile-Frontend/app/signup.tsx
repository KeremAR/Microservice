import React from 'react';
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

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <Box flex={1} bg="$white" p="$5">
      {/* Hide the default header, we'll create a custom one */}
      <Stack.Screen options={{ headerShown: false }} />

      <VStack space="lg">
        {/* Custom Header Back Button */}
        <Pressable onPress={() => router.back()} mb="$4">
          <Icon as={ChevronLeft} size="xl" color="$black" />
        </Pressable>

        {/* Title */}
        <Heading size="xl">Create an Account</Heading>

        {/* Description */}
        <Text size="md">
          Welcome! Fill out the information below to create a new account and get started right away.
        </Text>

        {/* Form Inputs */}
        <VStack space="md" mt="$5">
          <FormControl>
            <Input variant="underlined">
              <InputField placeholder="Name" type="text" />
            </Input>
          </FormControl>
          <FormControl>
            <Input variant="underlined">
              <InputField placeholder="Surname" type="text" />
            </Input>
          </FormControl>
          <FormControl>
            <Input variant="underlined">
              <InputField placeholder="Email" type="text" keyboardType="email-address" />
            </Input>
          </FormControl>
          <FormControl>
            <Input variant="underlined">
              <InputField placeholder="Password" type="password" />
            </Input>
          </FormControl>
          <FormControl>
            <Input variant="underlined">
              <InputField placeholder="Confirm Password" type="password" />
            </Input>
          </FormControl>
        </VStack>

        {/* Sign Up Button */}
        <Button size="lg" variant="solid" action="primary" bg="$blue800" mt="$10">
          <ButtonText>Sign Up</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
} 