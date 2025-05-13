import { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

type User = {
  id: string;
  email: string;
  name?: string;
  surname?: string;
  department_id?: number;
  role?: string;
};

type SignUpParams = {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone_number?: string;
};

type LoginParams = {
  email: string;
  password: string;
  token?: string;
  user?: User;
};

type AuthError = {
  code: number;
  message: string;
  details?: any;
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export default function useCustomAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  // Kullanıcı kaydı
  const signUp = async (userData: SignUpParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.SIGNUP}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError({
          code: data.detail?.code || response.status,
          message: data.detail?.message || 'Kayıt işlemi başarısız oldu',
          details: data.detail
        });
        return null;
      }
      
      // Başarılı kayıt işlemi sonrası otomatik login olarak düşünebiliriz
      // veya login ekranına yönlendirebiliriz
      return data;
      
    } catch (err: any) {
      setError({
        code: 500,
        message: 'Bağlantı hatası: ' + err.message
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Giriş işlemi
  const login = async ({ email, password, token: providedToken, user: providedUser }: LoginParams) => {
    setLoading(true);
    setError(null);
    
    try {
      // If token is already provided (e.g. from Google Sign-In)
      if (providedToken && providedUser) {
        // Save token
        await AsyncStorage.setItem(TOKEN_KEY, providedToken);
        setToken(providedToken);
        
        // Save user info
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(providedUser));
        setUser(providedUser);
        
        return {
          user: providedUser,
          token: providedToken
        };
      }
      
      // Traditional email/password login
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      
      console.log('Login response status:', response.status);
      
      // Yanıtı önce metin olarak al ve logla
      const responseText = await response.text();
      console.log('Login response text:', responseText);
      
      // Metni JSON'a çevir
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON parse hatası:', e);
        throw new Error('Sunucu yanıtı geçersiz format');
      }
      
      if (!response.ok) {
        setError({
          code: data.detail?.code || response.status,
          message: data.detail?.message || 'Giriş işlemi başarısız oldu',
          details: data.detail
        });
        return null;
      }
      
      // Token kaydet
      const authToken = data.token;
      await AsyncStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
      
      // Kullanıcı bilgilerini kaydet
      const userInfo: User = { 
        id: data.user_id || '',
        email: email,
        name: data.name || data.user_name || data.username || '',
        surname: data.surname || data.user_surname || '',
        department_id: data.department_id || null,
        role: data.role || 'student'
      };
      
      console.log('User info to save:', userInfo);
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
      
      return {
        user: userInfo,
        token: authToken
      };
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError({
        code: 500,
        message: 'Bağlantı hatası: ' + err.message
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış işlemi
  const logout = async () => {
    try {
      // Sign out from Firebase if user is signed in
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
      }
      
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
      return true;
    } catch (err) {
      return false;
    }
  };

  // Oturum durumunu yükle
  const loadSession = async () => {
    setLoading(true);
    try {
      const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const savedUser = await AsyncStorage.getItem(USER_KEY);
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Oturum yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    token,
    loading,
    error,
    signUp,
    login,
    logout,
    loadSession,
    isAuthenticated: !!user && !!token
  };
} 