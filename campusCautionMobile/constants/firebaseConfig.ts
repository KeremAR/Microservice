import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: 'AIzaSyBRvp3vb3IhP7eUHpZ0Qa4P5zmkLAJX5KA',
  authDomain: 'user-service-a8931.firebaseapp.com',
  projectId: 'user-service-a8931',
  storageBucket: 'user-service-a8931.firebasestorage.app',
  messagingSenderId: '465128947457',
  appId: '1:465128947457:android:e5372d2d030716f12e6500',
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth, Firestore ve Storage servislerini dışa aktar
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Firebase app'i dışa aktar
export default app; 