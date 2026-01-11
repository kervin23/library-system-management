const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticateToken, isAdmin, JWT_SECRET } = require("../middleware/auth");
const { sendResetCode, sendWelcomeEmail, sendVerificationCode } = require("../utils/emailService");

const router = express.Router();

// Email domain restriction
const ALLOWED_EMAIL_DOMAIN = "@cvsu.edu.ph";

// In-memory storage for email verification codes
const emailVerificationCodes = new Map();

// Generate a random 6-digit code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ========== EMAIL VERIFICATION FOR SIGNUP ==========

// Send verification code to email before registration
router.post("/send-verification-code", async (req, res) => {
  const email = req.body.email ? req.body.email.trim().toLowerCase() : null;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Validate email domain
  if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return res.status(400).json({
      error: `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`
    });
  }

  // Check if email already exists
  db.get("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [email], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (existingUser) {
      return res.status(400).json({ error: "This email is already registered" });
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Store code with expiration (10 minutes)
    emailVerificationCodes.set(email.toLowerCase(), {
      code: code,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Display code in console (backup)
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║         EMAIL VERIFICATION CODE (SIGNUP)           ║");
    console.log("╠════════════════════════════════════════════════════╣");
    console.log(`║  Email: ${email.padEnd(43)}║`);
    console.log(`║  Verification Code: ${code.padEnd(31)}║`);
    console.log(`║  Expires in: 10 minutes                            ║`);
    console.log("╚════════════════════════════════════════════════════╝");
    console.log("\n");

    // Send email
    try {
      const emailResult = await sendVerificationCode(email, code);

      if (emailResult.success) {
        res.json({ message: "Verification code sent to your email" });
      } else {
        console.log("Email sending failed, code shown in console above");
        res.json({ message: "Verification code generated. Check backend console if email not received." });
      }
    } catch (emailErr) {
      console.error("Email error:", emailErr);
      res.json({ message: "Verification code generated. Check backend console if email not received." });
    }
  });
});

// Verify email code before allowing registration
router.post("/verify-email-code", (req, res) => {
  const email = req.body.email ? req.body.email.trim().toLowerCase() : null;
  const code = req.body.code ? req.body.code.trim() : null;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  console.log("[VERIFY] Checking code for email:", email);
  console.log("[VERIFY] Stored emails:", Array.from(emailVerificationCodes.keys()));

  const storedData = emailVerificationCodes.get(email);

  if (!storedData) {
    return res.status(400).json({ error: "No verification code found. Please request a new one." });
  }

  if (Date.now() > storedData.expiresAt) {
    emailVerificationCodes.delete(email);
    return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
  }

  if (storedData.code !== code) {
    return res.status(400).json({ error: "Invalid verification code" });
  }

  // Mark as verified (keep for 30 minutes to allow registration)
  emailVerificationCodes.set(email, {
    ...storedData,
    verified: true,
    expiresAt: Date.now() + 30 * 60 * 1000 // Extend for 30 minutes
  });

  console.log("[VERIFY] Email verified successfully:", email);
  console.log("[VERIFY] Verification data:", emailVerificationCodes.get(email));

  res.json({ message: "Email verified successfully", verified: true });
});

// REGISTER (Students only - requires email verification)
router.post("/register", (req, res) => {
  const { name, studentNumber, password } = req.body;
  const email = req.body.email ? req.body.email.trim().toLowerCase() : null;

  if (!name || !email || !studentNumber || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Validate email domain
  if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return res.status(400).json({
      error: `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`
    });
  }

  // Debug logging
  console.log("[REGISTER] Attempting registration for email:", email);
  console.log("[REGISTER] Stored verification emails:", Array.from(emailVerificationCodes.keys()));

  // Check if email was verified
  const verificationData = emailVerificationCodes.get(email);
  console.log("[REGISTER] Verification data:", verificationData);

  if (!verificationData || !verificationData.verified) {
    return res.status(400).json({
      error: "Please verify your email first before registering"
    });
  }

  // Check if verification has expired
  if (Date.now() > verificationData.expiresAt) {
    emailVerificationCodes.delete(email);
    return res.status(400).json({
      error: "Email verification has expired. Please verify your email again."
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (name, email, studentNumber, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, studentNumber, hashedPassword, "user"],
    async function (err) {
      if (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ error: "User registration failed. Email or student number may already exist." });
      }

      // Clear the verification code after successful registration
      emailVerificationCodes.delete(email);
      console.log("[REGISTER] Registration successful for:", email);

      // Send welcome email (optional - won't block registration if it fails)
      try {
        await sendWelcomeEmail(email, name);
      } catch (emailErr) {
        console.log("Welcome email not sent (email service may not be configured)");
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

// GET all users with stats (Admin only)
router.get("/with-stats", authenticateToken, isAdmin, (req, res) => {
  const now = new Date().toISOString();

  db.all(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.studentNumber,
      u.role,
      u.createdAt,
      (SELECT COUNT(*) FROM borrowed_books WHERE userId = u.id AND status = 'borrowed') as borrowedCount,
      (SELECT COUNT(*) FROM borrowed_books WHERE userId = u.id AND status = 'borrowed' AND dueDate < ?) as overdueCount,
      (SELECT COUNT(*) FROM borrowed_books WHERE userId = u.id) as totalBorrows
    FROM users u
    ORDER BY u.name`,
    [now],
    (err, rows) => {
      if (err) {
        console.error("Error fetching users with stats:", err);
        return res.status(500).json({ error: "Failed to fetch users" });
      }
      res.json(rows);
    }
  );
});

// Helper function to log admin transactions
function logAdminTransaction(adminId, adminName, action, targetType, targetId, targetName, details) {
  db.run(
    `INSERT INTO admin_transactions (adminId, adminName, action, targetType, targetId, targetName, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [adminId, adminName, action, targetType, targetId, targetName, details],
    (err) => {
      if (err) console.error("Error logging admin transaction:", err);
    }
  );
}

// DELETE user by ID (Admin only, but cannot delete headadmin)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  // Check if target is headadmin
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.role === 'headadmin') {
      return res.status(403).json({ error: "Cannot delete Head Admin" });
    }

    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ error: "Failed to delete user" });
      }

      // Log the transaction
      logAdminTransaction(req.user.id, req.user.name, 'DELETE_USER', 'user', id, user.name, `Deleted user: ${user.name} (${user.studentNumber})`);

      res.json({ message: "User deleted successfully" });
    });
  });
});

// PROMOTE/DEMOTE user (Head Admin only)
router.put("/:id/promote", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Only headadmin can promote/demote
  if (req.user.role !== 'headadmin') {
    return res.status(403).json({ error: "Only Head Admin can promote or demote users" });
  }

  if (!role || (role !== 'admin' && role !== 'user')) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'user'" });
  }

  // Check target user
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Prevent demoting headadmin
    if (user.role === 'headadmin') {
      return res.status(403).json({ error: "Cannot change Head Admin role" });
    }

    // Prevent demoting yourself
    if (parseInt(id) === req.user.id && role === 'user') {
      return res.status(400).json({ error: "You cannot demote yourself" });
    }

    const action = role === 'admin' ? 'PROMOTE_TO_ADMIN' : 'DEMOTE_TO_USER';

    db.run(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, id],
      function (err) {
        if (err) {
          console.error("Error updating user role:", err);
          return res.status(500).json({ error: "Failed to update user role" });
        }

        // Log the transaction
        logAdminTransaction(req.user.id, req.user.name, action, 'user', id, user.name, `Changed ${user.name} role to ${role}`);

        res.json({ message: "User role updated successfully", role: role });
      }
    );
  });
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

// ========== ADMIN TRANSACTION HISTORY ROUTES ==========

// Get my admin transactions (for current admin)
router.get("/my-admin-history", authenticateToken, isAdmin, (req, res) => {
  const adminId = req.user.id;

  db.all(
    `SELECT * FROM admin_transactions WHERE adminId = ? ORDER BY timestamp DESC LIMIT 100`,
    [adminId],
    (err, transactions) => {
      if (err) {
        console.error("Error fetching admin history:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(transactions);
    }
  );
});

// Get all admin transactions (Head Admin only)
router.get("/all-admin-history", authenticateToken, (req, res) => {
  if (req.user.role !== 'headadmin') {
    return res.status(403).json({ error: "Head Admin access required" });
  }

  db.all(
    `SELECT * FROM admin_transactions ORDER BY timestamp DESC LIMIT 500`,
    (err, transactions) => {
      if (err) {
        console.error("Error fetching all admin history:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(transactions);
    }
  );
});

// Get transactions by specific admin (Head Admin only)
router.get("/admin-history/:adminId", authenticateToken, (req, res) => {
  if (req.user.role !== 'headadmin') {
    return res.status(403).json({ error: "Head Admin access required" });
  }

  const { adminId } = req.params;

  db.all(
    `SELECT * FROM admin_transactions WHERE adminId = ? ORDER BY timestamp DESC LIMIT 100`,
    [adminId],
    (err, transactions) => {
      if (err) {
        console.error("Error fetching admin history:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(transactions);
    }
  );
});

// ========== FORGOT PASSWORD ROUTES ==========

// In-memory storage for reset codes (in production, use database or Redis)
const resetCodes = new Map();

// Generate a random 6-digit code
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

// Send reset code to email
router.post("/send-reset-code", (req, res) => {
  const { studentNumber, email } = req.body;

  db.get(
    "SELECT * FROM users WHERE studentNumber = ? AND LOWER(email) = LOWER(?)",
    [studentNumber, email],
    async (err, user) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (!user) return res.status(401).json({ error: "Email does not match" });

      // Generate reset code
      const code = generateResetCode();

      // Store code with expiration (10 minutes)
      resetCodes.set(studentNumber, {
        code: code,
        email: email,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Display code in console (for backup/debugging)
      console.log("\n");
      console.log("╔════════════════════════════════════════════════════╗");
      console.log("║              PASSWORD RESET CODE                   ║");
      console.log("╠════════════════════════════════════════════════════╣");
      console.log(`║  Student Number: ${studentNumber.padEnd(34)}║`);
      console.log(`║  Email: ${email.padEnd(43)}║`);
      console.log(`║  Reset Code: ${code.padEnd(38)}║`);
      console.log(`║  Expires in: 10 minutes                            ║`);
      console.log("╚════════════════════════════════════════════════════╝");
      console.log("\n");

      // Send email via nodemailer
      try {
        const emailResult = await sendResetCode(email, studentNumber, code);

        if (emailResult.success) {
          res.json({
            message: "Reset code sent to your email address"
          });
        } else {
          // Email failed but code is still valid - show in console
          console.log("Email sending failed, code shown in console above");
          res.json({
            message: "Reset code generated. Check backend console if email not received."
          });
        }
      } catch (emailErr) {
        console.error("Email error:", emailErr);
        // Still return success since code is generated
        res.json({
          message: "Reset code generated. Check backend console if email not received."
        });
      }
    }
  );
});

// Verify reset code
router.post("/verify-reset-code", (req, res) => {
  const { studentNumber, code } = req.body;

  const storedData = resetCodes.get(studentNumber);

  if (!storedData) {
    return res.status(400).json({ error: "No reset code found. Please request a new one." });
  }

  if (Date.now() > storedData.expiresAt) {
    resetCodes.delete(studentNumber);
    return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
  }

  if (storedData.code !== code) {
    return res.status(400).json({ error: "Invalid reset code" });
  }

  res.json({ message: "Code verified successfully" });
});

// Reset password
router.post("/reset-password", (req, res) => {
  const { studentNumber, code, newPassword } = req.body;

  // Verify the code is still valid
  const storedData = resetCodes.get(studentNumber);

  if (!storedData) {
    return res.status(400).json({ error: "No reset code found. Please start over." });
  }

  if (Date.now() > storedData.expiresAt) {
    resetCodes.delete(studentNumber);
    return res.status(400).json({ error: "Reset code has expired. Please start over." });
  }

  if (storedData.code !== code) {
    return res.status(400).json({ error: "Invalid reset code" });
  }

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

      // Clear the reset code
      resetCodes.delete(studentNumber);

      res.json({ message: "Password reset successfully" });
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