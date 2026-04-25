// Import Mongoose to connect to MongoDB and work with collections
const mongoose = require('mongoose');
// Import the User model for seeding admin data
const User = require('./Model/User');
// Import the Facility model for seeding facilities
const Facility = require('./Model/facility');
// Load environment variables from the .env file
require('dotenv').config();

// Seed initial data into the database
const seedData = async () => {
    // Connect to MongoDB using the environment variable or fallback Atlas URI
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hansaninavodya825_db_user:hAgmdDYQ2U9FPfzA@hansani.xoabwdi.mongodb.net/sports_complex?retryWrites=true&w=majority');
  // Confirm successful connection
  console.log('Connected to MongoDB Atlas');

   // Remove all existing users and facilities before inserting fresh seed data
  await User.deleteMany({});
  await Facility.deleteMany({});

   // Create an admin user with initial credentials
  await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    phone: '+1234567890',
    role: 'admin'
  });

  // Define the facility records to insert
  const facilities = [
    { name: 'Main Gym', type: 'gym', pricePerHour: 15, maxCapacity: 30, description: 'Fully equipped gym with cardio, weights, and yoga studios' },
    { name: 'Cricket Ground', type: 'cricket', pricePerHour: 50, maxCapacity: 22, description: 'Full-size cricket ground with practice nets' },
    { name: 'Tennis Court', type: 'tennis', pricePerHour: 25, maxCapacity: 4, description: 'Professional tennis court with floodlights' },
    { name: 'Olympic Swimming Pool', type: 'swimming_pool', pricePerHour: 20, maxCapacity: 50, description: '50m heated Olympic-size swimming pool' },
    { name: 'Football Field', type: 'football', pricePerHour: 40, maxCapacity: 22, description: 'Professional football field with all amenities' }
  ];
  // Insert all facilities into the database at once
  await Facility.insertMany(facilities);

  // Log success after seeding completes
  console.log('Seed data inserted!');
  // Exit the process successfully
  process.exit(0);
};
// Run the seed function to populate the database with initial data
seedData();