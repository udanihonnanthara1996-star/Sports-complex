// Import Express to create a router instance
const express = require('express');
// Create a new router for booking-related routes
const router = express.Router();
// Import booking controller functions for handling booking actions
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../Controllers/bookingController');
// Import the schedule controller to fetch booking schedules
const { getSchedule } = require('../Controllers/scheduleController');
// Import authentication middleware object
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes below
router.use(auth);
// Create a new booking
router.post('/', createBooking);
// Get all bookings
router.get('/', getAllBookings);
// Get booking schedule data
router.get('/schedule', getSchedule);
// Get admin-level schedule data with admin-only access
router.get('/schedule/admin', auth.adminOnly, getSchedule);
// Get a single booking by its ID
router.get('/:id', getBookingById);
// Update an existing booking by ID
router.put('/:id', updateBooking);
// Delete a booking by ID
router.delete('/:id', deleteBooking);

// Export the router for use in the main application
module.exports = router;
