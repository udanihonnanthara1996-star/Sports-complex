const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: String,
  type: String,
  description: String,
  time: Date,
  venue: String,
  maxParticipants: Number,
  judgeBoard: [String],
  registrationDeadline: Date,
  contacts: [String] // Added contacts field
});

module.exports = mongoose.model('Event', EventSchema);

