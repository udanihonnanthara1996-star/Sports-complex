// Import Mongoose to connect to MongoDB and work with the database
const mongoose = require('mongoose');
// Import the Facility model to insert facility documents
const Facility = require('./Model/facility');
// Load environment variables from the .env file
require('dotenv').config();

// Seed the database with predefined facilities
const addFacilities = async () => {
  try {
    // Connect to MongoDB using the environment variable or fallback Atlas URI
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hansaninavodya825_db_user:hAgmdDYQ2U9FPfzA@hansani.xoabwdi.mongodb.net/sports_complex?retryWrites=true&w=majority');
    // Confirm that the database connection was successful
    console.log('Connected to MongoDB Atlas');

    /// Remove all existing facility records before inserting new ones
    await Facility.deleteMany({});
    console.log('Cleared existing facilities');

    // Define the facility records to be inserted
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

    // Insert all facility documents into the database at once
    const inserted = await Facility.insertMany(facilities);
    // Log a success message and print each inserted facility
    console.log('✅ Successfully added facilities:');
    inserted.forEach((f, i) => {
      console.log(`${i + 1}. ${f.name} (${f.type}) - $${f.pricePerHour}/hour`);
    });

    // Close the MongoDB connection after seeding is complete
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    // Log any error that occurs during connection, deletion, or insertion
    console.error('Error:', error.message);
    // Exit the process with a failure code
    process.exit(1);
  }
};
// Run the seed function to add facilities to the database
addFacilities();
