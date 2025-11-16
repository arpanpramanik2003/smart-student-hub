const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { syncDatabase } = require('./src/utils/database');
require('dotenv').config();

const app = express();

// 🔥 Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/profiles',
    'uploads/avatars', 
    'uploads/certificates'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Create upload directories
createUploadDirs();

// Security middleware
app.use(helmet({ 
  crossOriginEmbedderPolicy: false, 
  crossOriginOpenerPolicy: false, 
  crossOriginResourcePolicy: { policy: 'cross-origin' } 
}));

// CORS configuration - use environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔥 Enhanced static file serving with better logging
app.use('/uploads', (req, res, next) => {
  console.log(`📂 Static file request: ${req.path}`);
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, cors(), express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Strict rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply strict rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Changed to true for form data

// Initialize database
syncDatabase();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Smart Student Hub API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'Connected ✅'
  });
});

// 🔒 SECURE: Admin creation must be done through database seeding or CLI
// Public admin creation endpoint removed for security

// 🩺 DATABASE TEST ROUTE
app.get('/api/test-db', async (req, res) => {
  try {
    const { User } = require('./src/utils/database');
    const userCount = await User.count();
    
    res.json({ 
      success: true, 
      message: 'Database connected!',
      userCount: userCount,
      tables: 'User table exists'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🔥 Debug middleware to log all API requests
app.use('/api', (req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path}`, {
    body: req.body,
    files: req.files,
    contentType: req.get('Content-Type')
  });
  next();
});

// API routes - PLACE THESE AFTER SPECIAL ROUTES
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/students', require('./src/routes/student'));
app.use('/api/faculty', require('./src/routes/faculty'));
app.use('/api/admin', require('./src/routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🩺 Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`🔧 Admin setup: http://localhost:5173?setup=admin`);
  console.log(`📁 Upload directories created successfully`);
});