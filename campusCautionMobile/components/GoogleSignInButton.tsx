import React, { useEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import {
    GoogleSignin,
    statusCodes,
    NativeModuleError
} from '@react-native-google-signin/google-signin';
// Import Firebase modules correctly
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Buffer } from 'buffer'; // Import Buffer for base64 decoding

// Initialize Google Sign-In
const WEB_CLIENT_ID = '465128947457-tfc7bantghtsml6gqmklheg3jcvcf11n';

// Base64 decode function for JWT tokens (works in React Native)
const decodeJwtPayload = (token: string): any => {
  try {
    const base64Payload = token.split('.')[1];
    const normalizedBase64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = normalizedBase64.padEnd(
      normalizedBase64.length + (4 - (normalizedBase64.length % 4)) % 4, 
      '='
    );
    const jsonPayload = Buffer.from(paddedBase64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return {};
  }
};

const GoogleSignInButton = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    // Configure Google Sign-In according to documentation
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: false,
    });
    console.log('Google Sign-In configured in component');
    
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // First sign out to ensure we get the account picker every time
      try {
        await GoogleSignin.signOut();
        console.log('Signed out from previous Google session');
      } catch (signOutError) {
        // It's okay if this fails, just continue
        console.log('No previous Google session to sign out from');
      }
      
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in with Google
      const signInResult = await GoogleSignin.signIn();
      
      // Get tokens separately (this works with the latest version of the library)
      const { idToken } = await GoogleSignin.getTokens();
      console.log('idToken', idToken);
      if (!idToken) {
        Alert.alert("Giriş Hatası", "Google'dan kimlik bilgisi (ID Token) alınamadı.");
        setLoading(false);
        return;
      }
      
      // Parse the ID token to extract user info
      // Note: This is a simple way to decode the token without verification
      // The actual verification is done by Firebase
      const decodedToken = decodeJwtPayload(idToken);
      console.log('Decoded Google ID token:', decodedToken);
      
      // Extract user info from the token
      const googleUserInfo = {
        email: decodedToken.email,
        givenName: decodedToken.given_name,
        familyName: decodedToken.family_name,
        name: decodedToken.name,
        picture: decodedToken.picture
      };
      
      console.log('[GoogleSignInButton] Checking Firebase apps before auth call. All apps:', firebase.apps.map(app => app.name).join(', ') || 'No apps found');
      if (firebase.apps.length > 0) {
        try {
          const defaultFirebaseApp = firebase.app(); // This attempts to get the [DEFAULT] app
          console.log(`[GoogleSignInButton] Default Firebase app found: Name: ${defaultFirebaseApp.name}, AppID: ${defaultFirebaseApp.options.appId}`);
        } catch (e: any) {
          console.error('[GoogleSignInButton] Error getting default Firebase app instance:', e.message, e);
        }
      } else {
          console.warn('[GoogleSignInButton] firebase.apps array is empty before attempting Firebase Auth!');
      }
      // Create Firebase credential with Google ID token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase with the Google credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;
      
      // Generate Firebase ID token for backend auth
      const customToken = await firebaseUser.getIdToken();
      
      if (customToken) {
        // Call login from AuthContext to update the app's auth state
        // Firebase user data is synced automatically when using the token with the backend
        const result = await login({ 
          email: firebaseUser.email || '', 
          password: '',
          token: customToken,
          user: {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: googleUserInfo.givenName || firebaseUser.displayName?.split(' ')[0] || '',
            surname: googleUserInfo.familyName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            role: 'user' // Default role, will be updated when profile is fetched
          }
        });
        
        if (result) {
          // Navigate to main app
          router.replace('/(app)');
        } else {
          Alert.alert("Giriş Hatası", "Google ile giriş yapıldı fakat uygulama durumu güncellenemedi.");
        }
      } else {
        Alert.alert("Giriş Hatası", "Kullanıcı token bilgisi alınamadı.");
      }

    } catch (error: unknown) {
      const gError = error as NativeModuleError;
      console.error(
          'Google Sign-In/Firebase Auth Hatası:', 
          `Code: ${gError.code}, Message: ${gError.message}`,
          gError
      );

      let errorMessage = "Beklenmedik bir sorun oluştu. Lütfen tekrar deneyin.";
      let errorTitle = "Giriş Hatası";

      if (gError.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Kullanıcı Google girişini iptal etti.');
        return;
      } else if (gError.code === statusCodes.IN_PROGRESS) {
        errorTitle = 'İşlem Devam Ediyor';
        errorMessage = 'Giriş işlemi zaten devam ediyor. Lütfen bekleyin.';
      } else if (gError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorTitle = 'Servis Hatası';
        errorMessage = 'Google Play Hizmetleri telefonunuzda bulunamadı veya güncel değil.';
      } 
      // Firebase Auth hataları
      else if (typeof gError.code === 'string' && gError.code.startsWith('auth/')) {
         errorTitle = 'Kimlik Doğrulama Hatası';
         errorMessage = gError.message || 'Firebase kimlik doğrulama hatası.';
      } 
      // Ağ hatası
      else if (gError.message?.includes('NETWORK_ERROR')) {
        errorTitle = 'Ağ Hatası';
        errorMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.googleButton}
      onPress={signInWithGoogle}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <FontAwesome name="google" size={18} color="#fff" />
          <Text style={styles.buttonText}>Google ile Giriş Yap</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  }
});

export default GoogleSignInButton; 