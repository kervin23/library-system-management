const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Create pending request (student side)
router.post("/create", authenticateToken, (req, res) => {
  const { type, bookId, bookTitle, pcNumber, pcName, transactionId } = req.body;
  const userId = req.user.id;
  const studentNumber = req.user.studentNumber;
  const studentName = req.user.name;

  // Check if user already has a pending request
  db.get(
    `SELECT * FROM pending_requests WHERE userId = ? AND status = 'pending'`,
    [userId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      if (existing) {
        return res.status(400).json({ 
          error: "You already have a pending request. Please wait for admin approval." 
        });
      }

      // Create the request
      db.run(
        `INSERT INTO pending_requests 
         (userId, studentNumber, studentName, type, bookId, bookTitle, pcNumber, pcName, transactionId, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [userId, studentNumber, studentName, type, bookId || null, bookTitle || null, 
         pcNumber || null, pcName || null, transactionId || null],
        function(err) {
          if (err) {
            console.error("Error creating request:", err);
            return res.status(500).json({ error: "Failed to create request" });
          }
          
          res.json({ 
            message: "Request created successfully",
            requestId: this.lastID,
            studentNumber: studentNumber
          });
        }
      );
    }
  );
});

// Get all pending requests (admin only)
router.get("/pending", authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT * FROM pending_requests 
     WHERE status = 'pending' 
     ORDER BY createdAt DESC`,
    (err, requests) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(requests);
    }
  );
});

// Approve request (admin only)
router.post("/approve/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { verifiedStudentNumber } = req.body;

  // Get the request
  db.get(
    `SELECT * FROM pending_requests WHERE id = ?`,
    [id],
    (err, request) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ error: "Request already processed" });
      }

      // Verify student number
      if (verifiedStudentNumber !== request.studentNumber) {
        return res.status(400).json({ error: "Student number does not match" });
      }

      // Process based on request type
      if (request.type === 'borrow_book') {
        // Check book availability
        db.get("SELECT * FROM books WHERE id = ?", [request.bookId], (err, book) => {
          if (err || !book || book.available < 1) {
            return res.status(400).json({ error: "Book not available" });
          }

          // Calculate due date
          const now = new Date();
          const dayOfWeek = now.getDay();
          let daysToAdd = (dayOfWeek >= 1 && dayOfWeek <= 3) ? 2 : (dayOfWeek === 4 ? 4 : 2);
          const dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + daysToAdd);

          // Create borrow record
          db.run(
            `INSERT INTO borrowed_books (userId, bookId, dueDate) VALUES (?, ?, ?)`,
            [request.userId, request.bookId, dueDate.toISOString()],
            function(err) {
              if (err) {
                return res.status(500).json({ error: "Failed to borrow book" });
              }

              // Update book availability
              db.run("UPDATE books SET available = available - 1 WHERE id = ?", [request.bookId]);

              // Mark request as approved
              db.run(
                `UPDATE pending_requests SET status = 'approved', approvedAt = datetime('now') WHERE id = ?`,
                [id],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: "Failed to update request" });
                  }
                  res.json({ message: "Book borrowed successfully", dueDate: dueDate.toISOString() });
                }
              );
            }
          );
        });

      } else if (request.type === 'return_book') {
        // Process return
        db.get(
          "SELECT * FROM borrowed_books WHERE id = ?",
          [request.transactionId],
          (err, borrow) => {
            if (err || !borrow) {
              return res.status(400).json({ error: "Borrow record not found" });
            }

            const returnDate = new Date().toISOString();

            db.run(
              `UPDATE borrowed_books SET status = 'returned', returnDate = ? WHERE id = ?`,
              [returnDate, request.transactionId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: "Failed to return book" });
                }

                // Update book availability
                db.run("UPDATE books SET available = available + 1 WHERE id = ?", [request.bookId]);

                // Mark request as approved
                db.run(
                  `UPDATE pending_requests SET status = 'approved', approvedAt = datetime('now') WHERE id = ?`,
                  [id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: "Failed to update request" });
                    }
                    res.json({ message: "Book returned successfully" });
                  }
                );
              }
            );
          }
        );

      } else if (request.type === 'reserve_pc') {
        // Check PC availability
        db.get(
          `SELECT * FROM pc_reservations WHERE pcNumber = ? AND status = 'active'`,
          [request.pcNumber],
          (err, occupied) => {
            if (err) {
              return res.status(500).json({ error: "Database error" });
            }

            const startTime = new Date().toISOString();
            const status = occupied ? 'reserved' : 'active';

            db.run(
              `INSERT INTO pc_reservations (userId, pcNumber, startTime, status) VALUES (?, ?, ?, ?)`,
              [request.userId, request.pcNumber, startTime, status],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: "Failed to reserve PC" });
                }

                // Mark request as approved
                db.run(
                  `UPDATE pending_requests SET status = 'approved', approvedAt = datetime('now') WHERE id = ?`,
                  [id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: "Failed to update request" });
                    }
                    res.json({ 
                      message: occupied ? "PC reserved successfully" : "PC applied successfully",
                      pcNumber: request.pcNumber
                    });
                  }
                );
              }
            );
          }
        );
      }
    }
  );
});

// Reject request (admin only)
router.post("/reject/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE pending_requests SET status = 'rejected', approvedAt = datetime('now') WHERE id = ?`,
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json({ message: "Request rejected" });
    }
  );
});

module.exports = router;