const mongoose = require('mongoose');
const User = require('./Model/User');
const Facility = require('./Model/facility');
require('dotenv').config();

const seedData = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hansaninavodya825_db_user:hAgmdDYQ2U9FPfzA@hansani.xoabwdi.mongodb.net/sports_complex?retryWrites=true&w=majority');
  console.log('Connected to MongoDB Atlas');

  // Clear existing data
  await User.deleteMany({});
  await Facility.deleteMany({});

  // Create admin
  await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    phone: '+1234567890',
    role: 'admin'
  });

  // Create facilities
  const facilities = [
    { name: 'Main Gym', type: 'gym', pricePerHour: 15, maxCapacity: 30, description: 'Fully equipped gym with cardio, weights, and yoga studios' },
    { name: 'Cricket Ground', type: 'cricket', pricePerHour: 50, maxCapacity: 22, description: 'Full-size cricket ground with practice nets' },
    { name: 'Tennis Court', type: 'tennis', pricePerHour: 25, maxCapacity: 4, description: 'Professional tennis court with floodlights' },
    { name: 'Olympic Swimming Pool', type: 'swimming_pool', pricePerHour: 20, maxCapacity: 50, description: '50m heated Olympic-size swimming pool' },
    { name: 'Football Field', type: 'football', pricePerHour: 40, maxCapacity: 22, description: 'Professional football field with all amenities' }
  ];
  await Facility.insertMany(facilities);

  console.log('Seed data inserted!');
  process.exit(0);
};

seedData();