import { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  name?: string;
  surname?: string;
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
  const login = async ({ email, password }: LoginParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
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
      const userInfo = { 
        id: data.user_id || '',
        email: email,
      };
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
      
      return {
        user: userInfo,
        token: authToken
      };
      
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

  // Çıkış işlemi
  const logout = async () => {
    try {
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