const validateEmail = (email) => /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email);
const validatePhone = (phone) => /^\+?[1-9]\d{7,14}$/.test(phone);

const validateBookingInput = (data) => {
  const errors = [];
  if (!data.facilityId) errors.push('Facility is required');
  if (!data.date) errors.push('Date is required');
  if (!data.timeSlot) errors.push('Time slot is required');
  if (new Date(data.date) < new Date().setHours(0,0,0,0)) errors.push('Cannot book past dates');
  return errors;
};

module.exports = { validateEmail, validatePhone, validateBookingInput };