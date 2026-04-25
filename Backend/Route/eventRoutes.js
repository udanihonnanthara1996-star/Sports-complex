// Import Express to create a router instance
const express = require('express');
// Create a new router for event-related endpoints
const router = express.Router();
// Import all event controller functions for handling event actions
const eventCtrl = require('../Controllers/eventController');

// Get all events
router.get('/', eventCtrl.getEvents);
// Get a single event by its ID
router.get('/:id', eventCtrl.getEventById);

// Create a new event
router.post('/', eventCtrl.createEvent);
// Update an existing event by ID
router.put('/:id', eventCtrl.updateEvent);
// Delete an event by ID
router.delete('/:id', eventCtrl.deleteEvent);

// Register a user for a specific event
router.post('/:id/register', eventCtrl.registerForEvent);
// Get all registrations for a specific event
router.get('/:id/registrations', eventCtrl.getEventRegistrations);

// Approve a pending event registration
router.post('/registrations/:registrationId/approve', eventCtrl.approveRegistration);
// Reject a pending event registration
router.post('/registrations/:registrationId/reject', eventCtrl.rejectRegistration);

// Export the router to use in the main app
module.exports = router;

