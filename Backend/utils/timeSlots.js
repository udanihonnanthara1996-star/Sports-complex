const generateTimeSlots = (startHour = 6, endHour = 22, intervalMinutes = 60) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const start = `${String(h).padStart(2, '0')}:00`;
    const end = `${String(h + 1).padStart(2, '0')}:00`;
    slots.push({ start, end, label: `${start} - ${end}` });
  }
  return slots;
};

module.exports = { generateTimeSlots };
