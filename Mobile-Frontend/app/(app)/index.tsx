import React from 'react';
import {
  Box,
  Text,
  Image,
  Button,
  ButtonText,
  VStack,
  Heading,
  ScrollView,
  HStack,
  Icon,
  Pressable,
} from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, HelpCircle } from 'lucide-react-native';
import { Link } from 'expo-router';

const mockAnnouncements = [
  {
    id: '1',
    title: 'Resolved: Wi-Fi Connectivity Issues in the Library',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore...',
    link: '/announcements/1',
  },
  {
    id: '2',
    title: 'Upcoming Maintenance for Student Portal',
    description: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum...',
    link: '/announcements/2',
  },
];

const bannerText = 'Together, we make our campus better.';

export default function HomeScreen() {
  return (
    <ScrollView bg="$white" flex={1}>
      <VStack space="lg" pb="$16">
        <Box position="relative" h={200}>
          <LinearGradient
            colors={['#FDBA74', '#F9A8D4']}
            start={[0, 0]}
            end={[1, 1]}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          />
          <Box flex={1} justifyContent="center" alignItems="flex-end" p="$5">
            <Text color="$black" fontSize="$lg" fontWeight="$bold" maxWidth="60%">
              {bannerText}
            </Text>
          </Box>
        </Box>

        <Box
          bg="$backgroundLight100"
          borderRadius="$2xl"
          p="$5"
          mx="$3"
          alignItems="center"
          borderColor="$borderLight200"
          borderWidth={1}
        >
          <VStack space="md" alignItems="center">
            <Box bg="$yellow200" borderRadius="$full" p="$3" mb="$2">
              <Icon as={HelpCircle} size="xl" color="$yellow600" />
            </Box>
            <Text fontSize="$xl" fontWeight="bold">Need Help?</Text>
            <Text textAlign="center">
              If you encounter any issues on campus, please report them here to help us improve your experience
            </Text>
            <Button size="md" variant="solid" action="primary" bg="$blue800" mt="$3" borderRadius="$full">
              <ButtonText>Inform Us</ButtonText>
            </Button>
          </VStack>
        </Box>

        <VStack space="md" px="$3">
          <Text fontSize="$xl" fontWeight="bold" mb="$2">Announcements:</Text>
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