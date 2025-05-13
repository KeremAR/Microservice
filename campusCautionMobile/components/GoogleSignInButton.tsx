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

// Initialize Google Sign-In
const WEB_CLIENT_ID = '465128947457-tfc7bantghtsml6gqmklheg3jcvcf11n.apps.googleusercontent.com';

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
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in with Google
      const signInResult = await GoogleSignin.signIn();
      
      // Get tokens separately (this works with the latest version of the library)
      const { idToken } = await GoogleSignin.getTokens();
      
      if (!idToken) {
        Alert.alert("Giriş Hatası", "Google'dan kimlik bilgisi (ID Token) alınamadı.");
        setLoading(false);
        return;
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
            name: firebaseUser.displayName?.split(' ')[0] || '',
            surname: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
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