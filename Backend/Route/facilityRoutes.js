const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const { protect, adminOnly } = require('../middleware/auth');

// Get all facilities (public)
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true });
    res.json({ facilities });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create facility (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json({ facility });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update facility (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json({ facility });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete facility (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ message: 'Facility deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
