import React from 'react';
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
  // LinearGradient, // Remove from gluestack import
} from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient'; // Import from expo
import { ArrowRight, HelpCircle } from 'lucide-react-native'; // Icons for announcements and help card
import { Link } from 'expo-router'; // For linking announcements (optional)

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
  // Add more announcements as needed
];

// Mock Data for Banner
const bannerText = 'Together, we make our campus better.';
// Placeholder for banner image
// const bannerImage = require('../assets/images/home-banner.png');

// Placeholder for help card image
// const helpImage = require('../assets/images/need-help.png');

export default function HomeScreen() {
  return (
    <ScrollView bg="$white" flex={1}>
      <VStack space="lg" pb="$16">

        {/* Banner Section */}
        <Box position="relative" h={200}> {/* Adjust height as needed */}
          {/* Example Gradient Background */}
          <LinearGradient
            colors={['#FDBA74', '#F9A8D4']} // Use actual color strings, Gluestack tokens might not work here
            start={[0, 0]} // Correct array format
            end={[1, 1]}   // Correct array format
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          />
          {/* Add banner image here later */}
          {/* <Image source={bannerImage} alt="Banner" ... /> */}
          <Box flex={1} justifyContent="center" alignItems="flex-end" p="$5">
            <Text color="$black" fontSize="$lg" fontWeight="$bold" maxWidth="60%">
              {bannerText}
            </Text>
          </Box>
        </Box>

        {/* Need Help Card Section */}
        <Box
          bg="$backgroundLight100" // Lighter background for the card
          borderRadius="$2xl" // More rounded corners from image
          p="$5"
          mx="$3" // Add horizontal margin
          alignItems="center"
          borderColor="$borderLight200"
          borderWidth={1}
        >
          <VStack space="md" alignItems="center">
             {/* Placeholder for help image */}
             <Box bg="$yellow200" borderRadius="$full" p="$3" mb="$2">
                <Icon as={HelpCircle} size="xl" color="$yellow600" />
             </Box>
            {/* <Image source={helpImage} alt="Need Help" size="md" resizeMode="contain" mb="$2" /> */}
            <Heading size="lg">Need Help?</Heading>
            <Text textAlign="center">
              If you encounter any issues on campus, please report them here to help us improve your experience
            </Text>
            <Button size="md" variant="solid" action="primary" bg="$blue800" mt="$3" borderRadius="$full">
              <ButtonText>Inform Us</ButtonText>
            </Button>
          </VStack>
        </Box>

        {/* Announcements Section */}
        <VStack space="md" px="$3"> {/* Add horizontal padding */}
          <Heading size="lg">Announcements:</Heading>
          {mockAnnouncements.map((item) => (
            <Link href={item.link as any} key={item.id} asChild>
              <Pressable>
                {({ hovered, pressed }) => (
                  <Box
                    bg={pressed ? '$backgroundLight200' : hovered ? '$backgroundLight100' : '$backgroundLight50'}
                    p="$4"
                    borderRadius="$lg"
                    borderWidth={1}
                    borderColor="$borderLight200"
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1} mr="$3">
                        <Text fontWeight="$bold" mb="$1">{item.title}</Text>
                        <Text size="sm" color="$textLight600" numberOfLines={2}>{item.description}</Text>
                      </VStack>
                      <Icon as={ArrowRight} size="md" color="$textLight500" />
                    </HStack>
                  </Box>
                )}
              </Pressable>
            </Link>
          ))}
        </VStack>

      </VStack>
    </ScrollView>
  );
} 