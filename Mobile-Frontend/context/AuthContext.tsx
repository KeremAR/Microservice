import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth0, Auth0Provider } from 'react-native-auth0';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Auth0 Context tipi
type Auth0ContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserData: () => Promise<any>;
};

// Context'i oluştur
const Auth0Context = createContext<Auth0ContextType | undefined>(undefined);

// Auth0 Provider Component
export const Auth0ProviderWithRedirectCallback = ({ children }: { children: ReactNode }) => {
  // Çevre değişkenlerinden auth0 bilgilerini al veya varsayılan değerleri kullan
  const domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN || '';
  const clientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || '';
  
  // Gerçek redirectUri'yi oluştur
  const redirectUri = AuthSession.makeRedirectUri({
    native: 'com.keremm.campuscaution.auth0://callback',
    // @ts-ignore - useProxy EAS build'de çalışıyor ama tip tanımında yok
    useProxy: false,
  });
  
  console.log("AUTH0 REDIRECT URI:", redirectUri);
  console.log("Auth0 Configured with:", { domain, clientId, redirectUri });
  
  return (
    <Auth0Provider 
      domain={domain}
      clientId={clientId}
    >
      <Auth0ContextWrapper>{children}</Auth0ContextWrapper>
    </Auth0Provider>
  );
};

// Auth0 Context Wrapper
const Auth0ContextWrapper = ({ children }: { children: ReactNode }) => {
  const { authorize, clearSession, user, error, isLoading } = useAuth0();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Auth0 durumunu takip et
    setIsAuthenticated(user !== null && user !== undefined);
    if (user) {
      console.log("User authenticated:", user.name || user.email || user.sub);
    }
  }, [user]);

  // Auth0 login
  const login = async () => {
    try {
      // Tarayıcı oturumlarını başlatmadan önce temizle
      await WebBrowser.coolDownAsync();
      
      const credentials = await authorize({
        // @ts-ignore - prompt parametresi tip tanımında olmayabilir ama çalışıyor
        // Her seferinde login ekranını göster, oturumu hatırlama
        prompt: 'login'
      });
      console.log("Login successful, credentials:", credentials ? "Received" : "None");
      // Başarılı login sonrası isAuthenticated'ı manuel olarak true yap
      if (credentials) {
        setIsAuthenticated(true);
      }
      
      // Tarayıcı oturumlarını tekrar temizle
      await WebBrowser.coolDownAsync();
    } catch (e) {
      console.error("Login Error:", e);
      // Hata olsa bile oturumları temizle
      await WebBrowser.coolDownAsync();
    }
  };

  // Auth0 logout
  const logout = async () => {
    try {
      // Tarayıcı oturumlarını başlatmadan önce temizle
      await WebBrowser.coolDownAsync();
      await clearSession();
      // Tarayıcı oturumlarını tekrar temizle
      await WebBrowser.coolDownAsync();
    } catch (e) {
      console.error("Logout Error:", e);
      // Hata olsa bile oturumları temizle
      await WebBrowser.coolDownAsync();
    }
  };

  // Kullanıcı verilerini al
  const getUserData = async () => {
    if (!user) {
      console.warn("No user is logged in");
      return;
    }
    
    try {
      // Auth0'dan gelen user objesi ID token'dan çözümleniyor
      return user;
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };

  const contextValue = {
    isLoading,
    isAuthenticated,
    user,
    login,
    logout,
    getUserData,
  };

  return (
    <Auth0Context.Provider value={contextValue}>
      {children}
    </Auth0Context.Provider>
  );
};

// Auth0 Context hook
export const useAuth = (): Auth0ContextType => {
  const context = useContext(Auth0Context);
  if (context === undefined) {
    throw new Error('useAuth must be used within an Auth0ProviderWithRedirectCallback');
  }
  return context;
}; 