// Define environment type
type Environment = 'development' | 'test' | 'production';

// Import local configuration if it exists
let localConfig: { API_GATEWAY_IP: string; API_GATEWAY_PORT: number } | null = null;
try {
  // Using dynamic import to avoid build errors if the file doesn't exist
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localConfig = require('./local.env').LOCAL_CONFIG;
  console.log('Using local configuration:', localConfig);
} catch (error) {
  console.log('No local configuration found, using defaults');
}

// Environment variables
const ENV = {
  development: {
    API_GATEWAY_URL: localConfig 
      ? `http://${localConfig.API_GATEWAY_IP}:${localConfig.API_GATEWAY_PORT}`
      : 'http://localhost:3000',
    ENV_NAME: 'development'
  },
  test: {
    API_GATEWAY_URL: 'http://test-api.campuscaution.com',
    ENV_NAME: 'test'
  },
  production: {
    API_GATEWAY_URL: 'https://api.campuscaution.com',
    ENV_NAME: 'production'
  }
};

// Default to development environment
const getEnvVars = (env: Environment = 'development') => {
  // For standalone apps, you could use different logic
  // such as looking at the hostname/domain to determine environment
  if (__DEV__) {
    return ENV.development;
  }
  
  // For production builds, you could determine the env based on
  // a build flag or something else
  return ENV[env];
};

export default getEnvVars; 