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
  const [user, setUser] = useState<any | null>(null); // Store user info if needed
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading until token checked
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null); // State to store code_verifier

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
        .then((tokenResponse) => {
          console.log("Token exchange successful:", tokenResponse.accessToken ? 'Token received' : 'No token in response', tokenResponse);
          if (tokenResponse.accessToken) {
            const receivedToken = tokenResponse.accessToken;
            setAccessToken(receivedToken);
            SecureStore.setItemAsync('accessToken', receivedToken);
            // You might want to store the refresh token as well
            if (tokenResponse.refreshToken) {
              SecureStore.setItemAsync('refreshToken', tokenResponse.refreshToken);
            }
            // Optionally decode id_token for user info
            // if (tokenResponse.idToken) { ... }
          } else {
            console.error("Token exchange failed, response did not contain access_token:", tokenResponse);
            // Handle error
          }
          // No need to setIsLoading(false) here, loaded token effect handles it
        })
        .catch((error) => {
          console.error("Token exchange error with exchangeCodeAsync:", error);
          // Handle error, maybe signOut()
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
        // You might also load stored user info here
        if (storedToken) {
          setAccessToken(storedToken);
          // Optional: Validate token expiry here before setting state
          // const storedUser = await SecureStore.getItemAsync('user');
          // if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load token from storage", e);
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
      // Optional: Revoke token via Microsoft endpoint if needed
      setAccessToken(null);
      setUser(null);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('user'); // Clear stored user info
      // Clear browser cookies/session if necessary (might require more complex handling)
       if (Platform.OS !== 'web') { // WebBrowser only available on native
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