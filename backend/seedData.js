// seedData.js - Run this to add sample books and PCs to your database
// Usage: node seedData.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "library.db");
const db = new sqlite3.Database(dbPath);

console.log("🌱 Starting to seed database...\n");

// Sample Books Data
const books = [
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0-06-112008-4", copies: 3 },
  { title: "1984", author: "George Orwell", isbn: "978-0-452-28423-4", copies: 5 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0-7432-7356-5", copies: 4 },
  { title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0-14-143951-8", copies: 2 },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "978-0-316-76948-0", copies: 3 },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "978-0-439-70818-8", copies: 6 },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0-618-00221-3", copies: 4 },
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien", isbn: "978-0-618-57498-4", copies: 3 },
  { title: "Animal Farm", author: "George Orwell", isbn: "978-0-452-28424-1", copies: 5 },
  { title: "The Chronicles of Narnia", author: "C.S. Lewis", isbn: "978-0-06-023481-3", copies: 4 },
  { title: "Brave New World", author: "Aldous Huxley", isbn: "978-0-06-085052-4", copies: 3 },
  { title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0-06-112241-5", copies: 5 },
  { title: "Little Women", author: "Louisa May Alcott", isbn: "978-0-14-303999-0", copies: 2 },
  { title: "Jane Eyre", author: "Charlotte Brontë", isbn: "978-0-14-144114-6", copies: 3 },
  { title: "Wuthering Heights", author: "Emily Brontë", isbn: "978-0-14-143955-6", copies: 2 },
  { title: "The Hunger Games", author: "Suzanne Collins", isbn: "978-0-439-02348-1", copies: 5 },
  { title: "Divergent", author: "Veronica Roth", isbn: "978-0-06-202402-2", copies: 4 },
  { title: "The Fault in Our Stars", author: "John Green", isbn: "978-0-14-242417-9", copies: 6 },
  { title: "Educated", author: "Tara Westover", isbn: "978-0-399-59050-4", copies: 3 },
  { title: "Becoming", author: "Michelle Obama", isbn: "978-1-524-76313-8", copies: 4 },
  { title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0-062-31609-6", copies: 3 },
  { title: "The Midnight Library", author: "Matt Haig", isbn: "978-0-525-55948-1", copies: 5 },
  { title: "Where the Crawdads Sing", author: "Delia Owens", isbn: "978-0-735-21932-0", copies: 4 },
  { title: "The Silent Patient", author: "Alex Michaelides", isbn: "978-1-250-30170-7", copies: 3 },
  { title: "Project Hail Mary", author: "Andy Weir", isbn: "978-0-593-13520-4", copies: 4 }
];

let booksAdded = 0;
let pcsAdded = 0;

// Function to add books
function addBooks() {
  return new Promise((resolve, reject) => {
    console.log("📚 Adding books to database...\n");
    
    let processed = 0;
    
    books.forEach((book) => {
      db.run(
        `INSERT INTO books (title, author, isbn, available, totalCopies)
         VALUES (?, ?, ?, ?, ?)`,
        [book.title, book.author, book.isbn, book.copies, book.copies],
        function(err) {
          processed++;
          
          if (err) {
            if (err.message.includes("UNIQUE constraint")) {
              console.log(`⚠️  "${book.title}" already exists, skipping...`);
            } else {
              console.log(`❌ Error adding "${book.title}": ${err.message}`);
            }
          } else {
            console.log(`✅ Added: "${book.title}" by ${book.author} (${book.copies} copies)`);
            booksAdded++;
          }
          
          if (processed === books.length) {
            console.log(`\n📚 Books Summary: ${booksAdded} new books added\n`);
            resolve();
          }
        }
      );
    });
  });
}

// Function to add PCs
function addPCs() {
  return new Promise((resolve, reject) => {
    console.log("💻 Adding 30 PCs to database...\n");
    
    let processed = 0;
    
    for (let i = 1; i <= 30; i++) {
      const pcNumber = i;
      const status = 'available'; // all start as available
      
      db.run(
        `INSERT INTO pcs (pcNumber, status, location)
         VALUES (?, ?, ?)`,
        [pcNumber, status, `Station ${i}`],
        function(err) {
          processed++;
          
          if (err) {
            if (err.message.includes("UNIQUE constraint")) {
              console.log(`⚠️  PC-${pcNumber} already exists, skipping...`);
            } else {
              console.log(`❌ Error adding PC-${pcNumber}: ${err.message}`);
            }
          } else {
            console.log(`✅ Added: PC-${pcNumber} (Station ${i})`);
            pcsAdded++;
          }
          
          if (processed === 30) {
            console.log(`\n💻 PCs Summary: ${pcsAdded} new PCs added\n`);
            resolve();
          }
        }
      );
    }
  });
}

// Main execution
async function seedDatabase() {
  try {
    // Add books first
    await addBooks();
    
    // Then add PCs
    await addPCs();
    
    // Summary
    console.log("═══════════════════════════════════════");
    console.log("🎉 Database seeding completed!");
    console.log("═══════════════════════════════════════");
    console.log(`📚 Books added: ${booksAdded}`);
    console.log(`💻 PCs added: ${pcsAdded}`);
    console.log("═══════════════════════════════════════\n");
    
    db.close();
  } catch (error) {
    console.error("Error seeding database:", error);
    db.close();
  }
}

// Run the seeding
seedDatabase();