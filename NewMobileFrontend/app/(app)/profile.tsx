import React from 'react';
import {
  Box,
  Text,
  VStack,
  Heading,
  ScrollView,
  HStack,
  Icon,
  Pressable,
  Avatar,
  AvatarFallbackText,
  Divider,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { 
  Settings, LogOut, Bell, Shield, 
  HelpCircle, InfoIcon,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { currentUser } from '../../data/mockData';

const menuItems = [
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    route: '/settings',
    color: '$blue500',
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    icon: Bell,
    route: '/notification-settings',
    color: '$amber500',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    route: '/privacy',
    color: '$green500',
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: HelpCircle,
    route: '/help',
    color: '$purple500',
  },
  {
    id: 'about',
    title: 'About Campus Caution',
    icon: InfoIcon,
    route: '/about',
    color: '$indigo500',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  
  const handleLogout = () => {
    // Here you would handle the logout logic
    router.replace('/login');
  };
  
  return (
    <Box flex={1} bg="$white">
      <Box bg="$blue800" pt="$12" pb="$6" px="$4">
        <VStack space="md" alignItems="center">
          <Avatar size="xl" borderWidth={2} borderColor="$white">
            <AvatarFallbackText>{currentUser.name}</AvatarFallbackText>
          </Avatar>
          <VStack alignItems="center">
            <Heading color="$white" size="lg" textAlign="center">
              {currentUser.name}
            </Heading>
            <Text color="$white" opacity={0.9} textAlign="center">
              {currentUser.email}
            </Text>
            <HStack space="xs" mt="$1">
              <Text color="$white" opacity={0.8} textAlign="center" size="sm">
                {currentUser.department}
              </Text>
              <Text color="$white" opacity={0.8} textAlign="center" size="sm">
                •
              </Text>
              <Text color="$white" opacity={0.8} textAlign="center" size="sm">
                {currentUser.role}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>
      
      <ScrollView flex={1}>
        <Box mt="$4">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <Divider bg="$borderLight200" />}
              <Pressable 
                onPress={() => {
                  // Here you would navigate to the corresponding screen
                  // For demo, just show an alert
                  alert(`Navigating to ${item.title}`);
                }}
              >
                {({ hovered, pressed }) => (
                  <Box
                    bg={pressed ? '$backgroundLight200' : hovered ? '$backgroundLight100' : '$white'}
                    px="$4"
                    py="$3"
                  >
                    <HStack space="md" alignItems="center" justifyContent="space-between">
                      <HStack space="md" alignItems="center">
                        <Box
                          bg={`${item.color}20`}
                          p="$2"
                          borderRadius="$full"
                        >
                          <Icon 
                            as={item.icon} 
                            size="sm" 
                            color={item.color} 
                          />
                        </Box>
                        <Text size="md">{item.title}</Text>
                      </HStack>
                      <Icon as={ChevronRight} size="sm" color="$textLight400" />
                    </HStack>
                  </Box>
                )}
              </Pressable>
            </React.Fragment>
          ))}
        </Box>
        
        <Box p="$4" mt="$4">
          <Button 
            variant="outline" 
            size="lg"
            action="negative"
            borderColor="$red300"
            onPress={handleLogout}
          >
            <Icon as={LogOut} size="sm" color="$red500" mr="$2" />
            <ButtonText color="$red500">Log Out</ButtonText>
          </Button>
        </Box>
      </ScrollView>
    </Box>
  );
} 