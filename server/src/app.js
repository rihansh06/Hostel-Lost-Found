const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const postRoutes = require('./routes/postRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const claimRoutes = require('./routes/claimRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Configure CORS to dynamically accept requests from Vercel and local development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, cURL, Postman)
      if (!origin) return callback(null, true);

      // Check if origin ends with .vercel.app or matches localhost/CLIENT_URL
      const isVercel = origin.endsWith('.vercel.app');
      const isLocalhost = origin.includes('localhost');
      const isClientUrl = process.env.CLIENT_URL && origin.replace(/\/$/, '') === process.env.CLIENT_URL.replace(/\/$/, '');

      if (isVercel || isLocalhost || isClientUrl) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Security headers relaxed for cross-origin assets
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hostel-lost-found-backend' });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

// Central error handling middleware
app.use(errorHandler);

module.exports = app;