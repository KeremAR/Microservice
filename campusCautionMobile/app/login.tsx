import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
const logo = require('../assets/images/au-logo.png');

import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }

    const result = await login({ email, password });
    
    if (result) {
      router.replace('/(app)');
    } else if (error) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.contentContainer}>
            {/* Logo and tagline */}
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.titlePartOne}>Campus</Text>
                <Text style={styles.titlePartTwo}>Caution</Text>
              </View>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <Text style={styles.heading}>Login</Text>

              {/* Email field */}
              <View style={styles.formControl}>
                <Text style={styles.label}>Email</Text>
                <TextInput 
                  style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
              </View>

              {/* Password field */}
              <View style={styles.formControl}>
                <Text style={styles.label}>Password</Text>
                <TextInput 
                  style={styles.input}
                    placeholder="Enter your password"
                  secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
              </View>

              {/* Forgot password */}
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity onPress={() => router.push('/forgot-password')} disabled={loading}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Or divider */}
              <Text style={styles.divider}>or</Text>

              {/* Google Sign In Button */}
              <GoogleSignInButton />

              {/* Sign up */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/signup')} disabled={loading}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePartOne: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
  },
  titlePartTwo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  formControl: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    color: '#4b5563',
    fontWeight: 'bold',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 0.7,
    borderColor: '#e2e8f0',
    height: 45,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1e40af',
    borderRadius: 8,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginVertical: 12,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#4b5563',
    fontSize: 14,
    marginRight: 4,
  },
  signupLink: {
    color: '#1e40af',
    fontWeight: '500',
    fontSize: 14,
  },
}); 