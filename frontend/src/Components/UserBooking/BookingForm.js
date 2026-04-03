import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import './BookingForm.css';



function BookingForm({ fetchBookings, editingBooking, setEditingBooking, userId }) {
    const [bookingData, setBookingData] = useState({ name: '', sport: '', date: '', time: '' });

    useEffect(() => {
        if (editingBooking) setBookingData(editingBooking);
    }, [editingBooking]);

    const handleChange = (e) => {
        setBookingData({ ...bookingData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBooking) {
                await API.put(`/api/v1/bookings/${editingBooking._id}`, bookingData);
                setEditingBooking(null);
            } else {
                await API.post('/api/v1/bookings', { ...bookingData, userId: userId || 'user1' });
            }
            setBookingData({ name: '', sport: '', date: '', time: '' });
            fetchBookings();
        } catch (err) {
            console.log(err);
        }
    };

    return (
         
        <div className="booking-form-container">
           <form className="booking-form" onSubmit={handleSubmit}>
                <h2>{editingBooking ? 'Edit Booking' : 'Create New Booking'}</h2>
                <input 
                    name="name" 
                    placeholder="Enter your name" 
                    value={bookingData.name} 
                    onChange={handleChange} 
                    required
                />
                <input 
                    name="sport" 
                    placeholder="Enter sport type" 
                    value={bookingData.sport} 
                    onChange={handleChange} 
                    required
                />
                <input 
                    type="date" 
                    name="date" 
                    value={bookingData.date} 
                    onChange={handleChange} 
                    required
                />
                <input 
                    type="time" 
                    name="time" 
                    value={bookingData.time} 
                    onChange={handleChange} 
                    required
                />
                <button type="submit">
                    {editingBooking ? 'Update Booking' : 'Add Booking'}
                </button>
            </form>
        </div>
    );
}

export default BookingForm;