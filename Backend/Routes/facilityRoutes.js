const express = require('express');
const router = express.Router();
const Facility = require('../Model/facility');
const auth = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get all active facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true }).sort({ name: 1 });
    res.json({ facilities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create facility (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json({ facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update facility (admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json({ facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete facility (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json({ message: 'Facility deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
