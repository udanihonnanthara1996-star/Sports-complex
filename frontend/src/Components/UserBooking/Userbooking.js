import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../Context/AuthContext'; // Authentication context for user role
import jsPDF from 'jspdf'; // PDF generation library
import autoTable from 'jspdf-autotable'; // PDF table plugin
import API from '../../utils/api';
// Custom API wrapper
import { getBookingsArray } from '../../utils/bookingsApi';// Normalizes API booking responses
// Normalizes API booking responses
import BookingForm from './BookingForm';
// Reusable booking form component
import './Userbooking.css';
// Component styles
import Nav from '../Nav/Nav';

// Main navigation

/**
 * UserBooking Component - Multi-tab Dashboard
 * - 4 tabs: Create, List, History (filtered), Schedule (weekly/monthly)
 * - Supports both user-specific (userId prop) and admin views
 * - Real-time filtering, PDF export, schedule grouping by date
 * - Role-based endpoints (admin vs user schedule)
 */
function UserBooking({ userId }) {
    // userId prop filters to specific user (admin usage)
    const { auth } = useAuth();// Get current user auth state (role, token)
    // === CORE STATE ===
    const [bookings, setBookings] = useState([]);// User's bookings list
    const [editingBooking, setEditingBooking] = useState(null);// Currently editing booking
    const [activeTab, setActiveTab] = useState('create');// Active tab: 'create' | 'list' | 'history' | 'schedule'
    const [loading, setLoading] = useState(false);// Bookings loading state
    // === FILTERING STATE (History tab) ===
    const [filters, setFilters] = useState({
        status: '', // 'confirmed', 'cancelled', 'completed'
        dateFrom: '',// YYYY-MM-DD
        dateTo: ''// YYYY-MM-DD
    });
    // === SCHEDULE STATE ===   
    const [scheduleMode, setScheduleMode] = useState('weekly'); // 'weekly' | 'monthly'
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));// YYYY-MM-DD
    const [scheduleData, setScheduleData] = useState(null); // Backend schedule response
    const [scheduleLoading, setScheduleLoading] = useState(false);// Schedule loading state
    const [scheduleError, setScheduleError] = useState(''); // Schedule errors

    // === BOOKINGS FETCHING (useCallback prevents unnecessary re-renders) ===
    /**
     * Fetch and filter user's bookings
     * - Admin view: userId prop filters to specific user
     * - User view: Filters client-side by current user
     */
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/v1/bookings');// GET all bookings
            const list = getBookingsArray(res); // Normalize response
            if (userId) { // Admin filtering by specific userId
                setBookings(list.filter((b) => String(b.user?._id || b.user) === String(userId)));
            } else { // Current user bookings only
                setBookings(list);
            }
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

     // Fetch bookings when component mounts or userId changes
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // === EDIT HANDLER ===
    const handleEdit = (booking) => {
        setEditingBooking(booking);
        setActiveTab('create');// Switch to create tab for editing
    };
// === SCHEDULE FETCHING (Role-based endpoints) ===
    /**
     * Fetch schedule data (weekly/monthly) with role-based endpoints
     * - User: '/api/v1/bookings/schedule' (personal schedule)
     * - Admin: '/api/v1/bookings/schedule/admin' (full facility schedule)
     */
    const fetchSchedule = useCallback(async () => {
        if (!scheduleDate) return;
        setScheduleLoading(true);
        setScheduleError('');
        try {
            const endpoint = auth?.role === 'admin' ? '/api/v1/bookings/schedule/admin' : '/api/v1/bookings/schedule';
            const res = await API.get(endpoint, {
                params: {
                    date: scheduleDate,
                    period: scheduleMode,
                },
            });
            setScheduleData(res.data);// { summary, groupedBookings, start, end }
        } catch (err) {
            setScheduleError(err.response?.data?.message || err.message || 'Unable to load schedule');
            setScheduleData(null);
        } finally {
            setScheduleLoading(false);
        }
    }, [auth?.role, scheduleDate, scheduleMode]);

    // === DELETE HANDLER ===
    const handleDelete = async (bookingId) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;
        try {
            await API.delete(`/api/v1/bookings/${bookingId}`);
            fetchBookings();// Refresh list after deletion
        } catch (err) {
            console.error('Failed to delete booking:', err);
        }
    };

    // === FILTER HANDLER ===
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Fetch schedule when schedule tab becomes active
    useEffect(() => {
        if (activeTab === 'schedule') {
            fetchSchedule();
        }
    }, [activeTab, fetchSchedule]);

    // === CLIENT-SIDE FILTERING (History tab) ===
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        // Status filter
        if (filters.status && booking.status !== filters.status) return false;
        // Date range filter
        if (fromDate && bookingDate < fromDate) return false;
        if (toDate && bookingDate > toDate) return false;

        return true;
    });
    // === SCHEDULE SUMMARY ===
    const scheduleSummary = {
        total: scheduleData?.summary?.total || 0,
        confirmed: scheduleData?.summary?.confirmed || 0,
        cancelled: scheduleData?.summary?.cancelled || 0,
        revenue: scheduleData?.summary?.revenue || 0,
    };
    // === PDF EXPORT (Schedule) ===
    const handleDownloadSchedulePDF = () => {
        const periodLabel = scheduleMode === 'weekly' ? 'Weekly' : 'Monthly';
        const startLabel = new Date(scheduleData?.start).toLocaleDateString();
        const endLabel = new Date(scheduleData?.end).toLocaleDateString();
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`${periodLabel} Booking Schedule`, 14, 18);
        doc.setFontSize(10);
        doc.text(`Period: ${startLabel} - ${endLabel}`, 14, 26);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);
    
        // Table data with fallbacks
        const rows = (scheduleData?.bookings || []).map((b) => [
            b.facility?.name ?? '—',
            b.facility?.type ?? '—',
            b.date ? new Date(b.date).toLocaleDateString() : '—',
            b.timeSlot ?? '—',
            `${b.duration ?? '—'} hr`,
            b.status ?? '—',
        ]);

        if (rows.length > 0) {
            autoTable(doc, {
                head: [['Facility', 'Type', 'Date', 'Time', 'Duration', 'Status']],
                body: rows,
                startY: 42,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [102, 126, 234] },// Blue header
            });
        } else {
            doc.text('No bookings found for this period.', 14, 44);
        }

        doc.save(`booking-schedule-${scheduleMode}-${scheduleDate}.pdf`);
    };
   // === JSX RENDER ===
    return (
        <div className="user-booking-container">
            <Nav /> {/* Main navigation */}
            {/* Page Header */}
            <div className="user-booking-header">
                <h1>Your Bookings</h1>
                <p>Manage your personal bookings</p>
            </div>
            {/* ── TAB NAVIGATION ── */}
            <div className="booking-tabs">
                <button
                    type="button"
                    className={activeTab === 'create' ? 'tab-button active' : 'tab-button'}
                    onClick={() => {
                        setActiveTab('create');
                        setEditingBooking(null);// Clear edit mode
                    }}
                >
                    Create Booking
                </button>
                <button
                    type="button"
                    className={activeTab === 'list' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setActiveTab('list')}
                >
                    My Bookings
                </button>
                <button
                    type="button"
                    className={activeTab === 'history' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setActiveTab('history')}
                >
                    Booking History
                </button>
                <button
                    type="button"
                    className={activeTab === 'schedule' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setActiveTab('schedule')}
                >
                    Schedule
                </button>
            </div>
            {/* ── TAB: CREATE ── */}
            {activeTab === 'create' && (
                <BookingForm
                    fetchBookings={fetchBookings}
                    editingBooking={editingBooking}
                    setEditingBooking={setEditingBooking}
                />
            )}
            {/* ── TAB: LIST (Active/Current bookings) ── */}
            {activeTab === 'list' && (
                <div className="user-bookings-list">
                    {loading ? (
                        <div className="no-user-bookings"><p>Loading bookings...</p></div>
                    ) : bookings.length > 0 ? (
                        bookings.map(b => (
                            <div className="user-booking-card" key={b._id}>
                                <h3>Booking Details</h3>
                                <div className="user-booking-details">  {/* Key booking details with fallbacks */}
                                    <div className="user-booking-detail">
                                        <span className="user-booking-detail-label">Facility:</span>
                                        <span className="user-booking-detail-value">{b.facility?.name ?? '—'}</span>
                                    </div>
                                    <div className="user-booking-detail">
                                        <span className="user-booking-detail-label">Type:</span>
                                        <span className="user-booking-detail-value">{b.facility?.type ?? '—'}</span>
                                    </div>
                                    <div className="user-booking-detail">
                                        <span className="user-booking-detail-label">Date:</span>
                                        <span className="user-booking-detail-value">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</span>
                                    </div>
                                    <div className="user-booking-detail">
                                        <span className="user-booking-detail-label">Time:</span>
                                        <span className="user-booking-detail-value">{b.timeSlot ?? '—'}</span>
                                    </div>
                                    <div className="user-booking-detail">
                                        <span className="user-booking-detail-label">Duration:</span>
                                        <span className="user-booking-detail-value">{b.duration ?? '—'} hour(s)</span>
                                    </div>
                                    <div className="user-booking-detail">
                                        <span className="user-booking-detail-label">Status:</span>
                                        <span className="user-booking-detail-value">{b.status ?? '—'}</span>
                                    </div> {/* Action buttons */}
                                </div>
                                <div className="booking-card-actions">
                                    <button type="button" onClick={() => handleEdit(b)} className="action-button">
                                        Edit
                                    </button>
                                    <button type="button" onClick={() => handleDelete(b._id)} className="action-button delete-button">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-user-bookings">
                            <p>You don't have any bookings yet. Create your first booking above.</p>
                        </div>
                    )}
                </div>
            )}
        {/* ── TAB: HISTORY (Filtered + Stats) ── */}
            {activeTab === 'history' && (
                <div className="booking-history-section"> {/* Filters */}
                    <div className="booking-filters">
                        <h3>Filter Bookings</h3>
                        <div className="filter-row">
                            <div className="filter-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label htmlFor="dateFrom">From Date</label>
                                <input
                                    type="date"
                                    id="dateFrom"
                                    name="dateFrom"
                                    value={filters.dateFrom}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="filter-group">
                                <label htmlFor="dateTo">To Date</label>
                                <input
                                    type="date"
                                    id="dateTo"
                                    name="dateTo"
                                    value={filters.dateTo}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Stats Cards */}
                    <div className="booking-history-stats">
                        <div className="stat-card">
                            <h4>{filteredBookings.length}</h4>
                            <p>Filtered Bookings</p>
                        </div>
                        <div className="stat-card">
                            <h4>{filteredBookings.filter(b => b.status === 'confirmed').length}</h4>
                            <p>Confirmed</p>
                        </div>
                        <div className="stat-card">
                            <h4>{filteredBookings.filter(b => b.status === 'completed').length}</h4>
                            <p>Completed</p>
                        </div>
                        <div className="stat-card">
                            <h4>${filteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}</h4>
                            <p>Total Spent</p>
                        </div>
                    </div>

                    <div className="user-bookings-list">
                        {loading ? (
                            <div className="no-user-bookings"><p>Loading booking history...</p></div>
                        ) : filteredBookings.length > 0 ? (
                            filteredBookings.map(b => (
                                <div className="user-booking-card history-card" key={b._id}>
                                    <div className="booking-header">
                                        <h3>{b.facility?.name ?? 'Unknown Facility'}</h3>
                                        <span className={`status-badge status-${b.status}`}>
                                            {b.status}
                                        </span>
                                        {/* History details + price + notes */}
                                    </div>
                                    <div className="user-booking-details">
                                        <div className="user-booking-detail">
                                            <span className="user-booking-detail-label">Type:</span>
                                            <span className="user-booking-detail-value">{b.facility?.type ?? '—'}</span>
                                        </div>
                                        <div className="user-booking-detail">
                                            <span className="user-booking-detail-label">Date:</span>
                                            <span className="user-booking-detail-value">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</span>
                                        </div>
                                        <div className="user-booking-detail">
                                            <span className="user-booking-detail-label">Time:</span>
                                            <span className="user-booking-detail-value">{b.timeSlot ?? '—'}</span>
                                        </div>
                                        <div className="user-booking-detail">
                                            <span className="user-booking-detail-label">Duration:</span>
                                            <span className="user-booking-detail-value">{b.duration ?? '—'} hour(s)</span>
                                        </div>
                                        <div className="user-booking-detail">
                                            <span className="user-booking-detail-label">Price:</span>
                                            <span className="user-booking-detail-value">${b.totalPrice ?? '—'}</span>
                                        </div>
                                        {/* ... other details ... */}
                                    </div>
                                    {b.notes && (
                                        <div className="booking-notes">
                                            <strong>Notes:</strong> {b.notes}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-user-bookings">
                                <p>No bookings match your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
         {/* ── TAB: SCHEDULE (Weekly/Monthly + PDF Export) ── */}
            {activeTab === 'schedule' && (
                <div className="booking-schedule-section"> {/* Schedule Controls */}
                    <div className="schedule-controls">
                        <div className="schedule-buttons">
                            <button
                                type="button"
                                className={scheduleMode === 'weekly' ? 'tab-button active' : 'tab-button'}
                                onClick={() => setScheduleMode('weekly')}
                            >
                                Weekly
                            </button>
                            <button
                                type="button"
                                className={scheduleMode === 'monthly' ? 'tab-button active' : 'tab-button'}
                                onClick={() => setScheduleMode('monthly')}
                            >
                                Monthly
                            </button>
                        </div>
                        <div className="schedule-controls-right">
                            <label htmlFor="scheduleDate">Date</label>
                            <input
                                type="date"
                                id="scheduleDate"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                            <button type="button" className="action-button export-button" onClick={handleDownloadSchedulePDF} disabled={scheduleLoading || !scheduleData}>
                                Download PDF
                            </button>
                        </div>
                    </div>

                    <div className="booking-history-stats schedule-summary">
                        <div className="stat-card">
                            <h4>{scheduleSummary.total}</h4>
                            <p>Total bookings</p>
                        </div>
                        <div className="stat-card">
                            <h4>{scheduleSummary.confirmed}</h4>
                            <p>Confirmed</p>
                        </div>
                        <div className="stat-card">
                            <h4>{scheduleSummary.cancelled}</h4>
                            <p>Cancelled</p>
                        </div>
                        <div className="stat-card">
                            <h4>${scheduleSummary.revenue}</h4>
                            <p>Estimated revenue</p>
                        </div>
                    </div>

                    {scheduleLoading ? (
                        <div className="no-user-bookings"><p>Loading schedule...</p></div>
                    ) : scheduleError ? (
                        <div className="no-user-bookings"><p>{scheduleError}</p></div>
                    ) : (!scheduleData || scheduleSummary.total === 0) ? (
                        <div className="no-user-bookings">
                            <p>No bookings found for the selected {scheduleMode} period.</p>
                        </div>
                    ) : (
                        <div className="schedule-bookings-list">
                            {Object.keys(scheduleData.groupedBookings).sort().map((dateKey) => (
                                <div className="schedule-day-group" key={dateKey}>
                                    <h3>{new Date(dateKey).toLocaleDateString()}</h3>
                                    {scheduleData.groupedBookings[dateKey].map((booking) => (
                                        <div className="user-booking-card" key={booking._id}>
                                            <div className="user-booking-details">
                                                <div className="user-booking-detail">
                                                    <span className="user-booking-detail-label">Facility:</span>
                                                    <span className="user-booking-detail-value">{booking.facility?.name ?? '—'}</span>
                                                </div>
                                                <div className="user-booking-detail">
                                                    <span className="user-booking-detail-label">Time:</span>
                                                    <span className="user-booking-detail-value">{booking.timeSlot ?? '—'}</span>
                                                </div>
                                                <div className="user-booking-detail">
                                                    <span className="user-booking-detail-label">Duration:</span>
                                                    <span className="user-booking-detail-value">{booking.duration ?? '—'} hour(s)</span>
                                                </div>
                                                <div className="user-booking-detail">
                                                    <span className="user-booking-detail-label">Status:</span>
                                                    <span className="user-booking-detail-value">{booking.status ?? '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default UserBooking;