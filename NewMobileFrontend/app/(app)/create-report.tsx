import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Button,
  ButtonText,
  VStack,
  Heading,
  FormControl,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon, 
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
  Textarea,
  TextareaInput,
  ChevronDownIcon,
  ScrollView,
  Pressable,
  Icon,
  Center,
  HStack,
  Image,
  Progress,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Camera, Image as ImageIcon, CheckCircle2, X, Bot, ArrowRightCircle, ChevronDown, ChevronRight } from 'lucide-react-native';
import { Alert, Platform, Animated, Dimensions, TouchableWithoutFeedback, Easing, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { mockDepartments } from '../../data/mockData';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define a type for photos
interface Photo {
  id: string;
  uri: string;
  type: 'camera' | 'gallery';
}

export default function CreateReportScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Photo, 2: Department, 3: Description, 4: Success
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUnsureDepartment, setIsUnsureDepartment] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showPhotoOptionsSheet, setShowPhotoOptionsSheet] = useState(false);
  const [isPhotoSheetReady, setIsPhotoSheetReady] = useState(false);
  
  // Refs for inputs
  const descriptionInputRef = useRef(null);
  
  // Animation values for bottom sheets
  const bottomSheetHeight = SCREEN_HEIGHT * 0.5; // 50% of screen height for department info
  const photoOptionsHeight = 200; // Increased height for photo options sheet with consistent value
  const bottomSheetAnim = useRef(new Animated.Value(bottomSheetHeight)).current;
  const photoOptionsAnim = useRef(new Animated.Value(photoOptionsHeight)).current;
  const departmentBackdropOpacity = useRef(new Animated.Value(0)).current; // Separate backdrop for department
  const photoBackdropOpacity = useRef(new Animated.Value(0)).current; // Separate backdrop for photos

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

  // Request camera and media library permissions
  useEffect(() => {
    (async () => {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to take photos');
      }
      
      if (!mediaLibraryPermission.granted) {
        Alert.alert('Permission Required', 'Media library access is required to select photos');
      }
    })();
  }, []);
  
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
      
      return () => {
        // Reset state when navigating away from the screen
        setStep(1);
        setDepartment('');
        setDescription('');
        setTitle('');
        setPhotos([]);
        setIsUnsureDepartment(false);
      };
    }, [])
  );
  
  const handleNextStep = () => {
    if (step === 1 && photos.length === 0) {
      // Show confirmation dialog instead of just an alert
      Alert.alert(
        'No Photos Added',
        'Are you sure you want to continue without adding any photos?',
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
      Alert.alert('Department Required', 'Please select a department or check the "I\'m not sure" option.');
      return;
    }
    
    if (step === 3 && (!description || !title)) {
      Alert.alert('Information Required', 'Please provide both a title and description for the issue.');
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
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
        setPhotos([...photos, {
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
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos = result.assets.map(asset => ({
          id: `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          uri: asset.uri,
          type: 'gallery' as const
        }));
        
        setPhotos([...photos, ...newPhotos]);
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
    switch (step) {
      case 1:
        return (
          <VStack space="xl" alignItems="center" p="$5">
            <Text textAlign="center" mb="$4">
              Please add at least one photo of the issue to help us better understand the problem.
            </Text>
            
            {/* Single Add Photo Button - Mavi Tasarım */}
            <Box
              bg="$blue50"
              p="$6"
              borderRadius="$xl"
              w="80%"
              alignItems="center"
              justifyContent="center"
              mb="$8"
              borderColor="$blue200"
              borderWidth={1}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
                elevation: 2
              }}
              overflow="hidden"
            >
              {/* Background pattern for visual interest */}
              <Box 
                position="absolute" 
                right={-20} 
                bottom={-20} 
                w={120} 
                h={120} 
                borderRadius={100}
                bg="$blue100"
                opacity={0.8}
              />
              <Box 
                position="absolute" 
                left={-15} 
                top={-15} 
                w={80} 
                h={80} 
                borderRadius={100}
                bg="$blue100"
                opacity={0.5}
              />
              
              <Pressable 
                onPress={openPhotoOptionsSheet}
                w="100%"
                alignItems="center"
              >
                <Box
                  bg="$white"
                  p="$4"
                  mb="$3"
                  borderRadius="$full"
                  borderColor="$blue300"
                  borderWidth={1}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1
                  }}
                >
                  <Icon as={Camera} size="xl" color="$blue800" />
                </Box>
                <Text fontSize="$lg" fontWeight="$semibold" color="$blue800">Add Photo</Text>
                <Text fontSize="$xs" color="$blue600" mt="$1">Tap to select from camera or gallery</Text>
              </Pressable>
            </Box>
            
            {photos.length > 0 && (
              <VStack space="md" w="100%">
                <Text color="$success700" mb="$2">
                  {photos.length} photo{photos.length > 1 ? 's' : ''} added
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <HStack space="sm">
                    {photos.map((photo) => (
                      <Box key={photo.id} position="relative">
                        <Image 
                          source={{ uri: photo.uri }} 
                          alt="Report photo"
                          size="lg"
                          borderRadius={8}
                          width={100}
                          height={100}
                        />
                        <Pressable
                          position="absolute"
                          top={0}
                          right={0}
                          bg="$blackAlpha800"
                          borderRadius="$full"
                          p="$1"
                          onPress={() => removePhoto(photo.id)}
                        >
                          <Icon as={X} size="xs" color="$white" />
                        </Pressable>
                      </Box>
                    ))}
                  </HStack>
                </ScrollView>
              </VStack>
            )}
          </VStack>
        );
        
      case 2:
        return (
          <VStack space="md" p="$5">
            <Text fontSize="$lg" fontWeight="$medium" color="$gray800" mb="$4">
              Please select the department that should handle this issue.
            </Text>
            
            {/* Department Selection - Clean Design */}
            <Box
              bg="$white"
              p="$5"
              borderRadius="$lg"
              w="100%"
              mb="$5"
              borderWidth={1}
              borderColor="$gray200"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2
              }}
            >
              <Text fontSize="$md" fontWeight="$medium" color="$gray700" mb="$3">Department</Text>
              
              <FormControl w="100%">
                <Select 
                  selectedValue={department} 
                  onValueChange={setDepartment}
                  isDisabled={isUnsureDepartment}
                >
                  <SelectTrigger 
                    borderColor="$gray300" 
                    borderRadius="$md" 
                    borderWidth={1}
                    h="$12"
                  >
                    <SelectInput 
                      placeholder="Bir departman seçin" 
                      fontSize="$md"
                    />
                    <SelectIcon>
                      <ChevronDownIcon />
                    </SelectIcon>
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {mockDepartments.map((dept) => (
                        <SelectItem 
                          key={dept.id} 
                          label={dept.name} 
                          value={dept.id} 
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>
            </Box>
            
            {/* "I'm not sure" Option - Clean Design */}
            <Box
              bg="$white"
              p="$4"
              borderRadius="$lg"
              w="100%"
              borderWidth={1}
              borderColor="$gray200"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2
              }}
            >
              <Pressable 
                flexDirection="row" 
                alignItems="center" 
                onPress={handleUnsureDepartmentChange}
                p="$2"
              >
                <Box 
                  w="$6" 
                  h="$6" 
                  borderWidth={2}
                  borderColor={isUnsureDepartment ? "$blue800" : "$gray300"}
                  borderRadius="$sm"
                  bg={isUnsureDepartment ? "$blue800" : "$white"}
                  alignItems="center"
                  justifyContent="center"
                  mr="$3"
                >
                  {isUnsureDepartment && <CheckCircle2 size={16} color="white" />}
                </Box>
                <VStack flex={1}>
                  <Text fontSize="$md" fontWeight="$medium" color="$gray800">
                    I'm not sure which department handles this
                  </Text>
                  <Text fontSize="$sm" color="$gray500">
                    We'll automatically assign it to the right department
                  </Text>
                </VStack>
              </Pressable>
            </Box>
          </VStack>
        );
        
      case 3:
        return (
          <VStack space="lg" p="$5">
            <Text fontSize="$lg" fontWeight="$medium" color="$gray800" mb="$2">
              Please provide a title and detailed description of the issue to help us address it efficiently.
            </Text>
            
            {/* Combined Title and Description in one Box */}
            <Box
              bg="$blue50"
              p="$6"
              borderRadius="$xl"
              w="100%"
              mb="$4"
              borderColor="$blue200"
              borderWidth={1}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
                elevation: 2
              }}
              overflow="hidden"
            >
              {/* Background pattern for visual interest */}
              <Box 
                position="absolute" 
                right={-20} 
                bottom={-20} 
                w={120} 
                h={120} 
                borderRadius={100}
                bg="$blue100"
                opacity={0.6}
              />
              <Box 
                position="absolute" 
                left={-15} 
                top={-15} 
                w={80} 
                h={80} 
                borderRadius={100}
                bg="$blue100"
                opacity={0.4}
              />
              
              {/* Title Input */}
              <Text fontSize="$md" fontWeight="$semibold" color="$blue800" mb="$3">
                Title
              </Text>
              
              <FormControl isRequired w="100%" zIndex={1} mb="$4">
                <Input
                  size="md"
                  bg="$white"
                  borderColor="$blue300"
                  borderRadius="$md"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1
                  }}
                >
                  <InputField
                    placeholder="Enter a brief title for the issue"
                    value={title}
                    onChangeText={setTitle}
                    fontSize="$md"
                    color="$gray800"
                    p="$3"
                    autoCapitalize="sentences"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      // Focus the description input when submit is pressed on title
                      if (descriptionInputRef.current) {
                        descriptionInputRef.current.focus();
                      }
                    }}
                  />
                </Input>
              </FormControl>
              
              <Text fontSize="$xs" color="$blue600" mb="$4">
                A clear title helps identify your issue quickly
              </Text>
              
              {/* Description Input */}
              <Text fontSize="$md" fontWeight="$semibold" color="$blue800" mb="$3">
                Description
              </Text>
              
              <FormControl isRequired w="100%" zIndex={1}>
                <Textarea
                  size="md"
                  bg="$white"
                  borderColor="$blue300"
                  borderRadius="$md"
                  h={180}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1
                  }}
                >
                  <TextareaInput
                    placeholder="Describe the issue in detail"
                    value={description}
                    onChangeText={setDescription}
                    fontSize="$md"
                    color="$gray800"
                    p="$3"
                    multiline={true}
                    autoCapitalize="sentences"
                    ref={descriptionInputRef}
                  />
                </Textarea>
              </FormControl>
              
              <Text fontSize="$xs" color="$blue600" mt="$3">
                Detailed descriptions help us resolve issues faster
              </Text>
            </Box>
          </VStack>
        );
        
      case 4:
        return (
          <Box flex={1} position="relative" overflow="hidden">
            {/* Background decorative elements */}
            <Box 
              position="absolute" 
              top={-100} 
              right={-100} 
              width={300} 
              height={300} 
              borderRadius={300} 
              bg="$blue100" 
              opacity={0.7}
            />
            <Box 
              position="absolute" 
              bottom={-80} 
              left={-80} 
              width={250} 
              height={250} 
              borderRadius={250} 
              bg="$blue100" 
              opacity={0.5}
            />
            
            <Center flex={1} p="$5" zIndex={1}>
              {/* Success icon with circular background */}
              <Box 
                bg="$success100" 
                p="$5" 
                borderRadius="$full" 
                mb="$6"
                style={{
                  shadowColor: '#34D399',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5
                }}
              >
                <Icon as={CheckCircle2} size="xl" color="$success600" />
              </Box>
              
              <Heading size="2xl" textAlign="center" mb="$2" color="$blue800">Thank You!</Heading>
              <Text fontSize="$lg" textAlign="center" mb="$4" color="$gray700">
                Your report has been successfully submitted.
              </Text>
              <Text fontSize="$md" textAlign="center" mb="$8" color="$gray600" italic>
                We will review it and take action shortly.
              </Text>
              
              {/* Report confirmation box */}
              <Box
                bg="$blue50"
                p="$4"
                borderRadius="$lg"
                mb="$8" 
                w="90%"
                borderWidth={1}
                borderColor="$blue200"
              >
                <HStack space="md" alignItems="center" mb="$2">
                  <Icon as={ArrowRightCircle} size="md" color="$blue600" />
                  <Text fontWeight="$medium" color="$blue800">Report ID: #{Math.floor(Math.random() * 10000)}</Text>
                </HStack>
                <Text fontSize="$sm" color="$blue700">
                  You can track the status of your report in the dashboard under "Track"
                </Text>
              </Box>
              
              <Button
                size="lg"
                variant="solid"
                action="primary"
                bg="$blue800"
                w="80%"
                borderRadius="$lg"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 6
                }}
                onPress={() => router.replace('/(app)')}
              >
                <HStack space="sm" alignItems="center">
                  <ButtonText>Return to Home</ButtonText>
                  <Icon as={ChevronRight} size="sm" color="$white" />
                </HStack>
              </Button>
            </Center>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Box flex={1} bg="$white">
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
              <Center py="$3">
                <Box 
                  w="$16" 
                  h="$1" 
                  bg="$black" 
                  borderRadius="$full" 
                />
              </Center>
              
              <Box 
                bg="$blue50" 
                px="$5" 
                py="$4"
                borderBottomWidth={1}
                borderBottomColor="$blue100"
              >
                <Center>
                  <HStack space="sm" alignItems="center">
                    <Icon as={Bot} size="xl" color="$blue800" />
                    <Heading size="lg" color="$blue800">We've Got You Covered</Heading>
                  </HStack>
                </Center>
              </Box>
              
              <Box p="$5">
                <VStack space="md">
                  <Text fontSize="$md" textAlign="center" color="$textDark700">
                    Don't worry! Our system will automatically assign your report to the appropriate department based on your description.
                  </Text>
                  
                  <Center my="$2">
                    <Box 
                      bg="$blue100" 
                      p="$4" 
                      borderRadius="$lg" 
                      borderWidth={1} 
                      borderColor="$blue200" 
                      maxWidth="95%"
                    >
                      <Text color="$blue900" fontStyle="italic" fontSize="$sm">
                        Our AI system analyzes your report details and ensures it reaches the right department for prompt action.
                      </Text>
                    </Box>
                  </Center>
                </VStack>
              </Box>
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
              <Center py="$3">
                <Box 
                  w="$16" 
                  h="$1" 
                  bg="$black" 
                  borderRadius="$full" 
                />
              </Center>
              
              <VStack>
                <Pressable 
                  onPress={takePhoto}
                  py="$3" // Increased padding
                  px="$5"
                  flexDirection="row"
                  alignItems="center"
                >
                  <Icon as={Camera} color="$blue800" size="lg" mr="$3" /> 
                  <Text fontSize="$lg" fontWeight="$medium">Take Photo</Text> 
                </Pressable>
                
                <Box h="$px" bg="$gray200" w="100%" />
                
                <Pressable 
                  onPress={selectFromGallery}
                  py="$3" // Increased padding
                  px="$5"
                  flexDirection="row"
                  alignItems="center"
                >
                  <Icon as={ImageIcon} color="$blue800" size="lg" mr="$3" /> 
                  <Text fontSize="$lg" fontWeight="$medium">Choose from Gallery</Text> 
                </Pressable>
                
                <Box h="$px" bg="$gray200" w="100%" />
                
                <Pressable 
                  onPress={closePhotoOptionsSheet}
                  py="$3" // Increased padding
                  px="$5"
                  flexDirection="row"
                  alignItems="center"
                  mb="$2"
                >
                  <Icon as={X} color="$red800" size="lg" mr="$3" />
                  <Text fontSize="$lg" fontWeight="$medium" color="$red800">Cancel</Text> 
                </Pressable>
              </VStack>
            </Animated.View>
          </>
        )}
        
        <Box 
          bg="$blue800" 
          pt="$12" 
          pb="$4" 
          px="$4"
          flexDirection="row"
          alignItems="center"
        >
          <Pressable onPress={handleBackPress} mr="$3">
            <Icon as={ChevronLeft} size="xl" color="$white" />
          </Pressable>
          <Heading color="$white" size="xl">
            {getStepTitle()}
          </Heading>
        </Box>
        
        {/* Step Status Indicator - Circles with connecting lines */}
        <Box px="$8" py="$5" bg="$white">
          <HStack justifyContent="center" alignItems="center">
            {/* Step 1 */}
            <VStack alignItems="center" ml="$2">
              <Box 
                key={`step-1-${step}`} 
                w="$10" 
                h="$10" 
                borderRadius="$full" 
                bg={step >= 1 ? "$green500" : "$white"}
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor={step >= 1 ? "$green600" : "$gray800"}
              >
                <Text color={step >= 1 ? "$white" : "$black"} fontWeight="$bold" fontSize="$lg">1</Text>
              </Box>
              <Text 
                color={step === 1 ? "$green500" : step < 1 ? "$gray600" : "$green500"} 
                fontSize="$sm" 
                mt="$1" 
                fontWeight={step === 1 ? "$medium" : "$normal"}
              >
                Add Photos
              </Text>
            </VStack>

            {/* Connector Line */}
            <Box 
              alignSelf="center" 
              h="$1.5" 
              w="$12" 
              bg={step >= 2 ? "$green500" : "$coolGray300"} 
              mx="$1" 
              mt="-$6"
            />

            {/* Step 2 */}
            <VStack alignItems="center">
              <Box 
                key={`step-2-${step}`}
                w="$10" 
                h="$10" 
                borderRadius="$full" 
                bg={step >= 2 ? (step === 2 ? "$blue500" : "$green500") : "$white"}
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor={step >= 2 ? (step === 2 ? "$blue600" : "$green600") : "$gray800"}
              >
                <Text color={step >= 2 ? "$white" : "$black"} fontWeight="$bold" fontSize="$lg">2</Text>
              </Box>
              <Text 
                color={step === 2 ? "$blue500" : step < 2 ? "$gray600" : "$green500"} 
                fontSize="$sm" 
                mt="$1" 
                fontWeight={step === 2 ? "$medium" : "$normal"}
              >
                Department
              </Text>
            </VStack>

            {/* Connector Line */}
            <Box 
              alignSelf="center" 
              h="$1.5" 
              w="$12" 
              bg={step >= 3 ? "$green500" : "$coolGray300"} 
              mx="$1" 
              mt="-$6"
            />

            {/* Step 3 */}
            <VStack alignItems="center" mr="$2">
              <Box 
                key={`step-3-${step}`}
                w="$10" 
                h="$10" 
                borderRadius="$full" 
                bg={step >= 3 ? (step === 3 ? "$blue500" : "$green500") : "$white"}
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor={step >= 3 ? (step === 3 ? "$blue600" : "$green600") : "$gray800"}
              >
                <Text color={step >= 3 ? "$white" : "$black"} fontWeight="$bold" fontSize="$lg">3</Text>
              </Box>
              <Text 
                color={step === 3 ? "$blue500" : step < 3 ? "$gray600" : "$green500"} 
                fontSize="$sm" 
                mt="$1" 
                fontWeight={step === 3 ? "$medium" : "$normal"}
              >
                Description
              </Text>
            </VStack>
          </HStack>
        </Box>
        
        {/* Conditional Content Area */}
        {step < 4 ? (
          <ScrollView 
            flex={1}
            contentContainerStyle={{
              flexGrow: 1, 
              paddingBottom: 100 // Consistent padding for steps 1, 2, 3
            }}
          >
            <Box flex={1}>
              {renderStepContent()}
            </Box>
          </ScrollView>
        ) : (
          // Render step 4 content directly in a non-scrollable Box
          <Box flex={1}>
            {renderStepContent()}
          </Box>
        )}
        
        {step < 4 && (
          <Box 
            p="$5" 
            pb="$8"
            borderTopWidth={1} 
            borderTopColor="$borderLight200"
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="$white"
          >
            <Button
              size="lg"
              variant="solid"
              action="primary"
              bg="$blue800"
              onPress={handleNextStep}
            >
              <ButtonText>{step === 3 ? "Submit" : "Next"}</ButtonText>
            </Button>
          </Box>
        )}
      </Box>
    </KeyboardAvoidingView>
  );
} 