// Enhanced Feedback routes
const express = require('express');
const router = express.Router();
const feedbackController = require('../Controllers/feedback.controller');
const auth = require('../middleware/auth');

// Get feedback statistics
router.get('/stats', feedbackController.getFeedbackStats);

// Get all feedbacks (with filtering options)
router.get('/', feedbackController.getFeedbacks);

// Create feedback (requires authentication)
router.post('/', auth, feedbackController.createFeedback);

// Get feedback by ID
router.get('/:id', feedbackController.getFeedbackById);

// Update feedback (requires authentication)
router.put('/:id', auth, feedbackController.updateFeedback);
router.patch('/:id', auth, feedbackController.updateFeedback);

// Delete feedback (requires authentication)
router.delete('/:id', auth, feedbackController.deleteFeedback);

module.exports = router;
