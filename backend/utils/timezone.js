// Timezone helper - uses server's local time
// If your server is in Philippines, this will automatically be Philippine time

// Get current local time as a formatted string (no Z suffix)
// Format: YYYY-MM-DDTHH:MM:SS
function getLocalISOString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Alias for backward compatibility
function getPhilippineISOString() {
  return getLocalISOString();
}

// Get local time as Date object
function getLocalTime() {
  return new Date();
}

// Alias for backward compatibility
function getPhilippineTime() {
  return getLocalTime();
}

// Calculate due date: 24 hours from now, skip Thursdays and holidays
async function calculateDueDatePH(db) {
  return new Promise((resolve) => {
    const now = new Date();
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

// Helper: Format date for storage (YYYY-MM-DDTHH:MM:SS) - no Z suffix
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
  getLocalISOString,
  getLocalTime,
  getPhilippineTime,
  getPhilippineISOString,
  calculateDueDatePH,
  formatDateForStorage,
  formatDateOnly
};
