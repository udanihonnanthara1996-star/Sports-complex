import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Tickets.css';
import { useAuth } from '../Context/AuthContext';
import Nav from '../Nav/Nav';
import API from '../../utils/api';
import Popup from '../Common/Popup/Popup';

const TICKETS_ENDPOINT = '/api/v1/tickets';

const categories = [
  { value: 'FACILITY', label: '🏢 Facility Issues', description: 'Equipment, maintenance, or facility problems' },
  { value: 'EVENT', label: '🎯 Event Support', description: 'Event registration or participation issues' }
];

const priorities = [
  { value: 'LOW', label: '🟢 Low Priority', description: 'General questions, minor issues' },
  { value: 'MEDIUM', label: '🟡 Medium Priority', description: 'Standard support requests' },
  { value: 'HIGH', label: '🔴 High Priority', description: 'Urgent issues affecting service' }
];

const formatDisplayDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return value;
  }
};

const formatUserName = (user) => {
  if (!user) return 'Support Team';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (fullName) return fullName;
  if (user.email) return user.email;
  return 'Support Team';
};


// Component for creating new tickets
const CreateTicketForm = ({
  onTicketCreated,
  onTicketUpdated,
  onClose,
  mode = 'create',
  initialData = null,
  ticketId,
  onShowPopup
}) => {
  const { auth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Category options with emojis and descriptions
  const buildInitialForm = useCallback((data) => {
    const allowedCategories = categories.map(cat => cat.value);
    const mappedCategory = data && allowedCategories.includes(data.category)
      ? data.category
      : categories[0].value;

    return {
      subject: data?.subject || '',
      description: data?.description || '',
      category: mappedCategory,
      priority: data?.priority || 'MEDIUM'
    };
  }, []);

  const [form, setForm] = useState(buildInitialForm(initialData));

  const isEditMode = mode === 'edit';
  const headerTitle = isEditMode ? '✏️ Update Support Ticket' : '🎫 Create Support Ticket';
  const headerSubtitle = isEditMode
    ? 'Modify the details of your ticket below.'
    : "Tell us about your issue and we'll help you resolve it";
  const errorTitle = isEditMode ? 'Update Error' : 'Validation Error';
  const successTitle = isEditMode ? 'Ticket Updated Successfully!' : 'Ticket Created Successfully!';
  const successDescription = isEditMode
    ? 'Your changes have been saved.'
    : "We'll review your request and get back to you soon.";

  const notify = (config) => {
    if (typeof onShowPopup === 'function') {
      onShowPopup(config);
    }
  };

  useEffect(() => {
    setForm(buildInitialForm(initialData));
    setFieldErrors({});
    setError(null);
    setSuccess(false);
  }, [initialData, mode, buildInitialForm]);

  // Comprehensive form validation
  const validateField = (name, value) => {
    const errors = {};
    const valStr = value == null ? "" : (typeof value === "string" ? value : String(value));
    
    switch (name) {
      case 'subject':
        if (!valStr.trim()) {
          errors.subject = 'Subject is required';
        } else if (valStr.trim().length < 5) {
          errors.subject = 'Subject must be at least 5 characters';
        } else if (valStr.trim().length > 100) {
          errors.subject = 'Subject must be less than 100 characters';
        }
        break;
        
      case 'description':
        if (!valStr.trim()) {
          errors.description = 'Description is required';
        } else if (valStr.trim().length < 10) {
          errors.description = 'Please provide more details (at least 10 characters)';
        } else if (valStr.trim().length > 1000) {
          errors.description = 'Description must be less than 1000 characters';
        }
        break;
        
      case 'category':
        if (!value) {
          errors.category = 'Please select a category';
        }
        break;
        
      case 'priority':
        if (!value) {
          errors.priority = 'Please select a priority level';
        }
        break;
        
      default:
        break;
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form value
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Clear general error
    if (error) setError(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errors = validateField(name, value);
    
    setFieldErrors(prev => ({
      ...prev,
      ...errors
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate all fields
    Object.keys(form).forEach(field => {
      const fieldErrors = validateField(field, form[field]);
      Object.assign(errors, fieldErrors);
    });
    
    // Additional cross-field validation
    const allowedCategories = categories.map(cat => cat.value);
    if (!allowedCategories.includes(form.category)) {
      errors.category = 'Please select a valid category';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validate entire form
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const validationMessage = 'Please correct the highlighted fields and try again.';
      setError(validationMessage);
      notify({
        type: 'error',
        title: errorTitle,
        message: validationMessage
      });
      return;
    }
    
    setIsLoading(true);
    setFieldErrors({});

    try {
      if (!auth?.userId) {
        const loginMessage = 'You must be logged in to submit a ticket.';
        setError(loginMessage);
        notify({
          type: 'error',
          title: 'Authentication Required',
          message: loginMessage
        });
        setIsLoading(false);
        return;
      }

      // Prepare data with user ID and sanitized inputs
      const ticketData = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      };

      if (isEditMode && ticketId) {
        const payload = {
          ...ticketData,
          updatedBy: auth.userId
        };
        await API.patch(`${TICKETS_ENDPOINT}/${ticketId}`, payload);
        setSuccess(true);
        notify({
          type: 'success',
          title: successTitle,
          message: successDescription,
          autoClose: 1200,
          onAfterClose: () => {
            if (onTicketUpdated) {
              onTicketUpdated();
            }
            onClose();
          }
        });
      } else {
        const payload = {
          ...ticketData,
          createdBy: auth.userId
        };
        await API.post(TICKETS_ENDPOINT, payload);
        setSuccess(true);
        notify({
          type: 'success',
          title: successTitle,
          message: successDescription,
          autoClose: 1500,
          onAfterClose: () => {
            if (onTicketCreated) {
              onTicketCreated();
            }
            onClose();
          }
        });
      }
      
    } catch (err) {
      console.error('Error saving ticket:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save ticket';
      setError(errorMessage);
      notify({
        type: 'error',
        title: errorTitle,
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-ticket-form">
      <div className="form-header">
        <h3>{headerTitle}</h3>
        <p>{headerSubtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="ticket-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              📝 Subject *
              <span className="char-count">{form.subject.length}/100</span>
            </label>
            <input 
              type="text"
              name="subject"
              className={`input ${fieldErrors.subject ? 'input-error' : ''}`}
              placeholder="Brief, clear description of your issue"
              value={form.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={100}
              required
            />
            {fieldErrors.subject && (
              <div className="field-error">
                <span className="error-icon">❌</span>
                {fieldErrors.subject}
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">📂 Category *</label>
            <select 
              name="category"
              className={`select ${fieldErrors.category ? 'input-error' : ''}`}
              value={form.category}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="field-help">
              {categories.find(c => c.value === form.category)?.description}
            </div>
            {fieldErrors.category && (
              <div className="field-error">
                <span className="error-icon">❌</span>
                {fieldErrors.category}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">⚡ Priority Level *</label>
            <select 
              name="priority"
              className={`select ${fieldErrors.priority ? 'input-error' : ''}`}
              value={form.priority}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            <div className="field-help">
              {priorities.find(p => p.value === form.priority)?.description}
            </div>
            {fieldErrors.priority && (
              <div className="field-error">
                <span className="error-icon">❌</span>
                {fieldErrors.priority}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              📄 Description *
              <span className="char-count">{form.description.length}/1000</span>
            </label>
            <textarea 
              name="description"
              className={`textarea ${fieldErrors.description ? 'input-error' : ''}`}
              placeholder="Please provide detailed information about your issue. Include steps to reproduce, error messages, or any other relevant details."
              rows="6"
              value={form.description}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={1000}
              required
            />
            {fieldErrors.description && (
              <div className="field-error">
                <span className="error-icon">❌</span>
                {fieldErrors.description}
              </div>
            )}
          </div>
        </div>

        <div className="form-footer">
          <div className="form-info">
            <span className="info-icon">💡</span>
            <span>Fields marked with * are required</span>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-cancel" 
              onClick={onClose}
              disabled={isLoading}
            >
              ✖️ Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : success ? (
                isEditMode ? '💾 Saved!' : '✅ Created!'
              ) : (
                isEditMode ? '💾 Save Changes' : '🚀 Create Ticket'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Component for displaying a single ticket
const TicketItem = ({
  ticket,
  isUserTicket,
  onEdit,
  onDelete,
  commentCount = 0,
  conversation = null,
  canModify = true,
  modifyDisabledReason = ''
}) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'IN_PROGRESS': return 'status-progress';
      case 'RESOLVED': return 'status-resolved';
      case 'CLOSED': return 'status-closed';
      default: return '';
    }
  };
  
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className={`ticket-item ${isUserTicket ? 'my-ticket' : ''}`}>
      <div className="ticket-header">
        <h3 className="ticket-title">{ticket.subject}</h3>
        <div className="ticket-meta">
          <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
            {ticket.status}
          </span>
          <span className={`ticket-priority ${getPriorityClass(ticket.priority)}`}>
            {ticket.priority}
          </span>
        </div>
      </div>
      
      <div className="ticket-category">
        <span className="category-label">{ticket.category}</span>
        <span className="ticket-date">{formatDisplayDate(ticket.createdAt)}</span>
      </div>
      
      {ticket.description && (
        <div className="ticket-description">
          {ticket.description}
        </div>
      )}
      
      {commentCount > 0 && (
        <div className="ticket-comments-count">
          {commentCount} {commentCount === 1 ? 'response' : 'responses'}
        </div>
      )}

      <div className="ticket-actions">
        <button
          type="button"
          className="btn btn-small btn-edit"
          onClick={() => onEdit?.(ticket)}
          disabled={!canModify}
          title={!canModify && modifyDisabledReason ? modifyDisabledReason : undefined}
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          className="btn btn-small btn-delete"
          onClick={() => onDelete?.(ticket)}
          disabled={!canModify}
          title={!canModify && modifyDisabledReason ? modifyDisabledReason : undefined}
        >
          🗑️ Delete
        </button>
      </div>

      {!canModify && modifyDisabledReason && (
        <div className="ticket-actions-disabled">
          {modifyDisabledReason}
        </div>
      )}

      {conversation}
    </div>
  );
};

const TicketConversation = ({
  ticket,
  conversation,
  onReload,
  currentUserId,
  replyValue = '',
  onReplyChange,
  onSubmit,
  isSubmitting = false
}) => {
  const loading = conversation?.loading;
  const error = conversation?.error;
  const comments = conversation?.comments || [];
  const hasComments = comments.length > 0;
  const isClosed = ticket.status === 'CLOSED';
  const canReply = !isClosed;
  const trimmedReply = replyValue.trim();

  return (
    <div className="ticket-conversation">
      <div className="conversation-header">
        <div>
          <h4 className="conversation-title">Conversation</h4>
          <p className="conversation-subtitle">All replies between you and the support team appear below.</p>
        </div>
        <div className="conversation-header-actions">
          <button
            type="button"
            className="btn btn-small btn-refresh"
            onClick={() => onReload?.()}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div className="conversation-meta">
        <div className="conversation-stat">
          <span className="conversation-label">Status</span>
          <span className="conversation-value">{ticket.status}</span>
        </div>
        <div className="conversation-stat">
          <span className="conversation-label">Priority</span>
          <span className="conversation-value">{ticket.priority}</span>
        </div>
        <div className="conversation-stat">
          <span className="conversation-label">Last Updated</span>
          <span className="conversation-value">{formatDisplayDate(ticket.updatedAt || ticket.createdAt)}</span>
        </div>
      </div>

      <div className="conversation-body">
        {loading && (
          <div className="conversation-loading">
            <span className="spinner"></span>
            Loading conversation…
          </div>
        )}

        {!loading && error && (
          <div className="conversation-error">
            <p>{error}</p>
            <button type="button" className="btn btn-small btn-secondary" onClick={() => onReload?.()}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && hasComments && (
          <ul className="conversation-list">
            {comments.map((comment) => {
              const role = comment?.author?.role ? comment.author.role.toUpperCase() : '';
              const isStaff = role === 'ADMIN' || role === 'STAFF';
              const isOwner = comment?.author?._id && currentUserId && comment.author._id === currentUserId;
              const badgeLabel = isOwner ? 'You' : isStaff ? 'Support' : 'Member';

              return (
                <li key={comment._id} className={`conversation-item ${isStaff ? 'staff' : 'member'}`}>
                  <div className="conversation-item-header">
                    <span className="conversation-author">
                      {formatUserName(comment.author)}
                      <span className="conversation-badge">{badgeLabel}</span>
                    </span>
                    <span className="conversation-time">{formatDisplayDate(comment.createdAt)}</span>
                  </div>
                  <p className="conversation-message">{comment.message}</p>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && !hasComments && (
          <div className="conversation-empty">
            <h5>No replies yet</h5>
            <p>Updates from the support team will appear here.</p>
          </div>
        )}
      </div>

      <form
        className="conversation-reply"
        onSubmit={(event) => {
          event.preventDefault();
          if (canReply) {
            onSubmit?.();
          }
        }}
      >
        <label className="conversation-reply-label" htmlFor={`reply-${ticket._id}`}>
          Share an update
        </label>
        <textarea
          id={`reply-${ticket._id}`}
          className="conversation-reply-textarea"
          placeholder={canReply ? 'Type your message to the support team…' : 'This ticket is closed and no longer accepts new replies.'}
          value={replyValue}
          onChange={(event) => onReplyChange?.(event.target.value)}
          disabled={!canReply || isSubmitting}
          rows={4}
        />
        <div className="conversation-reply-actions">
          <button
            type="submit"
            className="btn btn-small btn-primary conversation-reply-submit"
            disabled={!canReply || isSubmitting || trimmedReply.length === 0}
          >
            {isSubmitting ? 'Sending…' : 'Send reply'}
          </button>
          {isClosed && (
            <span className="conversation-reply-note">Closed tickets cannot receive new updates.</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default function Tickets() {
  const { auth } = useAuth();
  const [myTickets, setMyTickets] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [popup, setPopup] = useState(null);
  const popupConfigRef = useRef(null);
  const conversationCacheRef = useRef({});
  const [conversationState, setConversationState] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySending, setReplySending] = useState({});
  const userRole = auth?.role ? auth.role.toUpperCase() : 'MEMBER';
  const userId = auth?.userId || null;

  const showPopup = useCallback((config = {}) => {
    const configWithDefaults = {
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      actions: config.actions || null,
      autoClose: config.autoClose,
      onAfterClose: config.onAfterClose
    };

    popupConfigRef.current = configWithDefaults;
    setPopup(configWithDefaults);
  }, []);

  const closePopup = useCallback(() => {
    const current = popupConfigRef.current;
    setPopup(null);
    popupConfigRef.current = null;

    if (typeof current?.onAfterClose === 'function') {
      current.onAfterClose();
    }
  }, []);

  useEffect(() => {
    if (!popup || !popup.autoClose) {
      return undefined;
    }

    const timer = setTimeout(() => {
      closePopup();
    }, popup.autoClose);

    return () => clearTimeout(timer);
  }, [popup, closePopup]);

  const loadMyTickets = useCallback(async () => {
    try {
      if (!userId) return;
      const { data } = await API.get(`${TICKETS_ENDPOINT}/user/${userId}`);
      setMyTickets(data.items || []);
    } catch (error) {
      console.error('Error loading my tickets:', error);
    }
  }, [userId]);

  const loadStats = useCallback(async () => {
    try {
      if (!userId) return;
      const { data } = await API.get(`${TICKETS_ENDPOINT}/stats/overview`, {
        params: { userId, userRole: 'MEMBER' }
      });
      setStats(data || { open: 0, inProgress: 0, resolved: 0, closed: 0 });
    } catch (error) {
      console.error('Error loading ticket stats:', error);
      setStats({ open: 0, inProgress: 0, resolved: 0, closed: 0 });
    }
  }, [userId]);

  const fetchCommentsForTicket = useCallback(async (ticketId, { force = false } = {}) => {
    if (!ticketId || !userId) return;

    if (!force && conversationCacheRef.current[ticketId]) {
      setConversationState((prev) => ({
        ...prev,
        [ticketId]: {
          loading: false,
          error: null,
          comments: conversationCacheRef.current[ticketId]
        }
      }));
      return;
    }

    setConversationState((prev) => ({
      ...prev,
      [ticketId]: {
        loading: true,
        error: null,
        comments: prev[ticketId]?.comments || []
      }
    }));

    try {
      const { data } = await API.get(`${TICKETS_ENDPOINT}/${ticketId}/comments`, {
        params: { userRole, userId }
      });
      const safeData = Array.isArray(data) ? data : [];
      conversationCacheRef.current[ticketId] = safeData;
      setConversationState((prev) => ({
        ...prev,
        [ticketId]: {
          loading: false,
          error: null,
          comments: safeData
        }
      }));
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to load conversation.';
      setConversationState((prev) => ({
        ...prev,
        [ticketId]: {
          loading: false,
          error: message,
          comments: prev[ticketId]?.comments || []
        }
      }));
    }
  }, [userId, userRole]);

  const handleReplyDraftChange = useCallback((ticketId, value) => {
    setReplyDrafts((prev) => ({
      ...prev,
      [ticketId]: value
    }));
  }, []);

  const handleSubmitReply = useCallback(async (ticketId) => {
    if (!ticketId) return;
    if (!userId) {
      showPopup({
        type: 'error',
        title: 'Authentication required',
        message: 'Please sign in again to reply to this ticket.'
      });
      return;
    }

    const draft = (replyDrafts[ticketId] || '').trim();
    if (!draft) {
      showPopup({
        type: 'warning',
        title: 'Reply required',
        message: 'Enter a message before sending your reply.'
      });
      return;
    }

    setReplySending((prev) => ({ ...prev, [ticketId]: true }));

    try {
      await API.post(`${TICKETS_ENDPOINT}/${ticketId}/comments`, {
        message: draft,
        author: userId,
        internal: false
      });

      setReplyDrafts((prev) => ({
        ...prev,
        [ticketId]: ''
      }));

      showPopup({
        type: 'success',
        title: 'Reply sent',
        message: 'Your message has been shared with the support team.',
        autoClose: 1600
      });

      await fetchCommentsForTicket(ticketId, { force: true });
      await loadStats();
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Unable to send reply. Please try again.';
      showPopup({
        type: 'error',
        title: 'Send failed',
        message
      });
    } finally {
      setReplySending((prev) => ({
        ...prev,
        [ticketId]: false
      }));
    }
  }, [fetchCommentsForTicket, loadStats, replyDrafts, showPopup, userId]);

  const reloadTicketData = useCallback(() => {
    loadMyTickets();
    loadStats();
  }, [loadMyTickets, loadStats]);

  const handleTicketCreated = () => {
    reloadTicketData();
  };

  const handleTicketUpdated = () => {
    reloadTicketData();
    setEditingTicket(null);
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setShowCreateForm(false);
  };

  const handleDeleteTicket = async (ticket) => {
    if (!ticket?._id) return;
    const confirmed = window.confirm('Are you sure you want to delete this ticket?');
    if (!confirmed) return;

    try {
      await API.delete(`${TICKETS_ENDPOINT}/${ticket._id}`, {
        data: { deletedBy: auth.userId }
      });
      setConversationState((prev) => {
        const next = { ...prev };
        delete next[ticket._id];
        return next;
      });
      delete conversationCacheRef.current[ticket._id];
      if (editingTicket?._id === ticket._id) {
        setEditingTicket(null);
      }
      reloadTicketData();
      showPopup({
        type: 'success',
        title: 'Ticket deleted',
        message: 'Your support request has been removed.',
        autoClose: 1400
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      const message = error.response?.data?.error || error.message || 'Failed to delete ticket. Please try again.';
      showPopup({
        type: 'error',
        title: 'Delete failed',
        message
      });
    }
  };
  
  useEffect(() => {
    loadMyTickets();
    loadStats();
  }, [loadMyTickets, loadStats]);

  useEffect(() => {
    if (!userId || !myTickets || myTickets.length === 0) {
      return;
    }

    myTickets.forEach((ticket) => {
      if (ticket?._id) {
        fetchCommentsForTicket(ticket._id);
      }
    });
  }, [myTickets, fetchCommentsForTicket, userId]);

  return (
    <div className="tickets-page">
      {popup && (
        <Popup
          open={Boolean(popup)}
          type={popup.type}
          title={popup.title}
          message={popup.message}
          actions={popup.actions || undefined}
          onClose={closePopup}
        />
      )}

      <Nav/>
      <div className="tickets-content">
        <div className="tickets-header">
          <h2>Support & Tickets</h2>
        </div>
        
        <div className="tickets-actions">
          <button 
            className={`btn ${showCreateForm ? 'secondary' : 'primary'}`} 
            onClick={() => {
              if (editingTicket) {
                setEditingTicket(null);
              }
              setShowCreateForm(prev => !prev);
            }}
          >
            {showCreateForm ? '✖️ Cancel' : '🎫 Create New Ticket'}
          </button>
        </div>

        {/* Ticket Creation Form */}
        {(showCreateForm || editingTicket) && (
          <div className="create-ticket-container">
            <CreateTicketForm 
              key={editingTicket ? editingTicket._id : 'create-ticket'}
              onTicketCreated={handleTicketCreated} 
              onTicketUpdated={handleTicketUpdated}
              onClose={() => {
                if (editingTicket) {
                  setEditingTicket(null);
                } else {
                  setShowCreateForm(false);
                }
              }} 
              mode={editingTicket ? 'edit' : 'create'}
              initialData={editingTicket}
              ticketId={editingTicket?._id}
              onShowPopup={showPopup}
            />
          </div>
        )}
        
        {/* My Ticket Stats */}
        <div className="stat-bar">
          <div className="stat">📋 Open: {stats.open || 0}</div>
          <div className="stat">⏳ In Progress: {stats.inProgress || 0}</div>
          <div className="stat">✅ Resolved: {stats.resolved || 0}</div>
          <div className="stat">🔒 Closed: {stats.closed || 0}</div>
        </div>
        
        {/* My Tickets Section Header */}
        <div className="my-tickets-header">
          <h3>📋 My Support Tickets</h3>
          <p>Track and manage your support requests</p>
        </div>
        
        {/* My Tickets List */}
        <div className="ticket-list">
          {myTickets.length > 0 ? (
            myTickets.map(ticket => {
              const conversation = conversationState[ticket._id] || { loading: false, error: null, comments: [] };
              const commentCount = conversation?.comments?.length || 0;
              const resolvedStatuses = ['RESOLVED', 'CLOSED'];

              const commentsArray = Array.isArray(conversation?.comments) ? conversation.comments : [];
              const sortedComments = commentsArray.slice().sort((a, b) => {
                const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                return aTime - bTime;
              });
              let latestComment = null;
              for (let index = sortedComments.length - 1; index >= 0; index -= 1) {
                const current = sortedComments[index];
                if (!current?.internal) {
                  latestComment = current;
                  break;
                }
              }
              const latestAuthorRaw = latestComment?.author;
              let latestAuthorRole = '';
              let latestAuthorId = null;

              if (latestAuthorRaw && typeof latestAuthorRaw === 'object') {
                if (typeof latestAuthorRaw.role === 'string') {
                  latestAuthorRole = latestAuthorRaw.role.toUpperCase();
                }
                latestAuthorId = latestAuthorRaw._id || latestAuthorRaw.id || null;
              } else if (typeof latestAuthorRaw === 'string') {
                latestAuthorId = latestAuthorRaw;
              }

              if (!latestAuthorRole && typeof latestComment?.authorRole === 'string') {
                latestAuthorRole = latestComment.authorRole.toUpperCase();
              }

              if (!latestAuthorId && latestComment?.authorId) {
                latestAuthorId = latestComment.authorId;
              }
              const latestResponderIsStaff = latestAuthorRole === 'ADMIN' || latestAuthorRole === 'STAFF';
              const latestResponderIsCurrentUser = latestAuthorId && userId ? latestAuthorId.toString() === userId.toString() : false;

              let modifyDisabledReason = '';

              if (resolvedStatuses.includes(ticket.status)) {
                modifyDisabledReason = 'Tickets that are resolved or closed cannot be edited or deleted.';
              } else if (!conversation?.loading && sortedComments.length > 0 && latestResponderIsStaff) {
                modifyDisabledReason = 'Support has already replied to your most recent update, so editing this ticket is locked.';
              }

              const canModifyTicket = modifyDisabledReason === '' || (sortedComments.length > 0 && latestResponderIsCurrentUser && !resolvedStatuses.includes(ticket.status));

              if (canModifyTicket && modifyDisabledReason) {
                modifyDisabledReason = '';
              }

              return (
                <TicketItem 
                  key={ticket._id} 
                  ticket={ticket} 
                  isUserTicket={true}
                  onEdit={handleEditTicket}
                  onDelete={handleDeleteTicket}
                  commentCount={commentCount}
                  canModify={canModifyTicket}
                  modifyDisabledReason={modifyDisabledReason}
                  conversation={
                    <TicketConversation
                      ticket={ticket}
                      conversation={conversation}
                      onReload={() => fetchCommentsForTicket(ticket._id, { force: true })}
                      currentUserId={userId}
                      replyValue={replyDrafts[ticket._id] || ''}
                      onReplyChange={(value) => handleReplyDraftChange(ticket._id, value)}
                      onSubmit={() => handleSubmitReply(ticket._id)}
                      isSubmitting={Boolean(replySending[ticket._id])}
                    />
                  }
                />
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h4>No Support Tickets Yet</h4>
              <p>You haven't created any tickets yet. Click "Create New Ticket" above to get started with your first support request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
