import React from 'react';
import { Tabs } from 'expo-router';
import { GluestackUIProvider, Text, Box, Icon } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config'; // Assuming you're using the default config
import { Home, ListChecks, Bell, User } from 'lucide-react-native'; // Import icons

export default function AppLayout() {
  return (
    // You might already have GluestackUIProvider higher up in app/_layout.tsx
    // If so, you might not need it here, but it usually doesn't hurt.
    // <GluestackUIProvider config={config}>
      <Tabs
        screenOptions={{
          headerShown: false, // We can hide the default header for tabs
          tabBarActiveTintColor: config.tokens.colors.blue700, // Example active color
          tabBarInactiveTintColor: config.tokens.colors.coolGray500, // Changed from gray500
          tabBarStyle: {
            // Add any custom styles for the tab bar itself
            // height: 60,
            // paddingBottom: 5,
          },
          tabBarLabelStyle: {
            // Add custom styles for the tab labels
            // fontSize: 12,
            // fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index" // This corresponds to app/(app)/index.tsx
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Icon as={Home} color={color} size="md" /> // Use 'md' or specific number size
            ),
          }}
        />
        <Tabs.Screen
          name="track" // Corresponds to app/(app)/track.tsx (will create later)
          options={{
            title: 'Track',
            tabBarIcon: ({ color, size }) => (
              <Icon as={ListChecks} color={color} size="md" />
            ),
          }}
        />
         {/* Placeholder for the central Add button - REMOVED */}
         {/* A simple placeholder screen for now */}
         {/* <Tabs.Screen
           name="addPlaceholder"
           options={{
             title: 'Add',
             tabBarButton: () => null, // Hide the actual tab button for this placeholder
             // You might implement a custom Floating Action Button (FAB) instead
           }}
         /> */}
        <Tabs.Screen
          name="notifications" // Corresponds to app/(app)/notifications.tsx (will create later)
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color, size }) => (
              <Icon as={Bell} color={color} size="md" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile" // Corresponds to app/(app)/profile.tsx (will create later)
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon as={User} color={color} size="md" />
            ),
          }}
        />
      </Tabs>
    // </GluestackUIProvider>
  );
} 