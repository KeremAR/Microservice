import React from 'react';
import { Box, Text, Heading, Button, ButtonText, VStack } from '@gluestack-ui/themed';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { signOut, user } = useAuth();

  return (
    <Box flex={1} justifyContent="center" alignItems="center" p="$5">
      <VStack space="lg" alignItems="center" w="100%">
        <Heading>Profile Screen</Heading>
        {user && <Text>Welcome, {user.name || 'User'}!</Text>}
        <Text>User profile information and settings will go here.</Text>

        <Button 
          mt="$10" 
          action="negative"
          variant="solid"
          onPress={signOut}
          w="100%"
        >
          <ButtonText>Logout</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
} 