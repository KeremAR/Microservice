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
  Icon,
} from '@gluestack-ui/themed';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <Box flex={1} bg="$white" p="$5">
      <Stack.Screen options={{ headerShown: false }} />

      <VStack space="lg">
        <Pressable onPress={() => router.back()} mb="$4">
          <Icon as={ChevronLeft} size="xl" color="$black" />
        </Pressable>

        <Heading size="xl">Forgot Your Password</Heading>

        <Text size="md">
          Enter the email associated with your account and we will send an email to change your password
        </Text>

        <FormControl mt="$5">
          <Input variant="underlined">
            <InputField placeholder="Email" type="text" keyboardType="email-address" />
          </Input>
        </FormControl>

        <Button size="lg" variant="solid" action="primary" bg="$blue800" mt="$10">
          <ButtonText>Send</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
} 