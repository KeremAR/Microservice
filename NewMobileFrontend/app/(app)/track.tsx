import React from 'react';
import {
  Box,
  Text,
  VStack,
  Heading,
  ScrollView,
  HStack,
  Icon,
  Pressable,
  Divider,
} from '@gluestack-ui/themed';
import { Clock, CheckCircle, AlertCircle, XCircle, ClipboardList, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Issue, mockIssues } from '../../data/mockData';

// Get only the current user's issues
const getUserIssues = () => {
  return mockIssues.filter(issue => issue.isUserIssue === true);
};

const getStatusColor = (status: Issue['status']) => {
  switch (status) {
    case 'completed':
      return '$green600';
    case 'in_progress':
      return '$yellow500';
    case 'received':
      return '$blue600';
    case 'rejected':
      return '$red600';
    default:
      return '$gray600';
  }
};

const getStatusIcon = (status: Issue['status']) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'in_progress':
      return Clock;
    case 'received':
      return AlertCircle;
    case 'rejected':
      return XCircle;
    default:
      return AlertCircle;
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
    <Box flex={1} bg="$backgroundLight50">
      <Box bg="$blue700" pt="$12" pb="$4" px="$4">
        <Heading color="$white" size="xl">
          My Reports
        </Heading>
      </Box>
      
      <ScrollView flex={1}>
        <VStack space="lg" p="$4">
          {userIssues.length === 0 ? (
            <Box 
              py="$16" 
              alignItems="center" 
              justifyContent="center"
            >
              <Icon as={ClipboardList} size="xl" color="$textLight400" mb="$3" />
              <Text color="$textLight500" textAlign="center">
                You have not submitted any reports yet.
              </Text>
            </Box>
          ) : (
            userIssues.map((report) => (
              <VStack key={report.id} space="xs">
                <Text size="xs" color="$textLight500" fontWeight="$medium">
                  {formatDate(report.date)}
                </Text>
                <Divider my="$1.5" />
                <Pressable
                  onPress={() => navigateToIssueDetail(report.id)}
                >
                  {({ hovered, pressed }) => (
                    <Box
                      borderRadius="$lg"
                      borderWidth={1}
                      borderColor={pressed ? '$blue300': '$borderLight200'}
                      bg="$white"
                      sx={{
                        shadowColor: '$black',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 3,
                      }}
                      overflow="hidden"
                    >
                      {/* Top part: Background based on status */}
                      <Box p="$3" bg={getStatusColor(report.status)}>
                        <HStack space="sm" alignItems="center">
                          <Icon
                            as={Info}
                            size="sm"
                            color="$white"
                          />
                          <Heading
                            size="sm"
                            color="$white"
                            flex={1}
                            numberOfLines={1}
                          >
                            {report.title}
                          </Heading>
                        </HStack>
                      </Box>

                      {/* Bottom part: Gradient background with Description, Location, Status */}
                      <LinearGradient
                         colors={['#f0f5ff', '#ffffff']}
                         start={[0, 0]}
                         end={[0, 1]}
                      >
                        <Box p="$3">
                          <VStack space="sm">
                            <Text size="sm" color="$textLight600" numberOfLines={2} mb="$2">
                              {report.description}
                            </Text>
                            <HStack justifyContent="flex-end" alignItems="flex-end">
                              <HStack space="xs" alignItems="center" bg={`${getStatusColor(report.status)}20`} px="$2" py="$1" borderRadius="$md">
                                <Icon as={getStatusIcon(report.status)} size="xs" color={getStatusColor(report.status)} />
                                <Text size="xs" color={getStatusColor(report.status)} fontWeight="$medium">
                                  {getStatusLabel(report.status)}
                                </Text>
                              </HStack>
                            </HStack>
                          </VStack>
                        </Box>
                      </LinearGradient>
                    </Box>
                  )}
                </Pressable>
              </VStack>
            ))
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
} 