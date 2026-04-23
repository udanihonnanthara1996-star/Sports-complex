const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Credit Card', 'Master Card'],
    },
    cardN: {
      type: String,
      required: [true, 'Card number is required'],
      trim: true,
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
    },
    sportTime: {
      type: String,
      required: [true, 'Booking time is required'],
    },
    amount: {
      type: String,
      required: [true, 'Amount is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
