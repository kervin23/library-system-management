const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const { getPhilippineISOString } = require("../utils/timezone");

const router = express.Router();

// Get detailed status of all PCs
router.get("/detailed-status", authenticateToken, (req, res) => {
  const now = new Date();
  
  db.all(
    `SELECT 
      p.*,
      CASE 
        WHEN pr.id IS NOT NULL AND pr.status = 'active' THEN 'occupied'
        ELSE 'available'
      END as status,
      pr.id as sessionId,
      pr.userId as currentUserId,
      pr.startTime,
      CASE 
        WHEN pr.id IS NOT NULL AND pr.status = 'active' 
        THEN CAST((60 - (strftime('%s', 'now') - strftime('%s', pr.startTime)) / 60) AS INTEGER)
        ELSE 0
      END as remainingMinutes
     FROM pcs p
     LEFT JOIN pc_reservations pr ON p.pcNumber = pr.pcNumber AND pr.status = 'active'
     ORDER BY p.pcNumber`,
    (err, pcs) => {
      if (err) {
        console.error("Error loading PCs:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(pcs);
    }
  );
});

// Get user's current session
router.get("/my-session", authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.get(
    `SELECT 
      pr.*,
      p.location,
      CASE 
        WHEN pr.status = 'active' THEN 'active'
        WHEN pr.status = 'reserved' THEN 'reserved'
        ELSE 'none'
      END as type,
      CASE 
        WHEN pr.status = 'active' 
        THEN CAST((60 - (strftime('%s', 'now') - strftime('%s', pr.startTime)) / 60) AS INTEGER)
        ELSE 0
      END as remainingMinutes,
      CASE 
        WHEN pr.status = 'reserved' 
        THEN (SELECT CAST((60 - (strftime('%s', 'now') - strftime('%s', startTime)) / 60) AS INTEGER)
              FROM pc_reservations 
              WHERE pcNumber = pr.pcNumber AND status = 'active' 
              LIMIT 1)
        ELSE 0
      END as waitMinutes
     FROM pc_reservations pr
     JOIN pcs p ON pr.pcNumber = p.pcNumber
     WHERE pr.userId = ? AND pr.status IN ('active', 'reserved')
     LIMIT 1`,
    [userId],
    (err, session) => {
      if (err) {
        console.error("Error loading session:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(session || null);
    }
  );
});

// Apply for a PC (immediate use)
router.post("/apply", authenticateToken, (req, res) => {
  const { pcNumber } = req.body;
  const userId = req.user.id;

  // Check if user already has an active session or reservation
  db.get(
    `SELECT * FROM pc_reservations 
     WHERE userId = ? AND status IN ('active', 'reserved')`,
    [userId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      if (existing) {
        return res.status(400).json({ 
          error: "You already have an active session or reservation"
        });
      }

      // Check if PC is available
      db.get(
        `SELECT * FROM pc_reservations 
         WHERE pcNumber = ? AND status = 'active'`,
        [pcNumber],
        (err, occupied) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          
          if (occupied) {
            return res.status(400).json({ error: "Computer is currently occupied" });
          }

          // Create active session (1 hour)
          const startTime = getPhilippineISOString();
          
          db.run(
            `INSERT INTO pc_reservations (userId, pcNumber, startTime, status)
             VALUES (?, ?, ?, 'active')`,
            [userId, pcNumber, startTime],
            function(err) {
              if (err) {
                console.error("Error creating session:", err);
                return res.status(500).json({ error: "Failed to apply for computer" });
              }
              res.json({ 
                message: "Computer applied successfully",
                sessionId: this.lastID,
                pcNumber: pcNumber,
                startTime: startTime,
                duration: 60 // minutes
              });
            }
          );
        }
      );
    }
  );
});

// Reserve a PC (for when it's occupied)
router.post("/reserve", authenticateToken, (req, res) => {
  const { pcNumber } = req.body;
  const userId = req.user.id;

  // Check if user already has an active session or reservation
  db.get(
    `SELECT * FROM pc_reservations 
     WHERE userId = ? AND status IN ('active', 'reserved')`,
    [userId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      if (existing) {
        return res.status(400).json({ 
          error: "You already have an active session or reservation"
        });
      }

      // Create reservation
      db.run(
        `INSERT INTO pc_reservations (userId, pcNumber, status)
         VALUES (?, ?, 'reserved')`,
        [userId, pcNumber],
        function(err) {
          if (err) {
            return res.status(500).json({ error: "Failed to reserve computer" });
          }
          res.json({ 
            message: "Computer reserved successfully",
            reservationId: this.lastID,
            pcNumber: pcNumber
          });
        }
      );
    }
  );
});

// End session
router.post("/end-session/:sessionId", authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  db.get(
    `SELECT * FROM pc_reservations WHERE id = ?`,
    [sessionId],
    (err, session) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (session.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const endTime = getPhilippineISOString();

      db.run(
        `UPDATE pc_reservations 
         SET status = 'completed', endTime = ?
         WHERE id = ?`,
        [endTime, sessionId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to end session" });
          }
          
          // Check if anyone has reserved this PC
          db.get(
            `SELECT * FROM pc_reservations 
             WHERE pcNumber = ? AND status = 'reserved' 
             ORDER BY id ASC LIMIT 1`,
            [session.pcNumber],
            (err, nextReservation) => {
              if (nextReservation) {
                // Promote reservation to active
                const newStartTime = getPhilippineISOString();
                db.run(
                  `UPDATE pc_reservations 
                   SET status = 'active', startTime = ?
                   WHERE id = ?`,
                  [newStartTime, nextReservation.id]
                );
              }
              
              res.json({ message: "Session ended successfully" });
            }
          );
        }
      );
    }
  );
});

// Auto-expire sessions (call this periodically or via cron)
router.post("/expire-sessions", authenticateToken, isAdmin, (req, res) => {
  db.run(
    `UPDATE pc_reservations 
     SET status = 'expired', endTime = datetime('now')
     WHERE status = 'active' 
     AND (strftime('%s', 'now') - strftime('%s', startTime)) > 3600`,
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to expire sessions" });
      }
      res.json({ message: "Expired sessions updated" });
    }
  );
});

// Get all active sessions (admin only)
router.get("/sessions", authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT pr.*, u.name, u.studentNumber, p.location,
      CAST((60 - (strftime('%s', 'now') - strftime('%s', pr.startTime)) / 60) AS INTEGER) as remainingMinutes
     FROM pc_reservations pr
     JOIN users u ON pr.userId = u.id
     JOIN pcs p ON pr.pcNumber = p.pcNumber
     WHERE pr.status = 'active'
     ORDER BY pr.startTime DESC`,
    (err, sessions) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(sessions);
    }
  );
});

// Get all reservations (admin only)
router.get("/reservations", authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT pr.*, u.name, u.studentNumber, p.location
     FROM pc_reservations pr
     JOIN users u ON pr.userId = u.id
     JOIN pcs p ON pr.pcNumber = p.pcNumber
     WHERE pr.status = 'reserved'
     ORDER BY pr.id ASC`,
    (err, reservations) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(reservations);
    }
  );
});

// Get history
router.get("/history", authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT pr.*, u.name, u.studentNumber, p.location
     FROM pc_reservations pr
     JOIN users u ON pr.userId = u.id
     JOIN pcs p ON pr.pcNumber = p.pcNumber
     ORDER BY pr.startTime DESC
     LIMIT 100`,
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(history);
    }
  );
});

// Get stats
router.get("/stats", authenticateToken, (req, res) => {
  db.get(
    `SELECT 
       COUNT(*) as totalPCs,
       SUM(CASE WHEN EXISTS (
         SELECT 1 FROM pc_reservations pr 
         WHERE pr.pcNumber = pcs.pcNumber AND pr.status = 'active'
       ) THEN 1 ELSE 0 END) as occupied,
       SUM(CASE WHEN NOT EXISTS (
         SELECT 1 FROM pc_reservations pr 
         WHERE pr.pcNumber = pcs.pcNumber AND pr.status = 'active'
       ) THEN 1 ELSE 0 END) as available
     FROM pcs`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(stats);
    }
  );
});

module.exports = router;