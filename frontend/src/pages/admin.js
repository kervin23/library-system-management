import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import QRScanner from "../components/QRScanner";
import StudentLog from "../components/StudentLog";
import AdminBookManagement from "../components/AdminBookManagement";
import AdminPCView from "../components/AdminPCView";
import Settings from "../components/Settings";
import AdminRequestsPanel from "../components/AdminRequestsPanel";
import HolidayManagement from "../components/HolidayManagement";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Admin() {
  const { theme, isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [borrowedBooksCount, setBorrowedBooksCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [availablePCs, setAvailablePCs] = useState(0);
  const [totalPCs, setTotalPCs] = useState(30);
  const [studentSortOrder, setStudentSortOrder] = useState('name-asc');
  const [studentSearch, setStudentSearch] = useState('');
  const [adminHistory, setAdminHistory] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('all');
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
      if (data.user && (data.user.role === 'admin' || data.user.role === 'headadmin')) {
        setCurrentUser(data.user);
        loadUsers();
        loadStats();
      } else {
        navigate('/student');
      }
    })
    .catch(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate('/login');
    });
  }, [navigate]);

  const loadUsers = () => {
    fetch(`${API_URL}/users/with-stats`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => {
      setUsers(data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error loading users:", err);
      setLoading(false);
    });
  };

  // Sort and filter students
  const getSortedStudents = (studentList) => {
    let filtered = studentList;

    // Apply search filter
    if (studentSearch.trim()) {
      const query = studentSearch.toLowerCase();
      filtered = studentList.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.studentNumber.includes(query)
      );
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (studentSortOrder) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'borrowed-asc':
        sorted.sort((a, b) => (a.borrowedCount || 0) - (b.borrowedCount || 0));
        break;
      case 'borrowed-desc':
        sorted.sort((a, b) => (b.borrowedCount || 0) - (a.borrowedCount || 0));
        break;
      case 'overdue-desc':
        sorted.sort((a, b) => (b.overdueCount || 0) - (a.overdueCount || 0));
        break;
      case 'id-asc':
        sorted.sort((a, b) => a.studentNumber.localeCompare(b.studentNumber));
        break;
      default:
        break;
    }
    return sorted;
  };

  const loadStats = () => {
    // Get checked-in count
    fetch(`${API_URL}/attendance/current-count`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setCheckedInCount(data.checkedInCount || 0))
    .catch(err => console.error("Error loading check-in count:", err));

    // Get pending requests count
    fetch(`${API_URL}/requests/pending-count`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setPendingCount(data.count || 0))
    .catch(err => console.error("Error loading pending count:", err));

    // Get PC stats
    fetch(`${API_URL}/pcs/stats`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => {
      setAvailablePCs(data.available || 0);
      setTotalPCs(data.totalPCs || 30);
    })
    .catch(err => console.error("Error loading PC stats:", err));

    // Get borrowed books count
    fetch(`${API_URL}/books/all-borrowed`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setBorrowedBooksCount(Array.isArray(data) ? data.length : 0))
    .catch(err => console.error("Error loading borrowed books:", err));
  };

  const loadAdminHistory = (adminId = 'all') => {
    const url = adminId === 'all'
      ? `${API_URL}/users/all-admin-history`
      : `${API_URL}/users/admin-history/${adminId}`;

    fetch(url, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setAdminHistory(data);
      }
    })
    .catch(err => console.error("Error loading admin history:", err));
  };

  const deleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else loadUsers();
      })
      .catch(err => console.error("Error deleting user:", err));
    }
  };

  const promoteToAdmin = (id) => {
    if (window.confirm("Promote this student to admin?")) {
      fetch(`${API_URL}/users/${id}/promote`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ role: "admin" })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else { alert("User promoted to admin!"); loadUsers(); }
      })
      .catch(err => console.error("Error promoting user:", err));
    }
  };

  const demoteToStudent = (id) => {
    if (window.confirm("Demote this admin to student?")) {
      fetch(`${API_URL}/users/${id}/promote`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ role: "user" })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else { alert("Admin demoted to student!"); loadUsers(); }
      })
      .catch(err => console.error("Error demoting user:", err));
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: "20px",
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.background,
        color: theme.text
      }}>
        <div>
          <div style={{
            width: "50px",
            height: "50px",
            border: `4px solid ${theme.border}`,
            borderTopColor: theme.primary,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <h2>Loading...</h2>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const isHeadAdminUser = currentUser?.role === 'headadmin';

  const menuItems = [
    { icon: "🏠", label: "Dashboard", action: () => setActiveView('dashboard') },
    { icon: "👥", label: "Student List", action: () => setActiveView('students') },
    { icon: "👔", label: "Admin List", action: () => setActiveView('admins') },
    ...(isHeadAdminUser ? [{ icon: "📊", label: "Admin History", action: () => setActiveView('adminhistory') }] : []),
    { icon: "📋", label: "Student Log", action: () => setActiveView('studentlog') },
    { icon: "📚", label: "Manage Books", action: () => setActiveView('books') },
    { icon: "💻", label: "PC Reservations", action: () => setActiveView('pclog') },
    { icon: "📋", label: "Pending Requests", action: () => setActiveView('requests') },
    { icon: "📅", label: "Holidays", action: () => setActiveView('holidays') },
    { icon: "📷", label: "Scan QR Code", action: () => setActiveView('scanner') },
    { icon: "👤", label: "Profile", action: () => setActiveView('profile') },
    { icon: "⚙️", label: "Settings", action: () => setActiveView('settings') },
    { icon: "🚪", label: "Logout", action: 'logout' }
  ];

  const admins = users.filter(user => user.role === 'admin' || user.role === 'headadmin');
  const students = users.filter(user => user.role === 'user' || user.role === 'student');
  const isHeadAdmin = currentUser?.role === 'headadmin';

  // Common styles
  const cardStyle = {
    backgroundColor: theme.surface,
    borderRadius: "12px",
    padding: "25px",
    boxShadow: `0 4px 20px ${theme.shadow}`
  };

  const statCardStyle = (borderColor) => ({
    ...cardStyle,
    borderLeft: `4px solid ${borderColor}`,
    transition: "transform 0.2s ease, box-shadow 0.2s ease"
  });

  const buttonStyle = (bgColor, hoverBg) => ({
    backgroundColor: bgColor,
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease"
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.background }}>
      <Navbar user={currentUser} menuItems={menuItems} />

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            <div style={{
              ...cardStyle,
              marginBottom: "30px",
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
              color: "white"
            }}>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>
                Admin Dashboard
              </h1>
              <p style={{ margin: 0, opacity: 0.9 }}>
                Manage your library system efficiently
              </p>
            </div>

            {/* Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={statCardStyle(theme.info)}>
                <div style={{
                  fontSize: "32px",
                  marginBottom: "10px",
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: `${theme.info}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>👥</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: theme.info }}>
                  {checkedInCount}/{students.length}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: "14px" }}>Students (Checked In / Total)</div>
              </div>

              <div style={statCardStyle(theme.warning)}>
                <div style={{
                  fontSize: "32px",
                  marginBottom: "10px",
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: `${theme.warning}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>📚</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: theme.warning }}>
                  {borrowedBooksCount}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: "14px" }}>Books Currently Borrowed</div>
              </div>

              <div style={statCardStyle(theme.success)}>
                <div style={{
                  fontSize: "32px",
                  marginBottom: "10px",
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: `${theme.success}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>💻</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: theme.success }}>
                  {availablePCs}/{totalPCs}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: "14px" }}>Available Computers</div>
              </div>

              <div
                onClick={() => setActiveView('requests')}
                style={{
                  ...statCardStyle(pendingCount > 0 ? theme.error : theme.primary),
                  cursor: "pointer"
                }}
              >
                <div style={{
                  fontSize: "32px",
                  marginBottom: "10px",
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: pendingCount > 0 ? `${theme.error}15` : `${theme.primary}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>📋</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: pendingCount > 0 ? theme.error : theme.primary }}>
                  {pendingCount}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: "14px" }}>
                  Pending Requests {pendingCount > 0 && <span style={{ color: theme.error }}>(Click to view)</span>}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px"
            }}>
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, color: theme.text, fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: `${theme.primary}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px"
                  }}>📊</span>
                  Today's Activity
                </h3>
                <div style={{ fontSize: "14px", lineHeight: "2.2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: theme.surfaceHover, borderRadius: "8px", marginBottom: "8px" }}>
                    <span style={{ color: theme.textSecondary }}>Check-ins:</span>
                    <strong style={{ color: theme.text }}>{checkedInCount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: theme.surfaceHover, borderRadius: "8px", marginBottom: "8px" }}>
                    <span style={{ color: theme.textSecondary }}>Books borrowed:</span>
                    <strong style={{ color: theme.text }}>0</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: theme.surfaceHover, borderRadius: "8px" }}>
                    <span style={{ color: theme.textSecondary }}>Books returned:</span>
                    <strong style={{ color: theme.text }}>0</strong>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, color: theme.text, fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: `${theme.primary}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px"
                  }}>🎯</span>
                  Quick Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={() => setActiveView('scanner')}
                    style={{
                      padding: "14px 18px",
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "600",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "15px",
                      boxShadow: `0 4px 15px ${theme.primary}30`
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>📷</span> Scan QR Code
                  </button>
                  <button
                    onClick={() => setActiveView('students')}
                    style={{
                      padding: "14px 18px",
                      backgroundColor: theme.surfaceHover,
                      color: theme.text,
                      border: `2px solid ${theme.border}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "600",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "15px"
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>👥</span> View Students
                  </button>
                  <button
                    onClick={() => setActiveView('requests')}
                    style={{
                      padding: "14px 18px",
                      backgroundColor: pendingCount > 0 ? `${theme.error}15` : theme.surfaceHover,
                      color: pendingCount > 0 ? theme.error : theme.text,
                      border: `2px solid ${pendingCount > 0 ? theme.error : theme.border}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "600",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "15px"
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>📋</span> Pending Requests
                    {pendingCount > 0 && (
                      <span style={{
                        marginLeft: "auto",
                        backgroundColor: theme.error,
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "12px"
                      }}>{pendingCount}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Student List View */}
        {activeView === 'students' && (
          <div style={cardStyle}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
              flexWrap: "wrap",
              gap: "15px"
            }}>
              <h2 style={{ margin: 0, color: theme.text }}>Students ({students.length})</h2>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: `2px solid ${theme.border}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    width: "200px",
                    backgroundColor: theme.surface,
                    color: theme.text,
                    outline: "none"
                  }}
                />
                <select
                  value={studentSortOrder}
                  onChange={(e) => setStudentSortOrder(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: `2px solid ${theme.border}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    backgroundColor: theme.surface,
                    color: theme.text
                  }}
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="id-asc">Student ID</option>
                  <option value="borrowed-desc">Most Borrowed</option>
                  <option value="borrowed-asc">Least Borrowed</option>
                  <option value="overdue-desc">Most Overdue</option>
                </select>
              </div>
            </div>

            {getSortedStudents(students).length === 0 ? (
              <p style={{ color: theme.textSecondary, textAlign: "center", padding: "40px" }}>
                {studentSearch ? "No students found matching your search." : "No students found."}
              </p>
            ) : (
              getSortedStudents(students).map(user => (
                <div key={user.id} style={{
                  marginBottom: 15,
                  padding: "20px",
                  backgroundColor: user.overdueCount > 0 ? `${theme.warning}10` : theme.surfaceHover,
                  borderRadius: "12px",
                  border: `2px solid ${user.overdueCount > 0 ? theme.warning : theme.border}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ fontSize: "16px", color: theme.text }}>{user.name}</strong>
                        <span style={{
                          marginLeft: 10,
                          padding: "4px 12px",
                          backgroundColor: theme.success,
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          STUDENT
                        </span>
                        {user.overdueCount > 0 && (
                          <span style={{
                            marginLeft: 10,
                            padding: "4px 12px",
                            backgroundColor: theme.error,
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            {user.overdueCount} OVERDUE
                          </span>
                        )}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: "14px", marginBottom: "12px" }}>
                        {user.email} | ID: {user.studentNumber}
                      </div>
                      <div style={{ display: "flex", gap: "10px", fontSize: "13px", flexWrap: "wrap" }}>
                        <span style={{
                          padding: "6px 12px",
                          backgroundColor: `${theme.info}15`,
                          borderRadius: "8px",
                          color: theme.info
                        }}>
                          Currently Borrowed: <strong>{user.borrowedCount || 0}</strong>
                        </span>
                        <span style={{
                          padding: "6px 12px",
                          backgroundColor: `${theme.success}15`,
                          borderRadius: "8px",
                          color: theme.success
                        }}>
                          Total Borrows: <strong>{user.totalBorrows || 0}</strong>
                        </span>
                        {user.overdueCount > 0 && (
                          <span style={{
                            padding: "6px 12px",
                            backgroundColor: `${theme.error}15`,
                            borderRadius: "8px",
                            color: theme.error
                          }}>
                            Overdue: <strong>{user.overdueCount}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {isHeadAdmin && (
                        <button
                          onClick={() => promoteToAdmin(user.id)}
                          style={buttonStyle(theme.info)}
                        >
                          Promote to Admin
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={buttonStyle(theme.error)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Admin List View */}
        {activeView === 'admins' && (
          <div style={cardStyle}>
            <h2 style={{ color: theme.text, marginBottom: "25px" }}>Administrators ({admins.length})</h2>
            {admins.map(user => {
              const isUserHeadAdmin = user.role === 'headadmin';
              const canModify = isHeadAdmin && !isUserHeadAdmin && currentUser?.id !== user.id;

              return (
                <div key={user.id} style={{
                  marginBottom: 15,
                  padding: "20px",
                  backgroundColor: isUserHeadAdmin ? `${theme.warning}10` : `${theme.info}10`,
                  borderRadius: "12px",
                  border: `2px solid ${isUserHeadAdmin ? theme.warning : theme.info}`
                }}>
                  <div style={{ marginBottom: "10px" }}>
                    <strong style={{ fontSize: "16px", color: theme.text }}>{user.name}</strong>
                    <span style={{
                      marginLeft: 10,
                      padding: "4px 12px",
                      backgroundColor: isUserHeadAdmin ? theme.warning : theme.info,
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}>
                      {isUserHeadAdmin ? "HEAD ADMIN" : "ADMIN"}
                    </span>
                    {currentUser?.id === user.id && (
                      <span style={{
                        marginLeft: 10,
                        padding: "4px 12px",
                        backgroundColor: theme.success,
                        color: "white",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: "14px", marginBottom: "12px" }}>
                    {user.email} | ID: {user.studentNumber}
                  </div>
                  {isHeadAdmin && !isUserHeadAdmin && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => demoteToStudent(user.id)}
                        disabled={!canModify}
                        style={{
                          ...buttonStyle(canModify ? theme.warning : theme.textMuted),
                          cursor: canModify ? "pointer" : "not-allowed"
                        }}
                      >
                        Demote to Student
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        disabled={!canModify}
                        style={{
                          ...buttonStyle(canModify ? theme.error : theme.textMuted),
                          cursor: canModify ? "pointer" : "not-allowed"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* QR Scanner View */}
        {activeView === 'scanner' && <QRScanner />}

        {/* Student Log View */}
        {activeView === 'studentlog' && <StudentLog />}

        {/* Book Management View */}
        {activeView === 'books' && <AdminBookManagement />}

        {/* PC Reservations View */}
        {activeView === 'pclog' && <AdminPCView />}

        {/* Pending Requests View */}
        {activeView === 'requests' && <AdminRequestsPanel />}

        {/* Profile View */}
        {activeView === 'profile' && (
          <div style={cardStyle}>
            <h2 style={{ color: theme.text, marginBottom: "25px" }}>Profile</h2>
            <div style={{ fontSize: "15px", lineHeight: "2.5" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: theme.surfaceHover,
                borderRadius: "8px",
                marginBottom: "10px"
              }}>
                <span style={{ color: theme.textSecondary }}>Name:</span>
                <strong style={{ color: theme.text }}>{currentUser?.name}</strong>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: theme.surfaceHover,
                borderRadius: "8px",
                marginBottom: "10px"
              }}>
                <span style={{ color: theme.textSecondary }}>Email:</span>
                <strong style={{ color: theme.text }}>{currentUser?.email}</strong>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: theme.surfaceHover,
                borderRadius: "8px",
                marginBottom: "10px"
              }}>
                <span style={{ color: theme.textSecondary }}>Student Number:</span>
                <strong style={{ color: theme.text }}>{currentUser?.studentNumber}</strong>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: `${theme.primary}15`,
                borderRadius: "8px",
                border: `1px solid ${theme.primary}30`
              }}>
                <span style={{ color: theme.textSecondary }}>Role:</span>
                <strong style={{ color: theme.primary }}>
                  {currentUser?.role === 'headadmin' ? 'Head Administrator' : 'Administrator'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Admin History View - Head Admin Only */}
        {activeView === 'adminhistory' && isHeadAdmin && (
          <div style={cardStyle}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
              flexWrap: "wrap",
              gap: "15px"
            }}>
              <h2 style={{ margin: 0, color: theme.text }}>Admin Transaction History</h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: theme.textSecondary }}>Filter by Admin:</span>
                <select
                  value={selectedAdmin}
                  onChange={(e) => {
                    setSelectedAdmin(e.target.value);
                    loadAdminHistory(e.target.value);
                  }}
                  style={{
                    padding: "10px 14px",
                    border: `2px solid ${theme.border}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    backgroundColor: theme.surface,
                    color: theme.text
                  }}
                >
                  <option value="all">All Admins</option>
                  {admins.filter(a => a.role !== 'headadmin').map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => loadAdminHistory(selectedAdmin)}
                  style={{
                    padding: "10px 18px",
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>

            {adminHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>
                <p>No transaction history found.</p>
                <button
                  onClick={() => loadAdminHistory(selectedAdmin)}
                  style={{
                    padding: "12px 24px",
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginTop: "10px",
                    fontWeight: "600"
                  }}
                >
                  Load History
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.surfaceHover }}>
                      <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${theme.border}`, color: theme.text }}>Date/Time</th>
                      <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${theme.border}`, color: theme.text }}>Admin</th>
                      <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${theme.border}`, color: theme.text }}>Action</th>
                      <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${theme.border}`, color: theme.text }}>Target</th>
                      <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${theme.border}`, color: theme.text }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminHistory.map((item, index) => {
                      let actionColor = theme.text;
                      let actionBg = theme.surfaceHover;

                      if (item.action.includes('APPROVE')) {
                        actionColor = theme.success;
                        actionBg = `${theme.success}15`;
                      } else if (item.action.includes('REJECT')) {
                        actionColor = theme.error;
                        actionBg = `${theme.error}15`;
                      } else if (item.action.includes('PROMOTE')) {
                        actionColor = theme.info;
                        actionBg = `${theme.info}15`;
                      } else if (item.action.includes('DEMOTE')) {
                        actionColor = theme.warning;
                        actionBg = `${theme.warning}15`;
                      }

                      return (
                        <tr key={index} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                          <td style={{ padding: "14px", color: theme.text }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: "14px", color: theme.text }}>
                            <strong>{item.adminName}</strong>
                          </td>
                          <td style={{ padding: "14px" }}>
                            <span style={{
                              padding: "5px 12px",
                              backgroundColor: actionBg,
                              color: actionColor,
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600"
                            }}>
                              {item.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: "14px", color: theme.text }}>
                            {item.targetName || '-'}
                          </td>
                          <td style={{ padding: "14px", color: theme.textSecondary, fontSize: "13px" }}>
                            {item.details || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Settings View */}
        {activeView === 'settings' && <Settings />}

        {/* Holiday Management View */}
        {activeView === 'holidays' && <HolidayManagement />}
      </main>
    </div>
  );
}
