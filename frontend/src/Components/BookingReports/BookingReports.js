import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';// PDF generation library
import autoTable from 'jspdf-autotable';// Table plugin for jsPDF (complex table layouts)
import API from '../../utils/api';// Custom API wrapper for backend communication
import { getBookingsArray } from '../../utils/bookingsApi';// Normalizes API response to bookings array
import AdminNav from '../Admin/AdminNav';// Admin navigation component
import './BookingReports.css';// Component-specific styles

/**
 * BookingReports Component
 * - Fetches and displays all bookings with advanced filtering (sport, date range)
 * - Generates downloadable PDF reports (weekly/monthly periods)
 * - Features loading states, error handling, and empty states
 */
function BookingReports() {
  // === STATE MANAGEMENT ===
  const [bookings, setBookings] = useState([]);
  // Raw bookings data from API
  const [loading, setLoading] = useState(true);
  // Loading spinner state
  const [error, setError] = useState(null);
  // API error messages
  const [sportFilter, setSportFilter] = useState('');
  // Live search filter for facility/type
  const [dateFrom, setDateFrom] = useState('');
  // Date range filter start
  const [dateTo, setDateTo] = useState('');
  // Date range filter end
  const [reportPeriod, setReportPeriod] = useState('weekly');// PDF export period (weekly/monthly)
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));// PDF reference date (YYYY-MM-DD)

  // === DATA FETCHING ===
    /**
     * Fetch all bookings with comprehensive error handling
     * - Clears previous errors
     * - Sets loading state
     * - Handles API failures gracefully
     */
  const fetchBookings = async () => {
    setError(null);// Clear previous errors before new request
    try {
      const res = await API.get('/api/v1/bookings');// GET all bookings endpoint
      setBookings(getBookingsArray(res));// Normalize API response
    } catch (e) {
      // Prioritize API error message, fallback to generic message
      setError(e.response?.data?.message || e.message || 'Failed to load bookings');
      setBookings([]);// Clear bookings on error
    } finally {
      setLoading(false);// Always stop loading spinner
    }
  };
// Fetch bookings on component mount (empty deps = run once)
  useEffect(() => {
    fetchBookings();
  }, []);

   // === FILTERING LOGIC (Performance optimized with useMemo) ===
    /**
     * Memoized filtered bookings based on sport search + date range
     * - Prevents unnecessary re-filtering on every render
     * - Complex date logic: end-of-day for 'to' date
     */
  const filtered = useMemo(() => {
    const sport = sportFilter.trim().toLowerCase(); // Normalize search term
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);// Include entire end day

    return bookings.filter((b) => {// Sport/facility filtering (search in name OR type)
      if (sport) {
        const facilityName = String(b.facility?.name || '');
        const facilityType = String(b.facility?.type || '');
        if (
          facilityName.toLowerCase().indexOf(sport) === -1 &&
          facilityType.toLowerCase().indexOf(sport) === -1
        ) {
          return false;// Exclude if neither matches
        }
      }
      // Date range filtering (if from/to specified, check booking date)
      if (from || to) {
        const d = new Date(b.date);
        if (from && d < from) return false; // Before start date
        if (to && d > to) return false; // After end date
      }
      return true;// Include booking
    });
  }, [bookings, sportFilter, dateFrom, dateTo]);// Recompute when these change

   // === REPORT PERIOD CALCULATION ===
    /**
     * Calculates date range for PDF reports (weekly or monthly)
     * - Weekly: Sunday-Saturday containing reference date
     * - Monthly: 1st to last day of reference month
     * @param {string} dateString - YYYY-MM-DD reference date
     * @param {string} period - 'weekly' | 'monthly'
     * @returns {Object} {start, end, label} for filtering and display
     */

  const getPeriodRange = (dateString, period) => {
    const date = new Date(dateString || new Date().toISOString());
    if (Number.isNaN(date.getTime())) return { start: new Date(), end: new Date(), label: '' };// Fallback for invalid date
    if (period === 'monthly') {// Monthly: 1st to last day of month
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` };
    }
 // Weekly: Sunday to Saturday (ISO week start)
    const start = new Date(date);
    start.setDate(date.getDate() - ((date.getDay() + 6) % 7));// Previous Sunday
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);// +6 days = Saturday
    end.setHours(23, 59, 59, 999);
    return { start, end, label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` };
  };

  // === PDF EXPORT FUNCTIONALITY ===
    /**
     * Generates and downloads PDF report for selected period
     * - Uses jsPDF + autoTable for professional table layout
     * - Filters bookings by calculated period range
     * - Custom header with branding and metadata
     */
  const handleDownloadPDF = () => {
    const { start, end, label } = getPeriodRange(reportDate, reportPeriod);
    // Filter bookings for report period (ignoring sport/date filters to show all in period)
    const periodBookings = bookings.filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate >= start && bookingDate <= end;
    });

    // Initialize PDF document
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Facility Booking Report', 14, 18);// Title
    doc.setFontSize(10);
    doc.text(`${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} report`, 14, 26);
    doc.text(`Period: ${label}`, 14, 34);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);// Timestamp

    // Prepare table data with fallbacks
    const rows = periodBookings.map((b) => [
      b.facility?.name ?? '—',
      b.facility?.type ?? '—',
      b.date ? new Date(b.date).toLocaleDateString() : '—',
      b.timeSlot ?? '—',
      b.status ?? '—',
      b.user?.name ?? b.user?._id ?? '—',
    ]);

    // Generate table or empty message
    if (rows.length > 0) {
      autoTable(doc, {
        head: [['Facility', 'Type', 'Date', 'Time slot', 'Status', 'User']],
        body: rows,
        startY: 50,// Position after header
        styles: { fontSize: 9 },// Compact table
        headStyles: { fillColor: [102, 126, 234] },// Blue header
      });
    } else {
      doc.text('No bookings found for the selected period.', 14, 50);
    }

    // Download with descriptive filename
    doc.save(`booking-report-${reportPeriod}-${reportDate}.pdf`);
  };

  // === JSX RENDER ===
  return (
    <div className="booking-reports-container">/* Persistent admin navigation */
      <AdminNav />
      /* Page header */
      <div className="booking-reports-header">
        <h1>Booking reports</h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>View and filter all facility bookings</p>
      </div>
 
    /* Live filters (sport search + date range) */
      <div className="booking-reports-filters">
        /* Sport/facility search filter */
        <label htmlFor="br-sport" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#555' }}>Sport</span>
          <input
            id="br-sport"
            type="search"
            placeholder="Filter by facility or type"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', minWidth: 160 }}
          />
        </label>
        /* Date range filters */
        <label htmlFor="br-from" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#555' }}>From</span>
          <input
            id="br-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
        </label>
        <label htmlFor="br-to" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#555' }}>To</span>
          <input
            id="br-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
        </label>
      </div>
      /* PDF Export Controls */
      <div className="report-export-controls">
        <label htmlFor="reportPeriod" className="report-export-label">
          Report type
          <select
            id="reportPeriod"
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label htmlFor="reportDate" className="report-export-label">
          Reference date
          <input
            id="reportDate"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </label>
        <button type="button" className="export-button" onClick={handleDownloadPDF}>
          Download {reportPeriod} PDF
        </button>
      </div>
  /* Error State */
      {error && (
        <p className="booking-reports-empty" role="alert" style={{ color: '#c0392b' }}>
          {error}
        </p>
      )}
/* Loading & Empty States */
      {loading ? (
        <p className="booking-reports-empty">Loading bookings…</p>
      ) : !error && filtered.length === 0 ? (
        <p className="booking-reports-empty">
          {bookings.length === 0 ? 'No bookings in the system yet.' : 'No bookings match your filters.'}
        </p>
      ) : (  /* Filtered Bookings Table */
        <div className="booking-reports-table-wrap">
          <table className="booking-reports-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Type</th>
                <th>Date</th>
                <th>Time slot</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => ( /* MongoDB ObjectId as unique key */
                <tr key={b._id}>
                  <td>{b.facility?.name ?? '—'}</td>
                  <td>{b.facility?.type ?? '—'}</td>
                  <td>{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
                  <td>{b.timeSlot ?? '—'}</td>
                  <td>{b.user?.name ?? b.user?._id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BookingReports;
