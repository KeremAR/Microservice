import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
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
                {/* Received - Always shown */}
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                  <View style={{ alignItems: 'center', width: 30 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#444444',
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
                    <View
                      style={{
                        width: 2,
                        height: 40,
                        backgroundColor: issue.status === 'in_progress' || issue.status === 'completed' ? '#444444' : '#E5E7EB'
                      }}
                    />
                  </View>
                  <View>
                    <Text style={{ fontWeight: 'bold' }}>Received</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(issue.date)}</Text>
                    <Text style={{ fontSize: 14, marginTop: 4 }}>Your issue has been received and is being reviewed.</Text>
                  </View>
                </View>
                
                {/* In Progress - Shown if status is in_progress or completed */}
                {(issue.status === 'in_progress' || issue.status === 'completed') && (
                  <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                    <View style={{ alignItems: 'center', width: 30 }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: '#F59E0B',
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
                      {issue.status === 'completed' && (
                        <View
                          style={{
                            width: 2,
                            height: 40,
                            backgroundColor: '#F59E0B'
                          }}
                        />
                      )}
                    </View>
                    <View>
                      <Text style={{ fontWeight: 'bold' }}>In Progress</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        {formatDate(new Date(new Date(issue.date).getTime() + 3*24*60*60*1000).toISOString().split('T')[0])}
                      </Text>
                      <Text style={{ fontSize: 14, marginTop: 4 }}>
                        {issue.status === 'in_progress' 
                          ? "The issue is currently being addressed by the maintenance team." 
                          : "The issue was addressed by the maintenance team."}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Completed - Only shown if status is completed */}
                {issue.status === 'completed' && (
                  <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
                    <View style={{ alignItems: 'center', width: 30 }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: '#10B981',
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
                    </View>
                    <View>
                      <Text style={{ fontWeight: 'bold' }}>Completed</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        {formatDate(new Date(new Date(issue.date).getTime() + 7*24*60*60*1000).toISOString().split('T')[0])}
                      </Text>
                      <Text style={{ fontSize: 14, marginTop: 4 }}>
                        The issue has been successfully resolved.
                      </Text>
                    </View>
                  </View>
                )}
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
                      <Text style={{ fontWeight: '500' }}>{issue.department}</Text>
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
                      <Text style={{ fontWeight: '500' }}>{issue.location}</Text>
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
                      <Text style={{ fontWeight: '500' }}>{formatDate(issue.date)}</Text>
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