import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function AdminBookManagement() {
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('books'); // 'books', 'borrowed', 'history'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState('title-asc'); // title-asc, title-desc, author-asc, author-desc
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    totalCopies: 1,
    imageUrl: ''
  });

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    loadBooks();
    loadBorrowedBooks();
    loadHistory();
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

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/books/admin-history`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
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
        setNewBook({ title: '', author: '', isbn: '', totalCopies: 1, imageUrl: '' });
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

  const handleEditBook = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/books/${editingBook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(editingBook)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Book updated successfully!");
        setEditingBook(null);
        loadBooks();
      } else {
        alert(data.error || "Failed to update book");
      }
    } catch (err) {
      console.error("Error updating book:", err);
      alert("Network error");
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });

      const data = await response.json();

      if (response.ok) {
        alert("Book deleted successfully!");
        loadBooks();
      } else {
        alert(data.error || "Failed to delete book");
      }
    } catch (err) {
      console.error("Error deleting book:", err);
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
        loadHistory();
      } else {
        alert(data.error || "Failed to return book");
      }
    } catch (err) {
      console.error("Error returning book:", err);
      alert("Network error");
    }
  };

  // Sort books
  const getSortedBooks = () => {
    let sorted = [...books];
    switch (sortOrder) {
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'author-asc':
        sorted.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'author-desc':
        sorted.sort((a, b) => b.author.localeCompare(a.author));
        break;
      default:
        break;
    }
    return sorted;
  };

  // Filter history by search query
  const getFilteredHistory = () => {
    if (!searchQuery.trim()) return history;
    const query = searchQuery.toLowerCase();
    return history.filter(item =>
      item.bookTitle.toLowerCase().includes(query) ||
      item.studentName.toLowerCase().includes(query) ||
      item.studentNumber.includes(query)
    );
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
          {showAddForm ? "Cancel" : "+ Add New Book"}
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
                style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px" }}
              />
              <input
                type="text"
                placeholder="Author"
                value={newBook.author}
                onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                required
                style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px" }}
              />
              <input
                type="text"
                placeholder="ISBN"
                value={newBook.isbn}
                onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px" }}
              />
              <input
                type="number"
                placeholder="Total Copies"
                value={newBook.totalCopies}
                onChange={(e) => setNewBook({...newBook, totalCopies: parseInt(e.target.value) || 1})}
                min="1"
                required
                style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px" }}
              />
              <input
                type="url"
                placeholder="Image URL (optional)"
                value={newBook.imageUrl}
                onChange={(e) => setNewBook({...newBook, imageUrl: e.target.value})}
                style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "14px", gridColumn: "span 2" }}
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

      {/* Edit Book Modal */}
      {editingBook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>Edit Book</h3>
            <form onSubmit={handleEditBook}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Title</label>
                <input
                  type="text"
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Author</label>
                <input
                  type="text"
                  value={editingBook.author}
                  onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>ISBN</label>
                <input
                  type="text"
                  value={editingBook.isbn || ''}
                  onChange={(e) => setEditingBook({...editingBook, isbn: e.target.value})}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Total Copies</label>
                <input
                  type="number"
                  value={editingBook.totalCopies}
                  onChange={(e) => setEditingBook({...editingBook, totalCopies: parseInt(e.target.value) || 1})}
                  min="1"
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Image URL</label>
                <input
                  type="url"
                  value={editingBook.imageUrl || ''}
                  onChange={(e) => setEditingBook({...editingBook, imageUrl: e.target.value})}
                  placeholder="https://example.com/book-cover.jpg"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#f5f5f5",
                    color: "#333",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
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
          All Books ({books.length})
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
          Currently Borrowed ({borrowedBooks.length})
        </button>
        <button
          onClick={() => setView('history')}
          style={{
            padding: "10px 20px",
            backgroundColor: view === 'history' ? "#667eea" : "transparent",
            color: view === 'history' ? "white" : "#666",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          History ({history.length})
        </button>
      </div>

      {/* Books List View */}
      {view === 'books' && (
        <div>
          {/* Sorting Controls */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <h3 style={{ margin: 0 }}>All Books in Library</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>Sort by:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="author-asc">Author A-Z</option>
                <option value="author-desc">Author Z-A</option>
              </select>
            </div>
          </div>

          {books.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No books in library. Add some books to get started!
            </p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "20px"
            }}>
              {getSortedBooks().map(book => (
                <div key={book.id} style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                  border: `2px solid ${book.available > 0 ? "#e8f5e9" : "#ffebee"}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                }}>
                  {/* Book Cover */}
                  <div style={{
                    height: "200px",
                    backgroundColor: "#f0f4f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    {book.imageUrl ? (
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      display: book.imageUrl ? 'none' : 'flex',
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    }}>
                      <span style={{ fontSize: "60px" }}>📚</span>
                      <span style={{
                        color: "white",
                        fontSize: "12px",
                        marginTop: "8px",
                        textAlign: "center",
                        padding: "0 10px",
                        opacity: 0.9
                      }}>
                        No Cover
                      </span>
                    </div>

                    {/* Availability Badge */}
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      padding: "5px 10px",
                      backgroundColor: book.available > 0 ? "#4caf50" : "#f44336",
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "700",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}>
                      {book.available}/{book.totalCopies}
                    </div>
                  </div>

                  {/* Book Info */}
                  <div style={{ padding: "15px" }}>
                    <h3 style={{
                      margin: "0 0 8px 0",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#333",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {book.title}
                    </h3>
                    <p style={{
                      margin: "0 0 5px 0",
                      fontSize: "13px",
                      color: "#666",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {book.author}
                    </p>
                    {book.isbn && (
                      <p style={{
                        margin: "0 0 10px 0",
                        fontSize: "11px",
                        color: "#999"
                      }}>
                        ISBN: {book.isbn}
                      </p>
                    )}

                    {/* Status */}
                    <div style={{
                      padding: "6px 0",
                      marginBottom: "12px",
                      borderTop: "1px solid #eee",
                      borderBottom: "1px solid #eee"
                    }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: book.available > 0 ? "#4caf50" : "#f44336"
                      }}>
                        {book.available > 0 ? "Available" : "All Borrowed"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setEditingBook(book)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "12px",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#1976D2"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#2196F3"}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "12px",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#d32f2f"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#f44336"}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                          {dueDate.toLocaleDateString()} {isOverdue && "OVERDUE"}
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

      {/* History View */}
      {view === 'history' && (
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <h3 style={{ margin: 0 }}>Borrow/Return History</h3>
            <input
              type="text"
              placeholder="Search by book, student, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "10px 15px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "14px",
                width: "300px",
                maxWidth: "100%"
              }}
            />
          </div>

          {getFilteredHistory().length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              {searchQuery ? "No results found for your search." : "No history available."}
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Book</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Student</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Borrowed</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Due Date</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Returned</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredHistory().map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>
                        <strong>{item.bookTitle}</strong>
                        <br />
                        <span style={{ color: "#666", fontSize: "12px" }}>{item.bookAuthor}</span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {item.studentName}
                        <br />
                        <span style={{ color: "#666", fontSize: "12px" }}>{item.studentNumber}</span>
                      </td>
                      <td style={{ padding: "12px" }}>{new Date(item.borrowDate).toLocaleDateString()}</td>
                      <td style={{ padding: "12px" }}>{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td style={{ padding: "12px" }}>
                        {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            item.status === 'returned' ? "#e8f5e9" :
                            item.isOverdue ? "#ffebee" : "#e3f2fd",
                          color:
                            item.status === 'returned' ? "#2e7d32" :
                            item.isOverdue ? "#c62828" : "#1565c0"
                        }}>
                          {item.status === 'returned' ? 'Returned' :
                           item.isOverdue ? 'Overdue' : 'Borrowed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
