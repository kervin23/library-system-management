const jwt = require("jsonwebtoken");

const JWT_SECRET = "your-secret-key-change-this-in-production";

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// Middleware to check if user is admin or headadmin
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'headadmin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Middleware to check if user is headadmin only
function isHeadAdmin(req, res, next) {
  if (req.user.role !== 'headadmin') {
    return res.status(403).json({ error: "Head Admin access required" });
  }
  next();
}

module.exports = {
  authenticateToken,
  isAdmin,
  isHeadAdmin,
  JWT_SECRET
};
