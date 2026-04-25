const mongoose = require('mongoose');

// Define the Booking schema for storing reservation details
const bookingSchema = new mongoose.Schema({
  // Reference to the User who made the booking
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Reference to the Facility being booked
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  // Booking date
  date: { type: Date, required: true },
  // Selected time slot for the booking
  timeSlot: { type: String, required: true },
  // Duration of the booking in hours
  duration: { type: Number, default: 1 },
  // Booking status: confirmed, cancelled, or completed
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  // Total price for the booking
  totalPrice: { type: Number, required: true },
  // Optional notes or special requests from the user
  notes: { type: String, default: '' },
  // Timestamp for when the booking was created
  createdAt: { type: Date, default: Date.now },
  // Timestamp for when the booking was last updated
  updatedAt: { type: Date, default: Date.now }
});
// Automatically update the updatedAt field before saving the document
bookingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});
// Export the Booking model based on the defined schema
module.exports = mongoose.model('Booking', bookingSchema);
