const Booking = require('../models/Booking');

exports.generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let start, end;

    if (type === 'weekly') {
      start = new Date();
      start.setDate(start.getDate() - 7);
      end = new Date();
    } else if (type === 'monthly') {
      start = new Date();
      start.setMonth(start.getMonth() - 1);
      end = new Date();
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      return res.status(400).json({ message: 'Provide type (weekly/monthly) or startDate & endDate' });
    }

    const bookings = await Booking.find({
      date: { $gte: start, $lte: end }
    }).populate('facility', 'name type pricePerHour').populate('user', 'name email');

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;

    // Group by facility
    const byFacility = {};
    bookings.forEach(b => {
      const key = b.facility ? b.facility.name : 'Unknown';
      if (!byFacility[key]) byFacility[key] = { count: 0, revenue: 0 };
      byFacility[key].count++;
      byFacility[key].revenue += b.totalPrice;
    });

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
    res.status(500).json({ message: err.message });
  }
};
