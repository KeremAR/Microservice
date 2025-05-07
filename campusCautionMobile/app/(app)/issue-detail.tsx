import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OSMMap from '../../components/OSMMap';
import { getIssueDetails } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

// Token key
const TOKEN_KEY = 'auth_token';

// Define type for issue
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface IssueDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  departmentId?: number;
  departmentName?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  latitude?: number;
  longitude?: number;
  userId?: string;
  photoUrl?: string;
  coordinates?: Coordinates;
  [key: string]: any;
}

export default function IssueDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  
  // Fetch issue details from API
  useEffect(() => {
    const fetchIssueDetails = async () => {
      if (!issueId) {
        setError('Issue ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get token from context or AsyncStorage
        let authToken = token;
        
        if (!authToken) {
          console.log('Token not found in context, trying AsyncStorage');
          authToken = await AsyncStorage.getItem(TOKEN_KEY);
        }
        
        if (!authToken) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        console.log('Fetching issue details for ID:', issueId);
        const issueData = await getIssueDetails(authToken, issueId);
        
        if (!issueData) {
          setError('Issue not found or error fetching details');
          setLoading(false);
          return;
        }
        
        console.log('Issue details fetched successfully:', issueData);
        setIssue(issueData);
      } catch (err) {
        console.error('Error fetching issue details:', err);
        setError('Failed to load issue details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchIssueDetails();
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
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Unknown date';
    
    try {
    const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'completed':
      case 'done':
      case 'resolved':
      case 'fixed':
        return '#10B981';
      case 'in_progress':
      case 'inprogress':
      case 'in progress':
      case 'processing':
      case 'working':
        return '#F59E0B';
      case 'received':
      case 'open':
      case 'new':
      case 'pending':
      case 'submitted':
        return '#444444';
      case 'rejected':
      case 'closed':
      case 'denied':
      case 'cancelled':
        return '#DC2626';
      default:
        return '#4b5563';
    }
  };
  
  // Get status label
  const getStatusLabel = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'completed':
      case 'done':
      case 'resolved':
      case 'fixed':
        return 'Completed';
      case 'in_progress':
      case 'inprogress':
      case 'in progress':
      case 'processing':
      case 'working':
        return 'In Progress';
      case 'received':
      case 'open':
      case 'new':
      case 'pending':
      case 'submitted':
        return 'Received';
      case 'rejected':
      case 'closed':
      case 'denied':
      case 'cancelled':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };
  
  // Calculate status timeline
  const getStatusTimeline = (issue: IssueDetail) => {
    const statuses = [];
    const createdDate = issue.createdAt || issue.date || new Date().toISOString();
    
    // Always add received status
    statuses.push({
      status: 'received',
      label: 'Received',
      date: createdDate,
      message: 'Your issue has been received and is being reviewed.'
    });
    
    // Add in_progress status if applicable
    if (['in_progress', 'completed', 'done', 'resolved', 'fixed'].includes(issue.status?.toLowerCase())) {
      // Estimate in_progress date as 3 days after creation
      const inProgressDate = new Date(new Date(createdDate).getTime() + 3*24*60*60*1000);
      statuses.push({
        status: 'in_progress',
        label: 'In Progress',
        date: issue.updatedAt || inProgressDate.toISOString(),
        message: "The issue is currently being addressed by the maintenance team."
      });
    }
    
    // Add completed status if applicable
    if (['completed', 'done', 'resolved', 'fixed'].includes(issue.status?.toLowerCase())) {
      // Estimate completion date as 7 days after creation
      const completedDate = new Date(new Date(createdDate).getTime() + 7*24*60*60*1000);
      statuses.push({
        status: 'completed',
        label: 'Completed',
        date: issue.resolvedAt || completedDate.toISOString(),
        message: "The issue has been successfully resolved."
      });
    }
    
    // Add rejected status if applicable
    if (['rejected', 'closed', 'denied', 'cancelled'].includes(issue.status?.toLowerCase())) {
      // Estimate rejection date as 2 days after creation
      const rejectedDate = new Date(new Date(createdDate).getTime() + 2*24*60*60*1000);
      statuses.push({
        status: 'rejected',
        label: 'Rejected',
        date: issue.resolvedAt || rejectedDate.toISOString(),
        message: "This issue could not be resolved or was declined."
      });
    }
    
    return statuses;
  };
  
  // Get department name
  const getDepartmentName = (issue: IssueDetail) => {
    return issue.departmentName || `Department #${issue.departmentId || 'Unknown'}`;
  };
  
  // Get location string
  const getLocationString = (issue: IssueDetail) => {
    if (issue.location) return issue.location;
    
    if (issue.latitude && issue.longitude) {
      return `Latitude: ${issue.latitude.toFixed(6)}, Longitude: ${issue.longitude.toFixed(6)}`;
    }
    
    return 'Location data not available';
  };
  
  // Get coordinates from issue
  const getCoordinates = (issue: IssueDetail) => {
    // First, try to use latitude/longitude fields from issue
    if (issue.latitude && issue.longitude && 
        issue.latitude !== 0 && issue.longitude !== 0) {
      console.log('Using direct latitude/longitude from issue data');
      return {
        latitude: issue.latitude,
        longitude: issue.longitude
      };
    }
    
    // If not available, check if we have coordinates in a different format
    if (issue.coordinates) {
      console.log('Using coordinates object from issue data');
      return {
        latitude: issue.coordinates.latitude || 0,
        longitude: issue.coordinates.longitude || 0
      };
    }
    
    // Last resort: If issue has location field but not coordinates,
    // we could potentially geocode it, but for now return default coordinates
    // Default to Akdeniz University campus center
    console.log('Using default campus coordinates');
    return {
      latitude: 36.8945,  // Default latitude (campus center)
      longitude: 30.6520  // Default longitude (campus center)
    };
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16 }}>Loading issue details...</Text>
      </View>
    );
  }
  
  // Error state
  if (error || !issue) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: 'white' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          {error || 'Issue not found'}
        </Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#6B7280' }}>
          We couldn't load the details for this issue.
        </Text>
        <Pressable
          style={{
            marginTop: 24,
            backgroundColor: '#3B82F6',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }
  
  // Animasyon için geçerli değerler
  const scrollDistance = Math.max(50, mapHeight - headerHeight);
  
  // Get coordinates from issue
  const coordinates = getCoordinates(issue);
  const hasValidCoordinates = coordinates.latitude !== 0 && coordinates.longitude !== 0;
  
  // Log coordinates for debugging
  console.log('Issue coordinates:', coordinates);
  console.log('Has valid coordinates:', hasValidCoordinates);
  
  // Prepare marker for OSMMap
  const issueMarker = {
    id: issue.id,
    coordinates: coordinates,
    title: issue.title,
    description: getLocationString(issue),
    color: getStatusColor(issue.status)
  };
  
  // Get status timeline for rendering
  const statusTimeline = getStatusTimeline(issue);
  
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={headerIsLight ? "light-content" : "dark-content"} />
      
      {/* Harita - Alt katman olarak */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: mapHeight }}>
        <OSMMap
          style={{ width: '100%', height: '100%' }}
          initialRegion={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
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
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{issue.title}</Text>
          </View>
          
          {/* Description - Moved right after title */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <View 
              style={{
                backgroundColor: '#EBF8FF', 
                padding: 16,
                borderRadius: 12, 
                borderLeftWidth: 4,
                borderLeftColor: '#3B82F6',
                ...styles.cardShadow
              }}
            >
              <Text>{issue.description}</Text>
            </View>
          </View>
          
          {/* Status Timeline */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ backgroundColor: '#E1EFFE', padding: 8, borderRadius: 8, marginRight: 8 }}>
                <Ionicons name="alert-circle" size={16} color="#3B82F6" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Status Updates</Text>
            </View>
            
            <View 
              style={{
                backgroundColor: 'white', 
                padding: 16,
                borderRadius: 12, 
                ...styles.cardShadow
              }}
            >
              <View style={{ gap: 4 }}>
                {statusTimeline.map((statusItem, index) => (
                  <View key={statusItem.status} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                    <View style={{ alignItems: 'center', width: 30 }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: getStatusColor(statusItem.status),
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <View 
                          style={{
                            width: 10, 
                            height: 10, 
                            borderRadius: 5, 
                            backgroundColor: 'white'
                          }}
                        />
                      </View>
                      {index < statusTimeline.length - 1 && (
                        <View
                          style={{
                            width: 2,
                            height: 40,
                            backgroundColor: getStatusColor(statusItem.status)
                          }}
                        />
                      )}
                    </View>
                    <View>
                      <Text style={{ fontWeight: 'bold' }}>{statusItem.label}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(statusItem.date)}</Text>
                      <Text style={{ fontSize: 14, marginTop: 4 }}>{statusItem.message}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
          
          {/* Issue Details */}
          <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8, marginRight: 8 }}>
                <Ionicons name="business" size={16} color="#D97706" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Issue Information</Text>
            </View>
            
            <View
              style={{
                ...styles.cardShadow,
                borderRadius: 12,
                overflow: 'hidden'
              }}
            >
              <View
                style={{ 
                  padding: 16, 
                  backgroundColor: '#f7f9fc'
                }}
              >
                <View style={{ gap: 16 }}>
                  {/* Department */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ backgroundColor: '#EBF8FF', padding: 8, borderRadius: 8 }}>
                      <Ionicons name="business" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Department</Text>
                      <Text style={{ fontWeight: '500' }}>{getDepartmentName(issue)}</Text>
                    </View>
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
                  
                  {/* Location */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8 }}>
                      <Ionicons name="location" size={16} color="#EF4444" />
                    </View>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Location</Text>
                      <Text style={{ fontWeight: '500' }}>{getLocationString(issue)}</Text>
                    </View>
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
                  
                  {/* Date */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ backgroundColor: '#D1FAE5', padding: 8, borderRadius: 8 }}>
                      <Ionicons name="calendar" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Date Reported</Text>
                      <Text style={{ fontWeight: '500' }}>{formatDate(issue.createdAt || issue.date)}</Text>
                    </View>
                  </View>
                  
                  {/* Status */}
                  <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ 
                      backgroundColor: `${getStatusColor(issue.status)}20`, 
                      padding: 8, 
                      borderRadius: 8 
                    }}>
                      <Ionicons name="checkmark-circle" size={16} color={getStatusColor(issue.status)} />
                    </View>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Current Status</Text>
                      <Text style={{ 
                        fontWeight: '500',
                        color: getStatusColor(issue.status)
                      }}>
                        {getStatusLabel(issue.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
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
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
            }}
          />
        </Animated.View>
        
        {/* Header içeriği - her zaman üstte */}
        <View style={{ paddingHorizontal: 16, paddingTop: STATUSBAR_HEIGHT + 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable 
              onPress={() => router.back()}
              style={[
                styles.backButton, 
                { backgroundColor: headerIsLight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)' }
              ]}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={headerIsLight ? "white" : "#1F2937"} 
              />
            </Pressable>
            <Text 
              style={{ 
                fontSize: 20, 
                fontWeight: 'bold', 
                color: headerIsLight ? "white" : "#1F2937"
              }}
            >
              Issue Details
            </Text>
          </View>
        </View>
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