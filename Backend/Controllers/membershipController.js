const MembershipPlan = require('../Model/MembershipPlan');
const UserMembership = require('../Model/UserMembership');

// ─────────────────────────────────────────────────
// PLAN CONTROLLERS
// ─────────────────────────────────────────────────

/**
 * POST /api/v1/memberships/plans
 * Admin only — create a new membership plan
 */
exports.createPlan = async (req, res) => {
  try {
    const { name, price, duration, benefits, discountPercentage } = req.body;

    if (!name || !price || !duration) {
      return res
        .status(400)
        .json({ message: 'Name, price, and duration are required.' });
    }

    const existing = await MembershipPlan.findOne({ name });
    if (existing) {
      return res
        .status(409)
        .json({ message: `A plan named "${name}" already exists.` });
    }

    const plan = await MembershipPlan.create({
      name,
      price,
      duration,
      benefits: benefits || [],
      discountPercentage: discountPercentage || 0,
    });

    res.status(201).json({ message: 'Plan created successfully', plan });
  } catch (err) {
    console.error('createPlan error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/v1/memberships/plans
 * Public — get all active membership plans
 */
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({
      price: 1,
    });
    res.json({ plans });
  } catch (err) {
    console.error('getAllPlans error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * PUT /api/v1/memberships/plans/:id
 * Admin only — update a membership plan
 */
exports.updatePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan updated', plan });
  } catch (err) {
    console.error('updatePlan error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * DELETE /api/v1/memberships/plans/:id
 * Admin only — soft-delete (deactivate) a plan
 */
exports.deletePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deactivated', plan });
  } catch (err) {
    console.error('deletePlan error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────
// USER MEMBERSHIP CONTROLLERS
// ─────────────────────────────────────────────────

/**
 * POST /api/v1/memberships/subscribe
 * Authenticated user — subscribe to a plan (called after successful payment)
 */
exports.subscribeToPlan = async (req, res) => {
  try {
    const { planId, paymentId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!planId) {
      return res.status(400).json({ message: 'planId is required.' });
    }

    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res
        .status(404)
        .json({ message: 'Membership plan not found or inactive.' });
    }

    // Cancel any existing ACTIVE membership for this user
    await UserMembership.updateMany(
      { userId, status: 'ACTIVE' },
      { status: 'CANCELLED' }
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const membership = await UserMembership.create({
      userId,
      planId,
      startDate,
      endDate,
      status: 'ACTIVE',
      paymentId: paymentId || null,
      planSnapshot: {
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        discountPercentage: plan.discountPercentage,
      },
    });

    const populated = await UserMembership.findById(membership._id).populate(
      'planId',
      'name price duration benefits discountPercentage'
    );

    res.status(201).json({
      message: `Successfully subscribed to ${plan.name} plan!`,
      membership: populated,
    });
  } catch (err) {
    console.error('subscribeToPlan error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/v1/memberships/user/:id
 * Get a specific user's active membership (admin can check any; user can only check own)
 */
exports.getUserMembership = async (req, res) => {
  try {
    const requestedUserId = req.params.id;
    const requestingUserId = req.user._id?.toString() || req.user.id?.toString();

    // Non-admins can only see their own membership
    if (req.user.role !== 'admin' && requestedUserId !== requestingUserId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let membership = await UserMembership.findOne({
      userId: requestedUserId,
      status: 'ACTIVE',
    }).populate('planId', 'name price duration benefits discountPercentage');

    if (!membership) {
      // Also check for most recent expired/cancelled
      membership = await UserMembership.findOne({ userId: requestedUserId })
        .sort({ createdAt: -1 })
        .populate('planId', 'name price duration benefits discountPercentage');
    }

    if (!membership) {
      return res.status(404).json({ message: 'No membership found for this user.' });
    }

    // Auto-expire if endDate passed
    await membership.checkAndUpdateStatus();

    res.json({ membership });
  } catch (err) {
    console.error('getUserMembership error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/v1/memberships/my
 * Authenticated user — get their own membership (convenience endpoint)
 */
exports.getMyMembership = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    let membership = await UserMembership.findOne({
      userId,
      status: 'ACTIVE',
    }).populate('planId', 'name price duration benefits discountPercentage');

    if (membership) {
      await membership.checkAndUpdateStatus();
      // Reload after potential status update
      membership = await UserMembership.findOne({
        userId,
        status: 'ACTIVE',
      }).populate('planId', 'name price duration benefits discountPercentage');
    }

    if (!membership) {
      return res.json({ membership: null, hasActiveMembership: false });
    }

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(membership.endDate) - now) / (1000 * 60 * 60 * 24))
    );

    res.json({
      membership,
      hasActiveMembership: true,
      daysRemaining,
      expiringSoon: daysRemaining <= 7,
    });
  } catch (err) {
    console.error('getMyMembership error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/v1/memberships/check-status
 * Authenticated — check if calling user has active membership and return discount info
 * Used by booking module before calculating price
 */
exports.checkMembershipStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const membership = await UserMembership.findOne({
      userId,
      status: 'ACTIVE',
    }).populate('planId', 'name discountPercentage');

    if (!membership) {
      return res.json({
        hasActiveMembership: false,
        discountPercentage: 0,
        planName: null,
      });
    }

    // Auto-expire check
    if (new Date() > membership.endDate) {
      membership.status = 'EXPIRED';
      await membership.save();
      return res.json({
        hasActiveMembership: false,
        discountPercentage: 0,
        planName: null,
      });
    }

    const discount = membership.planId?.discountPercentage || 0;
    res.json({
      hasActiveMembership: true,
      discountPercentage: discount,
      planName: membership.planId?.name || membership.planSnapshot?.name,
      endDate: membership.endDate,
    });
  } catch (err) {
    console.error('checkMembershipStatus error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * PATCH /api/v1/memberships/cancel
 * Authenticated user — cancel their own active membership
 */
exports.cancelMembership = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const membership = await UserMembership.findOneAndUpdate(
      { userId, status: 'ACTIVE' },
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!membership) {
      return res.status(404).json({ message: 'No active membership found.' });
    }

    res.json({ message: 'Membership cancelled successfully.', membership });
  } catch (err) {
    console.error('cancelMembership error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/v1/memberships/all  (Admin only)
 * Get all memberships across all users
 */
exports.getAllMemberships = async (req, res) => {
  try {
    const memberships = await UserMembership.find()
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name price discountPercentage')
      .sort({ createdAt: -1 });

    res.json({ memberships });
  } catch (err) {
    console.error('getAllMemberships error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
