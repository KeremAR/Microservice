import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define notification types
type NotificationType = 'status-update' | 'announcement' | 'alert';

interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: NotificationType;
  isRead: boolean;
}

// Mock data for notifications
const mockNotifications: Notification[] = [
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

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'status-update':
      return 'time';
    case 'announcement':
      return 'notifications';
    case 'alert':
      return 'warning';
    default:
      return 'notifications';
  }
};

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'status-update':
      return '#3b82f6';
    case 'announcement':
      return '#f59e0b';
    case 'alert':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const formatDate = (dateString: string): string => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Notifications
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {mockNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                You have no notifications yet.
              </Text>
            </View>
          ) : (
            mockNotifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <TouchableOpacity
                  style={[
                    styles.notificationCard,
                    !notification.isRead && styles.unreadCard
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View 
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${getNotificationColor(notification.type)}20` }
                      ]}
                    >
                      <Ionicons 
                        name={getNotificationIcon(notification.type) as any} 
                        size={20} 
                        color={getNotificationColor(notification.type)} 
                      />
                    </View>
                    
                    <View style={styles.textContainer}>
                      <View style={styles.notificationHeader}>
                        <Text style={[
                          styles.title,
                          !notification.isRead && styles.boldText
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.timestamp}>
                          {formatDate(notification.createdAt)}
                        </Text>
                      </View>
                      
                      <Text 
                        style={[
                          styles.description,
                          !notification.isRead && styles.unreadDescription
                        ]}
                      >
                        {notification.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.divider} />
              </React.Fragment>
            ))
          )}
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
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  notificationCard: {
    padding: 16,
    backgroundColor: 'white',
  },
  unreadCard: {
    backgroundColor: '#f9fafb',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  description: {
    fontSize: 14, 
    color: '#6b7280',
  },
  unreadDescription: {
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  }
}); 