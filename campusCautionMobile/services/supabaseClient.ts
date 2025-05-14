// Simple HTTP client for Supabase 
// Since we're using Firebase for auth and just syncing data to Supabase
// we're using a simple fetch-based implementation

import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../constants/config';

export interface SupabaseUser {
  id?: string;
  firebase_uid: string;
  email: string;
  name?: string;
  surname?: string;
  avatar_url?: string;
  role?: string;
  updated_at?: string;
}

// Function to save/update user data in Supabase via our backend service
export const upsertUser = async (userData: SupabaseUser, token: string): Promise<SupabaseUser | null> => {
  try {
    // No need for a special sync endpoint - the login endpoint already stores user data
    // Just get the profile to confirm everything is synced properly
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
      headers: getAuthHeaders(token)
    });

    if (!response.ok) {
      console.error('Error retrieving user profile after Google Sign-In');
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error upserting user to Supabase:', error);
    return null;
  }
};

// Function to retrieve user data from Supabase via our backend service
export const getUserByFirebaseUid = async (firebaseUid: string, token: string): Promise<SupabaseUser | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
      headers: getAuthHeaders(token)
    });

    if (!response.ok) {
      console.error('Error retrieving user profile');
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user from Supabase:', error);
    return null;
  }
}; 