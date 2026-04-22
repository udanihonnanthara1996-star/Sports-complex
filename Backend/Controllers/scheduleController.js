const Booking = require('../Model/booking');
const Facility = require('../Model/facility');

const getWeekRange = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getMonthRange = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const buildScheduleResponse = (bookings, range) => {
  const groupedBookings = bookings.reduce((groups, booking) => {
    const key = new Date(booking.date).toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(booking);
    return groups;
  }, {});

  const summary = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    revenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
  };

  return {
    start: range.start,
    end: range.end,
    groupedBookings,
    bookings,
    summary,
  };
};

exports.getSchedule = async (req, res) => {
  try {
    const { facilityId, date, period = 'weekly' } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }

    const range = period === 'monthly' ? getMonthRange(date) : getWeekRange(date);
    if (!range) {
      return res.status(400).json({ message: 'Invalid date value' });
    }

    const filter = {
      date: { $gte: range.start, $lte: range.end },
    };

    if (facilityId) {
      filter.facility = facilityId;
    }

    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    const bookings = await Booking.find(filter)
      .populate('facility', 'name type pricePerHour')
      .populate('user', 'name email phone')
      .sort({ date: 1, timeSlot: 1 });

    const response = buildScheduleResponse(bookings, range);
    return res.json({ period, date, ...response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminSchedule = exports.getSchedule;
