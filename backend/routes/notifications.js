const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { getLocalISOString, formatDateForStorage } = require("../utils/timezone");

const router = express.Router();

// Store notification subscriptions in memory (for local use)
// In production, you'd store these in the database
const subscriptions = new Map();

// Subscribe to notifications
router.post("/subscribe", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { subscription, enabled } = req.body;

  subscriptions.set(userId, {
    subscription,
    enabled: enabled !== false,
    subscribedAt: getLocalISOString()
  });

  console.log(`[Notifications] User ${userId} subscribed to notifications`);
  res.json({ message: "Subscribed to notifications", enabled: true });
});

// Unsubscribe from notifications
router.post("/unsubscribe", authenticateToken, (req, res) => {
  const userId = req.user.id;
  subscriptions.delete(userId);
  console.log(`[Notifications] User ${userId} unsubscribed from notifications`);
  res.json({ message: "Unsubscribed from notifications" });
});

// Check due dates for current user
router.get("/check-due-dates", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Get borrowed books that are due soon or overdue
  db.all(
    `SELECT
      bb.id,
      bb.bookId,
      bb.borrowDate,
      bb.dueDate,
      bb.status,
      b.title,
      b.author
    FROM borrowed_books bb
    JOIN books b ON bb.bookId = b.id
    WHERE bb.userId = ? AND bb.status = 'borrowed'
    ORDER BY bb.dueDate ASC`,
    [userId],
    (err, books) => {
      if (err) {
        console.error("Error checking due dates:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const dueSoon = [];
      const overdue = [];

      books.forEach(book => {
        const dueDate = new Date(book.dueDate);

        if (dueDate < now) {
          // Overdue
          overdue.push({
            id: book.id,
            bookId: book.bookId,
            title: book.title,
            author: book.author,
            dueDate: book.dueDate,
            daysOverdue: Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24))
          });
        } else if (dueDate <= twoDaysFromNow) {
          // Due within 2 days
          dueSoon.push({
            id: book.id,
            bookId: book.bookId,
            title: book.title,
            author: book.author,
            dueDate: book.dueDate,
            daysUntilDue: Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
          });
        }
      });

      res.json({
        dueSoon,
        overdue,
        totalBorrowed: books.length,
        checkedAt: getLocalISOString()
      });
    }
  );
});

// Get notification settings for current user
router.get("/settings", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const settings = subscriptions.get(userId);

  res.json({
    enabled: settings?.enabled || false,
    subscribedAt: settings?.subscribedAt || null
  });
});

// Update notification settings
router.put("/settings", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { enabled, dueDaysWarning } = req.body;

  const existing = subscriptions.get(userId) || {};
  subscriptions.set(userId, {
    ...existing,
    enabled: enabled !== false,
    dueDaysWarning: dueDaysWarning || 2,
    updatedAt: getLocalISOString()
  });

  res.json({ message: "Settings updated", enabled: enabled !== false });
});

// Get all users with books due soon (for admin/system use)
router.get("/all-due-soon", authenticateToken, (req, res) => {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  db.all(
    `SELECT
      bb.id,
      bb.userId,
      bb.bookId,
      bb.dueDate,
      b.title,
      u.name as userName,
      u.email as userEmail,
      u.studentNumber
    FROM borrowed_books bb
    JOIN books b ON bb.bookId = b.id
    JOIN users u ON bb.userId = u.id
    WHERE bb.status = 'borrowed' AND bb.dueDate <= ?
    ORDER BY bb.dueDate ASC`,
    [formatDateForStorage(twoDaysFromNow)],
    (err, books) => {
      if (err) {
        console.error("Error fetching due soon books:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const dueSoon = [];
      const overdue = [];

      books.forEach(book => {
        const dueDate = new Date(book.dueDate);
        const bookData = {
          ...book,
          isOverdue: dueDate < now
        };

        if (dueDate < now) {
          overdue.push(bookData);
        } else {
          dueSoon.push(bookData);
        }
      });

      res.json({ dueSoon, overdue, total: books.length });
    }
  );
});

// Test notification endpoint
router.post("/test", authenticateToken, (req, res) => {
  console.log(`[Notifications] Test notification for user ${req.user.id}`);
  res.json({
    message: "Test notification sent",
    title: "Test Notification",
    body: "This is a test notification from CvSU Library"
  });
});

module.exports = router;
