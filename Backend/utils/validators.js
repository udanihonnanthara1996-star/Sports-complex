// Validate whether a string is in a basic email format
const validateEmail = (email) => /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email);
// Validate whether a phone number matches an international-style format
const validatePhone = (phone) => /^\+?[1-9]\d{7,14}$/.test(phone);
// Validate the required booking fields and basic date rules
const validateBookingInput = (data) => {
  // Collect validation errors in one array
  const errors = [];
  // Facility must be provided
  if (!data.facilityId) errors.push('Facility is required');
  // Booking date must be provided
  if (!data.date) errors.push('Date is required');
  // Time slot must be provided
  if (!data.timeSlot) errors.push('Time slot is required');
  // Prevent bookings for dates earlier than today
  if (new Date(data.date) < new Date().setHours(0,0,0,0)) errors.push('Cannot book past dates');
  // Return all validation errors
  return errors;
};
// Export validation helpers for use in controllers or routes
module.exports = { validateEmail, validatePhone, validateBookingInput };