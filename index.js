const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Allow necessary headers
  credentials: true
}));
app.use(express.json());

// Service URLs
const CATEGORY_SERVICE_URL = 'http://localhost:3009';
const PRODUCT_SERVICE_URL = 'http://localhost:3010';
const USER_SERVICE_URL = 'http://localhost:3011';
const ORDER_SERVICE_URL = 'http://localhost:3012';
const HOME_SERVICE_URL = 'http://localhost:3008';

// Proxy configuration
const createProxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Proxy Error', message: err.message });
  },
  timeout: 30000,
  proxyTimeout: 31000,
  onProxyReq: (proxyReq, req, res) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
});

// Category Service Routes
app.use('/api/categories', createProxy(CATEGORY_SERVICE_URL));
app.use('/api/categories/:id', createProxy(CATEGORY_SERVICE_URL));
app.use('/api/categories/slug/:slug', createProxy(CATEGORY_SERVICE_URL));

// Product Service Routes
app.use('/api/products', createProxy(PRODUCT_SERVICE_URL));
app.use('/api/products/:id', createProxy(PRODUCT_SERVICE_URL));
app.use('/api/products/category/:categoryId', createProxy(PRODUCT_SERVICE_URL));
app.use('/api/products/:id/reviews', createProxy(PRODUCT_SERVICE_URL));
app.use('/api/reviews/:id', createProxy(PRODUCT_SERVICE_URL));
app.use('/api/products/:id/stock', createProxy(PRODUCT_SERVICE_URL));

// User Service Routes
app.use('/api/auth/login', createProxy(USER_SERVICE_URL));
app.use('/api/users', createProxy(USER_SERVICE_URL));
app.use('/api/users/me', createProxy(USER_SERVICE_URL));
app.use('/api/users/:id', createProxy(USER_SERVICE_URL));

// Order Service Routes
app.use('/api/orders', createProxy(ORDER_SERVICE_URL));
app.use('/api/orders/recent', createProxy(ORDER_SERVICE_URL));
app.use('/api/orders/stats', createProxy(ORDER_SERVICE_URL));
app.use('/api/orders/:id', createProxy(ORDER_SERVICE_URL));
app.use('/api/orders/:id/status', createProxy(ORDER_SERVICE_URL));
app.use('/api/users/:userId/orders', createProxy(ORDER_SERVICE_URL));

// Home Service Routes
app.use('/api/home/banners', createProxy(HOME_SERVICE_URL));
app.use('/api/home/banners/all', createProxy(HOME_SERVICE_URL));
app.use('/api/home/banners/:id', createProxy(HOME_SERVICE_URL));
app.use('/api/home/banners/reorder', createProxy(HOME_SERVICE_URL));
app.use('/api/banners', createProxy(HOME_SERVICE_URL));
app.use('/api/banners/all', createProxy(HOME_SERVICE_URL));
app.use('/api/banners/:id', createProxy(HOME_SERVICE_URL));

// Health check endpoints
app.use('/api/category/health', createProxy(CATEGORY_SERVICE_URL));
app.use('/api/product/health', createProxy(PRODUCT_SERVICE_URL));
app.use('/api/user/health', createProxy(USER_SERVICE_URL));
app.use('/api/order/health', createProxy(ORDER_SERVICE_URL));
app.use('/api/home/health', createProxy(HOME_SERVICE_URL));

// API Gateway health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'api-gateway' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`
Available Routes:
----------------
Category Service (${CATEGORY_SERVICE_URL}):
  - GET    /api/categories
  - GET    /api/categories/:id
  - GET    /api/categories/slug/:slug
  - POST   /api/categories
  - PUT    /api/categories/:id
  - DELETE /api/categories/:id
  - GET    /api/category/health

Product Service (${PRODUCT_SERVICE_URL}):
  - GET    /api/products
  - GET    /api/products/:id
  - GET    /api/products/category/:categoryId
  - POST   /api/products
  - PUT    /api/products/:id
  - DELETE /api/products/:id
  - GET    /api/products/:id/reviews
  - POST   /api/products/:id/reviews
  - PUT    /api/reviews/:id
  - DELETE /api/reviews/:id
  - PATCH  /api/products/:id/stock
  - GET    /api/product/health

User Service (${USER_SERVICE_URL}):
  - POST   /api/auth/login
  - GET    /api/users
  - POST   /api/users
  - GET    /api/users/me
  - GET    /api/users/:id
  - PUT    /api/users/:id
  - DELETE /api/users/:id
  - GET    /api/user/health

Order Service (${ORDER_SERVICE_URL}):
  - GET    /api/orders
  - GET    /api/orders/recent
  - GET    /api/orders/stats
  - GET    /api/orders/:id
  - POST   /api/orders
  - PATCH  /api/orders/:id/status
  - GET    /api/users/:userId/orders
  - GET    /api/order/health

Home Service (${HOME_SERVICE_URL}):
  - GET    /api/home/banners
  - GET    /api/home/banners/all
  - POST   /api/home/banners
  - PUT    /api/home/banners/:id
  - DELETE /api/home/banners/:id
  - PATCH  /api/home/banners/reorder
  - GET    /api/home/health
  - GET    /api/banners
  - GET    /api/banners/all
  - GET    /api/banners/:id

API Gateway:
  - GET    /health
`);
});
