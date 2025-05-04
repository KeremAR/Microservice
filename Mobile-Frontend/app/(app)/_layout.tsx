import React from 'react';
import { Tabs } from 'expo-router';
import { GluestackUIProvider, Text, Box, Icon, Pressable } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { Home, ListChecks, Bell, AlertTriangle, User } from 'lucide-react-native';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Tab bar tiplerini tanımlayalım
interface Route {
  key: string;
  name: string;
}

interface TabBarProps {
  state: {
    index: number;
    routes: Route[];
  };
  descriptors: {
    [key: string]: {
      options: {
        tabBarLabel?: string;
        title?: string;
      };
    };
  };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => any;
    navigate: (name: string) => void;
  };
}

// Create a custom tab bar with FAB in center
function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const router = useRouter();
  
  return (
    <View style={styles.containerWrapper}>
      <View style={styles.container}>
        {/* Left tabs (Home and Track) */}
        <View style={styles.tabGroup}>
          {state.routes.slice(0, 2).map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            const isFocused = state.index === index;
            
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            
            // Get the appropriate icon based on the tab
            let IconComponent;
            if (route.name === 'index') IconComponent = Home;
            else if (route.name === 'track') IconComponent = ListChecks;
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Icon 
                  as={IconComponent} 
                  size="xl"
                  color={isFocused ? config.tokens.colors.blue700 : config.tokens.colors.coolGray500} 
                />
                <Text
                  size="xs"
                  fontWeight={isFocused ? "$bold" : "$normal"}
                  color={isFocused ? '$blue700' : '$coolGray500'}
                  numberOfLines={1}
                  mt="$0.5"
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Empty center space for FAB */}
        <View style={styles.fabPlaceholder} />
        
        {/* Right tabs (Notifications and Profile) */}
        <View style={styles.tabGroup}>
          {state.routes.slice(3, 5).map((route, index) => {
            const actualIndex = index + 3; // Original index
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            const isFocused = state.index === actualIndex;
            
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            
            // Get icon for this tab
            let IconComponent;
            if (route.name === 'notifications') IconComponent = Bell;
            else if (route.name === 'profile') IconComponent = User;
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Icon 
                  as={IconComponent} 
                  size="xl"
                  color={isFocused ? config.tokens.colors.blue700 : config.tokens.colors.coolGray500} 
                />
                <Text
                  size="xs"
                  fontWeight={isFocused ? "$bold" : "$normal"}
                  color={isFocused ? '$blue700' : '$coolGray500'}
                  numberOfLines={1}
                  mt="$0.5"
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* FAB in center of tab bar */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          router.push('/(app)/create-report');
        }}
      >
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          style={styles.fabGradient}
          start={[0, 0]}
          end={[1, 1]}
        >
          <AlertTriangle color="white" size={30} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  fabPlaceholder: {
    width: 70,
  },
  fab: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    bottom: 30,
    left: '50%',
    marginLeft: -35,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
        }}
      />
      {/* This is a placeholder screen for our "+" button */}
      <Tabs.Screen
        name="create-report"
        options={{
          title: 'Create',
          // This makes the tab not visible in the tab bar
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
} 