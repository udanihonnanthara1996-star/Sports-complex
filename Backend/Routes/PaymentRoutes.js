const express = require('express');
const router = express.Router();
const Payment = require('../Model/Payment');

// POST /api/v1/payments  — create a new payment (called by Payment.js frontend)
router.post('/', async (req, res) => {
  try {
    const { name, email, method, cardN, sport, sportTime, amount, phone } = req.body;

    // Basic server-side validation
    if (!name || !email || !method || !cardN || !sport || !sportTime || !amount || !phone) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const payment = new Payment({ name, email, method, cardN, sport, sportTime, amount, phone });
    const saved = await payment.save();

    return res.status(201).json({ message: 'Payment saved successfully', payment: saved });
  } catch (err) {
    console.error('Payment creation error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/v1/payments  — list all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.json(payments);
  } catch (err) {
    console.error('Payment fetch error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/v1/payments/history  — alias kept for backwards compatibility
router.get('/history', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.json(payments);
  } catch (err) {
    console.error('Payment history error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/v1/payments/:id  — delete a payment by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Payment not found' });
    return res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Payment delete error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
