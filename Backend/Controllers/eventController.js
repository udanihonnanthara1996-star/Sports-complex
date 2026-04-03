const Event = require('../Model/Event');
const Registration = require('../Model/Registration');

// Get all events
exports.getEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};

// Get single event
exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ msg: 'Event not found' });
  res.json(event);
};

// Create event
exports.createEvent = async (req, res) => {
  const event = new Event(req.body);
  await event.save();
  res.status(201).json(event);
};

// Update event
exports.updateEvent = async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) return res.status(404).json({ msg: 'Event not found' });
  res.json(event);
};

// Delete event
exports.deleteEvent = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ msg: 'Event not found' });
  await Registration.deleteMany({ event: req.params.id });
  res.json({ msg: 'Event and its registrations deleted' });
};

// Register for event
exports.registerForEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ msg: 'Event not found' });
  if (event.participantsCount >= event.maxParticipants)
    return res.status(400).json({ msg: 'Event is full' });

  const registration = new Registration({
    event: event._id,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone
  });

  await registration.save();
  res.status(201).json(registration);
};

// Get registrations for an event
exports.getEventRegistrations = async (req, res) => {
  const regs = await Registration.find({ event: req.params.id });
  res.json(regs);
};

// Approve registration
exports.approveRegistration = async (req, res) => {
  const reg = await Registration.findById(req.params.registrationId);
  if (!reg) return res.status(404).json({ msg: 'Registration not found' });

  reg.status = 'approved';
  await reg.save();

  await Event.findByIdAndUpdate(reg.event, { $inc: { participantsCount: 1 } });

  res.json({ msg: 'Approved', registration: reg });
};

// Reject registration
exports.rejectRegistration = async (req, res) => {
  const reg = await Registration.findById(req.params.registrationId);
  if (!reg) return res.status(404).json({ msg: 'Registration not found' });

  reg.status = 'rejected';
  await reg.save();
  res.json({ msg: 'Rejected', registration: reg });
};
