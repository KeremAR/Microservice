const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const http = require('http');

// Load environment variables based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), 'config', `${NODE_ENV}.env`);

// Check if environment file exists
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log(`Environment file ${envPath} not found, using default .env file`);
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// HTTP request logger middleware
app.use(morgan('dev'));

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after a minute'
});

// Apply rate limiting to all requests
app.use(limiter);

// Set service URLs from environment variables or defaults
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';
const DEPARTMENT_SERVICE_URL = process.env.DEPARTMENT_SERVICE_URL || 'http://localhost:5002';
const ISSUE_SERVICE_URL = process.env.ISSUE_SERVICE_URL || 'http://localhost:5003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';

// Logger function for proxy requests
const logProvider = (provider) => {
  return {
    log: (...args) => console.log('[HPM]', ...args),
    debug: (...args) => console.debug('[HPM]', ...args),
    info: (...args) => console.info('[HPM]', ...args),
    warn: (...args) => console.warn('[HPM]', ...args),
    error: (...args) => console.error('[HPM]', ...args)
  };
};

// Proxy middleware options
const options = {
  changeOrigin: true,
  pathRewrite: {
    '^/user': '/',
    '^/department': '/',
    '^/issue': '/',
    '^/notification': '/'
  },
  logLevel: 'debug',
  logProvider,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Request: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Gateway] Response: ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
  }
};

// Helper function to make an HTTP request and return a promise
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    console.log(`Making request to: ${options.hostname}:${options.port}${options.path}`);
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Received response from ${options.hostname}:${options.port}${options.path} with status: ${res.statusCode}`);
        
        if (res.statusCode >= 400) {
          return reject({
            statusCode: res.statusCode,
            message: `Service returned error: ${res.statusCode}`,
            data: responseData
          });
        }
        
        try {
          // Try to parse as JSON
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          // If not valid JSON, return as string
          resolve(responseData);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error in request to ${options.hostname}:${options.port}${options.path}: ${error.message}`);
      reject({
        statusCode: 500,
        message: `Request failed: ${error.message}`,
        error
      });
    });
    
    req.on('timeout', () => {
      console.error(`Request to ${options.hostname}:${options.port}${options.path} timed out`);
      req.destroy();
      reject({
        statusCode: 504,
        message: 'Request timed out'
      });
    });
    
    // Set a timeout of 10 seconds
    req.setTimeout(10000);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Proxy routes with URLs from environment variables
app.use('/user', createProxyMiddleware({
  ...options,
  target: USER_SERVICE_URL
}));

app.use('/department', createProxyMiddleware({
  ...options,
  target: DEPARTMENT_SERVICE_URL
}));

app.use('/issue', createProxyMiddleware({
  ...options,
  target: ISSUE_SERVICE_URL
}));

app.use('/notification', createProxyMiddleware({
  ...options,
  target: NOTIFICATION_SERVICE_URL
}));

// Home route
app.get('/', (req, res) => {
  res.send('API Gateway is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`User Service: ${USER_SERVICE_URL}`);
  console.log(`Department Service: ${DEPARTMENT_SERVICE_URL}`);
  console.log(`Issue Service: ${ISSUE_SERVICE_URL}`);
  console.log(`Notification Service: ${NOTIFICATION_SERVICE_URL}`);
}); 