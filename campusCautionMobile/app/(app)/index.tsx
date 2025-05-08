import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { mockIssues, mockNotifications, mockStats, campusMapRegion } from '../../data/mockData';
import OSMMap from '../../components/OSMMap';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, getIssues, getUserIssues, getStats } from '../../services/api';

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
      // İstatistikleri hesaplamak için sadece kullanıcının sorunlarını getirelim
      const userIssuesData = await getUserIssues(token);
      console.log('User issues fetched:', userIssuesData.length);
      
      if (userIssuesData && userIssuesData.length > 0) {
        console.log('Sample user issue data structure:', JSON.stringify(userIssuesData[0], null, 2));
        console.log('User issues status values:', userIssuesData.map((issue: Issue) => `${issue.title}: ${issue.status}`));
      }
      
      // Kullanıcıya ait sorunları listeleyip, tüm istatistikleri hesaplayalım
      setAllIssues(userIssuesData);
      setUserIssues(userIssuesData);
      
      // Calculate stats directly from user issues data
      calculateStats(userIssuesData);
      
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
  
  // Process markers for OSMMap from real issues data
  const mapMarkers = allIssues
    .filter(issue => {
      // Check if status is not completed (handling both string and numeric formats)
      const statusStr = String(issue.status || '').toLowerCase();
      const isCompleted = statusStr === 'completed' || 
                          statusStr === 'done' || 
                          statusStr === '2' || 
                          issue.status === 2;
      
      // Log to debug coordinate data
      console.log(`Issue ${issue.title} - Coords: lat=${issue.latitude}, lng=${issue.longitude}`);
      
      return !isCompleted && issue.latitude && issue.longitude;
    })
    .map(issue => {
      // Check if we have a hexId, otherwise use id (converted to string)
      const issueId = issue.hexId || (issue.id ? issue.id.toString() : '');
      console.log(`Adding marker for issue: ${issue.title}, ID: ${issueId}`);
      
      return {
        id: issueId,
        coordinates: {
          latitude: issue.latitude || 0,
          longitude: issue.longitude || 0,
        },
        title: issue.title,
        description: issue.description,
        color: '#3B82F6', // Consistent blue color for all issues
        isUserIssue: true
      };
    });
  
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
              // Navigate to detail page for all issues
              if (marker && marker.id) {
                console.log('Navigating to issue detail with ID:', marker.id);
                navigateToIssueDetail(marker.id);
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

      {/* Floating Report Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/(app)/create-report')}
      >
        <View style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="white" />
        </View>
      </TouchableOpacity>
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
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 