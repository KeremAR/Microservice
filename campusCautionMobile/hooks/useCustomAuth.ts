import { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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
        console.log('Login with Firebase token and Google auth...');
        
        // For Google Sign-In, we need to handle differently since we already have Firebase authentication
        try {
          // First, check profile endpoint to see if user exists in system
          console.log('Making profile API call first to check user status...');
          const profileResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
            method: 'GET',
            headers: {
              ...getHeaders(),
              'Authorization': `Bearer ${providedToken}`
            }
          });
          
          const profileResponseText = await profileResponse.text();
          let profileData;
          
          try {
            profileData = JSON.parse(profileResponseText);
            console.log('Profile API response:', profileData);
          } catch (e) {
            console.error('Profile API JSON parse error:', e);
          }
          
          // Check if this is a Google user that needs UUID formatting
          if (profileResponse.ok && profileData?.status === 'warning' && 
              profileData?.action_required?.includes('google-signup')) {
            console.log('Need to register Google user with proper UUID format');
            
            // Call the new google-signup endpoint to create a UUID-formatted user
            const googleSignupResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_SIGNUP}`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({
                uid: profileData.firebase_uid,
                email: profileData.email,
                displayName: providedUser.name,
                given_name: providedUser.name?.split(' ')[0] || '',
                family_name: providedUser.surname || providedUser.name?.split(' ').slice(1).join(' ') || ''
              })
            });
            
            const googleSignupText = await googleSignupResponse.text();
            console.log('Google signup response:', googleSignupText);
            
            let googleSignupData;
            try {
              googleSignupData = JSON.parse(googleSignupText);
            } catch (e) {
              console.error('Google signup JSON parse error:', e);
            }
            
            if (googleSignupResponse.ok && googleSignupData) {
              console.log('Google user registered with UUID format successfully');
              
              // Save the token
              await AsyncStorage.setItem(TOKEN_KEY, providedToken);
              setToken(providedToken);
              
              // Save user with proper UUID
              const userInfo: User = {
                id: googleSignupData.user_id, // This should be the UUID now
                email: providedUser.email,
                name: providedUser.name || '',
                surname: providedUser.surname || '',
                role: 'user',
              };
              
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
              setUser(userInfo);
              
              setLoading(false);
              return {
                user: userInfo,
                token: providedToken
              };
            } else {
              console.error('Failed to register Google user with UUID format');
            }
          }
          
          // Continue with normal login process if not a new Google user or if signup failed
          console.log('Continuing with normal login process...');
          
          // Call our backend API to register this Firebase authenticated user in Supabase
          const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ 
              email: providedUser.email,
              // Send an empty password - the backend uses Firebase to authenticate
              password: '',
              // Add provider info since we've added it to the model
              provider: 'google'
            })
          });
          
          // Log response for debugging
          const responseText = await response.text();
          console.log('API Login response for Firebase user:', responseText);
          
          // Process API response
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('API response JSON parse error:', e);
          }
          
          // Save Firebase token from Google authentication
          await AsyncStorage.setItem(TOKEN_KEY, providedToken);
          setToken(providedToken);
          
          if (data && response.ok) {
            console.log('Google auth login API call succeeded');
            
            // Save user info from backend response
            const userInfo: User = { 
              id: data?.user_id || providedUser.id,
              email: providedUser.email,
              name: data?.name || providedUser.name,
              surname: data?.surname || providedUser.surname,
              role: data?.role || 'user',
              department_id: data?.department_id
            };
            
            console.log('Saving user info from API response:', userInfo);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
            setUser(userInfo);
          } else {
            console.warn('Backend login API call failed, using Firebase data only');
            
            // Save what we have from Firebase data
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(providedUser));
            setUser(providedUser);
          }
          
          // Important: Make an additional call to profile API to ensure user is in Supabase
          // This is needed because sometimes the login endpoint doesn't properly sync with Supabase
          try {
            console.log('Making profile API call to ensure user is synced with Supabase...');
            const profileResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
              method: 'GET',
              headers: {
                ...getHeaders(),
                'Authorization': `Bearer ${providedToken}`
              }
            });
            
            // If profile API succeeded, update user data from it
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log('Profile API response after login:', profileData);
              
              if (profileData && profileData.user_id) {
                // Update user info with the latest from profile API
                const updatedUserInfo: User = { 
                  id: profileData.user_id,
                  email: profileData.email,
                  name: profileData.name || providedUser.name,
                  surname: profileData.surname || providedUser.surname,
                  role: profileData.role || 'user',
                  department_id: profileData.department_id
                };
                
                console.log('Updating user info from profile API:', updatedUserInfo);
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUserInfo));
                setUser(updatedUserInfo);
              }
            }
          } catch (profileError) {
            console.error('Profile API call failed:', profileError);
            // Continue anyway as we already have basic user info
          }
          
          return {
            user: user || providedUser,
            token: providedToken
          };
        } catch (apiError) {
          console.error('All API calls failed during Google auth:', apiError);
          // Still proceed with Firebase auth data
          
          await AsyncStorage.setItem(TOKEN_KEY, providedToken);
          setToken(providedToken);
          
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(providedUser));
          setUser(providedUser);
          
          return {
            user: providedUser,
            token: providedToken
          };
        }
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
      // Try to sign out from Google Sign-In first
      try {
        // Sign out from Google (no need to check if signed in first)
        await GoogleSignin.signOut();
        console.log('Successfully signed out from Google');
      } catch (googleError) {
        console.error('Google Sign-In logout error:', googleError);
        // Continue logout process even if Google Sign-In logout fails
      }
      
      // Then sign out from Firebase
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
      }
      
      // Clear local storage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
      return true;
    } catch (err) {
      console.error('Logout error:', err);
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