// Import the Booking model to fetch booking records from MongoDB
const Booking = require('../Model/booking');
// Import the Facility model if needed for future extensions or validation
const Facility = require('../Model/facility');

// Get the start and end of the week for a given date
const getWeekRange = (dateString) => {
  // Convert the input string into a Date object
  const date = new Date(dateString);
  // Return null if the date is invalid
  if (Number.isNaN(date.getTime())) return null;
  // Create a copy of the date to calculate the week start
  const start = new Date(date);
  // Move the date back to Monday of the current week
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
 // Set the start time to midnight to include the entire day
  start.setHours(0, 0, 0, 0);
   // Create the end of the week by adding 6 days to the start date
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
   // Set the end time to the last millisecond of the day to include the entire day
  end.setHours(23, 59, 59, 999);
  // Return the calculated week range
  return { start, end };
};

// Get the start and end of the month for a given date
const getMonthRange = (dateString) => {
  // Convert the input string into a Date object
  const date = new Date(dateString);
  // Return null if the date is invalid
  if (Number.isNaN(date.getTime())) return null;
  // Get the first day of the month by setting the date to 1
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  // Return the calculated month range
  return { start, end };
};
// Build the API response with grouped bookings and summary statistics
const buildScheduleResponse = (bookings, range) => {
  // Group bookings by date in YYYY-MM-DD format
  const groupedBookings = bookings.reduce((groups, booking) => {
    const key = new Date(booking.date).toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(booking);
    return groups;
  }, {});
 // Create summary metrics for the schedule
  const summary = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    revenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
  };
 // Return the final structured response
  return {
    start: range.start,
    end: range.end,
    groupedBookings,
    bookings,
    summary,
  };
};
// Controller to get schedule data for a date range
exports.getSchedule = async (req, res) => {
  try {
    // Read filtering options from query parameters
    const { facilityId, date, period = 'weekly' } = req.query;
    // Require a date to build the time range
    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }
// Build the weekly or monthly range based on the period parameter
    const range = period === 'monthly' ? getMonthRange(date) : getWeekRange(date);
// Reject invalid date input
    if (!range) {
      return res.status(400).json({ message: 'Invalid date value' });
    }
 // Base MongoDB filter for bookings inside the selected date range
    const filter = {
      date: { $gte: range.start, $lte: range.end },
    };
// Restrict results to one facility if facilityId is provided
    if (facilityId) {
      filter.facility = facilityId;
    }
// Non-admin users can only see their own bookings
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }
// Fetch matching bookings and populate related facility and user details
    const bookings = await Booking.find(filter)
      .populate('facility', 'name type pricePerHour')
      .populate('user', 'name email phone')
      .sort({ date: 1, timeSlot: 1 });
 // Build the final schedule response object
    const response = buildScheduleResponse(bookings, range);
    // Send the response to the client with the period and date for context
    return res.json({ period, date, ...response });
  } catch (err) {
    // Return server error if anything fails
    res.status(500).json({ message: err.message });
  }
};
// Reuse the same controller for admin schedule access
exports.getAdminSchedule = exports.getSchedule;
