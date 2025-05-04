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
  Divider,
} from '@gluestack-ui/themed';
import { CheckCircle, Clock, Bell, AlertTriangle } from 'lucide-react-native';

// Mock data for notifications
const mockNotifications = [
  {
    id: '1',
    title: 'Status Update',
    description: 'Your report "Broken Light in Science Building" has been completed',
    createdAt: '2023-08-12T14:30:00Z',
    type: 'status-update',
    isRead: true,
  },
  {
    id: '2',
    title: 'Status Update',
    description: 'Your report "Leaking Roof in Library" is now in progress',
    createdAt: '2023-08-16T09:45:00Z',
    type: 'status-update',
    isRead: false,
  },
  {
    id: '3',
    title: 'New Announcement',
    description: 'Upcoming Maintenance for Student Portal on August 25th',
    createdAt: '2023-08-18T11:20:00Z',
    type: 'announcement',
    isRead: false,
  },
  {
    id: '4',
    title: 'Status Update',
    description: 'Your report "Trash Not Collected" has been rejected',
    createdAt: '2023-08-21T16:00:00Z',
    type: 'status-update',
    isRead: false,
  },
  {
    id: '5',
    title: 'New Alert',
    description: 'Construction work in progress near Engineering Building',
    createdAt: '2023-08-22T08:30:00Z',
    type: 'alert',
    isRead: true,
  },
];

const getNotificationIcon = (type) => {
  switch (type) {
    case 'status-update':
      return Clock;
    case 'announcement':
      return Bell;
    case 'alert':
      return AlertTriangle;
    default:
      return Bell;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'status-update':
      return '$blue500';
    case 'announcement':
      return '$amber500';
    case 'alert':
      return '$red500';
    default:
      return '$gray500';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // If it's today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  // If it's within the last week, show day name
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  if (date > oneWeekAgo) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
    });
  }
  
  // Otherwise show date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default function NotificationsScreen() {
  return (
    <Box flex={1} bg="$white">
      <Box bg="$blue800" pt="$12" pb="$4" px="$4">
        <Heading color="$white" size="xl">
          Notifications
        </Heading>
      </Box>
      
      <ScrollView flex={1}>
        <VStack divider={<Divider bg="$borderLight200" />}>
          {mockNotifications.length === 0 ? (
            <Box 
              py="$16" 
              alignItems="center" 
              justifyContent="center"
            >
              <Text color="$textLight500" textAlign="center">
                You have no notifications yet.
              </Text>
            </Box>
          ) : (
            mockNotifications.map((notification) => (
              <Pressable key={notification.id}>
                {({ hovered, pressed }) => (
                  <Box
                    bg={
                      pressed 
                        ? '$backgroundLight200'
                        : hovered 
                          ? '$backgroundLight100' 
                          : notification.isRead 
                            ? '$white'
                            : '$backgroundLight50'
                    }
                    p="$4"
                  >
                    <HStack space="md" alignItems="flex-start">
                      <Box 
                        bg={`${getNotificationColor(notification.type)}20`}
                        p="$2"
                        borderRadius="$full"
                      >
                        <Icon 
                          as={getNotificationIcon(notification.type)} 
                          size="md" 
                          color={getNotificationColor(notification.type)} 
                        />
                      </Box>
                      
                      <VStack space="xs" flex={1}>
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight={notification.isRead ? '$normal' : '$bold'} size="sm">
                            {notification.title}
                          </Text>
                          <Text size="xs" color="$textLight400">
                            {formatDate(notification.createdAt)}
                          </Text>
                        </HStack>
                        
                        <Text 
                          size="sm" 
                          color={notification.isRead ? '$textLight500' : '$textDark900'}
                        >
                          {notification.description}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </Pressable>
            ))
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
} 