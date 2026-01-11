const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");
const attendanceRoutes = require("./routes/attendance");
const bookRoutes = require("./routes/books");
const pcRoutes = require("./routes/pcs");
const requestRoutes = require("./routes/requests");
const holidayRoutes = require("./routes/holidays");
const notificationRoutes = require("./routes/notifications");

const app = express();
const PORT = 4000;

// Enhanced CORS configuration for network access - allow all origins in development
app.use(cors({
  origin: true, // Allow all origins
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
app.use("/requests", requestRoutes);
app.use("/holidays", holidayRoutes);
app.use("/notifications", notificationRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Library Management System API is running!");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("  - /users (User management)");
  console.log("  - /attendance (Check-in/out system)");
  console.log("  - /books (Book borrowing system)");
  console.log("  - /pcs (PC reservation system)");
  console.log("  - /requests (Pending requests)");
  console.log("  - /holidays (Holiday management)");
  console.log("  - /notifications (Push notifications)");
});