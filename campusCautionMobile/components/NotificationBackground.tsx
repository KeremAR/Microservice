import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications } from '../services/api';
import { 
  registerForPushNotificationsAsync, 
  sendLocalNotification,
  addNotificationListener,
  addNotificationResponseListener,
  saveDisplayedNotification,
  wasNotificationDisplayed
} from '../services/notificationService';
import * as Notifications from 'expo-notifications';

// Her 30 saniyede bir kontrol et (pil tasarrufu için daha uzun süreli)
const POLLING_INTERVAL = 30000;

export function NotificationBackground() {
  const { token, user } = useAuth();
  const pollingIntervalRef = useRef<any>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Bildirimleri kontrol et
  const checkForNewNotifications = useCallback(async () => {
    if (!token) {
      console.log('Bildirim kontrolü - token bulunamadı');
      return;
    }

    try {
      console.log('Yeni bildirimler kontrol ediliyor...');
      const fetchedNotifications = await getNotifications(token);
      
      if (!Array.isArray(fetchedNotifications) || fetchedNotifications.length === 0) {
        return;
      }
      
      // Backend'den gelen verileri dönüştür
      const notifications = fetchedNotifications.map((notification: any) => ({
        id: notification.id,
        title: notification.title || 'Bildirim',
        message: notification.message,
        createdAt: notification.createdAt,
        type: notification.type || 'status-update',
        isRead: notification.isRead || false,
      }));
      
      // Okunmamış bildirimleri filtrele
      const unreadNotifications = notifications.filter(
        notification => !notification.isRead
      );
      
      if (unreadNotifications.length > 0) {
        // Her bildirim için kontrol ve gösterme
        for (const notification of unreadNotifications) {
          // Bu bildirimi daha önce gösterip göstermediğimizi kontrol et
          const alreadyDisplayed = await wasNotificationDisplayed(notification.id);
          
          if (!alreadyDisplayed) {
            console.log('Yeni bildirim gösteriliyor:', notification.title);
            
            // Bildirimi göster
            await sendLocalNotification(
              notification.title,
              notification.message,
              { notificationId: notification.id, type: notification.type }
            );
            
            // Bildirimi gösterilenler listesine ekle
            await saveDisplayedNotification(notification.id);
          }
        }
      }
    } catch (error) {
      console.error('Bildirim kontrolü sırasında hata:', error);
    }
  }, [token]);

  // Polling mekanizmasını başlat
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Hemen bir kere kontrol et
    checkForNewNotifications();
    
    // Belirli aralıklarla kontrol etmeye başla
    pollingIntervalRef.current = setInterval(checkForNewNotifications, POLLING_INTERVAL);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [checkForNewNotifications]);

  useEffect(() => {
    // Bildirim izinlerini ve token'ı al
    registerForPushNotificationsAsync();
    
    // Bildirim geldiğinde
    notificationListener.current = addNotificationListener((notification: Notifications.Notification) => {
      console.log('Bildirim alındı:', notification);
    });

    // Kullanıcı bildirime tıkladığında
    responseListener.current = addNotificationResponseListener((response: Notifications.NotificationResponse) => {
      console.log('Bildirime tıklandı:', response);
      // Eğer özel veri varsa işle
      const data = response.notification.request.content.data;
      if (data && data.notificationId) {
        // Bildirime özel işlemler yapılabilir
        console.log('Bildirim ID:', data.notificationId);
      }
    });
    
    // Polling'i başlat
    const cleanup = startPolling();

    // Temizleme fonksiyonu
    return () => {
      cleanup();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [token, startPolling]);

  // Bu bileşen görünmez - sadece arkaplanda çalışır
  return null;
} 