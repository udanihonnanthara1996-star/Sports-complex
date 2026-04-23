// Enhanced Feedback controller
const Feedback = require('../Model/Feedback');
const mongoose = require('mongoose');

const ADMIN_ROLES = ['ADMIN', 'STAFF'];

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') {
    if (value._id) return value._id.toString();
    if (value.id) return value.id.toString();
  }
  try {
    return value.toString();
  } catch (error) {
    return null;
  }
};

const resolveRequesterContext = (req) => {
  const context = {
    id: null,
    isAdmin: false
  };

  const potentialIds = [
    req?.user?._id,
    req?.body?.updatedBy,
    req?.body?.deletedBy,
    req?.body?.userId,
    req?.body?.createdBy,
    req?.query?.userId,
    req?.params?.userId
  ];

  for (const candidate of potentialIds) {
    if (!context.id) {
      const normalized = normalizeId(candidate);
      if (normalized) {
        context.id = normalized;
      }
    }
  }

  const potentialRoles = [
    req?.user?.role,
    req?.body?.userRole,
    req?.query?.userRole
  ];

  for (const candidate of potentialRoles) {
    if (candidate && ADMIN_ROLES.includes(candidate.toString().toUpperCase())) {
      context.isAdmin = true;
      break;
    }
  }

  if (req?.user?.isAdmin) {
    context.isAdmin = true;
  }

  return context;
};

// Create feedback (enhanced with validation)
exports.createFeedback = async (req, res) => {
  try {
    // Get user from auth middleware or request body
    if (!req.body.createdBy && req.user && req.user._id) {
      req.body.createdBy = req.user._id;
    }
    
    // Validate required fields
    if (!req.body.createdBy) {
      return res.status(400).json({ error: 'createdBy is required (user id)' });
    }
    
    if (!req.body.targetType || !['FACILITY', 'EVENT', 'STAFF'].includes(req.body.targetType)) {
      return res.status(400).json({ error: 'Valid targetType is required (FACILITY, EVENT, STAFF)' });
    }
    
    if (!req.body.targetId || !mongoose.Types.ObjectId.isValid(req.body.targetId)) {
      return res.status(400).json({ error: 'Valid targetId is required (ObjectId)' });
    }
    
    if (!req.body.rating || req.body.rating < 1 || req.body.rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Create and save feedback
    const feedback = new Feedback(req.body);
    await feedback.save();
    
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all feedbacks with filtering and sorting options
exports.getFeedbacks = async (req, res) => {
  try {
    const { 
      targetType, 
      targetId, 
      minRating, 
      maxRating, 
      visibility,
      createdBy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50 
    } = req.query;
    
    // Build filter query
    const query = { isDeleted: false };
    
    // Apply filters if provided
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (createdBy) query.createdBy = createdBy;
    if (visibility) query.visibility = visibility;
    
    // Rating range filter
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = Number(minRating);
      if (maxRating) query.rating.$lte = Number(maxRating);
    }
    
    // Determine sort direction
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with population
    const feedbacks = await Feedback.find(query)
      .sort(sort)
      .limit(Number(limit))
      .populate('createdBy', 'firstName lastName email');
      
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const feedback = await Feedback.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('targetId', 'name title itemName firstName lastName', null, { path: req.body.targetType.toLowerCase() });
    
    if (!feedback || feedback.isDeleted) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update feedback
exports.updateFeedback = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback || feedback.isDeleted) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    const requester = resolveRequesterContext(req);

    if (!requester.id) {
      return res.status(401).json({ error: 'Authentication required to update feedback' });
    }

    // Check if user is the author or admin
    if (!requester.isAdmin && feedback.createdBy.toString() !== requester.id) {
      return res.status(403).json({ error: 'Not authorized to update this feedback' });
    }
    
    // Fields that can be updated
    const updateableFields = ['rating', 'comment', 'visibility', 'status'];
    
    // Update only allowed fields
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        feedback[field] = req.body[field];
      }
    });
    
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete feedback (soft delete)
exports.deleteFeedback = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback || feedback.isDeleted) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    const requester = resolveRequesterContext(req);

    if (!requester.id) {
      return res.status(401).json({ error: 'Authentication required to delete this feedback' });
    }

    // Check if user is the author or admin
    if (!requester.isAdmin && feedback.createdBy.toString() !== requester.id) {
      return res.status(403).json({ error: 'Not authorized to delete this feedback' });
    }
    
    // Soft delete
    feedback.isDeleted = true;
    await feedback.save();
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get feedback statistics
exports.getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
        _id: '$targetType',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        ratingsDistribution: {
          $push: '$rating'
        }
      }},
      { $project: {
        _id: 0,
        targetType: '$_id',
        count: 1,
        avgRating: 1,
        ratings: {
          '1': { $size: { $filter: { input: '$ratingsDistribution', as: 'r', cond: { $eq: ['$$r', 1] } } } },
          '2': { $size: { $filter: { input: '$ratingsDistribution', as: 'r', cond: { $eq: ['$$r', 2] } } } },
          '3': { $size: { $filter: { input: '$ratingsDistribution', as: 'r', cond: { $eq: ['$$r', 3] } } } },
          '4': { $size: { $filter: { input: '$ratingsDistribution', as: 'r', cond: { $eq: ['$$r', 4] } } } },
          '5': { $size: { $filter: { input: '$ratingsDistribution', as: 'r', cond: { $eq: ['$$r', 5] } } } }
        }
      }}
    ]);
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
