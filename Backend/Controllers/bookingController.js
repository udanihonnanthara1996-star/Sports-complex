const mongoose = require('mongoose');
const Booking = require('../Model/booking');
const Facility = require('../Model/facility');
const User = require('../Model/User');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const { validateBookingInput } = require('../utils/validators');

exports.createBooking = async (req, res) => {
  try {
    let facilityId = req.body.facilityId || req.body.facility || req.body.sport;
    const date = req.body.date;
    const timeSlot = req.body.timeSlot || req.body.time;
    const duration = Number(req.body.duration) || 1;
    const notes = req.body.notes || '';

    const errors = validateBookingInput({ facilityId, date, timeSlot });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    let facility = null;
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      facility = await Facility.findById(facilityId);
    }
    if (!facility && typeof facilityId === 'string') {
      facility = await Facility.findOne({
        $or: [
          { type: facilityId.toLowerCase() },
          { name: new RegExp(`^${facilityId}$`, 'i') }
        ]
      });
      if (facility) {
        facilityId = facility._id;
      }
    }
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    if (!facility.isActive) return res.status(400).json({ message: 'Facility is not available' });

    // Check for existing booking
    const existing = await Booking.findOne({
      facility: facilityId, date: new Date(date), timeSlot, status: 'confirmed'
    });
    if (existing) return res.status(409).json({ message: 'Time slot already booked' });

    const totalPrice = facility.pricePerHour * (duration || 1);
    const booking = await Booking.create({
      user: req.user._id, facility: facilityId, date: new Date(date),
      timeSlot, duration: duration || 1, totalPrice, notes
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('facility', 'name type').populate('user', 'name email phone');

    // Send WhatsApp confirmation
    try {
      const bookingUser = await User.findById(req.user._id).select('phone firstName lastName email');
      const msg = `✅ Booking Confirmed!\n\nFacility: ${facility.name} (${facility.type})\nDate: ${date}\nTime: ${timeSlot}\nDuration: ${duration || 1} hour(s)\nTotal: $${totalPrice}\n\nThank you for booking with us, ${bookingUser?.firstName || 'Customer'}!`;
      if (bookingUser?.phone) {
        await sendWhatsAppMessage(bookingUser.phone, msg);
      } else {
        console.warn('Booking created but user has no phone number for WhatsApp notification.');
      }
    } catch (whatsappErr) {
      console.error('WhatsApp notification failed:', whatsappErr.message);
    }

    res.status(201).json({ booking: populatedBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const bookings = await Booking.find(filter)
      .populate('facility', 'name type pricePerHour')
      .populate('user', 'name email phone')
      .sort({ date: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('facility', 'name type pricePerHour')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { date, timeSlot, duration, notes, status } = req.body;
    if (date) booking.date = new Date(date);
    if (timeSlot) booking.timeSlot = timeSlot;
    if (duration) {
      booking.duration = duration;
      const facility = await Facility.findById(booking.facility);
      booking.totalPrice = facility.pricePerHour * duration;
    }
    if (notes !== undefined) booking.notes = notes;
    if (status && req.user.role === 'admin') booking.status = status;

    await booking.save();
    const updated = await Booking.findById(booking._id)
      .populate('facility', 'name type').populate('user', 'name email phone');
    res.json({ booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
