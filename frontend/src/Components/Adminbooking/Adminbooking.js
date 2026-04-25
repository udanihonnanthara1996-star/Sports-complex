import React, { useEffect, useState } from 'react';
import API from '../../utils/api'; // Custom API wrapper for backend calls (Axios/fetch)
import { getBookingsArray } from '../../utils/bookingsApi';
// Utility to normalize/extract bookings from API response
import BookingForm from '../UserBooking/BookingForm';// Reusable form component for create/edit bookings
import './Adminbooking.css';// Component-specific styles
import AdminNav from '../Admin/AdminNav';// Admin navigation bar component


/**
 * AdminBooking Component
 * - Displays list of all bookings with edit/delete actions
 * - Fetches bookings on mount and after mutations (optimistic UI)
 * - Handles editing via shared BookingForm state
 */
function AdminBooking() {
    // Local state for bookings list and currently editing booking
    const [bookings, setBookings] = useState([]);// Array of booking objects from API
    const [editingBooking, setEditingBooking] = useState(null); // Booking being edited (passed to form)

    // Fetch all bookings from backend API
    const fetchBookings = async () => {
        // TODO: Add error handling with toast notifications (e.g., react-toastify)
        const res = await API.get('/api/v1/bookings');
        // GET all bookings endpoint
        setBookings(getBookingsArray(res));// Normalize response data into array
    };

    // Fetch bookings on component mount (empty deps = once)
    useEffect(() => {
        fetchBookings();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    // Delete booking by ID and refresh list
    const handleDelete = async (id) => {
        await API.delete(`/api/v1/bookings/${id}`);// DELETE single booking endpoint
        fetchBookings();// Refetch to update UI (alternative: optimistic delete)
    };

    // Set booking into edit mode (passes to BookingForm)
    const handleEdit = (booking) => {
        setEditingBooking(booking);
    };

    return (
        <div className="admin-booking-container">/* Main container with CSS grid/flex */
            <AdminNav /> /* Persistent admin navigation */
            <div className="admin-booking-header"> /* Header section */
                <h1>Admin Booking Management</h1>
                <p>Manage all bookings in the system</p>
            </div>
           /* Shared form for create NEW or edit EXISTING bookings */
            <BookingForm 
                fetchBookings={fetchBookings} // Callback to refresh list after submit
                editingBooking={editingBooking} // Current booking in edit mode (null = create)
                setEditingBooking={setEditingBooking}// Callback to clear edit mode on cancel
            />
            
            <div className="bookings-list"> /* Bookings list/grid */
                {bookings.length > 0 ? ( // Map over bookings with unique key for React reconciliation
                    bookings.map(b => (
                        <div className="booking-card" key={b._id}>
                            <h3>Booking Details</h3>
                            <div className="booking-details">
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Facility:</span>
                                    <span className="booking-detail-value">{b.facility?.name ?? '—'}</span> /* Optional chaining + fallback */
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Type:</span>
                                    <span className="booking-detail-value">{b.facility?.type ?? '—'}</span>/* Optional chaining + fallback */
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Date:</span>
                                    <span className="booking-detail-value">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</span>
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Time slot:</span>
                                    <span className="booking-detail-value">{b.timeSlot ?? '—'}</span>
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">User:</span>
                                    <span className="booking-detail-value">{b.user?.name ?? b.user?._id ?? '—'}</span> /* Prefer name, fallback to ID */
                                </div>
                            </div>
                            <div className="booking-actions">/* Action buttons */
                                <button className="btn btn-edit" onClick={() => handleEdit(b)}>Edit</button>
                                <button className="btn btn-delete" onClick={() => handleDelete(b._id)}>Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-bookings">/* Empty state */
                        <p>No bookings found. Create a new booking above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminBooking;