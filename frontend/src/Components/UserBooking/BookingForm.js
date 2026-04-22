import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import './BookingForm.css';

function BookingForm({ fetchBookings, editingBooking, setEditingBooking }) {
    const [facilities, setFacilities] = useState([]);
    const [bookingData, setBookingData] = useState({ facilityId: '', date: '', timeSlot: '', duration: 1, notes: '' });
    const [error, setError] = useState('');
    const [loadingFacilities, setLoadingFacilities] = useState(true);

    useEffect(() => {
        const loadFacilities = async () => {
            try {
                const res = await API.get('/api/v1/facilities');
                setFacilities(res.data?.facilities || []);
            } catch (err) {
                console.warn('Failed to load facilities:', err.message || err);
                setFacilities([]);
            } finally {
                setLoadingFacilities(false);
            }
        };

        loadFacilities();
    }, []);

    useEffect(() => {
        if (editingBooking) {
            setBookingData({
                facilityId: editingBooking.facility?._id || '',
                date: editingBooking.date ? new Date(editingBooking.date).toISOString().slice(0, 10) : '',
                timeSlot: editingBooking.timeSlot || '',
                duration: editingBooking.duration || 1,
                notes: editingBooking.notes || ''
            });
        }
    }, [editingBooking]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBooking) {
                await API.put(`/api/v1/bookings/${editingBooking._id}`, bookingData);
                setEditingBooking(null);
            } else {
                await API.post('/api/v1/bookings', bookingData);
            }
            setBookingData({ facilityId: '', date: '', timeSlot: '', duration: 1, notes: '' });
            setError('');
            fetchBookings();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save booking');
            console.error(err);
        }
    };

    return (
        <div className="booking-form-container">
            <form className="booking-form" onSubmit={handleSubmit}>
                <h2>{editingBooking ? 'Edit Booking' : 'Create New Booking'}</h2>

                {error && <div className="booking-error">{error}</div>}

                <label htmlFor="facilityId">Choose a facility</label>
                <select
                    id="facilityId"
                    name="facilityId"
                    value={bookingData.facilityId}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>
                        {loadingFacilities ? 'Loading facilities...' : facilities.length ? 'Select facility' : 'No facilities available'}
                    </option>
                    {facilities.map((facility) => (
                        <option key={facility._id} value={facility._id}>
                            {facility.name} ({facility.type.replace('_', ' ')})
                        </option>
                    ))}
                </select>
                {(!loadingFacilities && !facilities.length) && (
                    <div className="booking-info">No active facilities are available right now. Please check back later or contact support.</div>
                )}

                <label htmlFor="date">Date</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="timeSlot">Time</label>
                <input
                    type="time"
                    id="timeSlot"
                    name="timeSlot"
                    value={bookingData.timeSlot}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="duration">Duration (hours)</label>
                <input
                    type="number"
                    id="duration"
                    name="duration"
                    min="1"
                    value={bookingData.duration}
                    onChange={handleChange}
                />

                <label htmlFor="notes">Notes</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={bookingData.notes}
                    onChange={handleChange}
                    placeholder="Optional notes"
                />

                <button type="submit">
                    {editingBooking ? 'Update Booking' : 'Add Booking'}
                </button>
            </form>
        </div>
    );
}

export default BookingForm;