import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

// Import the same logo as in login
const logo = require('../assets/images/au-logo.png');

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    // Validate inputs
    if (!name || !surname || !email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    // Call signup function
    const result = await signUp({
      email,
      password,
      name,
      surname
    });

    if (result) {
      Alert.alert(
        'Success',
        'Your account has been created successfully. Please login to continue.',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );
    } else if (error) {
      Alert.alert('Sign Up Failed', error.message || 'Could not create account. Please try again.');
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

            {/* Sign Up Card */}
            <View style={styles.card}>
              <Text style={styles.heading}>Sign Up</Text>

              {/* First Name field */}
              <View style={styles.formControl}>
                <Text style={styles.label}>First Name</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your first name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              {/* Last Name field */}
              <View style={styles.formControl}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your last name"
                  value={surname}
                  onChangeText={setSurname}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

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
                  placeholder="Create a password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>

              {/* Confirm Password field */}
              <View style={styles.formControl}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Confirm your password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>

              {/* Sign Up button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              {/* Simple or text */}
              <Text style={styles.divider}>or</Text>

              {/* Login link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/login')} disabled={loading}>
                  <Text style={styles.loginLink}>Login</Text>
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#4b5563',
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    color: '#1e40af',
    fontWeight: '500',
    fontSize: 14,
  }
}); 