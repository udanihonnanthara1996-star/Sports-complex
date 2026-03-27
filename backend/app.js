// app.js
require('dotenv').config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// Routes
const userRoutes = require("./Route/UserRoutes");
// const paymentRoutes = require("./Route/PaymentRoutes"); 
// const eventRoutes = require('./Route/eventRoutes');
const inventoryRoutes = require("./Route/InventoryRoutes");
// const feedbackRoutes = require('./Route/feedback.routes');
// const ticketRoutes = require('./Route/ticket.routes');
// const bookingRoutes = require('./Route/bookingRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Explicit CORS policy
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return callback(null, true);
      }
    } catch (e) {
      // Invalid origin
    }
    const allowed = ['http://your-production-host.com'];
    if (allowed.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Routes
app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/payments", paymentRoutes); 
// app.use('/api/v1/events', eventRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
// app.use('/api/v1/feedback', feedbackRoutes);
// app.use('/api/v1/tickets', ticketRoutes);
// app.use('/api/v1/bookings', bookingRoutes);

// MongoDB options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};

// Connection event listeners
mongoose.connection.on('connecting', () => console.log('MongoDB connecting...'));
mongoose.connection.on('connected', () => console.log('MongoDB connected successfully'));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log("MongoDB connection established");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err);
    console.log("Please check your internet connection and MongoDB Atlas configuration");
    process.exit(1);
  });