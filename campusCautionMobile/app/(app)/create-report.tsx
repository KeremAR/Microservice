import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Easing,
  StyleSheet
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { mockDepartments } from '../../data/mockData';
import { createIssue } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Token key is 'auth_token' as defined in useCustomAuth.ts
const TOKEN_KEY = 'auth_token';

// Define a type for photos
interface Photo {
  id: string;
  uri: string;
  type: 'camera' | 'gallery';
}

// Konum bilgisini tanımlayan interface
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export default function CreateReportScreen() {
  const router = useRouter();
  const { token } = useAuth(); // Token'ı doğrudan AuthContext'ten al
  const [step, setStep] = useState(1); // 1: Photo, 2: Department, 3: Description, 4: Success
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUnsureDepartment, setIsUnsureDepartment] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showPhotoOptionsSheet, setShowPhotoOptionsSheet] = useState(false);
  const [showDepartmentSheet, setShowDepartmentSheet] = useState(false);
  const [isPhotoSheetReady, setIsPhotoSheetReady] = useState(false);
  const [selectIsOpen, setSelectIsOpen] = useState(false); // State for controlling dropdown
  const [isSubmitting, setIsSubmitting] = useState(false); // State for tracking submission process
  const [error, setError] = useState<string | null>(null); // State for tracking submission errors
  const [location, setLocation] = useState<LocationData | null>(null); // Konum bilgisi
  const [isLoadingLocation, setIsLoadingLocation] = useState(false); // Konum yükleniyor mu?
  
  // Refs for inputs
  const descriptionInputRef = useRef<TextInput>(null);
  
  // Animation values for bottom sheets
  const bottomSheetHeight = SCREEN_HEIGHT * 0.5; // 50% of screen height for department info
  const photoOptionsHeight = 200; // Height for photo options sheet
  const departmentSheetHeight = SCREEN_HEIGHT * 0.6; // Height for department selection sheet
  const bottomSheetAnim = useRef(new Animated.Value(bottomSheetHeight)).current;
  const photoOptionsAnim = useRef(new Animated.Value(photoOptionsHeight)).current;
  const departmentSheetAnim = useRef(new Animated.Value(departmentSheetHeight)).current;
  const departmentBackdropOpacity = useRef(new Animated.Value(0)).current; // Separate backdrop for department info
  const photoBackdropOpacity = useRef(new Animated.Value(0)).current; // Separate backdrop for photos
  const departmentSelectBackdropOpacity = useRef(new Animated.Value(0)).current; // Backdrop for department selection

  // Pre-configure bottom sheet to improve first open performance
  useEffect(() => {
    // Prepare animation values - this helps reduce stutter on first opening
    const prepareAnimations = () => {
      // Force calculations now rather than at first animation
      photoOptionsAnim.setValue(photoOptionsHeight);
      departmentBackdropOpacity.setValue(0);
      photoBackdropOpacity.setValue(0);
      setIsPhotoSheetReady(true);
    };
    
    prepareAnimations();
  }, []);

  // Request camera, media library and location permissions
  useEffect(() => {
    (async () => {
      // Kamera ve medya kütüphanesi izinleri
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to take photos');
      }
      
      if (!mediaLibraryPermission.granted) {
        Alert.alert('Permission Required', 'Media library access is required to select photos');
      }
      
      // Konum izni
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required to report issues accurately');
      } else {
        // Konum izni varsa konumu al
        getCurrentLocation();
      }
    })();
  }, []);
  
  // Konum bilgisini alma fonksiyonu
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        // İzin yoksa hata mesajı göster
        setError('Konum izni verilmediği için konum bilgisi alınamadı.');
        return;
      }
      
      // Düşük doğrulukla hızlı konum alımı
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('Konum bilgisi alındı:', currentLocation.coords);
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || undefined,
      });
    } catch (error) {
      console.error('Konum alma hatası:', error);
      setError('Konum alınamadı. Lütfen GPS\'inizin açık olduğundan emin olun.');
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  // Reset form state when screen comes into focus and when leaving
  useFocusEffect(
    useCallback(() => {
      // Reset the form state when screen comes into focus
      setStep(1);
      setDepartment('');
      setDescription('');
      setTitle('');
      setPhotos([]);
      setIsUnsureDepartment(false);
      setIsSubmitting(false);
      setError(null);
      
      // Her ekran odaklandığında yeni konum bilgisi al
      getCurrentLocation();
      
      return () => {
        // Reset state when navigating away from the screen
        setStep(1);
        setDepartment('');
        setDescription('');
        setTitle('');
        setPhotos([]);
        setIsUnsureDepartment(false);
        setIsSubmitting(false);
        setError(null);
        setLocation(null);
      };
    }, [])
  );
  
  // Function to submit the report data to the backend
  const submitReport = async () => {
    console.log('*** submitReport fonksiyonu çağrıldı ***');
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('Rapor verileri hazırlanıyor...');
      console.log('Başlık:', title);
      console.log('Açıklama:', description);
      console.log('Departman:', department);
      console.log('Foto sayısı:', photos.length);
      console.log('Konum bilgisi:', location);
      
      // Token kontrolü - AuthContext'ten doğrudan token'ı kullan, yoksa AsyncStorage'dan dene
      let authToken = token;
      console.log('Context token:', authToken ? 'Var' : 'Yok');
      
      // Context'ten token gelmezse AsyncStorage'dan al (doğru anahtar kullanarak)
      if (!authToken) {
        console.log(`AsyncStorage'dan token alınıyor (${TOKEN_KEY})`);
        authToken = await AsyncStorage.getItem(TOKEN_KEY);
        console.log('AsyncStorage token:', authToken ? 'Var' : 'Yok');
      }
      
      if (!authToken) {
        console.log('Hem context hem de AsyncStorage\'da token bulunamadı. Test token kullanılıyor.');
        // Geçici çözüm: Test için hardcoded bir token kullan
        // NOT: Bu token gerçek bir değer değil, test amaçlı. Gerçek bir token gerekiyor.
        const testToken = "test-token-12345";
        
        // Prepare data and continue with the test token
        const photoUrls = photos.map(photo => photo.uri);
        
        let departmentId: number | null = null;
        if (department && !isUnsureDepartment) {
          departmentId = parseInt(department, 10);
        }
        console.log('Hesaplanan departmentId:', departmentId);
        
        const issueData = {
          title,
          description,
          departmentId,
          photos: photoUrls,
          latitude: location?.latitude,
          longitude: location?.longitude,
        };
        
        console.log('API çağrısı yapılıyor (test token ile), veri:', JSON.stringify(issueData));
        
        try {
          // Submit report data to backend with test token
          const response = await createIssue(testToken, issueData);
          console.log('Rapor başarıyla gönderildi (test token ile):', response);
          setStep(4);
        } catch (tokenTestError) {
          console.error('Test token ile de hata oluştu:', tokenTestError);
          throw tokenTestError;
        }
        
        return;
      }
      
      console.log('Gerçek token ile işlem yapılıyor');
      
      // Eğer user context'ten kullanılabilirse, user ID'sini al
      let userId = '';
      if (authToken && authToken.split('.').length === 3) {
        try {
          // JWT'nin payload kısmını decode et ve userId almayı dene
          const base64Payload = authToken.split('.')[1];
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.uid || payload.sub || payload.user_id || '';
          console.log('Token\'dan çıkarılan userId:', userId);
        } catch (e) {
          console.error('Token parse hatası:', e);
        }
      }
      
      // Normal flow with valid token
      // Use photo URIs directly (conversion to base64 happens in the API service)
      const photoUrls = photos.map(photo => photo.uri);
      
      // Department ID artık array index'i, direkt number'a çevir
      let departmentId: number | null = null;
      if (department && !isUnsureDepartment) {
        departmentId = parseInt(department, 10);
      }
      console.log('Hesaplanan departmentId:', departmentId);

      // Prepare data for submission
      const issueData = {
        title,
        description,
        departmentId,
        photos: photoUrls,
        userId, // userId'yi gönder
        latitude: location?.latitude,
        longitude: location?.longitude,
      };
      
      console.log('API çağrısı yapılıyor, veri:', JSON.stringify({
        ...issueData,
        photos: photoUrls.length > 0 ? [`${photoUrls[0].substring(0, 20)}...`] : [] // Only show part of the URI in logs
      }));
      
      // Submit report data to backend
      const response = await createIssue(authToken, issueData);
      
      console.log('Rapor başarıyla gönderildi:', response);
      
      // Proceed to success screen
      console.log('Success ekranına geçiliyor');
      setStep(4);
    } catch (error) {
      console.error('Rapor gönderme hatası:', error);
      console.log('Hata detayı:', error instanceof Error ? error.message : 'Bilinmeyen hata');
      
      // Store the error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Rapor gönderilirken bilinmeyen bir hata oluştu.';
      
      setError(errorMessage);
      
      // Show error to user with a more informative message
      Alert.alert(
        'Gönderme Hatası',
        errorMessage,
        [{ 
          text: 'Tamam', 
          onPress: () => {} 
        }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNextStep = () => {
    console.log('handleNextStep çağrıldı, mevcut adım:', step);
    
    if (step === 1 && photos.length === 0) {
      console.log('Foto yok, uyarı gösteriliyor');
      // Show confirmation dialog instead of just an alert
      Alert.alert(
        'No Photo Added',
        'Are you sure you want to continue without adding a photo?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => setStep(step + 1),
          },
        ],
        { cancelable: false }
      );
      return;
    }
    
    if (step === 2 && !department && !isUnsureDepartment) {
      console.log('Departman seçilmemiş, uyarı gösteriliyor');
      Alert.alert('Department Required', 'Please select a department or check the "I\'m not sure" option.');
      return;
    }
    
    if (step === 3 && (!description || !title)) {
      console.log('Başlık veya açıklama eksik, uyarı gösteriliyor');
      Alert.alert('Information Required', 'Please provide both a title and description for the issue.');
      return;
    }
    
    if (step < 3) {
      console.log(`Adım ${step}'den ${step + 1}'e geçiliyor`);
      setStep(step + 1);
    } else if (step === 3) {
      console.log('Adım 3: Submit işlemi başlatılıyor');
      // Submit the report
      submitReport();
    } else if (step === 4) {
      console.log('Adım 4: Ana sayfaya dönülüyor');
      // Return to home
      router.replace('/(app)');
    }
  };
  
  const handleBackPress = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };
  
  const handleUnsureDepartmentChange = () => {
    const newValue = !isUnsureDepartment;
    setIsUnsureDepartment(newValue);
    
    if (newValue) {
      // Show bottom sheet
      setShowInfoSheet(true);
      setDepartment('');
      
      // Animate bottom sheet up
      Animated.parallel([
        Animated.timing(bottomSheetAnim, {
          toValue: 0, // Animate to 0 (fully shown)
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(departmentBackdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };
  
  const closeInfoSheet = () => {
    // Animate bottom sheet down
    Animated.parallel([
      Animated.timing(bottomSheetAnim, {
        toValue: bottomSheetHeight, // Animate back to height (hidden)
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(departmentBackdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowInfoSheet(false);
    });
  };
  
  const openPhotoOptionsSheet = () => {
    // Show sheet first, then animate
    setShowPhotoOptionsSheet(true);
    
    // Simple and direct animation - match with department bottom sheet
    Animated.parallel([
      Animated.timing(photoOptionsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(photoBackdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const closePhotoOptionsSheet = () => {
    // Match with department bottom sheet animation
    Animated.parallel([
      Animated.timing(photoOptionsAnim, {
        toValue: photoOptionsHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(photoBackdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowPhotoOptionsSheet(false);
    });
  };
  
  const takePhoto = async () => {
    closePhotoOptionsSheet();
    
    try {
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable crop/edit step
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Replace photos array with single photo instead of appending
        setPhotos([{
          id: `camera_${Date.now()}`,
          uri: asset.uri,
          type: 'camera'
        }]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  const selectFromGallery = async () => {
    closePhotoOptionsSheet();
    
    try {
      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable crop/edit step
        quality: 0.7,
        allowsMultipleSelection: false,
        selectionLimit: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Replace photos array with single photo instead of mapping
        setPhotos([{
          id: `gallery_${Date.now()}`,
          uri: asset.uri,
          type: 'gallery' as const
        }]);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select from gallery. Please try again.');
    }
  };
  
  const removePhoto = (id: string) => {
    setPhotos(photos.filter(photo => photo.id !== id));
  };
  
  const getStepTitle = () => {
    switch (step) {
      case 1: return "Add Photos";
      case 2: return "Select Department";
      case 3: return "Describe the Issue";
      case 4: return "Report Submitted";
      default: return "Report an Issue";
    }
  };

  // Function to calculate progress percentage
  const getProgressPercentage = () => {
    if (step === 4) return 100; // Success screen is 100%
    return (step / 3) * 100; // 3 is total number of steps (excluding success)
  };

  const renderStepContent = () => {
    console.log('renderStepContent çağrıldı, mevcut adım:', step);
    switch (step) {
      case 1:
        console.log('Adım 1 (Foto) içeriği render ediliyor');
        return (
          <View style={{gap: 24, alignItems: 'center', padding: 20}}>
            <Text style={{textAlign: 'center', marginBottom: 16}}>
              Please add a photo of the issue to help us better understand the problem.
            </Text>
            
            {/* Single Add Photo Button - Mavi Tasarım */}
            <View
              style={{
                backgroundColor: '#EBF5FF',
                padding: 24,
                borderRadius: 12,
                width: '80%',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16, // Reduced marginBottom to make room for location info
                borderColor: '#BFDBFE',
                borderWidth: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
                elevation: 2,
                overflow: 'hidden'
              }}
            >
              {/* Background pattern for visual interest */}
              <View 
                style={{
                  position: 'absolute', 
                  right: -20, 
                  bottom: -20, 
                  width: 120, 
                  height: 120, 
                  borderRadius: 100,
                  backgroundColor: '#DBEAFE',
                  opacity: 0.8
                }}
              />
              <View 
                style={{
                  position: 'absolute', 
                  left: -15, 
                  top: -15, 
                  width: 80, 
                  height: 80, 
                  borderRadius: 100,
                  backgroundColor: '#DBEAFE',
                  opacity: 0.5
                }}
              />
              
              <Pressable 
                onPress={openPhotoOptionsSheet}
                style={{
                  width: '100%',
                  alignItems: 'center'
                }}
              >
                <View
                  style={{
                    backgroundColor: 'white',
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 100,
                    borderColor: '#93C5FD',
                    borderWidth: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1
                  }}
                >
                  <Ionicons name="camera" size={32} color="#1E40AF" />
                </View>
                <Text style={{fontSize: 18, fontWeight: '600', color: '#1E40AF'}}>Add Photo</Text>
                <Text style={{fontSize: 12, color: '#3B82F6', marginTop: 4}}>Tap to select from camera or gallery</Text>
              </Pressable>
            </View>
            
            {/* Location Information */}
            <View style={{
              backgroundColor: '#F0FDF4',
              padding: 12,
              borderRadius: 8,
              width: '80%',
              alignItems: 'center',
              borderColor: '#D1FAE5',
              borderWidth: 1,
              marginBottom: 16
            }}>
              {renderLocationInfo()}
            </View>
            
            {photos.length > 0 && (
              <View style={{gap: 16, width: '100%'}}>
                <Text style={{color: '#047857', marginBottom: 8}}>
                  Photo added
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection: 'row', gap: 8}}>
                    {photos.map((photo) => (
                      <View key={photo.id} style={{position: 'relative'}}>
                        <Image 
                          source={{ uri: photo.uri }} 
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 8
                          }}
                        />
                        <Pressable
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            borderRadius: 100,
                            padding: 4
                          }}
                          onPress={() => removePhoto(photo.id)}
                        >
                          <Ionicons name="close" size={12} color="white" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        );
        
      case 2:
        console.log('Adım 2 (Departman) içeriği render ediliyor');
        return (
          <View style={{gap: 16, padding: 20}}>
            <Text style={{fontSize: 18, fontWeight: '500', color: '#1F2937', marginBottom: 16}}>
              Please select the department that should handle this issue.
            </Text>
            
            {/* Department Selection - Clean Design */}
            <View
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 12,
                width: '100%',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2
              }}
            >
              <Text style={{fontSize: 16, fontWeight: '500', color: '#4B5563', marginBottom: 12}}>Department</Text>
              
              <View style={{width: '100%'}}>
                <Pressable 
                  style={{
                    borderColor: '#D1D5DB', 
                    borderRadius: 8, 
                    borderWidth: 1,
                    height: 48,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isUnsureDepartment ? '#F3F4F6' : 'white'
                  }}
                  onPress={openDepartmentSheet}
                  disabled={isUnsureDepartment}
                >
                  <Text 
                    style={{
                      fontSize: 16, 
                      color: department ? '#1F2937' : '#9CA3AF',
                      opacity: isUnsureDepartment ? 0.5 : 1
                    }}
                  >
                    {department 
                      ? mockDepartments[parseInt(department, 10)]?.name || 'Select a department'
                      : 'Select a department'}
                  </Text>
                  <Ionicons name="chevron-down" size={24} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>
            
            {/* "I'm not sure" Option - Clean Design */}
            <View
              style={{
                backgroundColor: 'white',
                padding: 16,
                borderRadius: 12,
                width: '100%',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2
              }}
            >
              <Pressable 
                style={{
                  flexDirection: 'row', 
                  alignItems: 'center',
                  padding: 8
                }}
                onPress={handleUnsureDepartmentChange}
              >
                <View 
                  style={{
                    width: 24, 
                    height: 24, 
                    borderWidth: 2,
                    borderColor: isUnsureDepartment ? '#1E40AF' : '#D1D5DB',
                    borderRadius: 4,
                    backgroundColor: isUnsureDepartment ? '#1E40AF' : 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}
                >
                  {isUnsureDepartment && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 16, fontWeight: '500', color: '#1F2937'}}>
                    I'm not sure which department handles this
                  </Text>
                  <Text style={{fontSize: 14, color: '#6B7280'}}>
                    We'll automatically assign it to the right department
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        );
        
      case 3:
        console.log('Adım 3 (Açıklama) içeriği render ediliyor');
        return (
          <View style={{gap: 16, padding: 20}}>
            <Text style={{fontSize: 18, fontWeight: '500', color: '#1F2937', marginBottom: 8}}>
              Please provide a title and detailed description of the issue to help us address it efficiently.
            </Text>
            
            {/* Combined Title and Description in one Box */}
            <View
              style={{
                backgroundColor: '#EBF5FF',
                padding: 24,
                borderRadius: 12,
                width: '100%',
                marginBottom: 16,
                borderColor: '#BFDBFE',
                borderWidth: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
                elevation: 2,
                overflow: 'hidden'
              }}
            >
              {/* Background pattern for visual interest */}
              <View 
                style={{
                  position: 'absolute', 
                  right: -20, 
                  bottom: -20, 
                  width: 120, 
                  height: 120, 
                  borderRadius: 100,
                  backgroundColor: '#DBEAFE',
                  opacity: 0.6
                }}
              />
              <View 
                style={{
                  position: 'absolute', 
                  left: -15, 
                  top: -15, 
                  width: 80, 
                  height: 80, 
                  borderRadius: 100,
                  backgroundColor: '#DBEAFE',
                  opacity: 0.4
                }}
              />
              
              {/* Title Input */}
              <Text style={{fontSize: 16, fontWeight: '600', color: '#1E40AF', marginBottom: 12}}>
                Title
              </Text>
              
              <View style={{width: '100%', zIndex: 1, marginBottom: 16}}>
                <TextInput
                  style={{
                    height: 48,
                    backgroundColor: 'white',
                    borderColor: '#93C5FD',
                    borderRadius: 8,
                    borderWidth: 1,
                    padding: 12,
                    fontSize: 16,
                    color: '#1F2937',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1
                  }}
                  placeholder="Enter a brief title for the issue"
                  value={title}
                  onChangeText={setTitle}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // Focus the description input when submit is pressed on title
                    if (descriptionInputRef.current) {
                      descriptionInputRef.current.focus();
                    }
                  }}
                />
              </View>
              
              <Text style={{fontSize: 12, color: '#3B82F6', marginBottom: 16}}>
                A clear title helps identify your issue quickly
              </Text>
              
              {/* Description Input */}
              <Text style={{fontSize: 16, fontWeight: '600', color: '#1E40AF', marginBottom: 12}}>
                Description
              </Text>
              
              <View style={{width: '100%', zIndex: 1}}>
                <TextInput
                  style={{
                    height: 180,
                    backgroundColor: 'white',
                    borderColor: '#93C5FD',
                    borderRadius: 8,
                    borderWidth: 1,
                    padding: 12,
                    textAlignVertical: 'top',
                    fontSize: 16,
                    color: '#1F2937',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1
                  }}
                  placeholder="Describe the issue in detail"
                  value={description}
                  onChangeText={setDescription}
                  multiline={true}
                  numberOfLines={6}
                  autoCapitalize="sentences"
                  ref={descriptionInputRef}
                />
              </View>
              
              <Text style={{fontSize: 12, color: '#3B82F6', marginTop: 12}}>
                Detailed descriptions help us resolve issues faster
              </Text>
            </View>
          </View>
        );
        
      case 4:
        console.log('Adım 4 (Success) içeriği render ediliyor');
        return (
          <View style={{
            flex: 1, 
            backgroundColor: 'white',
            alignItems: 'center',
            padding: 24
          }}>
            {/* Success Checkmark */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(52, 211, 153, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 40,
              marginBottom: 16
            }}>
              <Ionicons name="checkmark" size={40} color="#34D399" />
            </View>
            
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#1E40AF',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Thank You!
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: '#4B5563',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Your report has been successfully submitted.
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 24,
              textAlign: 'center'
            }}>
              We will review it and take action shortly.
            </Text>
            
            {/* Report ID Box */}
            <View style={{
              backgroundColor: '#EBF5FF',
              borderRadius: 12,
              padding: 16,
              width: '100%',
              marginBottom: 32
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1E40AF'
                }}>
                  Report ID: #{Math.floor(Math.random() * 10000)}
                </Text>
              </View>
              
              <Text style={{
                fontSize: 14,
                color: '#3B82F6',
              }}>
                You can track the status of your report in the dashboard under "Track"
              </Text>
            </View>
            
            {/* Return to Home Button */}
            <TouchableOpacity 
              style={{
                backgroundColor: '#1E40AF',
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}
              onPress={() => router.replace('/(app)')}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginRight: 8
              }}>
                Return to Home
              </Text>
              <Ionicons name="chevron-forward" size={18} color="white" />
            </TouchableOpacity>
          </View>
        );
        
      default:
        console.log('Bilinmeyen adım:', step);
        return null;
    }
  };

  // Content for the InfoSheet component
  const renderInfoSheetContent = () => (
    <>
      <View style={styles.headerContent}>
        <Ionicons name="help-circle" size={24} color="#000" />
        <Text style={styles.headerText}>We've Got You Covered</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={{textAlign: 'center', color: '#374151', fontSize: 16}}>
          Don't worry! Our system will automatically assign your report to the appropriate department based on your description.
        </Text>
        
        <View style={{backgroundColor: '#EBF5FF', padding: 16, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#BFDBFE'}}>
          <Text style={{color: '#1E40AF', fontSize: 14, fontStyle: 'italic'}}>
            Our AI system analyzes your report details and ensures it reaches the right department for prompt action.
          </Text>
        </View>
      </View>
    </>
  );

  const openDepartmentSheet = () => {
    if (!isUnsureDepartment) {
      setShowDepartmentSheet(true);
      
      // Animate department sheet up
      Animated.parallel([
        Animated.timing(departmentSheetAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(departmentSelectBackdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };
  
  const closeDepartmentSheet = () => {
    // Animate department sheet down
    Animated.parallel([
      Animated.timing(departmentSheetAnim, {
        toValue: departmentSheetHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(departmentSelectBackdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowDepartmentSheet(false);
    });
  };
  
  const selectDepartment = (deptId: string, deptName: string, index: number) => {
    setDepartment(index.toString());
    closeDepartmentSheet();
  };

  // Update the Submit button to show loading state
  const renderFooterButton = () => {
    console.log('renderFooterButton çağrıldı, mevcut adım:', step);
    console.log('isSubmitting durumu:', isSubmitting);
    
    if (step === 3) {
      return (
        <Pressable
          style={[
            styles.footerButton,
            isSubmitting && { opacity: 0.7 }
          ]}
          onPress={() => {
            console.log('Submit butonuna tıklandı');
            handleNextStep();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.footerButtonText}>Submitting...</Text>
              {/* You can add a loading indicator here if needed */}
            </View>
          ) : (
            <Text style={styles.footerButtonText}>Submit</Text>
          )}
        </Pressable>
      );
    }
    
    return (
      <Pressable
        style={styles.footerButton}
        onPress={() => {
          console.log('Next butonuna tıklandı, adım:', step);
          handleNextStep();
        }}
      >
        <Text style={styles.footerButtonText}>Next</Text>
      </Pressable>
    );
  };

  // Add this to an appropriate place in the UI to show location status
  const renderLocationInfo = () => {
    return (
      <View style={{marginTop: 8, marginBottom: 8}}>
        {isLoadingLocation ? (
          <Text style={{color: '#3B82F6', fontStyle: 'italic'}}>Konum bilgisi alınıyor...</Text>
        ) : location ? (
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="location" size={16} color="#047857" />
            <Text style={{color: '#047857', marginLeft: 4}}>
              Konum bilgisi alındı
            </Text>
          </View>
        ) : (
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="location-outline" size={16} color="#EF4444" />
            <Text style={{color: '#EF4444', marginLeft: 4}}>
              Konum bilgisi alınamadı
            </Text>
            <TouchableOpacity 
              onPress={getCurrentLocation}
              style={{marginLeft: 8, padding: 4, backgroundColor: '#EFF6FF', borderRadius: 4}}
            >
              <Text style={{color: '#3B82F6', fontSize: 12}}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Department Info Bottom Sheet */}
      {showInfoSheet && (
        <>
          <TouchableWithoutFeedback onPress={closeInfoSheet}>
            <Animated.View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'black',
                opacity: departmentBackdropOpacity,
                zIndex: 1
              }} 
            />
          </TouchableWithoutFeedback>
          
          <Animated.View
            style={{
              position: 'absolute',
              height: bottomSheetHeight,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              zIndex: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 5,
              elevation: 5,
              transform: [{ 
                translateY: bottomSheetAnim
              }]
            }}
          >
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#D1D5DB',
              borderRadius: 2,
              alignSelf: 'center',
              marginTop: 8,
              marginBottom: 12
            }} />
            
            <View style={{
              backgroundColor: '#EBF5FF', 
              paddingHorizontal: 20, 
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#BFDBFE'
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ionicons name="help-circle" size={28} color="#1E40AF" style={{marginRight: 8}} />
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#1E40AF'
                }}>We've Got You Covered</Text>
              </View>
            </View>
            
            <View style={{padding: 20}}>
              <Text style={{
                fontSize: 16,
                textAlign: 'center',
                color: '#374151',
                marginBottom: 16
              }}>
                Don't worry! Our system will automatically assign your report to the appropriate department based on your description.
              </Text>
              
              <View style={{
                backgroundColor: '#EBF5FF',
                padding: 16,
                borderRadius: 12,
                marginTop: 8,
                borderWidth: 1,
                borderColor: '#BFDBFE',
                marginHorizontal: 8
              }}>
                <Text style={{
                  color: '#1E40AF',
                  fontSize: 14,
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  Our AI system analyzes your report details and ensures it reaches the right department for prompt action.
                </Text>
              </View>
            </View>
          </Animated.View>
        </>
      )}
      
      {/* Photo Options Bottom Sheet */}
      {showPhotoOptionsSheet && (
        <>
          <TouchableWithoutFeedback onPress={closePhotoOptionsSheet}>
            <Animated.View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'black',
                opacity: photoBackdropOpacity,
                zIndex: 1
              }} 
            />
          </TouchableWithoutFeedback>
          
          <Animated.View
            style={{
              position: 'absolute',
              height: photoOptionsHeight,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              zIndex: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 5,
              elevation: 5,
              transform: [{ 
                translateY: photoOptionsAnim
              }]
            }}
          >
            {/* Handle Bar */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#D1D5DB',
              borderRadius: 2,
              alignSelf: 'center',
              marginTop: 8,
              marginBottom: 12
            }} />
            
            <View style={{
              width: '100%',
            }}>
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 24
                }}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={24} color="#3B82F6" />
                <Text style={{
                  fontSize: 16,
                  marginLeft: 16,
                  color: '#1F2937'
                }}>Take Photo</Text>
              </TouchableOpacity>
              
              <View style={{
                height: 1,
                backgroundColor: '#E5E7EB',
                width: '100%'
              }} />
              
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 24
                }}
                onPress={selectFromGallery}
              >
                <Ionicons name="images" size={24} color="#3B82F6" />
                <Text style={{
                  fontSize: 16,
                  marginLeft: 16,
                  color: '#1F2937'
                }}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <View style={{
                height: 1,
                backgroundColor: '#E5E7EB',
                width: '100%'
              }} />
              
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 24
                }}
                onPress={closePhotoOptionsSheet}
              >
                <Ionicons name="close" size={24} color="#EF4444" />
                <Text style={{
                  fontSize: 16,
                  marginLeft: 16,
                  color: '#EF4444',
                  fontWeight: '500'
                }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
      
      {/* Department Selection Bottom Sheet */}
      {showDepartmentSheet && (
        <>
          <TouchableWithoutFeedback onPress={closeDepartmentSheet}>
            <Animated.View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'black',
                opacity: departmentSelectBackdropOpacity,
                zIndex: 1
              }} 
            />
          </TouchableWithoutFeedback>
          
          <Animated.View
            style={{
              position: 'absolute',
              height: departmentSheetHeight,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              zIndex: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 5,
              elevation: 5,
              transform: [{ 
                translateY: departmentSheetAnim
              }]
            }}
          >
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#D1D5DB',
              borderRadius: 2,
              alignSelf: 'center',
              marginTop: 12,
              marginBottom: 12
            }} />
            
            <ScrollView style={{maxHeight: SCREEN_HEIGHT * 0.5}}>
              {mockDepartments.map((dept, index) => (
                <TouchableOpacity
                  key={dept.id}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E7EB'
                  }}
                  onPress={() => selectDepartment(dept.id, dept.name, index)}
                >
                  <Text style={{
                    fontSize: 16,
                    color: '#1F2937'
                  }}>
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </>
      )}
      
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
      </View>
      
      {/* Step Status Indicator - Circles with connecting lines */}
      <View style={styles.stepIndicator}>
        <View style={styles.stepItem}>
          <View style={step >= 1 ? styles.activeStep : styles.inactiveStep} />
          <Text style={step === 1 ? styles.activeText : styles.inactiveText}>Add Photos</Text>
        </View>
        
        <View style={step >= 2 ? [styles.connector, {backgroundColor: '#34D399'}] : styles.connector} />
        
        <View style={styles.stepItem}>
          <View style={step >= 2 ? styles.activeStep : styles.inactiveStep} />
          <Text style={step === 2 ? styles.activeText : styles.inactiveText}>Department</Text>
        </View>
        
        <View style={step >= 3 ? [styles.connector, {backgroundColor: '#34D399'}] : styles.connector} />
        
        <View style={styles.stepItem}>
          <View style={step >= 3 ? styles.activeStep : styles.inactiveStep} />
          <Text style={step === 3 ? styles.activeText : styles.inactiveText}>Description</Text>
        </View>
      </View>
      
      {/* Conditional Content Area */}
      {step < 4 ? (
        <ScrollView 
          style={styles.contentContainer}
          contentContainerStyle={{
            flexGrow: 1, 
            paddingBottom: 100 // Consistent padding for steps 1, 2, 3
          }}
        >
          <View style={styles.content}>
            {renderStepContent()}
          </View>
        </ScrollView>
      ) : (
        // Render step 4 content directly in a non-scrollable Box
        <View style={styles.content}>
          {renderStepContent()}
        </View>
      )}
      
      {step < 4 && (
        <View style={styles.footer}>
          {renderFooterButton()}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  stepItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  activeStep: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34D399',
    marginBottom: 8,
  },
  inactiveStep: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  activeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34D399',
  },
  inactiveText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  connector: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
    marginTop: -4,
    marginBottom: 12,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#34D399',
    padding: 16,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonImage: {
    width: 100,
    height: 100,
  },
  photoContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  photoRow: {
    flexDirection: 'row',
  },
  photoItem: {
    position: 'relative',
    marginRight: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 100,
    padding: 4,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
  },
  unsureButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unsureButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unsureButtonCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34D399',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unsureButtonText: {
    fontSize: 16,
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  titleInput: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionInput: {
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundGradient: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  successContent: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  successIcon: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 100,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  reportConfirmation: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  reportConfirmationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reportStatus: {
    fontSize: 16,
    color: '#34D399',
  },
  returnButton: {
    backgroundColor: '#34D399',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    padding: 16,
  },
  footerButton: {
    backgroundColor: '#34D399',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    padding: 12,
  },
  handleBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
}); 