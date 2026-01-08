const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Smart check-in/out (toggles based on current status)
router.post("/toggle", authenticateToken, isAdmin, (req, res) => {
  const { studentNumber } = req.body;

  if (!studentNumber) {
    return res.status(400).json({ error: "Student number is required" });
  }

  // First, get user info
  db.get(
    "SELECT id, name, email FROM users WHERE studentNumber = ?",
    [studentNumber],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Check current status
      db.get(
        "SELECT * FROM current_status WHERE userId = ?",
        [user.id],
        (err, status) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          const isCheckedIn = status && status.checkedIn === 1;
          const action = isCheckedIn ? "checkout" : "checkin";
          const timestamp = new Date().toISOString();

          // Log the action
          db.run(
            `INSERT INTO attendance_logs (userId, studentNumber, action, timestamp)
             VALUES (?, ?, ?, ?)`,
            [user.id, studentNumber, action, timestamp],
            (err) => {
              if (err) {
                return res.status(500).json({ error: "Failed to log attendance" });
              }

              // Update current status
              if (!status) {
                // Create new status entry
                db.run(
                  `INSERT INTO current_status (userId, studentNumber, checkedIn, lastCheckIn)
                   VALUES (?, ?, 1, ?)`,
                  [user.id, studentNumber, timestamp],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: "Failed to update status" });
                    }
                    res.json({
                      success: true,
                      action: "checkin",
                      user: user,
                      timestamp: timestamp
                    });
                  }
                );
              } else {
                // Update existing status
                const newCheckedIn = isCheckedIn ? 0 : 1;
                const updateField = isCheckedIn ? "lastCheckOut" : "lastCheckIn";
                
                db.run(
                  `UPDATE current_status 
                   SET checkedIn = ?, ${updateField} = ?
                   WHERE userId = ?`,
                  [newCheckedIn, timestamp, user.id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: "Failed to update status" });
                    }
                    res.json({
                      success: true,
                      action: action,
                      user: user,
                      timestamp: timestamp
                    });
                  }
                );
              }
            }
          );
        }
      );
    }
  );
});

// Get current checked-in count
router.get("/current-count", authenticateToken, (req, res) => {
  db.get(
    "SELECT COUNT(*) as count FROM current_status WHERE checkedIn = 1",
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ checkedInCount: result.count });
    }
  );
});

// Get attendance logs (for admin)
router.get("/logs", authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT l.*, u.name 
     FROM attendance_logs l
     JOIN users u ON l.userId = u.id
     ORDER BY l.timestamp DESC
     LIMIT 100`,
    (err, logs) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(logs);
    }
  );
});

// Get user's attendance history
router.get("/my-history", authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM attendance_logs 
     WHERE userId = ?
     ORDER BY timestamp DESC
     LIMIT 50`,
    [req.user.id],
    (err, logs) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(logs);
    }
  );
});

module.exports = router;