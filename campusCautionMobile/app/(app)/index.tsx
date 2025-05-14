import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { mockIssues, mockNotifications, mockStats, campusMapRegion } from '../../data/mockData';
import OSMMap from '../../components/OSMMap';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, getUserIssues, getIssues } from '../../services/api';
import { Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kullanıcı profili için tip tanımlaması
interface UserProfile {
  id?: string;
  name?: string | null;
  email?: string | null;
  department_id?: number | null;
  role?: string | null;
}

// Issue interface
interface Issue {
  id: any; // Original MongoDB ObjectId (as object)
  hexId: string; // Hexadecimal string representation of ObjectId
  title: string;
  description: string;
  status: string | number; // Can be string like 'completed' or numeric like 0,1,2,3
  latitude?: number;
  longitude?: number;
  departmentId?: number;
  userId?: string;
  createdAt?: string;
  isUserIssue?: boolean; // To identify if issue belongs to current user
}

// Mock Data for Announcements
const mockAnnouncements = [
  {
    id: '1',
    title: 'Resolved: Wi-Fi Connectivity Issues in the Library',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore...',
    link: '/announcements/1', // Example link
  },
  {
    id: '2',
    title: 'Upcoming Maintenance for Student Portal',
    description: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum...',
    link: '/announcements/2',
  },
  {
    id: '3',
    title: 'New Library Hours Starting Next Week',
    description: 'The university library will be extending its opening hours starting from next Monday to accommodate student needs...',
    link: '/announcements/3',
  },
  // Add more announcements as needed
];

// Mock data for issue hotspots on campus map
const hotspots = [
  { id: 1, lat: 36.8969, lng: 30.6882, title: 'Science Building', count: 5 },
  { id: 2, lat: 36.8975, lng: 30.6892, title: 'Library', count: 3 },
  { id: 3, lat: 36.8965, lng: 30.6865, title: 'Student Center', count: 7 },
];

// Mock Data for Banner
const bannerText = 'Together, we make our campus better.';
// Placeholder for banner image
// const bannerImage = require('../assets/images/home-banner.png');

// Placeholder for help card image
// const helpImage = require('../assets/images/need-help.png');

// Student illustration
// const studentIllustration = require('../../assets/images/student-illustration.png');

export default function HomeScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const { user, token, logout } = useAuth();
  
  // States for user data and loading
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [receivedCount, setReceivedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(mockNotifications.length);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  
  // Get status bar height
  const STATUSBAR_HEIGHT = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 0);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-20));
  const [stats] = useState(mockStats);
  
  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profileData = await getUserProfile(token);
      console.log('Home - Profile data received:', profileData);
      setUserProfile(profileData);
      
      // Eğer API'dan gelen verilerde name yoksa, auth context'teki name ile doldur
      if (!profileData.name && user?.name) {
        setUserProfile(prev => ({
          ...prev,
          name: user.name
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to check status (handles both string and numeric values)
  const checkStatus = (issue: Issue, statusTypes: Array<string|number>): boolean => {
    if (issue.status === undefined || issue.status === null) return false;
    
    // Convert the issue status to lowercase string for comparison
    const statusStr = String(issue.status).toLowerCase();
    console.log(`Checking status for issue: ${issue.title}, status: ${issue.status} (${typeof issue.status})`);
    
    // Check against all possible status values
    const result = statusTypes.some(type => {
      if (typeof type === 'number') {
        return issue.status === type;
      }
      return statusStr === String(type).toLowerCase();
    });
    
    return result;
  };
  
  // Calculate statistics from issues data
  const calculateStats = (issues: Issue[]) => {
    if (!Array.isArray(issues)) {
      console.log('Issues is not an array, cannot calculate stats');
      return;
    }
    
    console.log(`Calculating stats from ${issues.length} issues`);
    
    // Eğer API'den gelen status değerleri alanı görmek için önce kontrol edelim
    if (issues.length > 0) {
      console.log('First issue status sample:', issues[0].status, typeof issues[0].status);
      console.log('All status values in data:', issues.map(i => i.status));
    }
    
    const newCount = issues.filter(issue => 
      checkStatus(issue, ['received', 'new', 'pending', 'submitted', 'open', '0', 0])
    ).length;
    
    const activeCount = issues.filter(issue => 
      checkStatus(issue, ['inprogress', 'in_progress', 'in progress', 'processing', 'working', '1', 1])
    ).length;
    
    const doneCount = issues.filter(issue => 
      checkStatus(issue, ['completed', 'done', 'resolved', 'fixed', '2', 2])
    ).length;
    
    console.log('Calculated stats from issues:', { newCount, activeCount, doneCount });
    
    setReceivedCount(newCount);
    setInProgressCount(activeCount);
    setCompletedCount(doneCount);
  };
  
  // Fetch all issues
  const fetchAllIssues = async () => {
    if (!token) return;
    
    setIsLoadingIssues(true);
    
    try {
      // Kullanıcının sorunlarını getirelim (bunlara tıklanabilecek)
      const userIssuesData = await getUserIssues(token);
      console.log('User issues fetched:', userIssuesData.length);
      
      // Tüm sorunları da getirelim
      const allIssuesData = await getIssues(token);
      console.log('All issues fetched:', allIssuesData.length);
      
      // Her iki listedeki öğeleri daha detaylı logla
      console.log('First user issue (if exists):', userIssuesData.length > 0 ? {
        id: userIssuesData[0].id,
        hexId: userIssuesData[0].hexId,
        title: userIssuesData[0].title
      } : 'No user issues');
      
      console.log('First all issue (if exists):', allIssuesData.length > 0 ? {
        id: allIssuesData[0].id,
        hexId: allIssuesData[0].hexId,
        title: allIssuesData[0].title
      } : 'No issues');
      
      // Kullanıcıya ait olmayan sorunları belirle (debugging için)
      if (userIssuesData.length > 0 && allIssuesData.length > 0) {
        console.log('Checking for non-user issues:');
        
        // Tüm sorunlardaki ID'leri ve kullanıcı sorunlarındaki ID'leri karşılaştır
        const userIssueIds = userIssuesData.map((ui: Issue) => ui.hexId || (ui.id ? ui.id.toString() : ''));
        const nonUserIssues = allIssuesData.filter((ai: Issue) => {
          const allIssueId = ai.hexId || (ai.id ? ai.id.toString() : '');
          return !userIssueIds.includes(allIssueId);
        });
        
        console.log(`Non-user issues count: ${nonUserIssues.length} / ${allIssuesData.length}`);
        
        if (nonUserIssues.length > 0) {
          console.log('Example non-user issue:', {
            id: nonUserIssues[0].id,
            hexId: nonUserIssues[0].hexId,
            title: nonUserIssues[0].title
          });
        }
      }
      
      // Kullanıcının sorunlarına açık bir belirteç ekle
      const enhancedUserIssues = userIssuesData.map((issue: Issue) => ({
        ...issue,
        isUserIssue: true  // Kullanıcı sorunlarını belirgin şekilde işaretle
      }));
      
      // Kullanıcı sorunlarını ve tüm sorunları sakla
      setUserIssues(enhancedUserIssues);
      setAllIssues(allIssuesData);
      
      // Calculate stats directly from user issues data
      calculateStats(enhancedUserIssues);
      
    } catch (err: any) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setIsLoadingIssues(false);
    }
  };
  
  // Fetch profile and issues when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, [token, user]);
  
  // Use useFocusEffect to refresh issues every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Home screen is focused, refreshing issues...');
      fetchAllIssues();
      return () => {
        // Optional cleanup
      };
    }, [token])
  );
  
  // Run animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const navigateToIssueDetail = (issueId: string) => {
    console.log(`Navigating to issue detail with ID: ${issueId}`);
    
    if (!issueId) {
      console.error('Invalid issue ID for navigation');
      return;
    }
    
    router.push(`/issue-detail?id=${issueId}`);
  };
  
  // Process markers for OSMMap from issues data
  
  // Önce aynı koordinatlardaki sorunları gruplayalım
  const coordinateGroups = new Map();
  
  // Kullanıcı sorunlarını önce işle
  userIssues
    .filter(issue => {
      // Check if status is pending (0) or in progress (1)
      const statusStr = String(issue.status || '').toLowerCase();
      const isPendingOrInProgress = statusStr === 'pending' || 
                           statusStr === 'in_progress' || 
                           statusStr === 'new' ||
                           statusStr === 'received' ||
                           statusStr === '0' || 
                           statusStr === '1' ||
                           issue.status === 0 ||
                           issue.status === 1;
      
      // Check if coordinates are valid
      const hasValidCoords = 
        issue.latitude !== undefined && 
        issue.longitude !== undefined && 
        issue.latitude !== 0 && 
        issue.longitude !== 0;
      
      return isPendingOrInProgress && hasValidCoords;
    })
    .forEach(issue => {
      // Koordinat anahtarı oluştur
      const coordKey = `${issue.latitude?.toFixed(5)},${issue.longitude?.toFixed(5)}`;
      
      // Bu koordinattaki sorun sayısını güncelle
      if (!coordinateGroups.has(coordKey)) {
        coordinateGroups.set(coordKey, { count: 0, hasUserIssue: false });
      }
      
      const group = coordinateGroups.get(coordKey);
      group.count++;
      group.hasUserIssue = true;
    });
  
  // Diğer kullanıcıların sorunlarını işle
  allIssues
    .filter(issue => {
      // Eğer kullanıcının sorunuysa ekleme
      const isUserIssue = userIssues.some(userIssue => {
        const userIssueId = userIssue.hexId || (userIssue.id ? userIssue.id.toString() : '');
        const currentIssueId = issue.hexId || (issue.id ? issue.id.toString() : '');
        return userIssueId === currentIssueId;
      });
      
      // Check if status is in progress (1) - ONLY in progress for other users
      const statusStr = String(issue.status || '').toLowerCase();
      const isInProgress = statusStr === 'in_progress' || 
                           statusStr === 'inprogress' ||
                           statusStr === 'in progress' ||
                           statusStr === 'processing' ||
                           statusStr === '1' ||
                           issue.status === 1;
      
      // Check if coordinates are valid
      const hasValidCoords = 
        issue.latitude !== undefined && 
        issue.longitude !== undefined && 
        issue.latitude !== 0 && 
        issue.longitude !== 0;
      
      return !isUserIssue && isInProgress && hasValidCoords;
    })
    .forEach(issue => {
      // Koordinat anahtarı oluştur
      const coordKey = `${issue.latitude?.toFixed(5)},${issue.longitude?.toFixed(5)}`;
      
      // Bu koordinattaki sorun sayısını güncelle
      if (!coordinateGroups.has(coordKey)) {
        coordinateGroups.set(coordKey, { count: 0, hasUserIssue: false });
      }
      
      coordinateGroups.get(coordKey).count++;
    });
  
  console.log('Coordinate groups:', Object.fromEntries(coordinateGroups));
  
  // Şimdi kullanıcı sorunları için markerları oluştur (bunlar her zaman daha üstte görünsün)
  const userMarkers = userIssues
    .filter(issue => {
      // Check if status is pending (0) or in progress (1)
      const statusStr = String(issue.status || '').toLowerCase();
      const isPendingOrInProgress = statusStr === 'pending' || 
                           statusStr === 'in_progress' || 
                           statusStr === 'new' ||
                           statusStr === 'received' ||
                           statusStr === '0' || 
                           statusStr === '1' ||
                           issue.status === 0 ||
                           issue.status === 1;
      
      // Check if coordinates are valid
      const hasValidCoords = 
        issue.latitude !== undefined && 
        issue.longitude !== undefined && 
        issue.latitude !== 0 && 
        issue.longitude !== 0;
      
      return isPendingOrInProgress && hasValidCoords;
    })
    .map((issue, index) => {
      const issueId = issue.hexId || (issue.id ? issue.id.toString() : '');
      
      // Koordinat anahtarı oluştur
      const coordKey = `${issue.latitude?.toFixed(5)},${issue.longitude?.toFixed(5)}`;
      const group = coordinateGroups.get(coordKey);
      
      // Aynı koordinatta birden fazla sorun varsa, küçük kaydırmalar ekle
      let adjustedLatitude = issue.latitude || 0;
      let adjustedLongitude = issue.longitude || 0;
      
      if (group && group.count > 1) {
        // Her sorun için hafif bir kaydırma ekle (0.0001 derece yaklaşık 10 metre)
        // Kullanıcının sorunlarını hafif yukarı-sağa kaydır
        const offsetMultiplier = 0.00005; // Daha küçük bir kaydırma değeri
        adjustedLatitude += offsetMultiplier;
        adjustedLongitude += offsetMultiplier;
      }
      
      // Get status color for the marker
      const statusColor = (() => {
        // Status kontrolü
        const statusStr = String(issue.status || '').toLowerCase();
        const isInProgress = statusStr === 'in_progress' || 
                            statusStr === 'inprogress' ||
                            statusStr === 'in progress' ||
                            statusStr === 'processing' ||
                            statusStr === '1' ||
                            issue.status === 1;
        
        if (isInProgress) return '#F59E0B'; // In Progress - Sarı
        return '#3B82F6'; // Pending - Mavi
      })();

      // Z-index değerini belirle
      // In Progress sorunları daha üstte, Pending sorunlarını onun altında göster
      const zIndexValue = (() => {
        const statusStr = String(issue.status || '').toLowerCase();
        const isInProgress = statusStr === 'in_progress' || 
                            statusStr === 'inprogress' ||
                            statusStr === 'in progress' ||
                            statusStr === 'processing' ||
                            statusStr === '1' ||
                            issue.status === 1;
        
        return isInProgress ? 2000 : 1000; // In Progress için 2000, Pending için 1000
      })();

      return {
        id: issueId,
        coordinates: {
          latitude: adjustedLatitude,
          longitude: adjustedLongitude,
        },
        title: issue.title,
        description: issue.description,
        color: statusColor,
        isUserIssue: true, // Kullanıcı sorunlarını belirt
        zIndex: zIndexValue // Z-index olarak hesaplanan değeri kullan
      };
    });
    
  // Diğer kullanıcıların sorunları için markerlar
  const otherMarkers = allIssues
    .filter(issue => {
      // Eğer kullanıcının sorunuysa ekleme (zaten yukarıda ekledik)
      const isUserIssue = userIssues.some(userIssue => {
        const userIssueId = userIssue.hexId || (userIssue.id ? userIssue.id.toString() : '');
        const currentIssueId = issue.hexId || (issue.id ? issue.id.toString() : '');
        return userIssueId === currentIssueId;
      });
      
      // Check if status is in progress (1) - ONLY in progress for other users
      const statusStr = String(issue.status || '').toLowerCase();
      const isInProgress = statusStr === 'in_progress' || 
                           statusStr === 'inprogress' ||
                           statusStr === 'in progress' ||
                           statusStr === 'processing' ||
                           statusStr === '1' ||
                           issue.status === 1;
      
      // Check if coordinates are valid
      const hasValidCoords = 
        issue.latitude !== undefined && 
        issue.longitude !== undefined && 
        issue.latitude !== 0 && 
        issue.longitude !== 0;
      
      return !isUserIssue && isInProgress && hasValidCoords;
    })
    .map((issue, index) => {
      const issueId = issue.hexId || (issue.id ? issue.id.toString() : '');
      
      // Koordinat anahtarı oluştur
      const coordKey = `${issue.latitude?.toFixed(5)},${issue.longitude?.toFixed(5)}`;
      const group = coordinateGroups.get(coordKey);
      
      // Aynı koordinatta birden fazla sorun varsa, küçük kaydırmalar ekle
      let adjustedLatitude = issue.latitude || 0;
      let adjustedLongitude = issue.longitude || 0;
      
      if (group && group.count > 1) {
        // Eğer bu koordinatta kullanıcı sorunu yoksa
        if (!group.hasUserIssue) {
          // Her sorun için hafif bir kaydırma ekle (dağıtmak için index kullan)
          const offsetMultiplier = 0.00003; // Daha küçük bir kaydırma değeri
          adjustedLatitude += offsetMultiplier * Math.cos(index * Math.PI / 4);
          adjustedLongitude += offsetMultiplier * Math.sin(index * Math.PI / 4);
        } else {
          // Eğer bu koordinatta kullanıcı sorunu varsa, hafif sol-aşağı kaydır
          const offsetMultiplier = 0.00005;
          adjustedLatitude -= offsetMultiplier;
          adjustedLongitude -= offsetMultiplier;
        }
      }
      
      return {
        id: issueId,
        coordinates: {
          latitude: adjustedLatitude,
          longitude: adjustedLongitude,
        },
        title: issue.title,
        description: issue.description,
        color: '#9CA3AF', // Gri renk - diğer kullanıcıların sorunları için
        isUserIssue: false, // Diğer kullanıcıların sorunlarını belirt
        zIndex: 500 // Daha düşük z-index (kullanıcı sorunlarının altında gösterilsin)
      };
    });
  
  // Önce otherMarkers, sonra userMarkers ekleyerek userMarkers'ın daha üstte olmasını sağla
  const mapMarkers = [...otherMarkers, ...userMarkers];
  
  // Get user's name - from API if available, fallback to auth context
  const getUserName = () => {
    // Önce API'dan gelen profile verisine bak
    if (userProfile && userProfile.name) {
      return userProfile.name;
    }
    // Eğer API'dan gelen veride name yoksa, auth context'e bak
    if (user && user.name) {
      return user.name;
    }
    // Hiçbir veri yoksa "User" döndür
    return 'User';
  };
  
  // Get first letter of name for avatar
  const getAvatarLetter = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  // Debug profile bilgilerini logla
  console.log('Home - Auth context user:', user);
  console.log('Home - User profile state:', userProfile);
  console.log('Home - Calculated name:', getUserName());
  console.log('Home - Map markers:', mapMarkers.length);
  console.log('Home - Stats:', { receivedCount, inProgressCount, completedCount });
  
  // Debug log final markers
  console.log('Final map markers:', mapMarkers.length, 'markers created');
  mapMarkers.forEach(marker => {
    console.log('Marker:', {
      title: marker.title,
      coords: marker.coordinates
    });
  });
  
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Full screen map - Using OpenStreetMap */}
      <View style={styles.mapContainer}>
        {isLoadingIssues ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading issues...</Text>
          </View>
        ) : (
          <OSMMap
            style={styles.map}
            initialRegion={campusMapRegion}
            markers={mapMarkers}
            onMarkerPress={(marker) => {
              // Sadece kullanıcının kendi sorunlarına tıklandığında detay sayfasına git
              if (marker && marker.id && marker.isUserIssue) {
                console.log('Navigating to issue detail with ID:', marker.id);
                navigateToIssueDetail(marker.id);
              } else if (marker && !marker.isUserIssue) {
                // Diğer kullanıcıların sorunlarına tıklandığında hiçbir şey yapma
                // (Marker'a tıklandığında zaten başlık popup olarak gösteriliyor)
                console.log('Other user issue clicked, no action needed:', marker.title);
              } else {
                console.error('Invalid marker or marker ID:', marker);
              }
            }}
          />
        )}
      </View>
      
      {/* Header floating on top of map */}
      <View>
        {/* Gradient Background */}
        <View style={styles.headerContainer}>
          <View
            style={{ 
              width: '100%',
              backgroundColor: '#3B82F6',
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              paddingTop: STATUSBAR_HEIGHT,
              paddingBottom: 24,
            }}
          >
            {/* Top Row: App Title and Icons */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>
                Campus Caution
              </Text>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={() => { router.push('/(app)/notifications') }}>
                  <View>
                    <Ionicons name="notifications" size={24} color="white" />
                    {notificationsCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {notificationsCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.push('/(app)/profile') }}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getAvatarLetter()}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Welcome Message - Only keep the welcome text */}
            <View style={styles.welcomeContainer}>
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.welcomeText}>
                  Welcome back, {getUserName().split(' ')[0]}!
                </Text>
              )}
            </View>
            
            {/* Quick Stats with vertical layout */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard} onPress={() => { router.push('/(app)/track') }}>
                  <View style={styles.statHeader}>
                    <Ionicons name="warning" size={18} color="#FCD34D" />
                    <Text style={styles.statLabel}>
                      New
                    </Text>
                  </View>
                  <Text style={styles.statValue}>
                    {receivedCount}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.statCard} onPress={() => { router.push('/(app)/track') }}>
                  <View style={styles.statHeader}>
                    <Ionicons name="shield" size={18} color="#93C5FD" />
                    <Text style={styles.statLabel}>
                      Active
                    </Text>
                  </View>
                  <Text style={styles.statValue}>
                    {inProgressCount}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.statCard} onPress={() => { router.push('/(app)/track') }}>
                  <View style={styles.statHeader}>
                    <Ionicons name="information-circle" size={18} color="#86EFAC" />
                    <Text style={styles.statLabel}>
                      Done
                    </Text>
                  </View>
                  <Text style={styles.statValue}>
                    {completedCount}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  mapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    position: "relative",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    marginRight: 4,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 9,
    height: 18,
    width: 18,
    position: 'absolute',
    top: -6,
    right: -6,
    borderWidth: 1,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    padding: 16,
    marginTop: 4,
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    opacity: 0.9,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 10,
    flex: 1,
    marginHorizontal: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3B82F6',
  }
}); 