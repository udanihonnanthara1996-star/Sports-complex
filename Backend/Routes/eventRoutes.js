const express = require('express');
const router = express.Router();
const eventCtrl = require('../Controllers/eventController');

router.get('/', eventCtrl.getEvents);
router.get('/:id', eventCtrl.getEventById);

router.post('/', eventCtrl.createEvent);
router.put('/:id', eventCtrl.updateEvent);
router.delete('/:id', eventCtrl.deleteEvent);

router.post('/:id/register', eventCtrl.registerForEvent);
router.get('/:id/registrations', eventCtrl.getEventRegistrations);

router.post('/registrations/:registrationId/approve', eventCtrl.approveRegistration);
router.post('/registrations/:registrationId/reject', eventCtrl.rejectRegistration);

module.exports = router;
