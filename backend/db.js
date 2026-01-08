const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.resolve(__dirname, "library.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeTables();
  }
});

function initializeTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      studentNumber TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("Error creating users table:", err);
    else createDefaultAdmin();
  });

  // Check-in/out logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      studentNumber TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Current status table (tracks who's currently checked in)
  db.run(`
    CREATE TABLE IF NOT EXISTS current_status (
      userId INTEGER PRIMARY KEY,
      studentNumber TEXT NOT NULL,
      checkedIn BOOLEAN DEFAULT 0,
      lastCheckIn DATETIME,
      lastCheckOut DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE,
      available INTEGER DEFAULT 1,
      totalCopies INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Borrowed books table
  db.run(`
    CREATE TABLE IF NOT EXISTS borrowed_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      bookId INTEGER NOT NULL,
      borrowDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      dueDate DATETIME NOT NULL,
      returnDate DATETIME,
      status TEXT DEFAULT 'borrowed',
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  // PCs table (30 computers)
  db.run(`
    CREATE TABLE IF NOT EXISTS pcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pcNumber INTEGER UNIQUE NOT NULL,
      status TEXT DEFAULT 'available',
      location TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // PC reservations table
  db.run(`
    CREATE TABLE IF NOT EXISTS pc_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      pcNumber INTEGER NOT NULL,
      startTime DATETIME DEFAULT CURRENT_TIMESTAMP,
      endTime DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pcNumber) REFERENCES pcs(pcNumber) ON DELETE CASCADE
    )
  `);

  console.log("All tables initialized");
}

function createDefaultAdmin() {
  db.get("SELECT * FROM users WHERE studentNumber = '0000'", (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.run(
        `INSERT INTO users (name, email, studentNumber, password, role)
         VALUES (?, ?, ?, ?, ?)`,
        ["Admin User", "admin@library.com", "0000", hashedPassword, "admin"],
        (err) => {
          if (err) console.error("Error creating default admin:", err);
          else console.log("Default admin created: 0000 / admin123");
        }
      );
    }
  });
}

module.exports = db;