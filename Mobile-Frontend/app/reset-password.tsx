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

export default function ResetPasswordScreen() {
  const router = useRouter();

  return (
    <Box flex={1} bg="$white" p="$5">
      {/* Hide the default header */}
      <Stack.Screen options={{ headerShown: false }} />

      <VStack space="lg">
        {/* Custom Header Back Button */}
        <Pressable onPress={() => router.back()} mb="$4">
          <Icon as={ChevronLeft} size="xl" color="$black" />
        </Pressable>

        {/* Title */}
        <Heading size="xl">Reset Your Password</Heading>

        {/* Description */}
        <Text size="md">
          You can reset your password after entering the confirmation code sent to your e-mail address linked to your account and your new password.
        </Text>

        {/* Form Inputs */}
        <VStack space="md" mt="$5">
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

        {/* Reset Button */}
        <Button size="lg" variant="solid" action="primary" bg="$blue800" mt="$10">
          <ButtonText>Reset Password</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
} 