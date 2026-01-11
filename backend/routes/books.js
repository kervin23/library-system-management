const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Calculate due date: 24 hours, skip Thursdays and holidays
async function calculateDueDate() {
  return new Promise((resolve, reject) => {
    // Start with 24 hours from now
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 24);

    // Get all holidays from database
    db.all("SELECT date FROM holidays", [], (err, holidays) => {
      if (err) {
        console.error("Error fetching holidays:", err);
        // If error, just return 24h without holiday check
        resolve(adjustForThursday(dueDate).toISOString());
        return;
      }

      const holidayDates = holidays.map(h => h.date);

      // Adjust due date to skip Thursdays and holidays
      let adjustedDate = new Date(dueDate);
      let maxIterations = 30; // Prevent infinite loop

      while (maxIterations > 0) {
        const dayOfWeek = adjustedDate.getDay();
        const dateStr = adjustedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Check if Thursday (4) or a holiday
        if (dayOfWeek === 4 || holidayDates.includes(dateStr)) {
          // Move to next day
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

// Helper function to adjust for Thursday only (sync version for fallback)
function adjustForThursday(date) {
  const adjustedDate = new Date(date);
  // If Thursday (4), move to Friday
  if (adjustedDate.getDay() === 4) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  return adjustedDate;
}

// Get all books
router.get("/", authenticateToken, (req, res) => {
  db.all("SELECT * FROM books ORDER BY title", (err, books) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(books);
  });
});

// Add book (admin only)
router.post("/", authenticateToken, isAdmin, (req, res) => {
  const { title, author, isbn, totalCopies } = req.body;
  
  db.run(
    `INSERT INTO books (title, author, isbn, available, totalCopies)
     VALUES (?, ?, ?, ?, ?)`,
    [title, author, isbn, totalCopies || 1, totalCopies || 1],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Failed to add book" });
      }
      res.json({ message: "Book added successfully", bookId: this.lastID });
    }
  );
});

// Borrow book
router.post("/borrow", authenticateToken, async (req, res) => {
  const { bookId } = req.body;
  const userId = req.user.id;

  // Check if user already has 2 books
  db.get(
    `SELECT COUNT(*) as count FROM borrowed_books
     WHERE userId = ? AND status = 'borrowed'`,
    [userId],
    async (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (result.count >= 2) {
        return res.status(400).json({
          error: "You can only borrow 2 books at a time",
          current: result.count,
          max: 2
        });
      }

      // Check if book is available
      db.get("SELECT * FROM books WHERE id = ?", [bookId], async (err, book) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        if (!book) {
          return res.status(404).json({ error: "Book not found" });
        }
        if (book.available < 1) {
          return res.status(400).json({ error: "Book not available" });
        }

        // Calculate due date (24h, skipping Thursdays and holidays)
        const dueDate = await calculateDueDate();

        // Create borrow record
        db.run(
          `INSERT INTO borrowed_books (userId, bookId, dueDate)
           VALUES (?, ?, ?)`,
          [userId, bookId, dueDate],
          function(err) {
            if (err) {
              return res.status(500).json({ error: "Failed to borrow book" });
            }

            // Update book availability
            db.run(
              "UPDATE books SET available = available - 1 WHERE id = ?",
              [bookId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: "Failed to update book" });
                }
                res.json({ 
                  message: "Book borrowed successfully",
                  dueDate: dueDate,
                  borrowId: this.lastID
                });
              }
            );
          }
        );
      });
    }
  );
});

// Return book
router.post("/return/:borrowId", authenticateToken, (req, res) => {
  const { borrowId } = req.params;
  const userId = req.user.id;

  db.get(
    "SELECT * FROM borrowed_books WHERE id = ? AND userId = ?",
    [borrowId, userId],
    (err, borrow) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!borrow) {
        return res.status(404).json({ error: "Borrow record not found" });
      }
      if (borrow.status === 'returned') {
        return res.status(400).json({ error: "Book already returned" });
      }

      const returnDate = new Date().toISOString();

      // Update borrow record
      db.run(
        `UPDATE borrowed_books 
         SET status = 'returned', returnDate = ?
         WHERE id = ?`,
        [returnDate, borrowId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to return book" });
          }

          // Update book availability
          db.run(
            "UPDATE books SET available = available + 1 WHERE id = ?",
            [borrow.bookId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: "Failed to update book" });
              }
              res.json({ message: "Book returned successfully" });
            }
          );
        }
      );
    }
  );
});

// Admin return book (any borrow record)
router.post("/admin-return/:borrowId", authenticateToken, isAdmin, (req, res) => {
  const { borrowId } = req.params;

  db.get(
    "SELECT * FROM borrowed_books WHERE id = ?",
    [borrowId],
    (err, borrow) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!borrow) {
        return res.status(404).json({ error: "Borrow record not found" });
      }
      if (borrow.status === 'returned') {
        return res.status(400).json({ error: "Book already returned" });
      }

      const returnDate = new Date().toISOString();

      // Update borrow record
      db.run(
        `UPDATE borrowed_books 
         SET status = 'returned', returnDate = ?
         WHERE id = ?`,
        [returnDate, borrowId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to return book" });
          }

          // Update book availability
          db.run(
            "UPDATE books SET available = available + 1 WHERE id = ?",
            [borrow.bookId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: "Failed to update book" });
              }
              res.json({ message: "Book returned successfully" });
            }
          );
        }
      );
    }
  );
});

// Get all borrowed books (admin only)
router.get("/all-borrowed", authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT bb.*, b.title, b.author, b.isbn, u.name as studentName, u.studentNumber
     FROM borrowed_books bb
     JOIN books b ON bb.bookId = b.id
     JOIN users u ON bb.userId = u.id
     WHERE bb.status = 'borrowed'
     ORDER BY bb.borrowDate DESC`,
    (err, books) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(books);
    }
  );
});

// Get user's borrowed books
router.get("/my-books", authenticateToken, (req, res) => {
  db.all(
    `SELECT bb.*, b.title, b.author, b.isbn
     FROM borrowed_books bb
     JOIN books b ON bb.bookId = b.id
     WHERE bb.userId = ?
     ORDER BY bb.borrowDate DESC`,
    [req.user.id],
    (err, books) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(books);
    }
  );
});

// Get borrow stats for user
router.get("/my-stats", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const now = new Date().toISOString();

  db.get(
    `SELECT 
       COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as borrowed,
       COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned,
       COUNT(CASE WHEN status = 'borrowed' AND dueDate < ? THEN 1 END) as overdue
     FROM borrowed_books
     WHERE userId = ?`,
    [now, userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({
        borrowed: stats.borrowed || 0,
        returned: stats.returned || 0,
        overdue: stats.overdue || 0,
        maxBooks: 2
      });
    }
  );
});

// Get user's complete history (for history page)
router.get("/my-history", authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Get all borrow/return activities
  db.all(
    `SELECT
      id,
      bookId,
      borrowDate as timestamp,
      'borrow' as type,
      (SELECT title FROM books WHERE id = bookId) as details
     FROM borrowed_books
     WHERE userId = ?
     UNION ALL
     SELECT
      id,
      bookId,
      returnDate as timestamp,
      'return' as type,
      (SELECT title FROM books WHERE id = bookId) as details
     FROM borrowed_books
     WHERE userId = ? AND returnDate IS NOT NULL
     ORDER BY timestamp DESC
     LIMIT 100`,
    [userId, userId],
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(history);
    }
  );
});

// Get complete history for admin (all borrow/return activities)
router.get("/admin-history", authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT
      bb.id,
      bb.bookId,
      bb.userId,
      bb.borrowDate,
      bb.dueDate,
      bb.returnDate,
      bb.status,
      b.title as bookTitle,
      b.author as bookAuthor,
      u.name as studentName,
      u.studentNumber,
      CASE
        WHEN bb.status = 'borrowed' AND bb.dueDate < datetime('now') THEN 1
        ELSE 0
      END as isOverdue
     FROM borrowed_books bb
     JOIN books b ON bb.bookId = b.id
     JOIN users u ON bb.userId = u.id
     ORDER BY bb.borrowDate DESC
     LIMIT 500`,
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(history);
    }
  );
});

// Update book (admin only)
router.put("/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, totalCopies, imageUrl } = req.body;

  // First get the current book to calculate available copies
  db.get("SELECT * FROM books WHERE id = ?", [id], (err, book) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Calculate new available copies
    const borrowedCopies = book.totalCopies - book.available;
    const newAvailable = Math.max(0, totalCopies - borrowedCopies);

    db.run(
      `UPDATE books SET title = ?, author = ?, isbn = ?, totalCopies = ?, available = ?, imageUrl = ? WHERE id = ?`,
      [title, author, isbn, totalCopies, newAvailable, imageUrl || null, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: "Failed to update book" });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Book not found" });
        }
        res.json({ message: "Book updated successfully" });
      }
    );
  });
});

// Delete book (admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  // Check if book has any active borrows
  db.get(
    "SELECT COUNT(*) as count FROM borrowed_books WHERE bookId = ? AND status = 'borrowed'",
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (result.count > 0) {
        return res.status(400).json({ error: "Cannot delete book with active borrows" });
      }

      db.run("DELETE FROM books WHERE id = ?", [id], function(err) {
        if (err) {
          return res.status(500).json({ error: "Failed to delete book" });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Book not found" });
        }
        res.json({ message: "Book deleted successfully" });
      });
    }
  );
});

module.exports = router;