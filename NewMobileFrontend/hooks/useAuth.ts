import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../constants/firebaseConfig';

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth state değişiklikleri için listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Kayıt ol
  const signUp = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Giriş yap
  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Çıkış yap
  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut
  };
} 