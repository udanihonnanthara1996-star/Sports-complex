const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./Routes/authRoutes');
const bookingRoutes = require('./Routes/bookingRoutes');
const facilityRoutes = require('./Routes/facilityRoutes');
const reportRoutes = require('./Routes/reportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/users', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/facilities', facilityRoutes);
app.use('/api/v1/reports', reportRoutes);

// Error handler
app.use(require('./middleware/errorHandler'));

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/facility_booking')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
