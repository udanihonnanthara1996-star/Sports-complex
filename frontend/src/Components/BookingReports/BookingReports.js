import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../../utils/api';
import { getBookingsArray } from '../../utils/bookingsApi';
import AdminNav from '../Admin/AdminNav';
import './BookingReports.css';

function BookingReports() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sportFilter, setSportFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchBookings = async () => {
    setError(null);
    try {
      const res = await API.get('/api/v1/bookings');
      setBookings(getBookingsArray(res));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = useMemo(() => {
    const sport = sportFilter.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      if (sport) {
        const facilityName = String(b.facility?.name || '');
        const facilityType = String(b.facility?.type || '');
        if (
          facilityName.toLowerCase().indexOf(sport) === -1 &&
          facilityType.toLowerCase().indexOf(sport) === -1
        ) {
          return false;
        }
      }
      if (from || to) {
        const d = new Date(b.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
  }, [bookings, sportFilter, dateFrom, dateTo]);

  const getPeriodRange = (dateString, period) => {
    const date = new Date(dateString || new Date().toISOString());
    if (Number.isNaN(date.getTime())) return { start: new Date(), end: new Date(), label: '' };
    if (period === 'monthly') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` };
    }

    const start = new Date(date);
    start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` };
  };

  const handleDownloadPDF = () => {
    const { start, end, label } = getPeriodRange(reportDate, reportPeriod);
    const periodBookings = bookings.filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate >= start && bookingDate <= end;
    });

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Facility Booking Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} report`, 14, 26);
    doc.text(`Period: ${label}`, 14, 34);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);

    const rows = periodBookings.map((b) => [
      b.facility?.name ?? '—',
      b.facility?.type ?? '—',
      b.date ? new Date(b.date).toLocaleDateString() : '—',
      b.timeSlot ?? '—',
      b.status ?? '—',
      b.user?.name ?? b.user?._id ?? '—',
    ]);

    if (rows.length > 0) {
      autoTable(doc, {
        head: [['Facility', 'Type', 'Date', 'Time slot', 'Status', 'User']],
        body: rows,
        startY: 50,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [102, 126, 234] },
      });
    } else {
      doc.text('No bookings found for the selected period.', 14, 50);
    }

    doc.save(`booking-report-${reportPeriod}-${reportDate}.pdf`);
  };

  return (
    <div className="booking-reports-container">
      <AdminNav />
      <div className="booking-reports-header">
        <h1>Booking reports</h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>View and filter all facility bookings</p>
      </div>

      <div className="booking-reports-filters">
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

      {error && (
        <p className="booking-reports-empty" role="alert" style={{ color: '#c0392b' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="booking-reports-empty">Loading bookings…</p>
      ) : !error && filtered.length === 0 ? (
        <p className="booking-reports-empty">
          {bookings.length === 0 ? 'No bookings in the system yet.' : 'No bookings match your filters.'}
        </p>
      ) : (
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
              {filtered.map((b) => (
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
