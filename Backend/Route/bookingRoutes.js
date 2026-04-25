// Import Express to create a router instance
const express = require('express');
// Create a new router for booking-related routes
const router = express.Router();
// Import booking controller functions for handling booking actions
const { createBooking, getAllBookings, getBookingById, updateBooking, deleteBooking } = require('../Controllers/bookingController');
// Import authentication middleware to protect routes
const { protect } = require('../middleware/auth');

// Apply authentication to all routes defined below
router.use(protect);
// Route to create a new booking
router.post('/', createBooking);
// Route to get all bookings
router.get('/', getAllBookings);
// Route to get a single booking by ID
router.get('/:id', getBookingById);
// Route to update an existing booking by ID
router.put('/:id', updateBooking);
// Route to delete a booking by ID
router.delete('/:id', deleteBooking);

// Mock route example for getting all bookings
// Note: This duplicates the GET '/' route above and should not be used together
router.get('/', (req, res) => {
  res.json({ bookings: [] });
});
// Mock route example for creating a booking
// Note: This duplicates the POST '/' route above and should not be used together
router.post('/', (req, res) => {
  res.json({ message: 'Booking created successfully' });
});
// Export the router to use it in the main app
module.exports = router;
