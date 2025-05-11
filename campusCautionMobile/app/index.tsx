import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function StartPage() {
  const { isAuthenticated, initialized } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auth context'in yüklenmesini bekle
    if (initialized) {
      setIsLoading(false);
    }
  }, [initialized]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  // Kimlik doğrulaması yapılmışsa ana uygulamaya, yapılmamışsa giriş sayfasına yönlendir
  return isAuthenticated ? <Redirect href="/(app)" /> : <Redirect href="/login" />;
} 