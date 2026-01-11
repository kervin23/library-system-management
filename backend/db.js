const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.resolve(__dirname, "..", "database", "library.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeTables();
  }
});

function initializeTables() {
  // Users table - added 'headadmin' role
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
      imageUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add imageUrl column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE books ADD COLUMN imageUrl TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Borrowed books table - added approvedBy for admin tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS borrowed_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      bookId INTEGER NOT NULL,
      borrowDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      dueDate DATETIME NOT NULL,
      returnDate DATETIME,
      status TEXT DEFAULT 'borrowed',
      approvedBy INTEGER,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (approvedBy) REFERENCES users(id)
    )
  `);

  // Add approvedBy column if it doesn't exist
  db.run(`ALTER TABLE borrowed_books ADD COLUMN approvedBy INTEGER`, (err) => {
    // Ignore error if column already exists
  });

  // PCs table (30 computers)
  db.run(`
    CREATE TABLE IF NOT EXISTS pcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pcNumber INTEGER UNIQUE NOT NULL,
      status TEXT DEFAULT 'available',
      location TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (!err) {
      // Initialize 30 PCs if they don't exist
      initializePCs();
    }
  });

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

  // Holidays table (for library closures)
  db.run(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Pending requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS pending_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      studentNumber TEXT,
      studentName TEXT,
      type TEXT NOT NULL,
      bookId INTEGER,
      bookTitle TEXT,
      pcNumber INTEGER,
      pcName TEXT,
      transactionId INTEGER,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      approvedAt DATETIME,
      approvedBy INTEGER,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approvedBy) REFERENCES users(id)
    )
  `);

  // Add approvedBy column to pending_requests if it doesn't exist
  db.run(`ALTER TABLE pending_requests ADD COLUMN approvedBy INTEGER`, (err) => {
    // Ignore error if column already exists
  });

  // Admin transaction history table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adminId INTEGER NOT NULL,
      adminName TEXT,
      action TEXT NOT NULL,
      targetType TEXT,
      targetId INTEGER,
      targetName TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (adminId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log("All tables initialized");
}

function initializePCs() {
  // Check if PCs already exist
  db.get("SELECT COUNT(*) as count FROM pcs", (err, result) => {
    if (err) {
      console.error("Error checking PCs:", err);
      return;
    }

    if (result.count === 0) {
      // Insert 30 PCs
      console.log("Initializing 30 PCs...");
      for (let i = 1; i <= 30; i++) {
        const location = i <= 10 ? 'Row A' : (i <= 20 ? 'Row B' : 'Row C');
        db.run(
          `INSERT INTO pcs (pcNumber, status, location) VALUES (?, 'available', ?)`,
          [i, location],
          (err) => {
            if (err && !err.message.includes('UNIQUE constraint')) {
              console.error(`Error creating PC ${i}:`, err);
            }
          }
        );
      }
      console.log("30 PCs initialized successfully");
    }
  });
}

function createDefaultAdmin() {
  // Create Head Admin (student number 0000)
  db.get("SELECT * FROM users WHERE studentNumber = '0000'", (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.run(
        `INSERT INTO users (name, email, studentNumber, password, role)
         VALUES (?, ?, ?, ?, ?)`,
        ["Head Admin", "headadmin@library.com", "0000", hashedPassword, "headadmin"],
        (err) => {
          if (err) console.error("Error creating head admin:", err);
          else console.log("Head Admin created: 0000 / admin123");
        }
      );
    } else if (row.role !== 'headadmin') {
      // Upgrade existing 0000 to headadmin
      db.run(`UPDATE users SET role = 'headadmin', name = 'Head Admin' WHERE studentNumber = '0000'`);
      console.log("Upgraded 0000 to Head Admin");
    }
  });
}

module.exports = db;
