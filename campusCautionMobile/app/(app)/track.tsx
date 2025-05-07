import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Issue, mockIssues } from '../../data/mockData';

// Get only the current user's issues
const getUserIssues = () => {
  return mockIssues.filter(issue => issue.isUserIssue === true);
};

const getStatusColor = (status: Issue['status']) => {
  switch (status) {
    case 'completed':
      return '#16a34a';
    case 'in_progress':
      return '#eab308';
    case 'received':
      return '#2563eb';
    case 'rejected':
      return '#dc2626';
    default:
      return '#4b5563';
  }
};

const getStatusIcon = (status: Issue['status']) => {
  switch (status) {
    case 'completed':
      return 'checkmark-circle';
    case 'in_progress':
      return 'time';
    case 'received':
      return 'alert-circle';
    case 'rejected':
      return 'close-circle';
    default:
      return 'alert-circle';
  }
};

const getStatusLabel = (status: Issue['status']) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'received':
      return 'Pending';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function for status-based gradient colors for the title background
const getStatusGradientColors = (status: Issue['status']): [string, string] => {
  switch (status) {
    case 'completed':
      return ['$green600', '$green500']; // Green gradient for completed
    case 'in_progress':
      return ['$yellow600', '$yellow500']; // Yellow gradient for in progress
    case 'received':
      return ['$blue600', '$blue500'];   // Blue gradient for received
    case 'rejected':
      return ['$red600', '$red500'];     // Red gradient for rejected
    default:
      return ['$gray600', '$gray500']; // Default grey gradient
  }
};

export default function TrackScreen() {
  const router = useRouter();
  const userIssues = getUserIssues();
  
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
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {userIssues.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard" size={40} color="#9ca3af" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                You have not submitted any reports yet.
              </Text>
            </View>
          ) : (
            userIssues.map((report) => (
              <View key={report.id} style={styles.reportContainer}>
                <Text style={styles.dateText}>
                  {formatDate(report.date)}
                </Text>
                <View style={styles.divider} />
                <TouchableOpacity
                  onPress={() => navigateToIssueDetail(report.id)}
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