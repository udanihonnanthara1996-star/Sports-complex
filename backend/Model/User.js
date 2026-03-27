const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: String,
  role: { type: String, enum: ['ADMIN', 'STAFF', 'MEMBER'], default: 'MEMBER' },
  passwordHash: String,
  isActive: { type: Boolean, default: true },
  verifiedAt: Date,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Remove the duplicate email index since unique: true already creates an index
UserSchema.index({ role: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
