// Import Express to create a router instance
const express = require('express');
// Create a new router for facility-related routes
const router = express.Router();
// Import the Facility model for database operations
const Facility = require('../Model/facility');
// Import authentication middleware
const auth = require('../middleware/auth');

// Middleware to ensure only admin users can access certain routes
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get all active facilities, sorted alphabetically by name
router.get('/', async (req, res) => {
  try {
    // Fetch only active facilities from the database
    const facilities = await Facility.find({ isActive: true }).sort({ name: 1 });
    // Return the list of facilities
    res.json({ facilities });
  } catch (error) {
    // Handle server or database errors
    res.status(500).json({ message: error.message });
  }
});

// Create a new facility (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    // Insert a new facility record using the request body
    const facility = await Facility.create(req.body);
    // Return the created facility with 201 status
    res.status(201).json({ facility });
  } catch (error) {
    // Handle creation errors
    res.status(500).json({ message: error.message });
  }
});

// Update an existing facility by ID (admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    // Find the facility by ID and update it, returning the new version
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Return 404 if the facility does not exist
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    // Return the updated facility
    res.json({ facility });
  } catch (error) {
    // Handle update errors
    res.status(500).json({ message: error.message });
  }
});

// Delete a facility by ID (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    // Remove the facility from the database
    const facility = await Facility.findByIdAndDelete(req.params.id);
    // Return 404 if the facility does not exist
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    // Return success message after deletion
    res.json({ message: 'Facility deleted' });
  } catch (error) {
    // Handle deletion errors
    res.status(500).json({ message: error.message });
  }
});
// Export the router to be used in the main app
module.exports = router;
