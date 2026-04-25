// Import Express to create a router instance
const express = require('express');
// Create a new router for facility-related endpoints
const router = express.Router();
// Import the Facility model for database operations
const Facility = require('../models/Facility');
// Import authentication and authorization middleware
const { protect, adminOnly } = require('../middleware/auth');

// Get all active facilities (public endpoint)
router.get('/', async (req, res) => {
  try {
    // Fetch only facilities that are currently active
    const facilities = await Facility.find({ isActive: true });
    // Return the list of facilities
    res.json({ facilities });
  } catch (err) {
    // Handle database or server errors
    res.status(500).json({ message: err.message });
  }
});

// Create a new facility (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    // Create a facility using request body data and save it to the database
    const facility = await Facility.create(req.body);
    // Return the newly created facility
    res.status(201).json({ facility });
  } catch (err) {
    // Handle database or server errors during creation
    res.status(500).json({ message: err.message });
  }
});

// Update an existing facility by ID (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    // Find the facility by ID and update it with new data
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Return 404 if no facility is found
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    // Return the updated facility
    res.json({ facility });
  } catch (err) {
    // Handle database or server errors during update
    res.status(500).json({ message: err.message });
  }
});

// Delete a facility by ID (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    // Permanently delete the facility from the database
    await Facility.findByIdAndDelete(req.params.id);
    // Return confirmation message
    res.json({ message: 'Facility deleted' });
  } catch (err) {
    // Handle deletion errors
    res.status(500).json({ message: err.message });
  }
});

// Export the router for use in the main app
module.exports = router;
