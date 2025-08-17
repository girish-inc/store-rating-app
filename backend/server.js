const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
require('dotenv').config();

// console.log('Starting up the server...'); // left this here from debugging
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup - had to fiddle with CORS for a while
// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://store-rating-app-inc.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // this was causing issues before, works now though
app.use(express.urlencoded({ extended: true }));

// Database connection test will be handled by the database config

// Routes - organized these after some trial and error
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const ownerRoutes = require('./routes/owner');
const storeRoutes = require('./routes/stores');
const ratingRoutes = require('./routes/ratings');

// Health check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Store Rating API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // admin stuff was tricky to implement
app.use('/api/users', userRoutes);
app.use('/api/owner', ownerRoutes); // owner dashboard took the longest
app.use('/api/stores', storeRoutes);
app.use('/api/ratings', ratingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // console.log('All routes loaded successfully'); // keeping this for now
  testConnection();
});

module.exports = app;