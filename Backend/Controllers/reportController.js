// Import the Booking model to query booking records from MongoDB
const Booking = require('../models/Booking');

// Controller function to generate booking reports based on date range or preset period
exports.generateReport = async (req, res) => {
  try {
    // Get report filters from query parameters
    const { type, startDate, endDate } = req.query;
    let start, end;

// If type is weekly, set the date range to the last 7 days
    if (type === 'weekly') {
      start = new Date();
      start.setDate(start.getDate() - 7);
      end = new Date();
// If type is monthly, set the date range to the last 30 days / one month
    } else if (type === 'monthly') {
      start = new Date();
      start.setMonth(start.getMonth() - 1);
      end = new Date();
// If custom dates are provided, use them as the report range
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
// Return an error if no valid date filter is provided
    } else {
      return res.status(400).json({ message: 'Provide type (weekly/monthly) or startDate & endDate' });
    }
// Fetch all bookings within the selected date range
    // Populate related facility and user data for readable report output
    const bookings = await Booking.find({
      date: { $gte: start, $lte: end }
    }).populate('facility', 'name type pricePerHour').populate('user', 'name email');
// Calculate total revenue from all bookings in the report range
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
     // Count bookings by status for summary statistics
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;

    // Group by facility
    // Group bookings by facility name and calculate count and revenue per facility
    const byFacility = {};
    bookings.forEach(b => {
      const key = b.facility ? b.facility.name : 'Unknown';
      if (!byFacility[key]) byFacility[key] = { count: 0, revenue: 0 };
      byFacility[key].count++;
      byFacility[key].revenue += b.totalPrice;
    });

// Send the full report response to the client with all calculated metrics and booking details
    res.json({
      report: {
        period: { start, end, type: type || 'custom' },
        totalBookings: bookings.length,
        confirmedCount, cancelledCount, completedCount,
        totalRevenue,
        byFacility,
        bookings
      }
    });
  } catch (err) {
    // Handle any server or database errors and return a 500 error response with the error message
    res.status(500).json({ message: err.message });
  }
};
