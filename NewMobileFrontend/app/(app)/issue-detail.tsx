import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Icon,
  ScrollView,
  Divider,
} from '@gluestack-ui/themed';
import { StatusBar, StyleSheet, Dimensions, View, Animated, Text as RNText } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, MapPin, Building, AlertCircle } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { mockIssues } from '../../data/mockData';
import OSMMap from '../../components/OSMMap';

// Define type for issue
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface IssueDetail {
  id: string;
  title: string;
  description: string;
  status: 'received' | 'in_progress' | 'completed' | 'rejected';
  department: string;
  location: string;
  date: string;
  coordinates: Coordinates;
}

export default function IssueDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const issueId = params.id as string;
  const windowHeight = Dimensions.get('window').height;
  const mapHeight = windowHeight * 0.5;
  
  // Get status bar height
  const STATUSBAR_HEIGHT = StatusBar.currentHeight || 44;
  // Scroll değerlerini izlemek için
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = STATUSBAR_HEIGHT + 60; // Header'ın yaklaşık yüksekliği
  
  // Header icon/text rengi için state
  const [headerIsLight, setHeaderIsLight] = useState(true);
  
  // Find the issue with the matching ID
  useEffect(() => {
    const foundIssue = mockIssues.find(item => item.id === issueId);
    setIssue(foundIssue || mockIssues[0]); // Default to first issue if not found
  }, [issueId]);
  
  // Scroll pozisyonunu izleyip header rengini değiştirme
  useEffect(() => {
    const listenerID = scrollY.addListener(({ value }) => {
      if (value > 40 && headerIsLight) {
        setHeaderIsLight(false);
      } else if (value <= 40 && !headerIsLight) {
        setHeaderIsLight(true);
      }
    });
    
    return () => {
      scrollY.removeListener(listenerID);
    };
  }, [scrollY, headerIsLight]);
  
  // Format the date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  if (!issue) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text>Loading...</Text>
      </Box>
    );
  }
  
  // Animasyon için geçerli değerler
  const scrollDistance = Math.max(50, mapHeight - headerHeight);
  
  // Prepare marker for OSMMap
  const issueMarker = {
    id: issue.id,
    coordinates: issue.coordinates,
    title: issue.title,
    description: issue.location,
    color: 'red'
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={headerIsLight ? "light-content" : "dark-content"} />
      
      {/* Harita - Alt katman olarak */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: mapHeight }}>
        <OSMMap
          style={{ width: '100%', height: '100%' }}
          initialRegion={{
            latitude: issue.coordinates.latitude,
            longitude: issue.coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          markers={[issueMarker]}
          onMarkerPress={(marker) => {
            // Optional: Do something when marker is pressed
            console.log('Marker pressed:', marker.title);
          }}
        />
      </View>
      
      {/* Beyaz arka plan overlay - Scroll ile opacity değişir */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: mapHeight,
          backgroundColor: 'white',
          opacity: scrollY.interpolate({
            inputRange: [0, scrollDistance],
            outputRange: [0, 1],
            extrapolate: 'clamp'
          })
        }}
      />
      
      {/* İçerik - Haritanın üzerine gelen */}
      <Animated.ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: mapHeight - 30,
          paddingBottom: 0, // İçerik bittiğinde kaydırmaya devam etmesi için daha fazla padding
        }}
        scrollEventThrottle={16}
        bounces={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Animated.View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: scrollY.interpolate({
              inputRange: [0, scrollDistance],
              outputRange: [30, 0],
              extrapolate: 'clamp'
            }),
            borderTopRightRadius: scrollY.interpolate({
              inputRange: [0, scrollDistance],
              outputRange: [30, 0],
              extrapolate: 'clamp'
            }),
            paddingTop: 24,
            paddingBottom: headerHeight,
            ...styles.cardShadow,
            borderBottomWidth: 0,
            borderWidth: 0,
            borderColor: 'transparent',
          }}
        >
          {/* Issue Title */}
          <Box px="$4">
            <Heading size="lg">{issue.title}</Heading>
          </Box>
          
          {/* Description - Moved right after title */}
          <Box px="$4" mt="$3">
            <Box 
              bg="$blue50" 
              p="$4" 
              borderRadius="$xl" 
              borderLeftWidth={4}
              borderLeftColor="$blue500"
              style={styles.cardShadow}
            >
              <Text>{issue.description}</Text>
            </Box>
          </Box>
          
          {/* Status Timeline */}
          <Box px="$4" mt="$6">
            <HStack alignItems="center" mb="$3">
              <Box bg="$blue100" p="$2" borderRadius="$md" mr="$2">
                <Icon as={AlertCircle} size="sm" color="$blue600" />
              </Box>
              <Heading size="sm">Status Updates</Heading>
            </HStack>
            
            <Box 
              bg="$white" 
              p="$4" 
              borderRadius="$xl" 
              style={styles.cardShadow}
            >
              <VStack space="xs">
                {/* Received - Always shown */}
                <HStack space="md" alignItems="flex-start">
                  <VStack alignItems="center" width={30}>
                    <Box
                      width={20}
                      height={20}
                      borderRadius="$full"
                      bg="#444444"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Box 
                        width={10} 
                        height={10} 
                        borderRadius="$full" 
                        bg="$white"
                      />
                    </Box>
                    <Box
                      width={2}
                      height={40}
                      bg={issue.status === 'in_progress' || issue.status === 'completed' ? '#444444' : '$gray300'}
                    />
                  </VStack>
                  <VStack>
                    <Text fontWeight="$bold">Received</Text>
                    <Text fontSize="$xs" color="$gray500">{formatDate(issue.date)}</Text>
                    <Text fontSize="$sm" mt="$1">Your issue has been received and is being reviewed.</Text>
                  </VStack>
                </HStack>
                
                {/* In Progress - Shown if status is in_progress or completed */}
                {(issue.status === 'in_progress' || issue.status === 'completed') && (
                  <HStack space="md" alignItems="flex-start">
                    <VStack alignItems="center" width={30}>
                      <Box
                        width={20}
                        height={20}
                        borderRadius="$full"
                        bg="$amber500"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box 
                          width={10} 
                          height={10} 
                          borderRadius="$full" 
                          bg="$white"
                        />
                      </Box>
                      {issue.status === 'completed' && (
                        <Box
                          width={2}
                          height={40}
                          bg="$amber500"
                        />
                      )}
                    </VStack>
                    <VStack>
                      <Text fontWeight="$bold">In Progress</Text>
                      <Text fontSize="$xs" color="$gray500">
                        {formatDate(new Date(new Date(issue.date).getTime() + 3*24*60*60*1000).toISOString().split('T')[0])}
                      </Text>
                      <Text fontSize="$sm" mt="$1">
                        {issue.status === 'in_progress' 
                          ? "The issue is currently being addressed by the maintenance team." 
                          : "The issue was addressed by the maintenance team."}
                      </Text>
                    </VStack>
                  </HStack>
                )}
                
                {/* Completed - Only shown if status is completed */}
                {issue.status === 'completed' && (
                  <HStack space="md" alignItems="flex-start">
                    <VStack alignItems="center" width={30}>
                      <Box
                        width={20}
                        height={20}
                        borderRadius="$full"
                        bg="$green500"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box 
                          width={10} 
                          height={10} 
                          borderRadius="$full" 
                          bg="$white"
                        />
                      </Box>
                    </VStack>
                    <VStack>
                      <Text fontWeight="$bold">Completed</Text>
                      <Text fontSize="$xs" color="$gray500">
                        {formatDate(new Date(new Date(issue.date).getTime() + 7*24*60*60*1000).toISOString().split('T')[0])}
                      </Text>
                      <Text fontSize="$sm" mt="$1">
                        The issue has been successfully resolved.
                      </Text>
                    </VStack>
                  </HStack>
                )}
              </VStack>
            </Box>
          </Box>
          
          {/* Issue Details */}
          <Box px="$4" mt="$6" mb="$8">
            <HStack alignItems="center" mb="$3">
              <Box bg="$amber100" p="$2" borderRadius="$md" mr="$2">
                <Icon as={Building} size="sm" color="$amber600" />
              </Box>
              <Heading size="sm">Issue Information</Heading>
            </HStack>
            
            <Box
              style={styles.cardShadow}
              borderRadius="$xl"
              overflow="hidden"
            >
              <LinearGradient
                colors={['#f7f9fc', '#ffffff']}
                start={[0, 0]}
                end={[0, 1]}
                style={{ padding: 16 }}
              >
                <VStack space="md">
                  {/* Department */}
                  <HStack space="md" alignItems="center">
                    <Box bg="$blue50" p="$2" borderRadius="$md">
                      <Icon as={Building} size="sm" color="$blue500" />
                    </Box>
                    <VStack>
                      <Text color="$gray500" fontSize="$xs">Department</Text>
                      <Text fontWeight="$medium">{issue.department}</Text>
                    </VStack>
                  </HStack>
                  
                  <Divider />
                  
                  {/* Location */}
                  <HStack space="md" alignItems="center">
                    <Box bg="$red50" p="$2" borderRadius="$md">
                      <Icon as={MapPin} size="sm" color="$red500" />
                    </Box>
                    <VStack>
                      <Text color="$gray500" fontSize="$xs">Location</Text>
                      <Text fontWeight="$medium">{issue.location}</Text>
                    </VStack>
                  </HStack>
                  
                  <Divider />
                  
                  {/* Date */}
                  <HStack space="md" alignItems="center">
                    <Box bg="$green50" p="$2" borderRadius="$md">
                      <Icon as={Calendar} size="sm" color="$green500" />
                    </Box>
                    <VStack>
                      <Text color="$gray500" fontSize="$xs">Date Reported</Text>
                      <Text fontWeight="$medium">{formatDate(issue.date)}</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </LinearGradient>
            </Box>
          </Box>
        </Animated.View>
      </Animated.ScrollView>
      
      {/* Header - En üstte, kesinlikle sabit */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: headerHeight,
        zIndex: 9999,
      }}>
        {/* Header arkaplanı - scroll ile değişir */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            opacity: scrollY.interpolate({
              inputRange: [0, scrollDistance],
              outputRange: [0, 1],
              extrapolate: 'clamp'
            })
          }}
        />
        
        {/* Gradient arkaplan */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: scrollY.interpolate({
              inputRange: [0, scrollDistance],
              outputRange: [1, 0],
              extrapolate: 'clamp'
            })
          }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
            start={[0, 0]}
            end={[0, 1]}
            style={{
              flex: 1,
            }}
          />
        </Animated.View>
        
        {/* Header içeriği - her zaman üstte */}
        <Box px="$4" style={{ paddingTop: STATUSBAR_HEIGHT + 16 }} pb="$2">
          <HStack alignItems="center" space="md">
            <Pressable 
              onPress={() => router.back()}
              style={[
                styles.backButton, 
                { backgroundColor: headerIsLight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)' }
              ]}
            >
              <Icon 
                as={ArrowLeft} 
                size="md" 
                color={headerIsLight ? "$white" : "$gray800"} 
              />
            </Pressable>
            <Heading 
              size="md" 
              color={headerIsLight ? "$white" : "$gray800"}
            >
              Issue Details
            </Heading>
          </HStack>
        </Box>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  mapContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  contentScroll: {
    flex: 1,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 