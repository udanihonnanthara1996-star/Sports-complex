import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import { getBookingsArray } from '../../utils/bookingsApi';
import BookingForm from '../UserBooking/BookingForm';
import './Adminbooking.css';
import AdminNav from '../Admin/AdminNav';

function AdminBooking() {
    const [bookings, setBookings] = useState([]);
    const [editingBooking, setEditingBooking] = useState(null);

    const fetchBookings = async () => {
        const res = await API.get('/api/v1/bookings');
        setBookings(getBookingsArray(res));
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleDelete = async (id) => {
        await API.delete(`/api/v1/bookings/${id}`);
        fetchBookings();
    };

    const handleEdit = (booking) => {
        setEditingBooking(booking);
    };

    return (
        <div className="admin-booking-container">
            <AdminNav />
            <div className="admin-booking-header">
                <h1>Admin Booking Management</h1>
                <p>Manage all bookings in the system</p>
            </div>
           
            <BookingForm 
                fetchBookings={fetchBookings} 
                editingBooking={editingBooking} 
                setEditingBooking={setEditingBooking}
            />
            
            <div className="bookings-list">
                {bookings.length > 0 ? (
                    bookings.map(b => (
                        <div className="booking-card" key={b._id}>
                            <h3>Booking Details</h3>
                            <div className="booking-details">
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Facility:</span>
                                    <span className="booking-detail-value">{b.facility?.name ?? '—'}</span>
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Type:</span>
                                    <span className="booking-detail-value">{b.facility?.type ?? '—'}</span>
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
                                    <span className="booking-detail-value">{b.user?.name ?? b.user?._id ?? '—'}</span>
                                </div>
                            </div>
                            <div className="booking-actions">
                                <button className="btn btn-edit" onClick={() => handleEdit(b)}>Edit</button>
                                <button className="btn btn-delete" onClick={() => handleDelete(b._id)}>Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-bookings">
                        <p>No bookings found. Create a new booking above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminBooking;