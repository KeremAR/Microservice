import { getNotifications } from './api';
import { sendLocalNotification } from './notificationService';

// Gösterilen bildirimleri takip etmek için memory store
// (Uygulama kapatılıp açıldığında sıfırlanır, ama geliştirme ortamı için yeterli)
let displayedNotifications = new Set();
let pollingInterval = null;
let isPolling = false;

// Son kontrol edilen bildirim ID'si
let lastCheckedId = null;

/**
 * Bildirim polling servisini başlat
 * @param {string} token - Kullanıcı token'ı
 * @param {number} interval - Kontrol aralığı (ms)
 */
export function startNotificationPolling(token, interval = 30000) {
  if (isPolling) {
    console.log('Bildirim servisi zaten çalışıyor.');
    return;
  }
  
  if (!token) {
    console.log('Token olmadan bildirim servisi başlatılamaz.');
    return;
  }
  
  console.log(`Bildirim servisi başlatılıyor. Kontrol aralığı: ${interval}ms`);
  
  // İlk kontrol
  checkForNewNotifications(token);
  
  // Periyodik kontrol
  pollingInterval = setInterval(() => {
    checkForNewNotifications(token);
  }, interval);
  
  isPolling = true;
}

/**
 * Bildirim polling servisini durdur
 */
export function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    isPolling = false;
    console.log('Bildirim servisi durduruldu.');
  }
}

/**
 * Yeni bildirimleri kontrol et
 * @param {string} token - Kullanıcı token'ı
 */
async function checkForNewNotifications(token) {
  try {
    console.log('Yeni bildirimler kontrol ediliyor...');
    const fetchedNotifications = await getNotifications(token);
    
    if (!Array.isArray(fetchedNotifications) || fetchedNotifications.length === 0) {
      return;
    }
    
    // Okunmamış bildirimleri filtrele
    const unreadNotifications = fetchedNotifications.filter(
      notification => !notification.isRead
    );
    
    // Yeni ve daha önce gösterilmemiş bildirimleri bul
    const newNotifications = unreadNotifications.filter(notification => 
      !displayedNotifications.has(notification.id)
    );
    
    // Yeni bildirimleri göster
    if (newNotifications.length > 0) {
      console.log(`${newNotifications.length} yeni bildirim bulundu, gösteriliyor...`);
      
      for (const notification of newNotifications) {
        // Bildirimi göster
        await sendLocalNotification(
          notification.title || 'Bildirim',
          notification.message,
          { notificationId: notification.id, type: notification.type }
        );
        
        // Gösterilen bildirimler listesine ekle
        displayedNotifications.add(notification.id);
      }
    }
  } catch (error) {
    console.error('Bildirim kontrolü sırasında hata:', error);
  }
} 