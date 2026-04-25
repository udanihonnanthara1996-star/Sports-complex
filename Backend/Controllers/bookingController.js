const mongoose = require('mongoose');
const Booking = require('../Model/booking');
const Facility = require('../Model/facility');
const User = require('../Model/User');
const UserMembership = require('../Model/UserMembership');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const { validateBookingInput } = require('../utils/validators');
/**
 * **CREATE BOOKING** - Handles new facility booking creation with flexible facility lookup
 * Supports facilityId, facility name, or sport type as input
 */
exports.createBooking = async (req, res) => {
  try {
    // **FLEXIBLE FACILITY INPUT HANDLING** - Accepts facilityId, facility name, or sport type
    let facilityId = req.body.facilityId || req.body.facility || req.body.sport;
    const date = req.body.date;
    const timeSlot = req.body.timeSlot || req.body.time;
    const duration = Number(req.body.duration) || 1;
    const notes = req.body.notes || '';

    // **INPUT VALIDATION** - Early validation prevents unnecessary DB queries 
    const errors = validateBookingInput({ facilityId, date, timeSlot });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    let facility = null;
    // **PRIMARY LOOKUP** - Direct ObjectId lookup for performance
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      facility = await Facility.findById(facilityId);
    }
    // **FALLBACK LOOKUP** - Search by type (sport) or exact name match (case-insensitive)
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
    // **FACILITY VALIDATION** - Ensure facility exists and is active
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    if (!facility.isActive) return res.status(400).json({ message: 'Facility is not available' });

    // Check for existing booking
    // **COLLISION DETECTION** - Prevent double-booking same time slot for the same facility
    const existing = await Booking.findOne({
      facility: facilityId, date: new Date(date), timeSlot, status: 'confirmed'// Only check confirmed bookings
    });
    if (existing) return res.status(409).json({ message: 'Time slot already booked' });
    // **PRICE CALCULATION** - Dynamic pricing based on facility rate and duration
    const totalPrice = facility.pricePerHour * (duration || 1);
    // **BOOKING CREATION** - Save to database with user reference

    // ── Membership Discount ─────────────────────────────────────────────
    let discountPercentage = 0;
    let membershipPlanName = null;
    try {
      const activeMembership = await UserMembership.findOne({
        userId: req.user._id,
        status: 'ACTIVE',
        endDate: { $gt: new Date() },
      }).populate('planId', 'name discountPercentage');
      if (activeMembership && activeMembership.planId) {
        discountPercentage = activeMembership.planId.discountPercentage || 0;
        membershipPlanName = activeMembership.planId.name;
      }
    } catch (membershipErr) {
      console.warn('Could not fetch membership info, proceeding without discount:', membershipErr.message);
    }

    const basePrice = facility.pricePerHour * (duration || 1);
    const discountAmount = basePrice * (discountPercentage / 100);
    const totalPrice = parseFloat((basePrice - discountAmount).toFixed(2));

    const booking = await Booking.create({
      user: req.user._id, facility: facilityId, date: new Date(date),
      timeSlot, duration: duration || 1, totalPrice, notes
    });
// **POPULATE RESPONSE** - Include facility and user details for client convenience
    const populatedBooking = await Booking.findById(booking._id)
      .populate('facility', 'name type').populate('user', 'name email phone');

    // Attach discount info to the response so frontend can display it
    const responseBooking = populatedBooking.toObject();
    responseBooking.discountApplied = discountPercentage > 0;
    responseBooking.discountPercentage = discountPercentage;
    responseBooking.membershipPlan = membershipPlanName;
    responseBooking.originalPrice = basePrice;

    // Send WhatsApp confirmation
    // **WHATSAPP NOTIFICATION** - Non-blocking async notification with graceful error handling
    try {
      const bookingUser = await User.findById(req.user._id).select('phone firstName lastName email');
      const msg = `✅ Booking Confirmed!\n\nFacility: ${facility.name} (${facility.type})\nDate: ${date}\nTime: ${timeSlot}\nDuration: ${duration || 1} hour(s)\nTotal: $${totalPrice}\n\nThank you for booking with us, ${bookingUser?.firstName || 'Customer'}!`;
      if (bookingUser?.phone) {
        await sendWhatsAppMessage(bookingUser.phone, msg);
      } else {
        console.warn('Booking created but user has no phone number for WhatsApp notification.');
      }
    } catch (whatsappErr) {
      // **NON-BLOCKING NOTIFICATION** - Booking succeeds even if WhatsApp fails
      console.error('WhatsApp notification failed:', whatsappErr.message);
    }

    res.status(201).json({ booking: responseBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * **GET ALL BOOKINGS** - Admin sees all, users see only their bookings
 * Returns populated data sorted by date (newest first)
 */

exports.getAllBookings = async (req, res) => {
  try {
    // **ROLE-BASED ACCESS CONTROL** - Different filters for admin vs user
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const bookings = await Booking.find(filter)
      .populate('facility', 'name type pricePerHour')
      .populate('user', 'name email phone')
      .sort({ date: -1 });// Newest bookings first
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * **GET SINGLE BOOKING** - Detailed view with authorization check
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('facility', 'name type pricePerHour')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // **AUTHORIZATION CHECK** - Owners or admins only
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * **UPDATE BOOKING** - Partial updates with recalculation and admin status control
 */
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    // **PARTIAL UPDATES** - Only update provided fields
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // **AUTHORIZATION CHECK** - Owners or admins only
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { date, timeSlot, duration, notes, status } = req.body;
    if (date) booking.date = new Date(date);
    if (timeSlot) booking.timeSlot = timeSlot;
    if (duration) {
      booking.duration = duration;
      // **DYNAMIC PRICE RECALCULATION** - Update total when duration changes
      const facility = await Facility.findById(booking.facility);
      booking.totalPrice = facility.pricePerHour * duration;
    }
    if (notes !== undefined) booking.notes = notes;
    if (status && req.user.role === 'admin') booking.status = status;
// **ADMIN-ONLY STATUS CHANGES** - e.g., 'confirmed', 'cancelled'
    await booking.save();
    // **RETURN UPDATED POPULATED DATA** - Reflect changes in response
    const updated = await Booking.findById(booking._id)
      .populate('facility', 'name type').populate('user', 'name email phone');
    res.json({ booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * **DELETE BOOKING** - Soft delete not implemented (hard delete)
 * Only owners or admins can delete
 */
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
