const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all holidays
router.get("/", authenticateToken, (req, res) => {
  db.all("SELECT * FROM holidays ORDER BY date", (err, holidays) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(holidays);
  });
});

// Add holiday (admin only)
router.post("/", authenticateToken, isAdmin, (req, res) => {
  const { date, description } = req.body;

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  db.run(
    `INSERT INTO holidays (date, description) VALUES (?, ?)`,
    [date, description || "Holiday"],
    function(err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ error: "This date is already marked as a holiday" });
        }
        return res.status(500).json({ error: "Failed to add holiday" });
      }
      res.json({ message: "Holiday added successfully", id: this.lastID });
    }
  );
});

// Delete holiday (admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM holidays WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete holiday" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Holiday not found" });
    }
    res.json({ message: "Holiday deleted successfully" });
  });
});

// Extend all active due dates by one day when a holiday is added
router.post("/extend-due-dates", authenticateToken, isAdmin, (req, res) => {
  const { holidayDate } = req.body;

  if (!holidayDate) {
    return res.status(400).json({ error: "Holiday date is required" });
  }

  // Extend due dates that fall on the holiday
  db.run(
    `UPDATE borrowed_books
     SET dueDate = datetime(dueDate, '+1 day')
     WHERE status = 'borrowed' AND date(dueDate) = ?`,
    [holidayDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Failed to extend due dates" });
      }
      res.json({
        message: "Due dates extended successfully",
        affectedRecords: this.changes
      });
    }
  );
});

module.exports = router;
