import React, { useEffect, useRef, useState } from 'react';
import './Feedback.css';
import { useAuth } from '../Context/AuthContext';
import API from '../../utils/api';
import Nav from '../Nav/Nav';

// API endpoints
const FEEDBACK_ENDPOINT = '/api/v1/feedback';
const USER_ENDPOINT = '/api/v1/users';

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

// Star rating component
const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        
        return (
          <span
            key={index}
            className={`star ${ratingValue <= (hover || rating) ? "selected" : ""}`}
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            &#9733;
          </span>
        );
      })}
    </div>
  );
};

// Display stars for a specific rating
const RatingStars = ({ rating }) => {
  return (
    <div className="feedback-rating">
      {[...Array(5)].map((_, index) => (
        <span 
          key={index} 
          className={`star ${index < rating ? "selected" : ""}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
};

// Stats component to display feedback statistics
const FeedbackStats = ({ stats }) => {
  if (!stats || stats.length === 0) return null;
  
  return (
    <div className="stats-container">
      <h3 className="stats-title">Feedback Overview</h3>
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.targetType} className="stat-card">
            <div className="stat-header">
              <h4>{stat.targetType}</h4>
              <span className="stat-count">{stat.count} reviews</span>
            </div>
            <div className="stat-rating">
              <span className="avg-rating">{stat.avgRating.toFixed(1)}</span>
              <RatingStars rating={Math.round(stat.avgRating)} />
            </div>
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map(num => (
                <div key={num} className="rating-bar">
                  <span className="rating-label">{num} ★</span>
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ 
                        width: `${stat.ratings[num] / stat.count * 100}%`,
                        backgroundColor: num >= 4 ? '#27ae60' : num >= 3 ? '#f39c12' : '#e74c3c' 
                      }}
                    ></div>
                  </div>
                  <span className="rating-count">{stat.ratings[num]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Feedback() {
  const { auth } = useAuth();
  const successTimeoutRef = useRef(null);
  
  // All hooks must be called before any early return
  const getDefaultForm = () => ({
    targetType: 'FACILITY',
    targetId: '',
    rating: 5,
    comment: '',
    visibility: 'PUBLIC'
  });

  const [list, setList] = useState([]);
  const [users, setUsers] = useState({});
  const [form, setForm] = useState(getDefaultForm());
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState('create');
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    targetType: 'ALL',
    minRating: 1,
    maxRating: 5,
    visibility: 'ALL',
    createdBy: 'ALL'
  });
  const [sort, setSort] = useState('createdAt-desc');
  const [targets, setTargets] = useState({
    FACILITY: [],
    EVENT: [],
    STAFF: []
  });
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // All useEffect hooks must be called before any early return
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => { 
    load();
    loadTargetData();
  }, []);

  // Check if user is logged in (after all hooks are called)
  if (!auth || !auth._id) {
    return (
      <div className="feedback-container">
        <Nav />
        <div className="feedback-auth-required">
          <h2>Authentication Required</h2>
          <p>You must be logged in to submit feedback.</p>
          <button onClick={() => window.location.href = '/'} className="login-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const triggerSuccess = (message) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setSubmitSuccess(message);
    successTimeoutRef.current = setTimeout(() => setSubmitSuccess(null), 3500);
  };

  const resetForm = () => {
    setForm(getDefaultForm());
    setMode('create');
    setEditingId(null);
    setError(null);
  };

  const getCreatorId = (feedback) => {
    if (!feedback) return null;
    if (typeof feedback.createdBy === 'string') return feedback.createdBy;
    if (feedback.createdBy && typeof feedback.createdBy === 'object') {
      return normalizeId(feedback.createdBy);
    }
    return normalizeId(feedback.createdBy);
  };

  const isOwnFeedback = (feedback) => {
    const currentUserId = normalizeId(auth?.userId || auth?._id || auth?.id || auth?.user?._id);
    if (!currentUserId) return false;
    const feedbackOwnerId = normalizeId(getCreatorId(feedback));
    return feedbackOwnerId !== null && feedbackOwnerId === currentUserId;
  };

  const ensureTargetInList = (type, id, name) => {
    if (!type || !id) return;
    setTargets(prev => {
      const existing = prev[type] || [];
      if (existing.some(target => target._id === id)) {
        return prev;
      }
      return {
        ...prev,
        [type]: [...existing, { _id: id, name: name || 'Selected item' }]
      };
    });
  };

  // Get badge class based on target type
  const getTargetClass = (type) => {
    const classes = {
      'FACILITY': 'target-facility',
      'EVENT': 'target-event',
      'STAFF': 'target-staff'
    };
    return classes[type] || '';
  };
  
  // Format date from ISO string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Load target data based on type from respective APIs
  const loadTargetData = async () => {
    try {
      // Initialize with empty arrays
      const targetData = {
        FACILITY: [],
        EVENT: [],
        STAFF: []
      };
      
      // Fetch facilities (assuming there's a facilities endpoint)
      try {
        const { data: facilities } = await API.get('/api/v1/inventory');
        targetData.FACILITY = facilities.map(facility => ({
          _id: facility._id,
          name: facility.name || facility.itemName || 'Unknown Facility'
        }));
      } catch (error) {
        console.error('Failed to load facilities:', error);
        // Fallback to mock data if API fails
        targetData.FACILITY = [
          { _id: '60d21b4967d0d8992e610c85', name: 'Main Sports Arena' },
          { _id: '60d21b4967d0d8992e610c86', name: 'Swimming Pool Complex' },
          { _id: '60d21b4967d0d8992e610c87', name: 'Fitness Center' },
        ];
      }
      
      // Fetch events
      try {
        const { data: events } = await API.get('/api/v1/events');
        targetData.EVENT = events.map(event => ({
          _id: event._id,
          name: event.title || event.name || 'Unknown Event'
        }));
      } catch (error) {
        console.error('Failed to load events:', error);
        // Fallback to mock data if API fails
        targetData.EVENT = [
          { _id: '60d21b4967d0d8992e610c88', name: 'Annual Sports Tournament' },
          { _id: '60d21b4967d0d8992e610c89', name: 'Swimming Competition' },
          { _id: '60d21b4967d0d8992e610c8a', name: 'Marathon Event' },
        ];
      }
      
      // Fetch staff (users with staff role)
      try {
        const { data: users } = await API.get('/api/v1/users');
        targetData.STAFF = users
          .filter(user => user.role === 'STAFF' || user.role === 'ADMIN')
          .map(staff => ({
            _id: staff._id,
            name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email || 'Unknown Staff'
          }));
      } catch (error) {
        console.error('Failed to load staff:', error);
        // Fallback to mock data if API fails
        targetData.STAFF = [
          { _id: '60d21b4967d0d8992e610c8b', name: 'Coaching Staff' },
          { _id: '60d21b4967d0d8992e610c8c', name: 'Administration Team' },
          { _id: '60d21b4967d0d8992e610c8d', name: 'Maintenance Personnel' },
        ];
      }
      
      setTargets(targetData);
    } catch (error) {
      console.error('Failed to load target data:', error);
      
      // Fallback to mock data if something goes wrong
      setTargets({
        FACILITY: [
          { _id: '60d21b4967d0d8992e610c85', name: 'Main Sports Arena' },
          { _id: '60d21b4967d0d8992e610c86', name: 'Swimming Pool Complex' },
          { _id: '60d21b4967d0d8992e610c87', name: 'Fitness Center' },
        ],
        EVENT: [
          { _id: '60d21b4967d0d8992e610c88', name: 'Annual Sports Tournament' },
          { _id: '60d21b4967d0d8992e610c89', name: 'Swimming Competition' },
          { _id: '60d21b4967d0d8992e610c8a', name: 'Marathon Event' },
        ],
        STAFF: [
          { _id: '60d21b4967d0d8992e610c8b', name: 'Coaching Staff' },
          { _id: '60d21b4967d0d8992e610c8c', name: 'Administration Team' },
          { _id: '60d21b4967d0d8992e610c8d', name: 'Maintenance Personnel' },
        ]
      });
    }
  };

  // Load user data for displaying names in feedback
  const loadUserData = async (userIds) => {
    if (!userIds.length) return;
    
    try {
      // In a real implementation, we would fetch only needed users
      // Here we're fetching all and filtering client-side
      const { data } = await API.get(USER_ENDPOINT);
      
      const userMap = {};
      data.forEach(user => {
        userMap[user._id] = user;
      });
      
      setUsers(userMap);
    } catch (error) {
      console.error('Failed to load user data:', error.message || error);
    }
  };

  // Load feedback statistics
  const loadStats = async () => {
    try {
      const { data } = await API.get(`${FEEDBACK_ENDPOINT}/stats`);
      setStats(data || []);
    } catch (error) {
      console.error('Failed to load feedback stats:', error);
      // Non-critical, so don't set error state
    }
  };

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // API utility automatically handles authentication headers
      const { data } = await API.get(FEEDBACK_ENDPOINT);
      setList(data || []);
      
      // Extract unique user IDs for fetching user details
      const userIds = [...new Set(data.map(item => item.createdBy))];
      await loadUserData(userIds);
      
      // Load statistics
      await loadStats();
    } catch (error) {
      console.error('Failed to load feedback:', error);
      setError('Unable to load feedback. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    console.log('Validating form:', form);
    console.log('Available targets:', targets);
    
    if (!form.targetId) {
      setError('Please select a specific target');
      return false;
    }
    if (!form.comment.trim()) {
      setError('Please provide feedback comment');
      return false;
    }
    return true;
  };

  const handleEditFeedback = (feedback, targetName) => {
    if (!isOwnFeedback(feedback)) return;
    ensureTargetInList(feedback.targetType, feedback.targetId, targetName);
    setMode('edit');
    setEditingId(feedback._id);
    setForm({
      targetType: feedback.targetType,
      targetId: feedback.targetId,
      rating: feedback.rating,
      comment: feedback.comment || '',
      visibility: feedback.visibility || 'PUBLIC'
    });
    setError(null);
    setSubmitSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitFeedbackUpdate = async (feedbackId, updates) => {
    if (!feedbackId) throw new Error('Feedback ID is required for updates');
    const payload = {
      ...updates,
      updatedBy: auth?._id || auth?.userId,
      userRole: auth?.role
    };
    return API.patch(`${FEEDBACK_ENDPOINT}/${feedbackId}`, payload);
  };

  const submitFeedbackCreate = async () => {
    const payload = {
      ...form,
      comment: form.comment.trim(),
      createdBy: auth?._id || auth?.userId,
      userRole: auth?.role
    };
    return API.post(FEEDBACK_ENDPOINT, payload);
  };

  const submitFeedbackDelete = async (feedbackId) => {
    if (!feedbackId) throw new Error('Feedback ID is required for deletion');
    return API.delete(`${FEEDBACK_ENDPOINT}/${feedbackId}`, {
      data: {
        deletedBy: auth?._id || auth?.userId,
        userRole: auth?.role
      }
    });
  };

  const handleDeleteFeedback = async (feedback) => {
    if (!isOwnFeedback(feedback)) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this feedback?');
    if (!confirmDelete) return;

    try {
      await submitFeedbackDelete(feedback._id);
      if (editingId === feedback._id) {
        resetForm();
      }
      triggerSuccess('Feedback deleted successfully!');
      await load();
    } catch (error) {
      console.error('Failed to delete feedback:', error);
      setError(error.message || 'Failed to delete feedback. Please try again.');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    
    console.log('Submit clicked - auth:', auth);
    console.log('Submit clicked - form:', form);
    
    if (!validateForm()) return;
    
    if (!auth?._id && !auth?.userId) {
      setError('You must be logged in to submit feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && editingId) {
        await submitFeedbackUpdate(editingId, {
          rating: form.rating,
          comment: form.comment.trim(),
          visibility: form.visibility
        });
        triggerSuccess('Feedback updated successfully!');
      } else {
        await submitFeedbackCreate();
        triggerSuccess('Feedback submitted successfully!');
      }
      resetForm();
      await load();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format user name from user data
  const getUserName = (userId) => {
    if (!userId || !users[userId]) return 'Anonymous';
    const user = users[userId];
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Anonymous';
  };

  return (
    <div className="feedback-page">
      <Nav />
      <div className="feedback-content">
        <div className="feedback-header">
          <h2>Share Your Experience</h2>
        </div>
        
        {stats.length > 0 && <FeedbackStats stats={stats} />}
      
        <div className="feedback-container">
        {/* Form Section */}
        <div className="feedback-form-container">
          <h3 className="form-title">{mode === 'edit' ? 'Update Your Feedback' : 'Submit New Feedback'}</h3>

          {mode === 'edit' && (
            <div className="form-edit-alert">
              <span>You're editing an existing feedback entry. Update your rating or comments below.</span>
              <button
                type="button"
                className="btn btn-cancel"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel Edit
              </button>
            </div>
          )}
          
          <form className="feedback-form" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">What are you reviewing?</label>
              <select 
                className="select" 
                value={form.targetType} 
                onChange={e => setForm({ ...form, targetType: e.target.value, targetId: '' })}
                disabled={mode === 'edit'}
              >
                <option value="FACILITY">Sports Facility</option>
                <option value="EVENT">Sports Event</option>
                <option value="STAFF">Staff Member</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Select {form.targetType.toLowerCase()}</label>
              <select 
                className="select" 
                value={form.targetId} 
                onChange={e => setForm({ ...form, targetId: e.target.value })}
                required
                disabled={mode === 'edit'}
              >
                <option value="">-- Select {form.targetType.toLowerCase()} --</option>
                {targets[form.targetType]?.map(target => (
                  <option key={target._id} value={target._id}>
                    {target.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">How would you rate your experience?</label>
              <StarRating 
                rating={form.rating} 
                setRating={(value) => setForm({ ...form, rating: value })} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Your feedback</label>
              <textarea 
                className="textarea" 
                placeholder="Tell us about your experience..." 
                value={form.comment} 
                onChange={e => setForm({ ...form, comment: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select 
                className="select" 
                value={form.visibility} 
                onChange={e => setForm({ ...form, visibility: e.target.value })}
              >
                <option value="PUBLIC">Public - visible to everyone</option>
                <option value="PRIVATE">Private - visible only to staff</option>
              </select>
            </div>

            <div className="form-actions">
              {mode === 'edit' && (
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </button>
              )}
              <button 
                className="btn btn-primary" 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (mode === 'edit' ? 'Saving...' : 'Submitting...')
                  : (mode === 'edit' ? 'Save Changes' : 'Submit Feedback')}
              </button>
            </div>
            
            {submitSuccess && (
              <div className="success-message">
                {submitSuccess}
              </div>
            )}
            
            {error && (
              <div style={{ color: '#e74c3c', textAlign: 'center', padding: '10px' }}>
                {error}
              </div>
            )}
          </form>
        </div>
        
        {/* Feedback List Section */}
        <div className="feedback-list-container">
          <div className="list-title">
            Recent Feedback
            <span className="feedback-count">{list.length} entries</span>
          </div>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading feedback...</p>
            </div>
          ) : (
            <div className="feedback-list">
              {list.length > 0 ? (
                list.map(feedback => {
                  const targetName = targets[feedback.targetType]?.find(t => t._id === feedback.targetId)?.name || 'Unknown';
                  
                  return (
                    <div key={feedback._id} className="feedback-item">
                      <div className="feedback-header-row">
                        <span className={`feedback-target ${getTargetClass(feedback.targetType)}`}>
                          {feedback.targetType}: {targetName}
                        </span>
                        <span className="feedback-meta">
                          {formatDate(feedback.createdAt)}
                        </span>
                      </div>
                      
                      <div className="feedback-user">
                        By: {getUserName(feedback.createdBy)}
                      </div>
                      
                      <RatingStars rating={feedback.rating} />
                      
                      <div className="feedback-comment">
                        {feedback.comment}
                      </div>
                      
                      {feedback.visibility && (
                        <div className="feedback-visibility">
                          <span className={`visibility-badge ${feedback.visibility.toLowerCase()}`}>
                            {feedback.visibility}
                          </span>
                        </div>
                      )}

                      {isOwnFeedback(feedback) && (
                        <div className="feedback-actions">
                          <button
                            type="button"
                            className="feedback-action-btn edit"
                            onClick={() => handleEditFeedback(feedback, targetName)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="feedback-action-btn delete"
                            onClick={() => handleDeleteFeedback(feedback)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No feedback submissions yet. Be the first to share your experience!</p>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
