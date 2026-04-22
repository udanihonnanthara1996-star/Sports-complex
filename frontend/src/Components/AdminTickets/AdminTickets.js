import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminTickets.css';
import AdminNav from '../Admin/AdminNav';
import { useAuth } from '../Context/AuthContext';
import API from '../../utils/api';
import Popup from '../Common/Popup/Popup';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar
} from 'recharts';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' }
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' }
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'FACILITY', label: 'Facility' },
  { value: 'EVENT', label: 'Event' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'BOOKING', label: 'Booking' },
  { value: 'OTHER', label: 'Other' }
];

const STATUS_COLORS = {
  PENDING: '#ff9800',
  IN_PROGRESS: '#2196f3',
  RESOLVED: '#4caf50',
  CLOSED: '#6b7280'
};

const PRIORITY_COLORS = {
  LOW: '#9c27b0',
  MEDIUM: '#03a9f4',
  HIGH: '#ef4444'
};

const formatStatus = (value) => STATUS_OPTIONS.find((option) => option.value === value)?.label || value || 'Unknown';
const formatPriority = (value) => PRIORITY_OPTIONS.find((option) => option.value === value)?.label || value || 'Unknown';
const formatCategory = (value) => CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value || 'Unknown';

const formatUserName = (user) => {
  if (!user) return 'Unassigned';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (fullName) return fullName;
  if (user.email) return user.email;
  return 'Team Member';
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const buildStatusChartData = (stats) => [
  { name: 'Pending', value: stats.open || 0, status: 'PENDING' },
  { name: 'In Progress', value: stats.inProgress || 0, status: 'IN_PROGRESS' },
  { name: 'Resolved', value: stats.resolved || 0, status: 'RESOLVED' },
  { name: 'Closed', value: stats.closed || 0, status: 'CLOSED' }
];

function AdminTickets() {
  const { auth } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalReply, setIsInternalReply] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [popupConfig, setPopupConfig] = useState(null);
  const role = auth?.role ? auth.role.toUpperCase() : 'ADMIN';
  const adminId = auth?.userId;
  const pageSize = 8;

  const showPopup = useCallback((config) => {
    setPopupConfig({ open: true, type: 'info', ...config });
  }, []);

  const closePopup = useCallback(() => {
    setPopupConfig(null);
  }, []);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        userRole: role,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        category: filters.category || undefined
      };
      const { data } = await API.get('/api/v1/tickets', { params });
      setTickets(data.items || []);
      setPageCount(data.pages || 1);
    } catch (error) {
      console.error('Failed to load tickets', error);
      showPopup({
        type: 'error',
        title: 'Unable to load tickets',
        message: error.message || 'An unexpected error occurred while loading tickets.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters.category, filters.priority, filters.status, page, pageSize, role, showPopup]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await API.get('/api/v1/tickets/stats/overview', {
        params: { userRole: role }
      });
      setStats(data || { open: 0, inProgress: 0, resolved: 0, closed: 0 });
    } catch (error) {
      console.error('Failed to load ticket stats', error);
    }
  }, [role]);

  const loadComments = useCallback(async (ticketId) => {
    if (!ticketId) return;
    setCommentsLoading(true);
    try {
      const { data } = await API.get(`/api/v1/tickets/${ticketId}/comments`, {
        params: { userRole: role, userId: adminId }
      });
      setComments(data || []);
    } catch (error) {
      console.error('Failed to load comments', error);
      showPopup({
        type: 'error',
        title: 'Unable to load comments',
        message: error.message || 'Please try again later.'
      });
    } finally {
      setCommentsLoading(false);
    }
  }, [adminId, role, showPopup]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ status: '', priority: '', category: '' });
    setPage(1);
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setIsInternalReply(false);
    loadComments(ticket._id);
  };

  const handleSubmitReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !adminId) {
      showPopup({ type: 'error', title: 'Missing information', message: 'User session expired. Please sign in again.' });
      return;
    }
    if (!replyMessage.trim()) {
      showPopup({ type: 'warning', title: 'Reply required', message: 'Please enter a reply message before sending.' });
      return;
    }

    setReplyLoading(true);
    try {
      const payload = {
        message: replyMessage.trim(),
        isInternal: isInternalReply,
        userRole: role,
        adminId
      };
      const { data } = await API.post(`/api/v1/tickets/${selectedTicket._id}/admin-reply`, payload);

      showPopup({
        type: 'success',
        title: 'Reply sent',
        message: 'Your response has been shared successfully.'
      });
      setReplyMessage('');
      setIsInternalReply(false);

      if (data?.ticket) {
        setSelectedTicket(data.ticket);
      }

      await loadComments(selectedTicket._id);
      await Promise.all([loadTickets(), loadStats()]);
    } catch (error) {
      console.error('Failed to send reply', error);
      showPopup({
        type: 'error',
        title: 'Unable to send reply',
        message: error.message || 'Please try again later.'
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const statusChartData = useMemo(() => buildStatusChartData(stats), [stats]);

  const categoryChartData = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const counts = tickets.reduce((acc, ticket) => {
      const key = ticket.category || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([key, value]) => ({
      name: formatCategory(key),
      rawKey: key,
      value
    }));
  }, [tickets]);

  const priorityChartData = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const counts = tickets.reduce((acc, ticket) => {
      const key = ticket.priority || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([key, value]) => ({
      name: formatPriority(key),
      rawKey: key,
      value
    }));
  }, [tickets]);

  const totalTickets = tickets.length;

  return (
    <div className="admin-tickets-page">
      <AdminNav />
      <div className="admin-tickets-container">
        <section className="analytics-section">
          <div className="analytics-header">
            <div>
              <h2>Ticket Insights</h2>
              <p className="analytics-subtitle">Track the support workload across categories and priorities.</p>
            </div>
            <div className="analytics-stats">
              <div className="analytics-stat">
                <span className="analytics-label">Total Tickets</span>
                <span className="analytics-value">{stats.open + stats.inProgress + stats.resolved + stats.closed}</span>
              </div>
              <div className="analytics-stat">
                <span className="analytics-label">Visible Page</span>
                <span className="analytics-value">{totalTickets}</span>
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <header>
                <h3>Status Breakdown</h3>
                <span className="chart-hint">Overall view</span>
              </header>
              <div className="chart-body">
                {statusChartData.every((item) => item.value === 0) ? (
                  <p className="chart-empty">No status data available yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={entry.status || index} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card">
              <header>
                <h3>Tickets by Category</h3>
                <span className="chart-hint">Current page</span>
              </header>
              <div className="chart-body">
                {categoryChartData.length === 0 ? (
                  <p className="chart-empty">Switch filters or load data to see category trends.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card">
              <header>
                <h3>Tickets by Priority</h3>
                <span className="chart-hint">Current page</span>
              </header>
              <div className="chart-body">
                {priorityChartData.length === 0 ? (
                  <p className="chart-empty">No priority information for selected filters.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={priorityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {priorityChartData.map((entry, index) => (
                          <Cell key={entry.rawKey || index} fill={PRIORITY_COLORS[entry.rawKey] || '#0ea5e9'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="tickets-section">
          <header className="tickets-header">
            <div>
              <h2>Manage Support Tickets</h2>
              <p className="tickets-subtitle">Review member requests and reply on behalf of the support team.</p>
            </div>
            <div className="filters">
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select name="priority" value={filters.priority} onChange={handleFilterChange}>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select name="category" value={filters.category} onChange={handleFilterChange}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button className="btn-reset" type="button" onClick={resetFilters}>Reset</button>
            </div>
          </header>

          <div className="tickets-list">
            {isLoading ? (
              <div className="list-placeholder">Loading tickets…</div>
            ) : tickets.length === 0 ? (
              <div className="list-placeholder">No tickets match the selected filters.</div>
            ) : (
              <ul>
                {tickets.map((ticket) => (
                  <li key={ticket._id} className={`ticket-card ticket-${ticket.status?.toLowerCase()}`}>
                    <div className="ticket-meta">
                      <h3>{ticket.subject}</h3>
                      <div className="ticket-tags">
                        <span className={`tag status-${ticket.status?.toLowerCase()}`}>{formatStatus(ticket.status)}</span>
                        <span className={`tag priority-${ticket.priority?.toLowerCase()}`}>{formatPriority(ticket.priority)}</span>
                        <span className="tag category-tag">{formatCategory(ticket.category)}</span>
                      </div>
                    </div>
                    <p className="ticket-description">{ticket.description}</p>
                    <div className="ticket-footer">
                      <div className="ticket-footer-column">
                        <span className="ticket-label">Created By</span>
                        <span className="ticket-value">{formatUserName(ticket.createdBy)}</span>
                      </div>
                      <div className="ticket-footer-column">
                        <span className="ticket-label">Assigned To</span>
                        <span className="ticket-value">{formatUserName(ticket.assignedTo)}</span>
                      </div>
                      <div className="ticket-footer-column">
                        <span className="ticket-label">Created</span>
                        <span className="ticket-value">{formatDateTime(ticket.createdAt)}</span>
                      </div>
                      <div className="ticket-footer-actions">
                        <button
                          type="button"
                          className="btn-reply"
                          onClick={() => handleSelectTicket(ticket)}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="tickets-footer">
            <span>Page {page} of {pageCount}</span>
            <div className="pager">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={page === pageCount}
              >
                Next
              </button>
            </div>
          </footer>
        </section>

        <aside className={`ticket-detail-panel ${selectedTicket ? 'open' : ''}`}>
          {selectedTicket ? (
            <div className="detail-wrapper">
              <header className="detail-header">
                <div>
                  <h2>{selectedTicket.subject}</h2>
                  <p className="detail-subtitle">Conversations with {formatUserName(selectedTicket.createdBy)}</p>
                </div>
                <button className="btn-close" type="button" onClick={() => setSelectedTicket(null)}>Close</button>
              </header>

              <section className="detail-meta">
                <div>
                  <span className="meta-label">Status</span>
                  <span className="meta-value">{formatStatus(selectedTicket.status)}</span>
                </div>
                <div>
                  <span className="meta-label">Priority</span>
                  <span className="meta-value">{formatPriority(selectedTicket.priority)}</span>
                </div>
                <div>
                  <span className="meta-label">Category</span>
                  <span className="meta-value">{formatCategory(selectedTicket.category)}</span>
                </div>
                <div>
                  <span className="meta-label">Assigned To</span>
                  <span className="meta-value">{formatUserName(selectedTicket.assignedTo)}</span>
                </div>
              </section>

              <section className="comments-section">
                <h3>Conversation</h3>
                {commentsLoading ? (
                  <div className="comments-placeholder">Loading conversation…</div>
                ) : comments.length === 0 ? (
                  <div className="comments-placeholder">No replies yet. Be the first to respond.</div>
                ) : (
                  <ul className="comments-list">
                    {comments.map((comment) => (
                      <li key={comment._id} className={`comment-item ${comment.internal ? 'comment-internal' : ''}`}>
                        <div className="comment-header">
                          <span className="comment-author">{formatUserName(comment.author)}</span>
                          <span className="comment-time">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p>{comment.message}</p>
                        {comment.internal && <span className="comment-badge">Internal</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="reply-section">
                <h3>Send a Reply</h3>
                <form onSubmit={handleSubmitReply}>
                  <textarea
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    placeholder="Share updates, troubleshooting steps, or follow-up questions with the member."
                    rows={5}
                  />
                  <label className="internal-toggle">
                    <input
                      type="checkbox"
                      checked={isInternalReply}
                      onChange={(event) => setIsInternalReply(event.target.checked)}
                    />
                    Internal note (visible to staff only)
                  </label>
                  <div className="reply-actions">
                    <button type="button" className="btn-secondary" onClick={() => setSelectedTicket(null)}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={replyLoading}>
                      {replyLoading ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : (
            <div className="detail-placeholder">
              <h3>Select a ticket</h3>
              <p>Choose a ticket from the list to review its history and send a response.</p>
            </div>
          )}
        </aside>
      </div>

      {popupConfig && (
        <Popup
          open={popupConfig.open}
          type={popupConfig.type}
          title={popupConfig.title}
          message={popupConfig.message}
          actions={popupConfig.actions}
          onClose={closePopup}
        />
      )}
    </div>
  );
}

export default AdminTickets;
