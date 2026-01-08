import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import QRCodeOffline from "../components/QRCodeOffline";
import PCReservationRedesigned from "../components/PCReservation";
import StudentActionVerification from "../components/StudentActionVerification";
import Settings from "../components/Settings";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Student() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({ borrowed: 0, returned: 0, overdue: 0, maxBooks: 2 });
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [completeHistory, setCompleteHistory] = useState([]);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationAction, setVerificationAction] = useState(null);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    fetch(`${API_URL}/users/verify`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setUser(data.user);
        loadStats();
        loadBorrowedBooks();
        loadHistory();
        loadCompleteHistory();
        setLoading(false);
      } else {
        navigate('/login');
      }
    })
    .catch(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate('/login');
    });
  }, [navigate]);

  const loadStats = () => {
    fetch(`${API_URL}/books/my-stats`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setStats(data))
    .catch(err => console.error("Error loading stats:", err));
  };

  const loadBorrowedBooks = () => {
    fetch(`${API_URL}/books/my-books`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setBorrowedBooks(data))
    .catch(err => console.error("Error loading borrowed books:", err));
  };

  const loadAllBooks = () => {
    fetch(`${API_URL}/books`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setAllBooks(data))
    .catch(err => console.error("Error loading books:", err));
  };

  const loadHistory = () => {
    fetch(`${API_URL}/attendance/my-history`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setHistory(data))
    .catch(err => console.error("Error loading history:", err));
  };

  const loadCompleteHistory = () => {
    // Load complete history including books and PCs
    fetch(`${API_URL}/users/my-complete-history`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setCompleteHistory(data))
    .catch(err => console.error("Error loading complete history:", err));
  };

  const handleBorrowBook = async (bookId) => {
    // Show verification modal instead of direct borrow
    setVerificationAction({
      type: 'borrow',
      data: bookId
    });
    setShowVerification(true);
  };

  const handleReturnBook = async (borrowId) => {
    // Show verification modal instead of direct return
    setVerificationAction({
      type: 'return',
      data: borrowId
    });
    setShowVerification(true);
  };

  const handleVerificationSuccess = (data) => {
    setShowVerification(false);
    setVerificationAction(null);
    
    // Show success message
    if (verificationAction.type === 'borrow') {
      alert(`Book borrowed successfully! Due date: ${new Date(data.dueDate).toLocaleDateString()}`);
    } else if (verificationAction.type === 'return') {
      alert("Book returned successfully!");
    }
    
    // Reload data
    loadStats();
    loadBorrowedBooks();
    if (allBooks.length > 0) loadAllBooks();
  };

  const handleVerificationCancel = () => {
    setShowVerification(false);
    setVerificationAction(null);
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}><h2>Loading...</h2></div>;
  }

  const menuItems = [
    { icon: "🏠", label: "Dashboard", action: () => setActiveView('dashboard') },
    { icon: "📚", label: "Book List", action: () => { setActiveView('booklist'); loadAllBooks(); } },
    { icon: "💻", label: "Reserve PC", action: () => setActiveView('pcreserve') },
    { icon: "📋", label: "History", action: () => { setActiveView('history'); loadCompleteHistory(); } },
    { icon: "👤", label: "Profile", action: () => setActiveView('profile') },
    { icon: "⚙️", label: "Settings", action: () => setActiveView('settings') },
    { icon: "🚪", label: "Logout", action: "logout" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Navbar user={user} menuItems={menuItems} />
      <QRCodeOffline user={user} show={showQR} onClose={() => setShowQR(false)} />
      
      {/* Verification Modal */}
      {showVerification && verificationAction && (
        <StudentActionVerification
          user={user}
          actionType={verificationAction.type}
          actionData={verificationAction.data}
          onSuccess={handleVerificationSuccess}
          onCancel={handleVerificationCancel}
        />
      )}

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && (
          <>
            <div style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "30px",
              marginBottom: "30px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h1 style={{ margin: "0 0 10px 0", color: "#333" }}>
                Welcome back, {user.name}! 👋
              </h1>
              <p style={{ margin: 0, color: "#666" }}>
                Here's what's happening with your library account today.
              </p>
            </div>

            {/* Stats Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #2196F3"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>📚</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2196F3" }}>
                  {stats.borrowed}/{stats.maxBooks}
                </div>
                <div style={{ color: "#666", fontSize: "14px" }}>Books Borrowed</div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #ff9800"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>⏰</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff9800" }}>
                  {stats.overdue}
                </div>
                <div style={{ color: "#666", fontSize: "14px" }}>Overdue Books</div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #4caf50"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>✅</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4caf50" }}>
                  {stats.returned}
                </div>
                <div style={{ color: "#666", fontSize: "14px" }}>Total Returned</div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #9c27b0"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>🎯</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#9c27b0" }}>0</div>
                <div style={{ color: "#666", fontSize: "14px" }}>Overdue</div>
              </div>
            </div>

            {/* QR Code and Quick Actions */}
            <div style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth > 768 ? "1fr 1fr" : "1fr",
              gap: "20px"
            }}>
              <div style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "30px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                textAlign: "center"
              }}>
                <h2 style={{ marginTop: 0, color: "#333" }}>Your Library QR Code</h2>
                <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
                  Show this QR code to check in/out of the library
                </p>
                <button
                  onClick={() => setShowQR(true)}
                  style={{
                    padding: "15px 30px",
                    backgroundColor: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
                  }}
                >
                  Show My QR Code
                </button>
              </div>

              <div style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "30px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{ marginTop: 0, color: "#333" }}>Quick Actions</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { icon: "🔍", label: "Search Books", action: () => { setActiveView('booklist'); loadAllBooks(); } },
                    { icon: "📖", label: "My Borrowed Books", action: () => setActiveView('booklist') },
                    { icon: "💻", label: "Reserve PC", action: () => setActiveView('pcreserve') },
                    { icon: "📋", label: "View History", action: () => { setActiveView('history'); loadCompleteHistory(); } },
                    { icon: "👤", label: "My Profile", action: () => setActiveView('profile') }
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} style={{
                      padding: "15px",
                      backgroundColor: "#f5f5f5",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "15px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#667eea";
                      e.target.style.color = "white";
                      e.target.style.borderColor = "#667eea";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f5f5f5";
                      e.target.style.color = "black";
                      e.target.style.borderColor = "#ddd";
                    }}>
                      <span style={{ fontSize: "24px" }}>{item.icon}</span>
                      <span style={{ fontWeight: "500" }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* BOOK LIST VIEW */}
        {activeView === 'booklist' && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h2>My Borrowed Books ({stats.borrowed}/{stats.maxBooks})</h2>
            
            {borrowedBooks.filter(b => b.status === 'borrowed').length === 0 ? (
              <p style={{ color: "#666", padding: "20px", textAlign: "center" }}>
                You haven't borrowed any books yet.
              </p>
            ) : (
              borrowedBooks.filter(b => b.status === 'borrowed').map(book => (
                <div key={book.id} style={{
                  marginBottom: "15px",
                  padding: "20px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  border: "1px solid #ddd"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{book.title}</h3>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Author:</strong> {book.author}
                      </p>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Borrowed:</strong> {new Date(book.borrowDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Due:</strong> <span style={{ 
                          color: new Date(book.dueDate) < new Date() ? "#f44336" : "#4caf50",
                          fontWeight: "600"
                        }}>
                          {new Date(book.dueDate).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleReturnBook(book.id)}
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
                      Return
                    </button>
                  </div>
                </div>
              ))
            )}

            <h2 style={{ marginTop: "40px" }}>Available Books</h2>
            {allBooks.length === 0 ? (
              <p style={{ color: "#666", padding: "20px", textAlign: "center" }}>
                No books available. Contact admin.
              </p>
            ) : (
              allBooks.map(book => {
                const isAvailable = book.available > 0;
                const isFullyBorrowed = book.available === 0;
                
                return (
                  <div key={book.id} style={{
                    marginBottom: "15px",
                    padding: "20px",
                    backgroundColor: isFullyBorrowed ? "#ffebee" : "#e3f2fd",
                    borderRadius: "8px",
                    border: `1px solid ${isFullyBorrowed ? "#f44336" : "#2196F3"}`,
                    opacity: isFullyBorrowed ? 0.7 : 1
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{book.title}</h3>
                        <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                          <strong>Author:</strong> {book.author}
                        </p>
                        <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                          <strong>Available:</strong> 
                          <span style={{
                            color: isFullyBorrowed ? "#f44336" : "#4caf50",
                            fontWeight: "600",
                            marginLeft: "5px"
                          }}>
                            {book.available}/{book.totalCopies}
                          </span>
                        </p>
                      </div>
                      {isFullyBorrowed ? (
                        <span style={{
                          padding: "10px 20px",
                          backgroundColor: "#f44336",
                          color: "white",
                          borderRadius: "5px",
                          fontSize: "14px",
                          fontWeight: "600"
                        }}>
                          All Borrowed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleBorrowBook(book.id)}
                          disabled={stats.borrowed >= stats.maxBooks}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: stats.borrowed >= stats.maxBooks ? "#ccc" : "#2196F3",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: stats.borrowed >= stats.maxBooks ? "not-allowed" : "pointer",
                            fontWeight: "600"
                          }}
                        >
                          {stats.borrowed >= stats.maxBooks ? "Limit Reached" : "Borrow"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeView === 'history' && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h2>My Complete History</h2>
            {completeHistory.length === 0 ? (
              <p style={{ color: "#666", padding: "20px", textAlign: "center" }}>
                No history available yet.
              </p>
            ) : (
              completeHistory.map(log => {
                let icon = "";
                let bgColor = "";
                let borderColor = "";
                let actionText = "";

                if (log.type === 'checkin') {
                  icon = "✓";
                  bgColor = "#e8f5e9";
                  borderColor = "#4caf50";
                  actionText = "Checked In";
                } else if (log.type === 'checkout') {
                  icon = "✗";
                  bgColor = "#fff3e0";
                  borderColor = "#ff9800";
                  actionText = "Checked Out";
                } else if (log.type === 'borrow') {
                  icon = "📚";
                  bgColor = "#e3f2fd";
                  borderColor = "#2196F3";
                  actionText = `Borrowed: ${log.details}`;
                } else if (log.type === 'return') {
                  icon = "📖";
                  bgColor = "#f3e5f5";
                  borderColor = "#9c27b0";
                  actionText = `Returned: ${log.details}`;
                } else if (log.type === 'pc_reserve') {
                  icon = "💻";
                  bgColor = "#e0f2f1";
                  borderColor = "#009688";
                  actionText = `Reserved PC-${log.details}`;
                } else if (log.type === 'pc_release') {
                  icon = "🖥️";
                  bgColor = "#fce4ec";
                  borderColor = "#e91e63";
                  actionText = `Released PC-${log.details}`;
                }

                return (
                  <div key={`${log.type}-${log.id}`} style={{
                    marginBottom: "12px",
                    padding: "15px",
                    backgroundColor: bgColor,
                    borderRadius: "8px",
                    border: `1px solid ${borderColor}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "16px" }}>
                          {icon} {actionText}
                        </strong>
                        <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PC RESERVATION VIEW */}
        {activeView === 'pcreserve' && <PCReservationRedesigned />}

        {/* PROFILE VIEW */}
        {activeView === 'profile' && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h2>My Profile</h2>
            <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Student Number:</strong> {user.studentNumber}</p>
              <p><strong>Role:</strong> {user.role === 'admin' ? 'Administrator' : 'Student'}</p>
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && <Settings />}
      </main>
    </div>
  );
}