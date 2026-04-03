import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import BookingForm from '../UserBooking/BookingForm';
import './Adminbooking.css';
import AdminNav from '../Admin/AdminNav';

function AdminBooking() {
    const [bookings, setBookings] = useState([]);
    const [editingBooking, setEditingBooking] = useState(null);

    const fetchBookings = async () => {
        const res = await API.get('/api/v1/bookings');
        setBookings(res.data);
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
                                    <span className="booking-detail-label">Name:</span>
                                    <span className="booking-detail-value">{b.name}</span>
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Sport:</span>
                                    <span className="booking-detail-value">{b.sport}</span>
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Date:</span>
                                    <span className="booking-detail-value">{new Date(b.date).toLocaleDateString()}</span>
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">Time:</span>
                                    <span className="booking-detail-value">{b.time}</span>
                                </div>
                                <div className="booking-detail">
                                    <span className="booking-detail-label">User ID:</span>
                                    <span className="booking-detail-value">{b.userId}</span>
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