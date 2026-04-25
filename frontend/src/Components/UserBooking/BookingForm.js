import React, { useState, useEffect } from 'react';
import API from '../../utils/api';// Custom API wrapper for backend calls
import './BookingForm.css';// Component-specific styles

/**
 * BookingForm Component
 * - Reusable form for CREATE NEW or EDIT EXISTING bookings
 * - Real-time price calculation with membership discounts
 * - Fetches facilities and membership status on mount
 * - Handles both create (POST) and update (PUT) operations
 */
function BookingForm({ fetchBookings, editingBooking, setEditingBooking })
//fetchBookings: Callback to refresh parent bookings list
//editingBooking: Booking object when editing (null = create mode)
//setEditingBooking: Callback to exit edit mode
{
    // === FORM STATE ===
    const [facilities, setFacilities] = useState([]);// Available facilities list
    const [bookingData, setBookingData] = useState({ facilityId: '', date: '', timeSlot: '', duration: 1, notes: '' });// Form input values
    const [error, setError] = useState('');// Form validation/API errors
    const [success, setSuccess] = useState('');// Success messages
    const [loadingFacilities, setLoadingFacilities] = useState(true);// Facilities loading spinner

     // === ADVANCED FEATURES STATE ===
    // Membership discount state
    const [membershipInfo, setMembershipInfo] = useState(null); // { hasActiveMembership, discountPercentage, planName }
    const [selectedFacility, setSelectedFacility] = useState(null);
    // Currently selected facility object for price calculations
    // === INITIAL DATA LOADING ===
    /**
     * Load facilities and check membership status on component mount
     * - Facilities: Dropdown options with price/type info
     * - Membership: Automatic discount eligibility check
     */

    useEffect(() => {
        const loadFacilities = async () => {
            try {
                const res = await API.get('/api/v1/facilities');// GET all available facilities
                setFacilities(res.data?.facilities || []);// Handle various response formats
            } catch (err) {
                console.warn('Failed to load facilities:', err.message || err);
                setFacilities([]);// Graceful degradation
            } finally {
                setLoadingFacilities(false);
            }
        };
        loadFacilities();

        // Check user membership status for automatic discounts
        API.get('/api/v1/memberships/check-status')
            .then(res => setMembershipInfo(res.data))// Store membership details
            .catch(() => setMembershipInfo(null));// No membership = no discount
    }, []);

   // === EDIT MODE POPULATION ===
    /**
     * Populate form when editing existing booking
     * - Converts backend date (ISO) to input format (YYYY-MM-DD)
     * - Preserves all existing field values
     */
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

    // === FACILITY SELECTION TRACKING ===
    /**
     * Track selected facility for real-time price calculation
     * - Updates when facility dropdown changes OR facilities list loads
     */
    useEffect(() => {
        if (bookingData.facilityId) {
            const found = facilities.find(f => f._id === bookingData.facilityId);
            setSelectedFacility(found || null);
        } else {
            setSelectedFacility(null);
        }
    }, [bookingData.facilityId, facilities]);

    // === FORM INPUT HANDLER ===
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Preserve duration as number, others as strings
        setBookingData((prev) => ({ ...prev, [name]: name === 'duration' ? Number(value) : value }));
    };

    // === FORM SUBMISSION ===
    /**
     * Handles both CREATE (POST) and UPDATE (PUT) operations
     * - Dynamic endpoint based on edit/create mode
     * - Clears form and refreshes parent list on success
     * - Comprehensive error handling with user feedback
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (editingBooking) { // UPDATE existing booking
                await API.put(`/api/v1/bookings/${editingBooking._id}`, bookingData);
                setEditingBooking(null);// Exit edit mode
                setSuccess('✅ Booking updated successfully!');
            } else { // CREATE new booking
                await API.post('/api/v1/bookings', bookingData);
                setSuccess('✅ Booking created successfully!');
            }
            // Reset form for next booking
            setBookingData({ facilityId: '', date: '', timeSlot: '', duration: 1, notes: '' });
            fetchBookings();// Refresh parent bookings list
        } catch (err) { // Prioritize backend validation messages
            setError(err.response?.data?.message || err.message || 'Failed to save booking');
            console.error(err);
        }
    };
    // === REAL-TIME PRICE CALCULATION ===
    // Price preview calculation
    const duration = Number(bookingData.duration) || 1;
    const pricePerHour = selectedFacility?.pricePerHour || 0;
    const basePrice = pricePerHour * duration;
    // Base cost before discounts
    const discountPct = membershipInfo?.hasActiveMembership ? (membershipInfo.discountPercentage || 0) : 0;
   // Discount amount
    const discountAmt = parseFloat((basePrice * discountPct / 100).toFixed(2));
    // Final payable
    const finalPrice = parseFloat((basePrice - discountAmt).toFixed(2));

    return (
        <div className="booking-form-container">
            {/* ── Membership Discount Banner ───────────────────────── */}
            {membershipInfo?.hasActiveMembership && (
                <div className="membership-discount-banner">
                    <span className="discount-banner-icon">
                        {membershipInfo.planName === 'Gold' ? '🥇' : membershipInfo.planName === 'Platinum' ? '💎' : '🥈'}
                    </span>
                    <div className="discount-banner-text">
                        <strong>{membershipInfo.planName} Member Discount Active!</strong>
                        <span>You get <strong>{membershipInfo.discountPercentage}% OFF</strong> on this booking automatically.</span>
                    </div>
                </div>
            )}
             {/* ── MEMBERSHIP UPSELL ─────────────────────────────────── */}
            {!membershipInfo?.hasActiveMembership && membershipInfo !== null && (
                <div className="no-membership-hint">
                    💡 <a href="/membership/plans">Get a Membership</a> and save up to 25% on every booking!
                </div>
            )}
            {/* ── MAIN FORM ─────────────────────────────────────────── */}
            <form className="booking-form" onSubmit={handleSubmit}>
                <h2>{editingBooking ? 'Edit Booking' : 'Create New Booking'}</h2>
              /* Form feedback */
                {error && <div className="booking-error">{error}</div>}
                {success && <div className="booking-success">{success}</div>}
                {/* ── FACILITY SELECTOR ────────────────────────────────── */}
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
                            {facility.name} ({facility.type.replace('_', ' ')}) — LKR {facility.pricePerHour}/hr
                        </option>
                    ))}
                </select>
                {(!loadingFacilities && !facilities.length) && (
                    <div className="booking-info">No active facilities are available right now. Please check back later or contact support.</div>
                )}
                {/* ── DATE & TIME ──────────────────────────────────────── */}
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
                {/* ── DURATION & NOTES ─────────────────────────────────── */}
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

                {/* ── Price Preview ──────────────────────────────────── */}
                {selectedFacility && (
                    <div className="price-preview-box">
                        <div className="price-preview-row">
                            <span>Base price ({duration} hr{duration > 1 ? 's' : ''} × LKR {pricePerHour})</span>
                            <span>LKR {basePrice.toLocaleString()}</span>
                        </div>
                        {discountPct > 0 && (
                            <div className="price-preview-row discount-row">
                                <span>{membershipInfo.planName} discount ({discountPct}%)</span>
                                <span>− LKR {discountAmt.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="price-preview-divider" />
                        <div className="price-preview-row price-total-row">
                            <strong>Total</strong>
                            <strong>LKR {finalPrice.toLocaleString()}</strong>
                        </div>
                    </div>
                )}
        {/* ── SUBMIT BUTTON ────────────────────────────────────── */}
                <button type="submit">
                    {editingBooking ? 'Update Booking' : 'Add Booking'}
                </button>
            </form>
        </div>
    );
}

export default BookingForm;