const mongoose = require('mongoose');
const Facility = require('./Model/facility');
require('dotenv').config();

const addFacilities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hansaninavodya825_db_user:hAgmdDYQ2U9FPfzA@hansani.xoabwdi.mongodb.net/sports_complex?retryWrites=true&w=majority');
    console.log('Connected to MongoDB Atlas');

    // Clear existing facilities
    await Facility.deleteMany({});
    console.log('Cleared existing facilities');

    // Create facilities with exact names requested
    const facilities = [
      { 
        name: 'Main Gym', 
        type: 'gym', 
        pricePerHour: 15, 
        maxCapacity: 30, 
        description: 'Fully equipped gym with cardio, weights, and yoga studios',
        isActive: true
      },
      { 
        name: 'Cricket Ground', 
        type: 'cricket', 
        pricePerHour: 50, 
        maxCapacity: 22, 
        description: 'Full-size cricket ground with practice nets',
        isActive: true
      },
      { 
        name: 'Tennis Court', 
        type: 'tennis', 
        pricePerHour: 25, 
        maxCapacity: 4, 
        description: 'Professional tennis court with floodlights',
        isActive: true
      },
      { 
        name: 'Olympic Swimming Pool', 
        type: 'swimming_pool', 
        pricePerHour: 20, 
        maxCapacity: 50, 
        description: '50m heated Olympic-size swimming pool',
        isActive: true
      },
      { 
        name: 'Football Field', 
        type: 'football', 
        pricePerHour: 40, 
        maxCapacity: 22, 
        description: 'Professional football field with all amenities',
        isActive: true
      }
    ];

    const inserted = await Facility.insertMany(facilities);
    console.log('✅ Successfully added facilities:');
    inserted.forEach((f, i) => {
      console.log(`${i + 1}. ${f.name} (${f.type}) - $${f.pricePerHour}/hour`);
    });

    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

addFacilities();
