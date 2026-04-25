// Import required core and third-party libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();// Loads environment variables from .env file for secure configuration

// Import route modules for modular API organization
const authRoutes = require('./Routes/authRoutes');
// User authentication endpoints (login/register)
const bookingRoutes = require('./Routes/bookingRoutes');
// Facility booking managementendpoints
const facilityRoutes = require('./Routes/facilityRoutes');
// Facility CRUD operations
const reportRoutes = require('./Routes/reportRoutes');
// Reporting and analytics endpoints


const app = express();

// === MIDDLEWARE CONFIGURATION ===
// Enable CORS for frontend-backend cross-origin requests (e.g., React app on different port)
app.use(cors());
// Parse JSON request bodies (required for POST/PUT with JSON payloads)
app.use(express.json());
// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// === API ROUTES (Versioned v1 for future scalability) ===
app.use('/api/v1/users', authRoutes); // Base path: /api/v1/users/*
app.use('/api/v1/bookings', bookingRoutes);// Base path: /api/v1/bookings/*
app.use('/api/v1/facilities', facilityRoutes);// Base path: /api/v1/facilities/*
app.use('/api/v1/reports', reportRoutes);// Base path: /api/v1/reports/*

// Global error handling middleware - catches all unhandled errors
// Must be last middleware to catch route errors
app.use(require('./middleware/errorHandler'));

// === DATABASE & SERVER STARTUP ===
const PORT = process.env.PORT || 5000;// Use env PORT for deployment (Heroku/Vercel), fallback to 5000 locally
// Connect to MongoDB Atlas/local with error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/facility_booking')// Prioritize env var for production security
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));// Exit process on DB failure to prevent running without database

  // TODO (dev): Add graceful shutdown handlers for SIGTERM/SIGINT (nodemon restarts, production deployments)
// FIXME: Add helmet.js for security headers and rate limiting for production
// NOTE: Consider adding morgan for request logging in development