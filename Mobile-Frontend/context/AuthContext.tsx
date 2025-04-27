import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { exchangeCodeAsync, makeRedirectUri, useAuthRequest, ResponseType, AuthRequest } from 'expo-auth-session';
import { Platform } from 'react-native';
// import Constants from "expo-constants"; // Comment out or remove Constants import if no longer needed elsewhere

// Ensure web browser is dismissible
WebBrowser.maybeCompleteAuthSession();

// Interface for the authentication context state
interface AuthContextData {
  accessToken: string | null;
  user: any | null; // Consider defining a specific user type
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// --- Configuration (Loaded from Environment Variables) ---
// Attempting to read via process.env as an alternative
const tenantId = process.env.EXPO_PUBLIC_TENANT_ID;
const clientId = process.env.EXPO_PUBLIC_MOBILE_APP_CLIENT_ID;
const userServiceClientId = process.env.EXPO_PUBLIC_USER_SERVICE_CLIENT_ID;
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8082/api'; // Use correct IP and port

// Basic validation to ensure variables are loaded
if (!tenantId || !clientId || !userServiceClientId) {
  throw new Error("Missing Azure AD configuration in environment variables. Ensure EXPO_PUBLIC_TENANT_ID, EXPO_PUBLIC_MOBILE_APP_CLIENT_ID, and EXPO_PUBLIC_USER_SERVICE_CLIENT_ID are set in your .env file.");
}

const redirectUri = makeRedirectUri({
  scheme: 'myapp', // Use the scheme defined in app.json
  path: 'auth',    // Use the path defined in Azure AD redirect URI
});

// --- Log the actual redirect URI being used ---
console.log("Using Redirect URI:", redirectUri);
console.log("Using API Base URL:", apiBaseUrl); // Log API base URL
// ----------------------------------------------

// Endpoint discovery configuration
const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
};

const scopes = [
  'openid',
  'profile',
  'email',
  'offline_access', // Request refresh token
  `api://${userServiceClientId}/access_as_user`, // Scope for your user-service API
];
// --- End Configuration ---

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null);

  // --- Fetch User Info Function ---
  const fetchUserInfo = async (token: string) => {
    console.log("Fetching user info with token...");
    try {
      const response = await fetch(`${apiBaseUrl}/users/me`, { // Use template literal for URL
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User info received:", userData);
        setUser(userData);
        // Optionally store user data for persistence
        // await SecureStore.setItemAsync('user', JSON.stringify(userData));
      } else {
        console.error("Failed to fetch user info:", response.status, await response.text());
        // Handle non-OK response (e.g., token expired, unauthorized)
        // Maybe trigger signOut() if status is 401 or 403
        if (response.status === 401 || response.status === 403) {
          // Consider signing out if unauthorized
          // await signOut(); // Be careful with potential loops if signOut also clears user
        }
        setUser(null); // Clear user state on fetch error
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setUser(null); // Clear user state on network or other errors
    }
  };
  // --- End Fetch User Info Function ---

  // --- Authentication Request Hook ---
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId,
      scopes: scopes,
      redirectUri: redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true, // Explicitly ensure PKCE is enabled (default for Code flow)
      extraParams: {
        prompt: 'select_account',
      },
      // useProxy: Platform.OS !== 'web', // Remove or keep commented out
    },
    discovery
  );

  // Store the code verifier when the request object is created
  useEffect(() => {
    if (request?.codeVerifier) {
      setCodeVerifier(request.codeVerifier);
      console.log("Stored PKCE Code Verifier");
    }
  }, [request]);

  // --- Token Handling Effect (Using exchangeCodeAsync) ---
  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        const { code } = response.params;
        
        if (!codeVerifier) {
          console.error("Cannot exchange code, PKCE code_verifier is missing.");
          // Maybe trigger sign out or show error?
          setIsLoading(false); // Stop loading indicator
          return;
        }

        console.log("Exchanging authorization code for token using exchangeCodeAsync...");
        exchangeCodeAsync(
          {
            clientId: clientId,
            code: code,
            redirectUri: redirectUri,
            extraParams: {
              // Pass the stored code_verifier
              code_verifier: codeVerifier,
            },
          },
          discovery // Pass the discovery object containing the token endpoint
        )
        .then(async (tokenResponse) => {
          console.log("Token exchange successful:", tokenResponse.accessToken ? 'Token received' : 'No token in response', tokenResponse);
          if (tokenResponse.accessToken) {
            const receivedToken = tokenResponse.accessToken;
            setAccessToken(receivedToken);
            await SecureStore.setItemAsync('accessToken', receivedToken);
            // Fetch user info immediately after getting the token
            await fetchUserInfo(receivedToken);
            if (tokenResponse.refreshToken) {
              await SecureStore.setItemAsync('refreshToken', tokenResponse.refreshToken);
            }
          } else {
            console.error("Token exchange failed, response did not contain access_token:", tokenResponse);
             setUser(null); // Clear user if token exchange fails
          }
        })
        .catch((error) => {
          console.error("Token exchange error with exchangeCodeAsync:", error);
           setUser(null); // Clear user on exchange error
        });

      } else if (response.type === 'error') {
        console.error("Authentication error response:", response.error, response.params);
        // Handle error
        // setIsLoading(false); // Consider stopping loading here too if needed
      }
    }
  }, [response, codeVerifier]); // Add codeVerifier to dependencies

  // --- Load Token on App Start ---
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('accessToken');
        if (storedToken) {
          setAccessToken(storedToken);
          // Fetch user info if token exists
          await fetchUserInfo(storedToken);
        }
      } catch (e) {
        console.error("Failed to load token from storage", e);
        // setUser(null); // Ensure user is null if token load fails
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // --- Sign In Function ---
  const signIn = async () => {
    await promptAsync();
  };

  // --- Sign Out Function ---
  const signOut = async () => {
    try {
      setAccessToken(null);
      setUser(null); // Ensure user state is cleared on sign out
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken'); // Clear refresh token too
      // await SecureStore.deleteItemAsync('user'); // Clear stored user info if you implemented it
      if (Platform.OS !== 'web') {
        await WebBrowser.openAuthSessionAsync(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`, redirectUri);
      }
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 