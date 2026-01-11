import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import QRCodeOffline from "../components/QRCodeOffline";
import PCReservationRedesigned from "../components/PCReservation";
import StudentActionVerification from "../components/StudentActionVerification";
import Settings from "../components/Settings";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Student() {
  const { theme, isDark } = useTheme();
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
  const [bookSortOrder, setBookSortOrder] = useState('title-asc');
  const [bookSearch, setBookSearch] = useState('');
  const [dueSoonBooks, setDueSoonBooks] = useState([]);
  const [showDueNotification, setShowDueNotification] = useState(true);
  const [peopleInLibrary, setPeopleInLibrary] = useState(0);
  const navigate = useNavigate();

  const checkDueSoonBooks = (books) => {
    const now = new Date();
    const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const dueSoon = books.filter(book => {
      if (book.status !== 'borrowed') return false;
      const dueDate = new Date(book.dueDate);
      return dueDate <= twelveHoursLater && dueDate > now;
    });
    setDueSoonBooks(dueSoon);
  };

  const getSortedBooks = () => {
    let filtered = allBooks;
    if (bookSearch.trim()) {
      const query = bookSearch.toLowerCase();
      filtered = allBooks.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query)
      );
    }
    let sorted = [...filtered];
    switch (bookSortOrder) {
      case 'title-asc': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'title-desc': sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'author-asc': sorted.sort((a, b) => a.author.localeCompare(b.author)); break;
      case 'author-desc': sorted.sort((a, b) => b.author.localeCompare(a.author)); break;
      case 'available-desc': sorted.sort((a, b) => b.available - a.available); break;
      default: break;
    }
    return sorted;
  };

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }

    fetch(`${API_URL}/users/verify`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          loadStats(); loadBorrowedBooks(); loadHistory(); loadCompleteHistory(); loadPeopleInLibrary();
          setLoading(false);
        } else { navigate('/login'); }
      })
      .catch(() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate('/login'); });
  }, [navigate]);

  const loadStats = () => {
    fetch(`${API_URL}/books/my-stats`, { headers: { "Authorization": `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => setStats(data)).catch(err => console.error(err));
  };

  const loadBorrowedBooks = () => {
    fetch(`${API_URL}/books/my-books`, { headers: { "Authorization": `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => { setBorrowedBooks(data); checkDueSoonBooks(data); }).catch(err => console.error(err));
  };

  const loadAllBooks = () => {
    fetch(`${API_URL}/books`, { headers: { "Authorization": `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => setAllBooks(data)).catch(err => console.error(err));
  };

  const loadHistory = () => {
    fetch(`${API_URL}/attendance/my-history`, { headers: { "Authorization": `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => setHistory(data)).catch(err => console.error(err));
  };

  const loadCompleteHistory = () => {
    fetch(`${API_URL}/users/my-complete-history`, { headers: { "Authorization": `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => setCompleteHistory(data)).catch(err => console.error(err));
  };

  const loadPeopleInLibrary = () => {
    fetch(`${API_URL}/attendance/current-count`, { headers: { "Authorization": `Bearer ${getToken()}` } })
      .then(res => res.json()).then(data => setPeopleInLibrary(data.checkedInCount || 0)).catch(err => console.error(err));
  };

  const handleBorrowBook = (bookId) => { setVerificationAction({ type: 'borrow', data: bookId }); setShowVerification(true); };
  const handleReturnBook = (borrowId) => { setVerificationAction({ type: 'return', data: borrowId }); setShowVerification(true); };
  const handleVerificationSuccess = () => { setShowVerification(false); setVerificationAction(null); loadStats(); loadBorrowedBooks(); if (allBooks.length > 0) loadAllBooks(); };
  const handleVerificationCancel = () => { setShowVerification(false); setVerificationAction(null); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <div style={{ textAlign: "center", color: theme.text }}>
          <div style={{ width: "40px", height: "40px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 15px" }}></div>
          <p>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: "🏠", label: "Dashboard", action: () => setActiveView('dashboard') },
    { icon: "📚", label: "Books", action: () => { setActiveView('booklist'); loadAllBooks(); } },
    { icon: "💻", label: "Reserve PC", action: () => setActiveView('pcreserve') },
    { icon: "📋", label: "History", action: () => { setActiveView('history'); loadCompleteHistory(); } },
    { icon: "👤", label: "Profile", action: () => setActiveView('profile') },
    { icon: "⚙️", label: "Settings", action: () => setActiveView('settings') },
    { icon: "🚪", label: "Logout", action: "logout" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.background }}>
      <Navbar user={user} menuItems={menuItems} />
      <QRCodeOffline user={user} show={showQR} onClose={() => setShowQR(false)} />

      {showVerification && verificationAction && (
        <StudentActionVerification user={user} actionType={verificationAction.type} actionData={verificationAction.data} onSuccess={handleVerificationSuccess} onCancel={handleVerificationCancel} />
      )}

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>

        {/* DASHBOARD */}
        {activeView === 'dashboard' && (
          <>
            {/* Due Soon Alert */}
            {dueSoonBooks.length > 0 && showDueNotification && (
              <div style={{ backgroundColor: isDark ? "#3d2f00" : "#fff8e1", border: `1px solid ${theme.warning}`, borderRadius: "8px", padding: "16px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: theme.warning }}>Books Due Soon</strong>
                  {dueSoonBooks.map(book => (
                    <p key={book.id} style={{ margin: "4px 0 0", fontSize: "14px", color: theme.text }}>
                      "{book.title}" - due {new Date(book.dueDate).toLocaleString()}
                    </p>
                  ))}
                </div>
                <button onClick={() => setShowDueNotification(false)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "18px" }}>×</button>
              </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ margin: "0 0 8px", color: theme.text, fontSize: "28px", fontWeight: "600" }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user.name.split(' ')[0]}
              </h1>
              <p style={{ margin: 0, color: theme.textSecondary, fontSize: "15px" }}>
                Here's your library overview
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Borrowed", value: `${stats.borrowed}/${stats.maxBooks}`, icon: "📚", color: theme.info },
                { label: "Overdue", value: stats.overdue, icon: "⏰", color: theme.error },
                { label: "Returned", value: stats.returned, icon: "✓", color: theme.success },
                { label: "In Library", value: peopleInLibrary, icon: "👥", color: theme.secondary }
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: theme.surface, borderRadius: "12px", padding: "20px", border: `1px solid ${theme.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <span style={{ fontSize: "28px" }}>{stat.icon}</span>
                    <span style={{ fontSize: "24px", fontWeight: "700", color: stat.color }}>{stat.value}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: theme.textSecondary }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Main Grid */}
            <div style={{ display: "grid", gridTemplateColumns: window.innerWidth > 768 ? "2fr 1fr" : "1fr", gap: "24px" }}>

              {/* Currently Borrowed */}
              <div style={{ backgroundColor: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
                <div style={{ padding: "20px", borderBottom: `1px solid ${theme.border}` }}>
                  <h3 style={{ margin: 0, color: theme.text, fontSize: "16px", fontWeight: "600" }}>Currently Borrowed</h3>
                </div>
                <div style={{ padding: "20px" }}>
                  {borrowedBooks.filter(b => b.status === 'borrowed').length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: theme.textMuted }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📚</div>
                      <p style={{ margin: 0 }}>No books borrowed</p>
                      <button onClick={() => { setActiveView('booklist'); loadAllBooks(); }} style={{ marginTop: "16px", padding: "10px 20px", backgroundColor: theme.primary, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
                        Browse Books
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {borrowedBooks.filter(b => b.status === 'borrowed').map(book => {
                        const isOverdue = new Date(book.dueDate) < new Date();
                        return (
                          <div key={book.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", backgroundColor: theme.surfaceHover, borderRadius: "8px", border: isOverdue ? `1px solid ${theme.error}` : "none" }}>
                            <div style={{ width: "48px", height: "64px", backgroundColor: theme.primary, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ color: "white", fontSize: "20px" }}>📖</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: "0 0 4px", fontWeight: "600", color: theme.text, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</p>
                              <p style={{ margin: 0, fontSize: "12px", color: theme.textSecondary }}>{book.author}</p>
                              <p style={{ margin: "4px 0 0", fontSize: "12px", color: isOverdue ? theme.error : theme.textMuted }}>
                                Due: {new Date(book.dueDate).toLocaleDateString()} {isOverdue && "(OVERDUE)"}
                              </p>
                            </div>
                            <button onClick={() => handleReturnBook(book.id)} style={{ padding: "8px 16px", backgroundColor: theme.success, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" }}>
                              Return
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* QR Code Card */}
                <div style={{ backgroundColor: theme.primary, borderRadius: "12px", padding: "24px", color: "white", textAlign: "center" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📱</div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "600" }}>Your QR Code</h3>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", opacity: 0.9 }}>Show at library entrance</p>
                  <button onClick={() => setShowQR(true)} style={{ padding: "10px 24px", backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
                    View QR
                  </button>
                </div>

                {/* Quick Links */}
                <div style={{ backgroundColor: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "16px" }}>
                  <h4 style={{ margin: "0 0 12px", color: theme.text, fontSize: "14px", fontWeight: "600" }}>Quick Actions</h4>
                  {[
                    { icon: "📚", label: "Browse Books", action: () => { setActiveView('booklist'); loadAllBooks(); } },
                    { icon: "💻", label: "Reserve PC", action: () => setActiveView('pcreserve') },
                    { icon: "📋", label: "View History", action: () => { setActiveView('history'); loadCompleteHistory(); } }
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} style={{ width: "100%", padding: "12px", marginBottom: i < 2 ? "8px" : 0, backgroundColor: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: theme.text, fontSize: "14px", transition: "background-color 0.2s" }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.surfaceAlt}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.surfaceHover}>
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* BOOK LIST */}
        {activeView === 'booklist' && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
              <h2 style={{ margin: 0, color: theme.text, fontSize: "24px", fontWeight: "600" }}>Books</h2>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input type="text" placeholder="Search..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)}
                  style={{ padding: "10px 14px", border: `1px solid ${theme.border}`, borderRadius: "6px", backgroundColor: theme.surface, color: theme.text, fontSize: "14px", width: "180px", outline: "none" }}
                  onFocus={(e) => e.target.style.borderColor = theme.primary} onBlur={(e) => e.target.style.borderColor = theme.border} />
                <select value={bookSortOrder} onChange={(e) => setBookSortOrder(e.target.value)}
                  style={{ padding: "10px 14px", border: `1px solid ${theme.border}`, borderRadius: "6px", backgroundColor: theme.surface, color: theme.text, fontSize: "14px", cursor: "pointer" }}>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="author-asc">Author A-Z</option>
                  <option value="available-desc">Availability</option>
                </select>
              </div>
            </div>

            {/* My Books Section */}
            {borrowedBooks.filter(b => b.status === 'borrowed').length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ color: theme.text, fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>My Borrowed Books</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                  {borrowedBooks.filter(b => b.status === 'borrowed').map(book => (
                    <div key={book.id} style={{ backgroundColor: theme.surface, borderRadius: "8px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
                      <div style={{ height: "100px", backgroundColor: theme.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "36px" }}>📖</span>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <p style={{ margin: "0 0 4px", fontWeight: "600", fontSize: "13px", color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</p>
                        <p style={{ margin: "0 0 8px", fontSize: "11px", color: theme.textSecondary }}>{book.author}</p>
                        <button onClick={() => handleReturnBook(book.id)} style={{ width: "100%", padding: "8px", backgroundColor: theme.success, color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>Return</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Books */}
            <h3 style={{ color: theme.text, fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>All Books</h3>
            {getSortedBooks().length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: theme.textMuted }}>
                <p>{bookSearch ? "No books match your search" : "No books available"}</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                {getSortedBooks().map(book => {
                  const unavailable = book.available === 0;
                  return (
                    <div key={book.id} style={{ backgroundColor: theme.surface, borderRadius: "8px", border: `1px solid ${theme.border}`, overflow: "hidden", opacity: unavailable ? 0.6 : 1 }}>
                      <div style={{ height: "100px", backgroundColor: unavailable ? theme.textMuted : theme.primary, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <span style={{ fontSize: "36px" }}>📚</span>
                        <span style={{ position: "absolute", top: "8px", right: "8px", padding: "2px 8px", backgroundColor: unavailable ? theme.error : theme.success, color: "white", borderRadius: "10px", fontSize: "10px", fontWeight: "600" }}>
                          {book.available}/{book.totalCopies}
                        </span>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <p style={{ margin: "0 0 4px", fontWeight: "600", fontSize: "13px", color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</p>
                        <p style={{ margin: "0 0 8px", fontSize: "11px", color: theme.textSecondary }}>{book.author}</p>
                        <button onClick={() => handleBorrowBook(book.id)} disabled={unavailable || stats.borrowed >= stats.maxBooks}
                          style={{ width: "100%", padding: "8px", backgroundColor: (unavailable || stats.borrowed >= stats.maxBooks) ? theme.textMuted : theme.info, color: "white", border: "none", borderRadius: "4px", cursor: (unavailable || stats.borrowed >= stats.maxBooks) ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "500" }}>
                          {unavailable ? "Unavailable" : stats.borrowed >= stats.maxBooks ? "Limit Reached" : "Borrow"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeView === 'history' && (
          <div>
            <h2 style={{ margin: "0 0 24px", color: theme.text, fontSize: "24px", fontWeight: "600" }}>Activity History</h2>
            {completeHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: theme.textMuted }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
                <p>No activity yet</p>
              </div>
            ) : (
              <div style={{ backgroundColor: theme.surface, borderRadius: "8px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
                {completeHistory.map((log, i) => {
                  const types = {
                    checkin: { icon: "✓", label: "Checked In", color: theme.success },
                    checkout: { icon: "←", label: "Checked Out", color: theme.warning },
                    borrow: { icon: "📚", label: `Borrowed: ${log.details}`, color: theme.info },
                    return: { icon: "📖", label: `Returned: ${log.details}`, color: theme.success },
                    pc_reserve: { icon: "💻", label: `Reserved PC-${log.details}`, color: theme.primary },
                    pc_release: { icon: "🖥️", label: `Released PC-${log.details}`, color: theme.secondary }
                  };
                  const t = types[log.type] || { icon: "•", label: log.type, color: theme.textMuted };
                  return (
                    <div key={`${log.type}-${log.id}`} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderBottom: i < completeHistory.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: `${t.color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: t.color, fontWeight: "600" }}>
                        {t.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: "500", color: theme.text, fontSize: "14px" }}>{t.label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: theme.textMuted }}>{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PC RESERVATION */}
        {activeView === 'pcreserve' && <PCReservationRedesigned />}

        {/* PROFILE */}
        {activeView === 'profile' && (
          <div>
            <h2 style={{ margin: "0 0 24px", color: theme.text, fontSize: "24px", fontWeight: "600" }}>My Profile</h2>
            <div style={{ backgroundColor: theme.surface, borderRadius: "8px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
              {[
                { label: "Name", value: user.name },
                { label: "Email", value: user.email },
                { label: "Student Number", value: user.studentNumber },
                { label: "Role", value: user.role === 'headadmin' ? 'Head Administrator' : user.role === 'admin' ? 'Administrator' : 'Student' }
              ].map((item, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                  <span style={{ color: theme.textSecondary, fontSize: "14px" }}>{item.label}</span>
                  <span style={{ color: theme.text, fontSize: "14px", fontWeight: "500" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeView === 'settings' && <Settings />}
      </main>
    </div>
  );
}
