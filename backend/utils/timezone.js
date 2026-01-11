// Timezone helper for Philippine Standard Time (UTC+8)

// Get current time in Philippine timezone
function getPhilippineTime() {
  const now = new Date();
  // Add 8 hours for Philippine timezone (UTC+8)
  const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return phTime;
}

// Get Philippine time as ISO string (for database storage)
function getPhilippineISOString() {
  return getPhilippineTime().toISOString();
}

// Get Philippine time formatted for SQLite datetime
function getPhilippineDateTimeString() {
  const ph = getPhilippineTime();
  return ph.toISOString().slice(0, 19).replace('T', ' ');
}

// Convert UTC date to Philippine time
function utcToPhilippine(utcDateString) {
  if (!utcDateString) return null;
  const utcDate = new Date(utcDateString);
  const phTime = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  return phTime;
}

// Format date for display (Philippine time)
function formatPhilippineDate(dateString) {
  if (!dateString) return '';
  const date = utcToPhilippine(dateString);
  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Calculate due date in Philippine time (24 hours from now, skip Thursdays and holidays)
async function calculateDueDatePH(db) {
  return new Promise((resolve) => {
    const now = getPhilippineTime();
    const dueDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours later

    db.all("SELECT date FROM holidays", [], (err, holidays) => {
      if (err) {
        resolve(dueDate.toISOString());
        return;
      }

      const holidayDates = holidays.map(h => h.date);
      let adjustedDate = new Date(dueDate);
      let maxIterations = 30;

      while (maxIterations > 0) {
        const dayOfWeek = adjustedDate.getDay();
        const dateStr = adjustedDate.toISOString().split('T')[0];

        // Skip Thursdays (day 4) and holidays
        if (dayOfWeek === 4 || holidayDates.includes(dateStr)) {
          adjustedDate.setDate(adjustedDate.getDate() + 1);
          maxIterations--;
        } else {
          break;
        }
      }

      resolve(adjustedDate.toISOString());
    });
  });
}

module.exports = {
  getPhilippineTime,
  getPhilippineISOString,
  getPhilippineDateTimeString,
  utcToPhilippine,
  formatPhilippineDate,
  calculateDueDatePH
};
