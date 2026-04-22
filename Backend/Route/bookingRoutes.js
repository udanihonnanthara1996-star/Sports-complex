const express = require('express');
const router = express.Router();
const { createBooking, getAllBookings, getBookingById, updateBooking, deleteBooking } = require('../Controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

// Mock booking routes - implement actual booking logic as needed
router.get('/', (req, res) => {
  res.json({ bookings: [] });
});

router.post('/', (req, res) => {
  res.json({ message: 'Booking created successfully' });
});

module.exports = router;
