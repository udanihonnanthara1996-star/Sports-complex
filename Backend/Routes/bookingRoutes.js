const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../Controllers/bookingController');
const { getSchedule } = require('../Controllers/scheduleController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/schedule', getSchedule);
router.get('/schedule/admin', auth.adminOnly, getSchedule);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

module.exports = router;
