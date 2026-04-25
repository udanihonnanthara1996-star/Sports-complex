// Import Express to create a router instance
const express = require('express');
// Create a new router for report-related endpoints
const router = express.Router();
// Import the report controller function
const { generateReport } = require('../controllers/reportController');
// Import authentication and admin authorization middleware
const { protect, adminOnly } = require('../middleware/auth');

// Protect this route so only logged-in admins can access reports
router.get('/', protect, adminOnly, generateReport);

// Export the router for use in the main application
module.exports = router;