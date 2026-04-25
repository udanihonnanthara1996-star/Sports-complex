const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  getUserMembership,
  getMyMembership,
  checkMembershipStatus,
  cancelMembership,
  getAllMemberships,
} = require('../Controllers/membershipController');

// ── Plan Routes ────────────────────────────────────
// GET  /api/v1/memberships/plans         — public: list all active plans
router.get('/plans', getAllPlans);

// POST /api/v1/memberships/plans         — admin: create a plan
router.post('/plans', auth, auth.adminOnly, createPlan);

// PUT  /api/v1/memberships/plans/:id     — admin: update a plan
router.put('/plans/:id', auth, auth.adminOnly, updatePlan);

// DELETE /api/v1/memberships/plans/:id   — admin: deactivate a plan
router.delete('/plans/:id', auth, auth.adminOnly, deletePlan);

// ── User Membership Routes ─────────────────────────
// POST /api/v1/memberships/subscribe     — subscribe (after payment)
router.post('/subscribe', auth, subscribeToPlan);

// GET  /api/v1/memberships/my            — get own active membership
router.get('/my', auth, getMyMembership);

// GET  /api/v1/memberships/check-status  — check discount for booking
router.get('/check-status', auth, checkMembershipStatus);

// PATCH /api/v1/memberships/cancel       — cancel own membership
router.patch('/cancel', auth, cancelMembership);

// GET  /api/v1/memberships/user/:id      — get specific user's membership
router.get('/user/:id', auth, getUserMembership);

// GET  /api/v1/memberships/all           — admin: all memberships
router.get('/all', auth, auth.adminOnly, getAllMemberships);

module.exports = router;
