const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");
const attendanceRoutes = require("./routes/attendance");
const bookRoutes = require("./routes/books");
const pcRoutes = require("./routes/pcs");

const app = express();
const PORT = 4000;

// Enhanced CORS configuration for network access
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://192.168.18.100:3000',
    'https://192.168.18.100:3000',
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
    /^https:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Mount routes
app.use("/users", userRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/books", bookRoutes);
app.use("/pcs", pcRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Library Management System API is running!");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Also accessible at http://192.168.18.100:${PORT}`);
  console.log("Available routes:");
  console.log("  - /users (User management)");
  console.log("  - /attendance (Check-in/out system)");
  console.log("  - /books (Book borrowing system)");
  console.log("  - /pcs (PC reservation system)");
});