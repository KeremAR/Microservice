const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const http = require('http');
const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();
// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'gateway-service'
});
// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [1, 5, 15, 50, 100, 200, 500, 1000, 2000]
});
// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);

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

// Apply rate limiting to all requests - BEFORE /metrics
app.use(limiter);

// Expose metrics endpoint for Prometheus - AFTER limiter, BEFORE proxies
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Add request duration metrics middleware - AFTER /metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.originalUrl.split('?')[0];
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });
  
  next();
});

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

// Proxy routes with URLs from environment variables
app.use('/user', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/user': '' },
  logLevel: 'debug',
  logProvider,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Request: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Gateway] Response: ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
  }
}));

app.use('/department', createProxyMiddleware({
  target: DEPARTMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/department': '' },
  logLevel: 'debug',
  logProvider,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Request: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Gateway] Response: ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
  }
}));

app.use('/issue', createProxyMiddleware({
  target: ISSUE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/issue': '' },
  logLevel: 'debug',
  logProvider,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Request: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    console.log(`[Gateway] Request headers:`, req.headers);
    console.log(`[Gateway] ProxyReq path: ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Gateway] Response: ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
  }
}));

app.use('/notification', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notification/notifications': '/notifications' },
  logLevel: 'debug',
  logProvider,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Request: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Gateway] Response: ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
  }
}));

// Home route
app.get('/', (req, res) => {
  res.send('API Gateway is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
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