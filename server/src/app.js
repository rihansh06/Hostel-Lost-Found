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

// 1. Configure CORS options
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// 2. Place CORS BEFORE Helmet to ensure OPTIONS preflight requests are handled immediately
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. Relax Helmet policies so cross-origin requests from Vercel are not blocked
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