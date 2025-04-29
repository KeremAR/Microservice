import React from 'react';
import { Box, Text, Heading, Button, ButtonText, VStack, Image } from '@gluestack-ui/themed';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { logout, user } = useAuth();

  return (
    <Box flex={1} justifyContent="center" alignItems="center" p="$5">
      <VStack space="lg" alignItems="center" w="100%">
        <Heading>Profile Screen</Heading>
        {user && (
          <VStack space="md" alignItems="center" w="100%">
            <Text>Welcome, {user.name || user.email || 'User'}!</Text>
            <Text>Email: {user.email || 'Not available'}</Text>
            {user.email_verified && <Text>Email Verified: {user.email_verified ? 'Yes' : 'No'}</Text>}
            {user.picture && (
              <Box mt="$2" borderRadius="$full" overflow="hidden">
                <Image 
                  source={{ uri: user.picture }} 
                  alt="Profile" 
                  w="$20" 
                  h="$20" 
                />
              </Box>
            )}
          </VStack>
        )}
        
        <Button 
          mt="$10" 
          action="negative"
          variant="solid"
          onPress={logout}
          w="100%"
        >
          <ButtonText>Logout</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
} 