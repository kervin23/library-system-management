// Quick test: Add a book due in 5 minutes to any student
// Usage: node notiftest.js [studentNumber]
// Example: node notiftest.js 20240001

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "..", "database", "library.db");
const db = new sqlite3.Database(dbPath);

const studentNumber = process.argv[2] || null;

function getLocalTime(addMinutes = 0) {
  const now = new Date();
  if (addMinutes) now.setMinutes(now.getMinutes() + addMinutes);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

// If no student number provided, show list and exit
if (!studentNumber) {
  console.log("\n  NOTIFICATION TEST - Add book due in 5 minutes\n");
  console.log("  Usage: node notiftest.js <studentNumber>\n");
  console.log("  Available students:");

  db.all("SELECT studentNumber, name, role FROM users WHERE role = 'user' LIMIT 15", (err, users) => {
    if (users && users.length > 0) {
      users.forEach(u => console.log(`    ${u.studentNumber} - ${u.name}`));
    } else {
      console.log("    No students found!");
    }
    console.log("\n  Example: node notiftest.js 20240001\n");
    db.close();
  });
} else {
  // Find user and add book
  db.get("SELECT * FROM users WHERE studentNumber = ?", [studentNumber], (err, user) => {
    if (!user) {
      console.log(`\n  ERROR: Student ${studentNumber} not found!\n`);
      db.close();
      return;
    }

    // Get or create a test book
    db.get("SELECT * FROM books WHERE available > 0 LIMIT 1", (err, book) => {
      if (!book) {
        // Create test book if none available
        db.run(
          "INSERT INTO books (title, author, isbn, available, totalCopies) VALUES (?, ?, ?, 1, 1)",
          ["Test Notification Book", "System", "TEST-" + Date.now()],
          function(err) {
            if (!err) {
              insertBorrow(user, { id: this.lastID, title: "Test Notification Book" });
            }
          }
        );
      } else {
        insertBorrow(user, book);
      }
    });
  });
}

function insertBorrow(user, book) {
  const borrowDate = getLocalTime();
  const dueDate = getLocalTime(5); // 5 minutes from now

  db.run(
    "INSERT INTO borrowed_books (userId, bookId, borrowDate, dueDate, status) VALUES (?, ?, ?, ?, 'borrowed')",
    [user.id, book.id, borrowDate, dueDate],
    function(err) {
      if (err) {
        console.log("\n  ERROR:", err.message, "\n");
        db.close();
        return;
      }

      db.run("UPDATE books SET available = available - 1 WHERE id = ?", [book.id]);

      console.log("\n  ====================================");
      console.log("  ✓ TEST BOOK ADDED SUCCESSFULLY!");
      console.log("  ====================================");
      console.log(`  Student:  ${user.name} (${studentNumber})`);
      console.log(`  Book:     ${book.title}`);
      console.log(`  Due in:   5 MINUTES`);
      console.log(`  Due at:   ${dueDate}`);
      console.log("  ====================================");
      console.log("\n  Now login as this student to test notifications!\n");

      db.close();
    }
  );
}
