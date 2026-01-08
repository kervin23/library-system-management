import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function AdminBookManagement() {
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('books'); // 'books' or 'borrowed'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    totalCopies: 1
  });

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    loadBooks();
    loadBorrowedBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await fetch(`${API_URL}/books`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setBooks(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading books:", err);
      setLoading(false);
    }
  };

  const loadBorrowedBooks = async () => {
    try {
      const response = await fetch(`${API_URL}/books/all-borrowed`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setBorrowedBooks(data);
    } catch (err) {
      console.error("Error loading borrowed books:", err);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(newBook)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Book added successfully!");
        setNewBook({ title: '', author: '', isbn: '', totalCopies: 1 });
        setShowAddForm(false);
        loadBooks();
      } else {
        alert(data.error || "Failed to add book");
      }
    } catch (err) {
      console.error("Error adding book:", err);
      alert("Network error");
    }
  };

  const handleReturnBook = async (borrowId) => {
    if (!window.confirm("Mark this book as returned?")) return;

    try {
      const response = await fetch(`${API_URL}/books/admin-return/${borrowId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Book marked as returned!");
        loadBooks();
        loadBorrowedBooks();
      } else {
        alert(data.error || "Failed to return book");
      }
    } catch (err) {
      console.error("Error returning book:", err);
      alert("Network error");
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h2 style={{ margin: 0 }}>Book Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          {showAddForm ? "Cancel" : "➕ Add New Book"}
        </button>
      </div>

      {/* Add Book Form */}
      {showAddForm && (
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          marginBottom: "25px"
        }}>
          <h3 style={{ marginTop: 0 }}>Add New Book</h3>
          <form onSubmit={handleAddBook}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Book Title"
                value={newBook.title}
                onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                required
                style={{
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px"
                }}
              />
              <input
                type="text"
                placeholder="Author"
                value={newBook.author}
                onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                required
                style={{
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px"
                }}
              />
              <input
                type="text"
                placeholder="ISBN"
                value={newBook.isbn}
                onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                style={{
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px"
                }}
              />
              <input
                type="number"
                placeholder="Total Copies"
                value={newBook.totalCopies}
                onChange={(e) => setNewBook({...newBook, totalCopies: parseInt(e.target.value)})}
                min="1"
                required
                style={{
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px"
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Add Book
            </button>
          </form>
        </div>
      )}

      {/* View Toggle */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "25px",
        backgroundColor: "#f8f9fa",
        padding: "5px",
        borderRadius: "8px",
        width: "fit-content"
      }}>
        <button
          onClick={() => setView('books')}
          style={{
            padding: "10px 20px",
            backgroundColor: view === 'books' ? "#667eea" : "transparent",
            color: view === 'books' ? "white" : "#666",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          📚 All Books ({books.length})
        </button>
        <button
          onClick={() => setView('borrowed')}
          style={{
            padding: "10px 20px",
            backgroundColor: view === 'borrowed' ? "#667eea" : "transparent",
            color: view === 'borrowed' ? "white" : "#666",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          📖 Currently Borrowed ({borrowedBooks.length})
        </button>
      </div>

      {/* Books List View */}
      {view === 'books' && (
        <div>
          <h3>All Books in Library</h3>
          {books.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No books in library. Add some books to get started!
            </p>
          ) : (
            books.map(book => (
              <div key={book.id} style={{
                marginBottom: "15px",
                padding: "20px",
                backgroundColor: book.available > 0 ? "#e8f5e9" : "#ffebee",
                borderRadius: "8px",
                border: `1px solid ${book.available > 0 ? "#4caf50" : "#f44336"}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{book.title}</h3>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Author:</strong> {book.author}
                    </p>
                    {book.isbn && (
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>ISBN:</strong> {book.isbn}
                      </p>
                    )}
                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                      <strong>Available:</strong> 
                      <span style={{ 
                        color: book.available > 0 ? "#4caf50" : "#f44336",
                        fontWeight: "600",
                        marginLeft: "5px"
                      }}>
                        {book.available}/{book.totalCopies}
                      </span>
                    </p>
                  </div>
                  <span style={{
                    padding: "6px 12px",
                    backgroundColor: book.available > 0 ? "#4caf50" : "#f44336",
                    color: "white",
                    borderRadius: "15px",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    {book.available > 0 ? "Available" : "All Borrowed"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Borrowed Books View */}
      {view === 'borrowed' && (
        <div>
          <h3>Currently Borrowed Books</h3>
          {borrowedBooks.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No books are currently borrowed.
            </p>
          ) : (
            borrowedBooks.map(borrow => {
              const dueDate = new Date(borrow.dueDate);
              const isOverdue = dueDate < new Date();
              
              return (
                <div key={borrow.id} style={{
                  marginBottom: "15px",
                  padding: "20px",
                  backgroundColor: isOverdue ? "#fff3e0" : "#f9f9f9",
                  borderRadius: "8px",
                  border: `1px solid ${isOverdue ? "#ff9800" : "#ddd"}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{borrow.title}</h3>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Author:</strong> {borrow.author}
                      </p>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Borrowed by:</strong> {borrow.studentName} ({borrow.studentNumber})
                      </p>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Borrowed:</strong> {new Date(borrow.borrowDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Due:</strong> 
                        <span style={{ 
                          color: isOverdue ? "#f44336" : "#4caf50",
                          fontWeight: "600",
                          marginLeft: "5px"
                        }}>
                          {dueDate.toLocaleDateString()} {isOverdue && "⚠️ OVERDUE"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleReturnBook(borrow.id)}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      Mark as Returned
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}