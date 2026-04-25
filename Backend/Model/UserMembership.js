const mongoose = require('mongoose');

const UserMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: [true, 'Plan ID is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    // Payment reference to track which payment activated this membership
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    // Snapshot of plan details at time of purchase (so historical data is preserved)
    planSnapshot: {
      name: String,
      price: Number,
      duration: Number,
      discountPercentage: Number,
    },
  },
  { timestamps: true }
);

// Auto-update status to EXPIRED if endDate has passed
UserMembershipSchema.methods.checkAndUpdateStatus = async function () {
  if (this.status === 'ACTIVE' && new Date() > this.endDate) {
    this.status = 'EXPIRED';
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('UserMembership', UserMembershipSchema);
