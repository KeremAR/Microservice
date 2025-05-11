import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getUserIssues } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

// Define Issue type based on backend response structure
interface Issue {
  id: any; // Original MongoDB ObjectId (as object)
  hexId: string; // Hexadecimal string representation of ObjectId
  title: string;
  description: string;
  status?: string | number; // Status can be string or numeric (0,1,2,3)
  departmentId?: number; // Make optional since it might not always be present
  createdAt?: string; // Make optional
  updatedAt?: string; // Make optional
  date?: string; // Add alternative date field that might be used
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  [key: string]: any; // Add index signature to accept any other fields
}

const TOKEN_KEY = 'auth_token';

const getStatusColor = (status: string | number | undefined) => {
  // Handle undefined or null status
  if (status === undefined || status === null) return '#4b5563'; // Default gray color
  
  // Handle numeric status codes
  if (typeof status === 'number') {
    switch(status) {
      case 0: return '#2563eb'; // Received/Pending (blue)
      case 1: return '#eab308'; // In Progress (yellow)
      case 2: return '#16a34a'; // Completed (green)
      case 3: return '#dc2626'; // Rejected (red)
      default: return '#4b5563'; // Unknown (gray)
    }
  }
  
  // Convert to lowercase for case-insensitive comparison if it's a string
  const statusLower = String(status).toLowerCase();
  
  switch (statusLower) {
    case 'completed':
    case 'done':
    case 'resolved':
    case 'fixed':
    case '2':
      return '#16a34a';
    case 'in_progress':
    case 'inprogress':
    case 'in progress':
    case 'processing':
    case 'working':
    case '1':
      return '#eab308';
    case 'received':
    case 'open':
    case 'new':
    case 'pending':
    case 'submitted':
    case '0':
      return '#2563eb';
    case 'rejected':
    case 'closed':
    case 'denied':
    case 'cancelled':
    case '3':
      return '#dc2626';
    default:
      console.log('Unknown status:', status);
      return '#4b5563';
  }
};

const getStatusIcon = (status: string | number | undefined) => {
  if (status === undefined || status === null) return 'alert-circle'; // Default icon for undefined status
  
  // Handle numeric status codes
  if (typeof status === 'number') {
    switch(status) {
      case 0: return 'alert-circle'; // Received/Pending
      case 1: return 'time'; // In Progress
      case 2: return 'checkmark-circle'; // Completed
      case 3: return 'close-circle'; // Rejected
      default: return 'alert-circle'; // Unknown
    }
  }
  
  // If status is a string
  switch (String(status).toLowerCase()) {
    case 'completed':
    case 'done':
    case '2':
      return 'checkmark-circle';
    case 'in_progress':
    case 'inprogress':
    case '1':
      return 'time';
    case 'received':
    case 'new':
    case '0':
      return 'alert-circle';
    case 'rejected':
    case 'closed':
    case '3':
      return 'close-circle';
    default:
      return 'alert-circle';
  }
};

const getStatusLabel = (status: string | number | undefined) => {
  // Handle undefined or null status
  if (status === undefined || status === null) return 'Unknown';
  
  // Handle numeric status codes
  if (typeof status === 'number') {
    switch(status) {
      case 0: return 'Pending';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      case 3: return 'Rejected';
      default: return `Status ${status}`;
    }
  }
  
  // Convert to lowercase for case-insensitive comparison if it's a string
  const statusLower = String(status).toLowerCase();
  
  switch (statusLower) {
    case 'completed':
    case 'done':
    case 'resolved':
    case 'fixed':
    case '2':
      return 'Completed';
    case 'in_progress':
    case 'inprogress':
    case 'in progress':
    case 'processing':
    case 'working':
    case '1':
      return 'In Progress';
    case 'received':
    case 'open':
    case 'new':
    case 'pending':
    case 'submitted':
    case '0':
      return 'Pending';
    case 'rejected':
    case 'closed':
    case 'denied':
    case 'cancelled':
    case '3':
      return 'Rejected';
    default:
      return String(status);
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if not a valid date
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if parsing fails
  }
};

// Helper function for status-based gradient colors for the title background
const getStatusGradientColors = (status: string | number | undefined): [string, string] => {
  if (status === undefined || status === null) return ['$gray600', '$gray500']; // Default for undefined status
  
  // Handle numeric status codes
  if (typeof status === 'number') {
    switch(status) {
      case 0: return ['$blue600', '$blue500']; // Received/Pending
      case 1: return ['$yellow600', '$yellow500']; // In Progress
      case 2: return ['$green600', '$green500']; // Completed
      case 3: return ['$red600', '$red500']; // Rejected
      default: return ['$gray600', '$gray500']; // Unknown
    }
  }
  
  // String status handling
  switch (String(status).toLowerCase()) {
    case 'completed':
    case 'done':
    case '2':
      return ['$green600', '$green500']; // Green gradient for completed
    case 'in_progress':
    case 'inprogress':
    case '1':
      return ['$yellow600', '$yellow500']; // Yellow gradient for in progress
    case 'received':
    case 'pending':
    case '0':
      return ['$blue600', '$blue500'];   // Blue gradient for received
    case 'rejected':
    case 'closed':
    case '3':
      return ['$red600', '$red500'];     // Red gradient for rejected
    default:
      return ['$gray600', '$gray500']; // Default grey gradient
  }
};

// Function to log issue data structure for debugging
const logIssueStructure = (issues: any[]) => {
  if (!issues || issues.length === 0) {
    console.log('No issues to analyze structure');
    return;
  }
  
  // Log the first issue's keys
  const firstIssue = issues[0];
  console.log('Issue structure - keys:', Object.keys(firstIssue));
  
  // Log status values to ensure we handle them correctly
  const statusValues = issues.map(issue => issue.status);
  console.log('Status values found:', [...new Set(statusValues)]);
};

export default function TrackScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchUserIssues = async () => {
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
        console.log('No authentication token found');
        setError('Authentication token not found');
        setLoading(false);
        return;
      }
      
      // Log token structure for debugging
      if (authToken && authToken.split('.').length === 3) {
        try {
          // Decode JWT token payload
          const base64Payload = authToken.split('.')[1];
          const payload = JSON.parse(atob(base64Payload));
          console.log('Token structure in track.tsx:', 
            JSON.stringify({
              uid: payload.uid,
              sub: payload.sub,
              user_id: payload.user_id,
              exp: payload.exp,
              iat: payload.iat
            })
          );
        } catch (e) {
          console.error('Error parsing token in track.tsx:', e);
        }
      }
      
      console.log('Fetching user issues with token length:', authToken ? authToken.length : 0);
      
      // Fetch user issues from API
      const issues = await getUserIssues(authToken);
      console.log('User issues fetched successfully:', issues ? issues.length : 0, 'issues found');
      
      // Log issue structure for debugging
      if (Array.isArray(issues) && issues.length > 0) {
        logIssueStructure(issues);
      } else {
        console.log('No issues returned from API - this could be normal if user has no issues');
      }
      
      // Check if issues is valid before setting state
      if (Array.isArray(issues)) {
        // Sort issues by date (newest first)
        const sortedIssues = [...issues].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setUserIssues(sortedIssues);
      } else {
        console.log('API did not return an array, setting empty array');
        setUserIssues([]);
      }
    } catch (err) {
      console.error('Error fetching user issues:', err);
      setError('Failed to load your reports. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch user issues on component mount
  useEffect(() => {
    fetchUserIssues();
  }, []);
  
  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchUserIssues();
  };
  
  const navigateToIssueDetail = (reportId: string) => {
    router.push(`/issue-detail?id=${reportId}`);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          My Reports
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1d4ed8" />
              <Text style={styles.loadingText}>Loading your reports...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="#dc2626" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchUserIssues}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : userIssues.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard" size={40} color="#9ca3af" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                You have not submitted any reports yet.
              </Text>
            </View>
          ) : (
            userIssues.map((report, index) => (
              <View key={`${report.hexId}-${index}`} style={styles.reportContainer}>
                <Text style={styles.dateText}>
                  {formatDate(report.createdAt || report.date)}
                </Text>
                <View style={styles.divider} />
                <TouchableOpacity
                  onPress={() => navigateToIssueDetail(report.hexId)}
                  style={styles.reportCard}
                >
                  {/* Top part: Background based on status */}
                  <View style={[styles.cardHeader, { backgroundColor: getStatusColor(report.status) }]}>
                    <View style={styles.headerRow}>
                      <Ionicons
                        name="information-circle"
                        size={18}
                        color="white"
                        style={styles.headerIcon}
                      />
                      <Text
                        style={styles.cardTitle}
                        numberOfLines={1}
                      >
                        {report.title}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom part: Gradient background with Description, Status */}
                  <View
                    style={styles.cardContent}
                  >
                    <Text style={styles.description} numberOfLines={2}>
                      {report.description}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: `${getStatusColor(report.status)}20` }
                      ]}>
                        <Ionicons 
                          name={getStatusIcon(report.status) as any} 
                          size={14} 
                          color={getStatusColor(report.status)} 
                          style={styles.statusIcon} 
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                          {getStatusLabel(report.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#1d4ed8',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  reportContainer: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 6,
  },
  reportCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  cardContent: {
    padding: 12,
    backgroundColor: '#f0f5ff',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  }
}); 