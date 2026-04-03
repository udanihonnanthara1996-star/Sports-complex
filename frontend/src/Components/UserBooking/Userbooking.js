import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import BookingForm from './BookingForm';
import './Userbooking.css';
import Nav from '../Nav/Nav';


function UserBooking({ userId }) {
    const [bookings, setBookings] = useState([]);

    const fetchBookings = async () => {
        const res = await API.get('/api/v1/bookings');
        setBookings(res.data.filter(b => b.userId === userId)); // only their own bookings
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return (        
        <div className="user-booking-container">
            <Nav />
            <div className="user-booking-header">
                <h1>Your Bookings</h1>
                <p>Manage your personal bookings</p>
            </div>
            
            <BookingForm fetchBookings={fetchBookings} userId={userId}/>
            
            <div className="user-bookings-list">
                {bookings.length > 0 ? (
                    bookings.map(b => (
                        <div className="user-booking-card" key={b._id}>
                            <h3>Booking Details</h3>
                            <div className="user-booking-details">
                                <div className="user-booking-detail">
                                    <span className="user-booking-detail-label">Name:</span>
                                    <span className="user-booking-detail-value">{b.name}</span>
                                </div>
                                <div className="user-booking-detail">
                                    <span className="user-booking-detail-label">Sport:</span>
                                    <span className="user-booking-detail-value">{b.sport}</span>
                                </div>
                                <div className="user-booking-detail">
                                    <span className="user-booking-detail-label">Date:</span>
                                    <span className="user-booking-detail-value">{new Date(b.date).toLocaleDateString()}</span>
                                </div>
                                <div className="user-booking-detail">
                                    <span className="user-booking-detail-label">Time:</span>
                                    <span className="user-booking-detail-value">{b.time}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-user-bookings">
                        <p>You don't have any bookings yet. Create your first booking above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserBooking;