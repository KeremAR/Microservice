import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Image,
  Button,
  ButtonText,
  VStack,
  Heading,
  ScrollView, // To allow scrolling if content exceeds screen height
  HStack, // For horizontal layout in announcement cards
  Icon,
  Pressable,
  Avatar,
  AvatarFallbackText,
  Badge,
  BadgeText,
  CircleIcon,
} from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient'; // Import from expo
import { ArrowRight, MapPin, Navigation2, Bell, Search, AlertTriangle, Shield, Info } from 'lucide-react-native'; // Icons for announcements and help card
import { Link, useRouter } from 'expo-router'; // For linking announcements (optional)
import { Dimensions, StyleSheet, Animated, StatusBar, Platform } from 'react-native';
import { mockIssues, mockNotifications, mockStats, campusMapRegion, currentUser, Coordinates } from '../../data/mockData';
import OSMMap from '../../components/OSMMap';

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
  
  // Get status bar height
  const STATUSBAR_HEIGHT = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 0);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-20));
  const [notificationsCount] = useState(mockNotifications.filter(n => !n.read).length);
  const [stats] = useState(mockStats);
  
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
  
  // Filter issues for user's vs others
  const userIssues = mockIssues.filter(issue => issue.isUserIssue === true);
  const otherIssues = mockIssues.filter(issue => issue.isUserIssue === false);
  
  const navigateToIssueDetail = (issueId: string) => {
    router.push(`/issue-detail?id=${issueId}`);
  };
  
  // Process markers for OSMMap
  const mapMarkers = [
    ...userIssues
      .filter(issue => issue.status !== 'completed') // Filter out completed issues
      .map(issue => ({
        id: issue.id,
        coordinates: issue.coordinates,
        title: issue.title,
        description: issue.location,
        color: 'red', // User's issues in red
        isUserIssue: true
      })),
    ...otherIssues
      .filter(issue => issue.status !== 'completed') // Filter out completed issues
      .map(issue => ({
        id: issue.id,
        coordinates: issue.coordinates,
        title: issue.title,
        description: issue.location,
        color: 'blue', // Other issues in blue
        isUserIssue: false
      }))
  ];
  
  // Calculate counts by status
  const receivedCount = mockIssues.filter(issue => issue.status === 'received').length;
  const inProgressCount = mockIssues.filter(issue => issue.status === 'in_progress').length;
  const completedCount = mockIssues.filter(issue => issue.status === 'completed').length;
  
  return (
    <Box flex={1} position="relative">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Full screen map - Using OpenStreetMap */}
      <Box position="absolute" top={0} left={0} right={0} bottom={0}>
        <OSMMap
          style={styles.map}
          initialRegion={campusMapRegion}
          markers={mapMarkers}
          onMarkerPress={(marker) => {
            // Only navigate to detail page for user's own issues
            if (marker.isUserIssue) {
              navigateToIssueDetail(marker.id);
            } else {
              // For other issues, just show the popup
              console.log('Other marker pressed:', marker.title);
            }
          }}
        />
      </Box>
      
      {/* Header floating on top of map */}
      <Box>
        {/* Gradient Background */}
        <Box position="relative">
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            start={[0, 0]}
            end={[1, 1]}
            style={{ 
              width: '100%',
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              paddingTop: STATUSBAR_HEIGHT,
              paddingBottom: 24,
            }}
          >
            {/* Top Row: App Title and Icons */}
            <HStack 
              justifyContent="space-between" 
              alignItems="center" 
              px="$4" 
              pt="$4" 
              pb="$2"
            >
              <Text 
                color="$white" 
                fontSize="$2xl" 
                fontWeight="$bold"
              >
                Campus Caution
              </Text>
              <HStack space="md" alignItems="center">
                <Pressable onPress={() => { router.push('/(app)/notifications') }}>
                  <Box>
                    <Icon as={Bell} size="lg" color="$white" />
                    {notificationsCount > 0 && (
                      <Badge 
                        bg="$red500" 
                        borderRadius="$full" 
                        h={18} 
                        w={18} 
                        position="absolute" 
                        top={-6} 
                        right={-6}
                        borderWidth={1}
                        borderColor="$white"
                      >
                        <BadgeText color="$white" fontSize={10}>
                          {notificationsCount}
                        </BadgeText>
                      </Badge>
                    )}
                  </Box>
                </Pressable>
                <Pressable onPress={() => { router.push('/(app)/profile') }}>
                  <Avatar size="sm" borderColor="$white" borderWidth={2}>
                    <AvatarFallbackText>{currentUser.name}</AvatarFallbackText>
                  </Avatar>
                </Pressable>
              </HStack>
            </HStack>
            
            {/* Welcome Message - Only keep the welcome text */}
            <Box p="$4" mt="$1">
              <Text color="$white" fontSize="$lg" opacity={0.9}>
                Welcome back, {currentUser.name.split(' ')[0]}!
              </Text>
            </Box>
            
            {/* Quick Stats with vertical layout */}
            <Box px="$4" mt="$1">
              <HStack space="md" justifyContent="space-between">
                <Pressable style={styles.statCard} onPress={() => { router.push('/(app)/track') }}>
                  <HStack alignItems="center" mb="$1">
                    <Icon as={AlertTriangle} size="md" color="$amber400" mr="$1" />
                    <Text color="$white" fontSize="$sm" fontWeight="$medium">
                      New
                    </Text>
                  </HStack>
                  <Text color="$white" fontSize="$2xl" fontWeight="$bold" textAlign="center">
                    0
                  </Text>
                </Pressable>
                
                <Pressable style={styles.statCard} onPress={() => { router.push('/(app)/track') }}>
                  <HStack alignItems="center" mb="$1">
                    <Icon as={Shield} size="md" color="$blue400" mr="$1" />
                    <Text color="$white" fontSize="$sm" fontWeight="$medium">
                      Active
                    </Text>
                  </HStack>
                  <Text color="$white" fontSize="$2xl" fontWeight="$bold" textAlign="center">
                    1
                  </Text>
                </Pressable>
                
                <Pressable style={styles.statCard} onPress={() => { router.push('/(app)/track') }}>
                  <HStack alignItems="center" mb="$1">
                    <Icon as={Info} size="md" color="$green400" mr="$1" />
                    <Text color="$white" fontSize="$sm" fontWeight="$medium">
                      Done
                    </Text>
                  </HStack>
                  <Text color="$white" fontSize="$2xl" fontWeight="$bold" textAlign="center">
                    1
                  </Text>
                </Pressable>
              </HStack>
            </Box>
          </LinearGradient>
        </Box>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 10,
    flex: 1,
    marginHorizontal: 2,
  },
  reportButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 