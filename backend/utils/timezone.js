// Timezone helper for Philippine Standard Time (UTC+8)

// Get current Philippine time as a Date object
function getPhilippineTime() {
  // Create date string in Philippine timezone
  const now = new Date();
  const phTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  return new Date(phTimeString);
}

// Get Philippine time as a local datetime string (no timezone suffix)
// Format: YYYY-MM-DDTHH:MM:SS (without Z)
function getPhilippineISOString() {
  const ph = getPhilippineTime();
  const year = ph.getFullYear();
  const month = String(ph.getMonth() + 1).padStart(2, '0');
  const day = String(ph.getDate()).padStart(2, '0');
  const hours = String(ph.getHours()).padStart(2, '0');
  const minutes = String(ph.getMinutes()).padStart(2, '0');
  const seconds = String(ph.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Get Philippine time formatted for SQLite datetime
// Format: YYYY-MM-DD HH:MM:SS
function getPhilippineDateTimeString() {
  const ph = getPhilippineTime();
  const year = ph.getFullYear();
  const month = String(ph.getMonth() + 1).padStart(2, '0');
  const day = String(ph.getDate()).padStart(2, '0');
  const hours = String(ph.getHours()).padStart(2, '0');
  const minutes = String(ph.getMinutes()).padStart(2, '0');
  const seconds = String(ph.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Calculate due date in Philippine time (24 hours from now, skip Thursdays and holidays)
async function calculateDueDatePH(db) {
  return new Promise((resolve) => {
    const now = getPhilippineTime();
    const dueDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours later

    db.all("SELECT date FROM holidays", [], (err, holidays) => {
      if (err) {
        resolve(formatDateForStorage(dueDate));
        return;
      }

      const holidayDates = holidays.map(h => h.date);
      let adjustedDate = new Date(dueDate);
      let maxIterations = 30;

      while (maxIterations > 0) {
        const dayOfWeek = adjustedDate.getDay();
        const dateStr = formatDateOnly(adjustedDate);

        // Skip Thursdays (day 4) and holidays
        if (dayOfWeek === 4 || holidayDates.includes(dateStr)) {
          adjustedDate.setDate(adjustedDate.getDate() + 1);
          maxIterations--;
        } else {
          break;
        }
      }

      resolve(formatDateForStorage(adjustedDate));
    });
  });
}

// Helper: Format date for storage (YYYY-MM-DDTHH:MM:SS)
function formatDateForStorage(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Helper: Format date only (YYYY-MM-DD)
function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

module.exports = {
  getPhilippineTime,
  getPhilippineISOString,
  getPhilippineDateTimeString,
  calculateDueDatePH,
  formatDateForStorage,
  formatDateOnly
};
