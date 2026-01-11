const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const { getPhilippineISOString, getPhilippineDateTimeString, calculateDueDatePH } = require("../utils/timezone");

const router = express.Router();

// Helper function to log admin transactions
function logAdminTransaction(adminId, adminName, action, targetType, targetId, targetName, details) {
  const timestamp = getPhilippineISOString();
  db.run(
    `INSERT INTO admin_transactions (adminId, adminName, action, targetType, targetId, targetName, details, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [adminId, adminName, action, targetType, targetId, targetName, details, timestamp],
    (err) => {
      if (err) console.error("Error logging admin transaction:", err);
    }
  );
}

// Helper function to check if student is checked in
function isStudentCheckedIn(userId, callback) {
  db.get(
    `SELECT checkedIn FROM current_status WHERE userId = ?`,
    [userId],
    (err, status) => {
      if (err) {
        callback(err, false);
        return;
      }
      callback(null, status && status.checkedIn === 1);
    }
  );
}

// Calculate due date: 24 hours, skip Thursdays and holidays (using Philippine time)
async function calculateDueDate() {
  return calculateDueDatePH(db);
}

// Create pending request (student side)
router.post("/create", authenticateToken, (req, res) => {
  const { type, bookId, bookTitle, pcNumber, pcName, transactionId } = req.body;
  const userId = req.user.id;
  const studentNumber = req.user.studentNumber;
  const studentName = req.user.name;

  // Check if student is checked in
  isStudentCheckedIn(userId, (err, checkedIn) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!checkedIn) {
      return res.status(403).json({
        error: "You must be checked in to the library to make requests. Please check in first."
      });
    }

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

        // Create the request with explicit local timestamp
        const createdAt = getPhilippineISOString();
        db.run(
          `INSERT INTO pending_requests
           (userId, studentNumber, studentName, type, bookId, bookTitle, pcNumber, pcName, transactionId, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [userId, studentNumber, studentName, type, bookId || null, bookTitle || null,
           pcNumber || null, pcName || null, transactionId || null, createdAt],
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
router.post("/approve/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { verifiedStudentNumber } = req.body;
  const adminId = req.user.id;
  const adminName = req.user.name;

  // Get the request
  db.get(
    `SELECT * FROM pending_requests WHERE id = ?`,
    [id],
    async (err, request) => {
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
        db.get("SELECT * FROM books WHERE id = ?", [request.bookId], async (err, book) => {
          if (err || !book || book.available < 1) {
            return res.status(400).json({ error: "Book not available" });
          }

          // Calculate due date (24h, skip Thursdays and holidays)
          const dueDate = await calculateDueDate();
          const borrowDate = getPhilippineISOString();

          // Create borrow record with approvedBy and explicit borrowDate
          db.run(
            `INSERT INTO borrowed_books (userId, bookId, dueDate, approvedBy, borrowDate) VALUES (?, ?, ?, ?, ?)`,
            [request.userId, request.bookId, dueDate, adminId, borrowDate],
            function(err) {
              if (err) {
                return res.status(500).json({ error: "Failed to borrow book" });
              }

              // Update book availability
              db.run("UPDATE books SET available = available - 1 WHERE id = ?", [request.bookId]);

              // Mark request as approved
              const approvedAt = getPhilippineISOString();
              db.run(
                `UPDATE pending_requests SET status = 'approved', approvedAt = ?, approvedBy = ? WHERE id = ?`,
                [approvedAt, adminId, id],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: "Failed to update request" });
                  }

                  // Log admin transaction
                  logAdminTransaction(adminId, adminName, 'APPROVE_BORROW', 'book', request.bookId,
                    request.bookTitle, `Approved borrow for ${request.studentName} (${request.studentNumber})`);

                  res.json({ message: "Book borrowed successfully", dueDate: dueDate });
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

            const returnDate = getPhilippineISOString();

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
                const approvedAtReturn = getPhilippineISOString();
                db.run(
                  `UPDATE pending_requests SET status = 'approved', approvedAt = ?, approvedBy = ? WHERE id = ?`,
                  [approvedAtReturn, adminId, id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: "Failed to update request" });
                    }

                    // Log admin transaction
                    logAdminTransaction(adminId, adminName, 'APPROVE_RETURN', 'book', request.bookId,
                      request.bookTitle, `Approved return for ${request.studentName} (${request.studentNumber})`);

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

            const startTime = getPhilippineISOString();
            const status = occupied ? 'reserved' : 'active';

            db.run(
              `INSERT INTO pc_reservations (userId, pcNumber, startTime, status) VALUES (?, ?, ?, ?)`,
              [request.userId, request.pcNumber, startTime, status],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: "Failed to reserve PC" });
                }

                // Mark request as approved
                const approvedAtPC = getPhilippineISOString();
                db.run(
                  `UPDATE pending_requests SET status = 'approved', approvedAt = ?, approvedBy = ? WHERE id = ?`,
                  [approvedAtPC, adminId, id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: "Failed to update request" });
                    }

                    // Log admin transaction
                    logAdminTransaction(adminId, adminName, 'APPROVE_PC_RESERVE', 'pc', request.pcNumber,
                      `PC-${request.pcNumber}`, `Approved PC reservation for ${request.studentName} (${request.studentNumber})`);

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
      } else {
        // Unknown request type
        return res.status(400).json({ error: "Unknown request type" });
      }
    }
  );
});

// Get pending requests count
router.get("/pending-count", authenticateToken, isAdmin, (req, res) => {
  db.get(
    `SELECT COUNT(*) as count FROM pending_requests WHERE status = 'pending'`,
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ count: result.count || 0 });
    }
  );
});

// Clean up unknown/invalid request types (admin only)
router.delete("/cleanup-invalid", authenticateToken, isAdmin, (req, res) => {
  db.run(
    `DELETE FROM pending_requests WHERE type NOT IN ('borrow_book', 'return_book', 'reserve_pc') AND status = 'pending'`,
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: `Cleaned up ${this.changes} invalid requests` });
    }
  );
});

// Reject request (admin only)
router.post("/reject/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const adminName = req.user.name;

  db.get(`SELECT * FROM pending_requests WHERE id = ?`, [id], (err, request) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const rejectedAt = getPhilippineISOString();
    db.run(
      `UPDATE pending_requests SET status = 'rejected', approvedAt = ?, approvedBy = ? WHERE id = ?`,
      [rejectedAt, adminId, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Request not found" });
        }

        // Log admin transaction
        logAdminTransaction(adminId, adminName, 'REJECT_REQUEST', request.type, request.bookId || request.pcNumber,
          request.bookTitle || `PC-${request.pcNumber}`, `Rejected ${request.type} request from ${request.studentName}`);

        res.json({ message: "Request rejected" });
      }
    );
  });
});

// Check student check-in status endpoint
router.get("/check-status", authenticateToken, (req, res) => {
  const userId = req.user.id;

  isStudentCheckedIn(userId, (err, checkedIn) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ checkedIn });
  });
});

module.exports = router;
