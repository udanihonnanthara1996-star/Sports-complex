//Add MongoDB connection setup using Mongoose
// Import the mongoose library to connect and work with MongoDB
const mongoose = require('mongoose');

// Define an async function to connect to the database
const connectDB = async () => {
  try {
    // Connect using the environment variable if available, otherwise use the local MongoDB URI
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:3000/facility_booking');
     // Log a success message when the connection is established
    console.log('MongoDB connected');
  } catch (err) {
    // Log any connection error message and exit the process with a failure code
    console.error('MongoDB connection error:', err.message);
    // Stop the application if the database connection fails
    process.exit(1);
  }
};
// Export the connection function so it can be used in other files
module.exports = connectDB;
