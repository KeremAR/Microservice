import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
            let iconName = route.name === 'index' ? 'home' : 'list';
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Ionicons 
                  name={iconName as any} 
                  size={24}
                  color={isFocused ? '#1e40af' : '#6b7280'} 
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isFocused ? 'bold' : 'normal',
                    color: isFocused ? '#1e40af' : '#6b7280',
                    marginTop: 4
                  }}
                  numberOfLines={1}
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
            let iconName = route.name === 'notifications' ? 'notifications' : 'person';
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Ionicons 
                  name={iconName as any} 
                  size={24}
                  color={isFocused ? '#1e40af' : '#6b7280'} 
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isFocused ? 'bold' : 'normal',
                    color: isFocused ? '#1e40af' : '#6b7280',
                    marginTop: 4
                  }}
                  numberOfLines={1}
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
        <View
          style={styles.fabGradient}
        >
          <Ionicons name="warning" color="white" size={30} />
        </View>
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
    backgroundColor: '#ef4444',
  }
});

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props: any) => <CustomTabBar {...props} />}
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
          title: 'Alerts',
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