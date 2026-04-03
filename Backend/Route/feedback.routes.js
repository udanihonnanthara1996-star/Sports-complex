// Enhanced Feedback routes
const express = require('express');
const router = express.Router();
const feedbackController = require('../Controllers/feedback.controller');

// Get feedback statistics
router.get('/stats', feedbackController.getFeedbackStats);

// Get all feedbacks (with filtering options)
router.get('/', feedbackController.getFeedbacks);

// Create feedback
router.post('/', feedbackController.createFeedback);

// Get feedback by ID
router.get('/:id', feedbackController.getFeedbackById);

// Update feedback
router.put('/:id', feedbackController.updateFeedback);
router.patch('/:id', feedbackController.updateFeedback);

// Delete feedback (soft delete)
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
