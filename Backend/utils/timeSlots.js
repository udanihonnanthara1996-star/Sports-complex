// Generate a list of hourly time slots between a start and end hour
const generateTimeSlots = (startHour = 6, endHour = 22, intervalMinutes = 60) => {
  // Store all generated slots in an array
  const slots = [];
  // Loop through each hour in the given range
  for (let h = startHour; h < endHour; h++) {
    // Format the start time as HH:00
    const start = `${String(h).padStart(2, '0')}:00`;
    // Format the end time as the next hour in HH:00 format
    const end = `${String(h + 1).padStart(2, '0')}:00`;
    // Save the slot with start, end, and a readable label
    slots.push({ start, end, label: `${start} - ${end}` });
  }
  // Return the complete list of generated slots
  return slots;
};

// Export the helper function for use in other files
module.exports = { generateTimeSlots };
