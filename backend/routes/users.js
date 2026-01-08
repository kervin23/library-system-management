const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticateToken, isAdmin, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// REGISTER (Students only)
router.post("/register", (req, res) => {
  const { name, email, studentNumber, password } = req.body;

  if (!name || !email || !studentNumber || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (name, email, studentNumber, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, studentNumber, hashedPassword, "user"],
    function (err) {
      if (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ error: "User registration failed. Email or student number may already exist." });
      }
      res.json({ message: "User registered successfully", userId: this.lastID });
    }
  );
});

// LOGIN (Returns JWT token)
router.post("/login", (req, res) => {
  const { studentNumber, password } = req.body;

  db.get("SELECT * FROM users WHERE studentNumber = ?", [studentNumber], (err, user) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!user) return res.status(401).json({ error: "Invalid student number or password" });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid student number or password" });

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        studentNumber: user.studentNumber,
        role: user.role,
        name: user.name,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    const { password: _, ...safeUser } = user;
    res.json({ 
      message: "Login successful", 
      token: token,
      user: safeUser 
    });
  });
});

// VERIFY TOKEN (Check if user is still logged in)
router.get("/verify", authenticateToken, (req, res) => {
  // Token is valid, return user info
  db.get("SELECT id, name, email, studentNumber, role FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: user });
  });
});

// GET all users (Admin only)
router.get("/", authenticateToken, isAdmin, (req, res) => {
  db.all("SELECT id, name, email, studentNumber, role FROM users", [], (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(rows);
  });
});

// DELETE user by ID (Admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  
  // Prevent deleting yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ error: "Failed to delete user" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
});

// PROMOTE/DEMOTE user (Admin only)
router.put("/:id/promote", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!role || (role !== 'admin' && role !== 'user')) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'user'" });
  }

  // Prevent demoting yourself
  if (parseInt(id) === req.user.id && role === 'user') {
    return res.status(400).json({ error: "You cannot demote yourself" });
  }
  
  db.run(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, id],
    function (err) {
      if (err) {
        console.error("Error updating user role:", err);
        return res.status(500).json({ error: "Failed to update user role" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User role updated successfully", role: role });
    }
  );
});

// UPDATE user profile (Admin only)
router.put("/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, email, studentNumber, password, role } = req.body;

  const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;

  db.run(
    `UPDATE users SET 
       name = ?, 
       email = ?, 
       studentNumber = ?, 
       ${hashedPassword ? "password = ?," : ""} 
       role = ?
     WHERE id = ?`,
    hashedPassword
      ? [name, email, studentNumber, hashedPassword, role, id]
      : [name, email, studentNumber, role, id],
    function (err) {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Failed to update user" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User updated successfully" });
    }
  );
});

// GET complete history (attendance, books, PCs)
router.get("/my-complete-history", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const attendanceQuery = `
    SELECT 
      id,
      action as type,
      timestamp,
      '' as details
    FROM attendance_logs
    WHERE userId = ?
  `;

  const booksQuery = `
    SELECT 
      id,
      CASE 
        WHEN returnDate IS NULL THEN 'borrow'
        ELSE 'return'
      END as type,
      CASE 
        WHEN returnDate IS NULL THEN borrowDate
        ELSE returnDate
      END as timestamp,
      (SELECT title FROM books WHERE id = bookId) as details
    FROM borrowed_books
    WHERE userId = ?
  `;

  const pcsQuery = `
    SELECT 
      id,
      CASE 
        WHEN status = 'active' THEN 'pc_reserve'
        ELSE 'pc_release'
      END as type,
      CASE 
        WHEN status = 'active' THEN startTime
        ELSE endTime
      END as timestamp,
      CAST(pcNumber AS TEXT) as details
    FROM pc_reservations
    WHERE userId = ?
  `;

  const fullQuery = `
    ${attendanceQuery}
    UNION ALL
    ${booksQuery}
    UNION ALL
    ${pcsQuery}
    ORDER BY timestamp DESC
    LIMIT 100
  `;

  db.all(fullQuery, [userId, userId, userId], (err, history) => {
    if (err) {
      console.error("Error fetching complete history:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(history);
  });
});

// ========== FORGOT PASSWORD ROUTES ==========

// Check if student exists and return masked email
router.post("/check-student", (req, res) => {
  const { studentNumber } = req.body;

  db.get("SELECT email FROM users WHERE studentNumber = ?", [studentNumber], (err, user) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!user) return res.status(404).json({ error: "Student not found" });

    // Mask email: j***@example.com
    const email = user.email;
    const [local, domain] = email.split('@');
    const maskedLocal = local[0] + '***';
    const maskedEmail = maskedLocal + '@' + domain;

    res.json({ maskedEmail });
  });
});

// Verify email matches
router.post("/verify-email", (req, res) => {
  const { studentNumber, email } = req.body;

  db.get(
    "SELECT * FROM users WHERE studentNumber = ? AND email = ?",
    [studentNumber, email],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (!user) return res.status(401).json({ error: "Email does not match" });

      res.json({ message: "Email verified" });
    }
  );
});

// Reset password
router.post("/reset-password", (req, res) => {
  const { studentNumber, email, newPassword } = req.body;

  // Verify student and email
  db.get(
    "SELECT * FROM users WHERE studentNumber = ? AND email = ?",
    [studentNumber, email],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      // Hash new password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      // Update password
      db.run(
        "UPDATE users SET password = ? WHERE studentNumber = ?",
        [hashedPassword, studentNumber],
        function (err) {
          if (err) {
            console.error("Error updating password:", err);
            return res.status(500).json({ error: "Failed to reset password" });
          }
          res.json({ message: "Password reset successfully" });
        }
      );
    }
  );
});

// ========== SETTINGS ROUTES ==========

// Update user profile (authenticated user can update their own profile)
router.put("/update-profile", authenticateToken, (req, res) => {
  const { name, email, studentNumber } = req.body;
  const userId = req.user.id;

  if (!name || !email || !studentNumber) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Check if email or student number is already taken by another user
  db.get(
    "SELECT * FROM users WHERE (email = ? OR studentNumber = ?) AND id != ?",
    [email, studentNumber, userId],
    (err, existing) => {
      if (err) {
        console.error("Error checking existing user:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (existing) {
        if (existing.email === email) {
          return res.status(400).json({ error: "Email already in use by another account" });
        }
        if (existing.studentNumber === studentNumber) {
          return res.status(400).json({ error: "Student number already in use by another account" });
        }
      }

      // Update user profile
      db.run(
        "UPDATE users SET name = ?, email = ?, studentNumber = ? WHERE id = ?",
        [name, email, studentNumber, userId],
        function (err) {
          if (err) {
            console.error("Error updating profile:", err);
            return res.status(500).json({ error: "Failed to update profile" });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: "User not found" });
          }

          res.json({ 
            message: "Profile updated successfully",
            user: { id: userId, name, email, studentNumber, role: req.user.role }
          });
        }
      );
    }
  );
});

// Change password (authenticated user can change their own password)
router.put("/change-password", authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  // Get current user
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update password
    db.run(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId],
      function (err) {
        if (err) {
          console.error("Error updating password:", err);
          return res.status(500).json({ error: "Failed to change password" });
        }

        res.json({ message: "Password changed successfully" });
      }
    );
  });
});

module.exports = router;