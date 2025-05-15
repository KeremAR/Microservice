import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { sendLocalNotification } from '../../services/notificationService';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

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
  
  // If it's today, show time with "Today" prefix
  if (date.toDateString() === now.toDateString()) {
    return `Bugün, ${date.toLocaleTimeString('tr-TR', {
      hour: '2-digit', 
      minute: '2-digit'
    })}`;
  }
  
  // If it's yesterday, show "Yesterday" with time
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Dün, ${date.toLocaleTimeString('tr-TR', {
      hour: '2-digit', 
      minute: '2-digit'
    })}`;
  }
  
  // If it's within the last week, show day name with time
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  if (date > oneWeekAgo) {
    return `${date.toLocaleDateString('tr-TR', {
      weekday: 'long'
    })}, ${date.toLocaleTimeString('tr-TR', {
      hour: '2-digit', 
      minute: '2-digit'
    })}`;
  }
  
  // Otherwise show full date with time
  return `${date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}, ${date.toLocaleTimeString('tr-TR', {
    hour: '2-digit', 
    minute: '2-digit'
  })}`;
};

export default function NotificationsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
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
      
      console.log('Fetched notifications raw data:', JSON.stringify(fetchedNotifications).substring(0, 300) + '...');
      
      // Backend'den gelen verileri UI formatına dönüştür
      const formattedNotifications = fetchedNotifications.map((notification: any) => {
        // Debug each notification structure
        console.log(`Notification ${notification.id} read property:`, 
          notification.isRead !== undefined ? 'isRead: ' + notification.isRead : 
          notification.read !== undefined ? 'read: ' + notification.read : 
          'no read status'
        );
        
        return {
          id: notification.id,
          title: notification.title || 'Bildirim',
          message: notification.message,
          description: notification.message, // UI uyumluluğu için
          createdAt: notification.createdAt,
          type: notification.type || 'status-update',
          // Backend'de 'isRead' veya 'read' olarak gelebilir, ikisini de kontrol et
          isRead: notification.isRead !== undefined ? notification.isRead : 
                 notification.read !== undefined ? notification.read : false,
          userId: notification.userId,
          data: notification.data
        };
      });
      
      // Bildirimleri tarihe göre sırala (en yeni en üstte)
      const sortedNotifications = formattedNotifications.sort((a: Notification, b: Notification) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setNotifications(sortedNotifications);
      console.log(`Loaded ${sortedNotifications.length} notifications, with ${sortedNotifications.filter((n: Notification) => !n.isRead).length} unread`);
    } catch (err) {
      console.error('Bildirimler alınırken hata oluştu:', err);
      setError('Bildirimler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Bildirimi okundu olarak işaretleme ve ilgili issue sayfasına yönlendirme
  const handleNotificationPress = async (notification: Notification) => {
    if (!token || !user?.id) {
      Alert.alert('Hata', 'Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      // Bildirim daha önce okunmamışsa okundu olarak işaretle
      if (!notification.isRead) {
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
          
          // Verify the change with backend
          setTimeout(() => {
            fetchNotifications();
          }, 500);
        }
      }
      
      // Bildirim data içeriyor mu kontrol et
      if (notification.data) {
        // Issue ID'yi bulmaya çalış
        const issueId = notification.data.Id || notification.data.id;
        
        if (issueId) {
          console.log(`Navigating to issue details for ID: ${issueId}`);
          router.push(`/issue-detail?id=${issueId}`);
        } else {
          console.log('Bildirimde ilgili issue ID bulunamadı:', notification);
        }
      } else {
        console.log('Bildirimde navigasyon için data bulunamadı:', notification);
      }
    } catch (err) {
      console.error('Bildirim işleme hatası:', err);
      Alert.alert('Hata', 'Bildirim işlenirken bir hata oluştu.');
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
                
                // Update from backend to ensure sync
                fetchNotifications();
                
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications()}>
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
        {notifications.map((notification) => {
          const renderRightActions = () => (
            <TouchableOpacity 
              style={styles.deleteAction}
              onPress={() => handleDeleteNotification(notification)}
            >
              <Text style={styles.deleteActionText}>Sil</Text>
            </TouchableOpacity>
          );
          
          return (
            <Swipeable
              key={notification.id}
              renderRightActions={renderRightActions}
              friction={2}
              overshootRight={false}
            >
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
              </TouchableOpacity>
            </Swipeable>
          );
        })}
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
    width: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    color: '#374151',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
  },
  description: {
    fontSize: 14, 
    color: '#6b7280',
    lineHeight: 19,
  },
  unreadDescription: {
    color: '#111827',
  },
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteActionText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 20,
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