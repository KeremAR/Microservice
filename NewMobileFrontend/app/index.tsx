import { Redirect } from 'expo-router';

export default function StartPage() {
  // App starts at the root (/), immediately redirect to the login screen
  return <Redirect href="/login" />;
} 