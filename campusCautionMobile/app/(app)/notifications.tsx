import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { sendLocalNotification } from '../../services/notificationService';

// Define notification types
type NotificationType = 'status-update' | 'announcement' | 'alert' | 'ISSUE_CREATED' | 'ISSUE_STATUS_CHANGED' | string;

interface Notification {
  id: string;
  title: string;
  message: string; // Backend'den gelen field
  description?: string; // UI uyumluluğu için
  createdAt: string;
  type: NotificationType;
  isRead: boolean;
  userId?: string;
  data?: any;
}

// Eğer backend verisinde eksik alanlar varsa, mockup verileri örnek olarak bırakıyorum
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Status Update',
    message: 'Your report "Broken Light in Science Building" has been completed',
    description: 'Your report "Broken Light in Science Building" has been completed',
    createdAt: '2023-08-12T14:30:00Z',
    type: 'status-update',
    isRead: true,
  },
  {
    id: '2',
    title: 'Status Update',
    message: 'Your report "Leaking Roof in Library" is now in progress',
    description: 'Your report "Leaking Roof in Library" is now in progress',
    createdAt: '2023-08-16T09:45:00Z',
    type: 'status-update',
    isRead: false,
  },
];

const getNotificationIcon = (type: NotificationType): string => {
  // Genişletilmiş tip desteği
  switch (type) {
    case 'status-update':
    case 'ISSUE_STATUS_CHANGED':
      return 'time';
    case 'announcement':
      return 'notifications';
    case 'alert':
      return 'warning';
    case 'ISSUE_CREATED':
      return 'add-circle';
    default:
      return 'notifications';
  }
};

const getNotificationColor = (type: NotificationType): string => {
  // Genişletilmiş tip desteği
  switch (type) {
    case 'status-update':
    case 'ISSUE_STATUS_CHANGED':
      return '#3b82f6';
    case 'announcement':
      return '#f59e0b';
    case 'alert':
      return '#ef4444';
    case 'ISSUE_CREATED':
      return '#10b981';
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
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API'den bildirimleri alma
  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setError('Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const fetchedNotifications = await getNotifications(token);
      
      // Backend'den gelen verileri UI formatına dönüştür
      const formattedNotifications = fetchedNotifications.map((notification: any) => ({
        id: notification.id,
        title: notification.title || 'Bildirim',
        message: notification.message,
        description: notification.message, // UI uyumluluğu için
        createdAt: notification.createdAt,
        type: notification.type || 'status-update',
        isRead: notification.isRead || false,
        userId: notification.userId,
        data: notification.data
      }));
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Bildirimler alınırken hata oluştu:', err);
      setError('Bildirimler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Bildirimi okundu olarak işaretleme
  const handleNotificationPress = async (notification: Notification) => {
    if (!token || !user?.id) {
      Alert.alert('Hata', 'Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (notification.isRead) return; // Zaten okunmuşsa işlem yapma

    try {
      const success = await markNotificationAsRead(token, user.id, notification.id);
      
      if (success) {
        // Bildirimi yerel listede de güncelle
        setNotifications(currentNotifications => 
          currentNotifications.map(item => 
            item.id === notification.id 
              ? { ...item, isRead: true } 
              : item
          )
        );
      }
    } catch (err) {
      console.error('Bildirim okundu işaretlenirken hata:', err);
      Alert.alert('Hata', 'Bildirim durumu güncellenirken bir hata oluştu.');
    }
  };

  // Bildirimi silme
  const handleDeleteNotification = async (notification: Notification) => {
    if (!token || !user?.id) {
      Alert.alert('Hata', 'Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteNotification(token, user.id, notification.id);
              
              if (success) {
                // Bildirimi yerel listeden kaldır
                setNotifications(currentNotifications => 
                  currentNotifications.filter(item => item.id !== notification.id)
                );
                
                // Kullanıcıya bildir
                Alert.alert('Başarılı', 'Bildirim başarıyla silindi.');
              } else {
                Alert.alert('Hata', 'Bildirim silinirken bir sorun oluştu.');
              }
            } catch (err) {
              console.error('Bildirim silinirken hata:', err);
              Alert.alert('Hata', 'Bildirim silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  // Sayfayı yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // İlk yükleme ve sayfa odaklandığında
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Test bildirim gönderme
  const sendTestNotification = async () => {
    try {
      await sendLocalNotification(
        'Test Bildirimi',
        'Bu bir test bildirimidir. Bildirim sistemi çalışıyor!',
        { notificationId: 'test-notification' }
      );
      Alert.alert('Başarılı', 'Test bildirimi gönderildi! Bildirim çekmecesini kontrol edin.');
    } catch (error) {
      console.error('Test bildirimi gönderilirken hata:', error);
      Alert.alert('Hata', 'Test bildirimi gönderilirken bir hata oluştu.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={40} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off" size={40} color="#9ca3af" />
          <Text style={styles.emptyText}>
            Henüz bildiriminiz bulunmuyor.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {notifications.map((notification) => (
          <React.Fragment key={notification.id}>
            <TouchableOpacity
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadCard
              ]}
              onPress={() => handleNotificationPress(notification)}
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
                    {notification.message || notification.description}
                  </Text>
                </View>
              </View>
              
              {/* Bildirim silme butonu ekle */}
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteNotification(notification)}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={styles.divider} />
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Bildirimler
        </Text>
        
        {/* Test bildirim butonu */}
        <TouchableOpacity 
          style={styles.testButton}
          onPress={sendTestNotification}
        >
          <Ionicons name="notifications" size={18} color="white" />
          <Text style={styles.testButtonText}>Test Bildirim</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1e40af']}
            tintColor="#1e40af"
          />
        }
      >
        {renderContent()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  centerContent: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 24,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#1e40af',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 16,
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
  },
  deleteButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    padding: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
}); 