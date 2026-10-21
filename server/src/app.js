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

// 1. Build an array of allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

// 2. Safely handle origin validation
const corsOptions = {
  origin: (origin, callback) => {
    // Log incoming requests on Render to pinpoint origin mismatches
    console.log('Incoming Request Origin:', origin);
    console.log('Allowed Origins Array:', allowedOrigins);

    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(
      (allowed) => allowed && allowed.replace(/\/$/, '') === cleanOrigin
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`CORS BLOCKED: Origin ${origin} is not in allowedOrigins`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

// 3. Apply CORS middleware before Helmet
app.use(cors(corsOptions));

// 4. Relax Helmet cross-origin policies
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