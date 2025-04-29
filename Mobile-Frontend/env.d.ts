declare module '@env' {
  export const EXPO_PUBLIC_AUTH0_DOMAIN: string;
  export const EXPO_PUBLIC_AUTH0_CLIENT_ID: string;
  export const EXPO_PUBLIC_API_BASE_URL: string;
}

// process.env için tip tanımları
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_AUTH0_DOMAIN: string;
      EXPO_PUBLIC_AUTH0_CLIENT_ID: string;
      EXPO_PUBLIC_API_BASE_URL: string;
    }
  }
} 