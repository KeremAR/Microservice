import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { currentUser } from '../../data/mockData';

const menuItems = [
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    route: '/settings',
    color: '#3b82f6',
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    icon: 'notifications',
    route: '/notification-settings',
    color: '#f59e0b',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: 'shield',
    route: '/privacy',
    color: '#10b981',
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: 'help-circle',
    route: '/help',
    color: '#8b5cf6',
  },
  {
    id: 'about',
    title: 'About Campus Caution',
    icon: 'information-circle',
    route: '/about',
    color: '#6366f1',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  
  const handleLogout = () => {
    // Here you would handle the logout logic
    router.replace('/login');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{currentUser.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{currentUser.name}</Text>
            <Text style={styles.email}>{currentUser.email}</Text>
            <View style={styles.userDetails}>
              <Text style={styles.userDetailText}>{currentUser.department}</Text>
              <Text style={styles.userDetailText}> • </Text>
              <Text style={styles.userDetailText}>{currentUser.role}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity 
                onPress={() => {
                  // Here you would navigate to the corresponding screen
                  // For demo, just show an alert
                  alert(`Navigating to ${item.title}`);
                }}
                style={styles.menuItem}
              >
                <View style={styles.menuRow}>
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons 
                      name={item.icon as any}
                      size={20} 
                      color={item.color} 
                    />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
        
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={18} color="#ef4444" style={{marginRight: 8}} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  username: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  email: {
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  userDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  userDetailText: {
    color: 'white',
    opacity: 0.8,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  menuContainer: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
  },
  logoutContainer: {
    padding: 16,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  }
}); 