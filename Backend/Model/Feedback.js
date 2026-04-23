const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['FACILITY', 'EVENT', 'STAFF'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 2000 },
  images: [{ url: String, key: String, caption: String }],
  visibility: { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' },
  status: { type: String, enum: ['VISIBLE', 'HIDDEN'], default: 'VISIBLE' },
  meta: {
    likesCount: { type: Number, default: 0 },
    flaggedCount: { type: Number, default: 0 }
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

FeedbackSchema.index({ targetType: 1, targetId: 1 });
FeedbackSchema.index({ createdBy: 1, createdAt: 1 });
FeedbackSchema.index({ rating: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);