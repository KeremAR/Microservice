import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gösterilen bildirimleri saklayacak key
const DISPLAYED_NOTIFICATIONS_KEY = 'displayed_notifications';

// Gösterilen bildirimleri kaydet
export async function saveDisplayedNotification(notificationId: string): Promise<void> {
  try {
    // Mevcut gösterilen bildirimleri al
    const displayedNotifications = await getDisplayedNotifications();
    
    // Maksimum 100 bildirim sakla, array başından sil (en eski)
    if (displayedNotifications.length >= 100) {
      displayedNotifications.shift(); // En eski kaydı kaldır
    }
    
    // Yeni bildirimi ekle ve kaydet
    displayedNotifications.push(notificationId);
    await AsyncStorage.setItem(
      DISPLAYED_NOTIFICATIONS_KEY, 
      JSON.stringify(displayedNotifications)
    );
  } catch (error) {
    console.error('Gösterilen bildirim kaydedilirken hata:', error);
  }
}

// Gösterilen bildirimleri al
export async function getDisplayedNotifications(): Promise<string[]> {
  try {
    const displayedNotificationsJson = await AsyncStorage.getItem(DISPLAYED_NOTIFICATIONS_KEY);
    return displayedNotificationsJson ? JSON.parse(displayedNotificationsJson) : [];
  } catch (error) {
    console.error('Gösterilen bildirimler alınırken hata:', error);
    return [];
  }
}

// Bir bildirimin daha önce gösterilip gösterilmediğini kontrol et
export async function wasNotificationDisplayed(notificationId: string): Promise<boolean> {
  const displayedNotifications = await getDisplayedNotifications();
  return displayedNotifications.includes(notificationId);
}

// Bildirim ayarlarını yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Bildirim izinlerini iste ve token al
export async function registerForPushNotificationsAsync() {
  let token = null;
  
  // İzinleri kontrol et - EAS bilgilerini DEV ortamında kontrol etmiyoruz artık
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  // Eğer izin yoksa, kullanıcıdan iste
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  // İzin verilmediyse uyarı ver
  if (finalStatus !== 'granted') {
    console.log('Bildirim izni alınamadı!');
    return null;
  }
  
  // Sadece gerçek push token almak istiyorsak bu kısmı kullanırız
  // Development ortamında buna ihtiyacımız yok
  if (Constants.expoConfig?.extra?.eas?.projectId) {
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })).data;
      console.log('Expo push token:', token);
    } catch (error) {
      console.log('Token alınırken hata:', error);
    }
  } else {
    console.log('EAS Project ID bulunamadı, development modunda çalışılıyor.');
  }

  // Android için kanal oluştur (8.0+ gerekli)
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1e40af',
    });
  }

  return token;
}

// Yerel bildirim gönder (test için)
export async function sendLocalNotification(title: string, body: string, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Hemen gönder
  });
}

// Tüm bildirimleri sil
export async function dismissAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

// Bildirim dinleyicisini ayarla
export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

// Bildirim yanıt dinleyicisini ayarla (kullanıcı bildirime tıkladığında)
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
} 