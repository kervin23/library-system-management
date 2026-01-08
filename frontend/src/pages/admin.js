import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import QRScanner from "../components/QRScanner";
import StudentLog from "../components/StudentLog";
import AdminBookManagement from "../components/AdminBookManagement";
import AdminPCView from "../components/AdminPCView";
import Settings from "../components/Settings";
import AdminRequestsPanel from "../components/AdminRequestsPanel";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [borrowedBooksCount, setBorrowedBooksCount] = useState(0);
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
      if (data.user && data.user.role === 'admin') {
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
    fetch(`${API_URL}/users`, {
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

  const loadStats = () => {
    // Get checked-in count
    fetch(`${API_URL}/attendance/current-count`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setCheckedInCount(data.checkedInCount || 0))
    .catch(err => console.error("Error loading check-in count:", err));

    // You can add more stat fetches here
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
    return <div style={{ padding: "20px", textAlign: "center" }}><h2>Loading...</h2></div>;
  }

  const menuItems = [
    { icon: "🏠", label: "Dashboard", action: () => setActiveView('dashboard') },
    { icon: "👥", label: "Student List", action: () => setActiveView('students') },
    { icon: "👔", label: "Admin List", action: () => setActiveView('admins') },
    { icon: "📋", label: "Student Log", action: () => setActiveView('studentlog') },
    { icon: "📚", label: "Manage Books", action: () => setActiveView('books') },
    { icon: "💻", label: "PC Reservations", action: () => setActiveView('pclog') },
    { icon: "📋", label: "Pending Requests", action: () => setActiveView('requests') },
    { icon: "📷", label: "Scan QR Code", action: () => setActiveView('scanner') },
    { icon: "👤", label: "Profile", action: () => setActiveView('profile') },
    { icon: "⚙️", label: "Settings", action: () => setActiveView('settings') },
    { icon: "🚪", label: "Logout", action: 'logout' }
  ];

  const admins = users.filter(user => user.role === 'admin');
  const students = users.filter(user => user.role === 'user' || user.role === 'student');
  const checkedInAdmins = 0; // You can implement this later if needed

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Navbar user={currentUser} menuItems={menuItems} />

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* Dashboard View */}
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
                Admin Dashboard
              </h1>
              <p style={{ margin: 0, color: "#666" }}>
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
              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #2196F3"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>👥</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2196F3" }}>
                  {checkedInCount}/{students.length}
                </div>
                <div style={{ color: "#666", fontSize: "14px" }}>Students (Checked In / Total)</div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #ff9800"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>📚</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff9800" }}>
                  {borrowedBooksCount}
                </div>
                <div style={{ color: "#666", fontSize: "14px" }}>Books Currently Borrowed</div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #4caf50"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>💻</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4caf50" }}>
                  0
                </div>
                <div style={{ color: "#666", fontSize: "14px" }}>Available Computers</div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #9c27b0"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>👔</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#9c27b0" }}>
                  {checkedInAdmins}/{admins.length}
                </div>
                <div style={{ color: "#666", fontSize: "14px" }}>Admins (Checked In / Total)</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px"
            }}>
              <div style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "25px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ marginTop: 0, color: "#333", fontSize: "18px" }}>
                  📊 Today's Activity
                </h3>
                <div style={{ fontSize: "14px", lineHeight: "2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Check-ins:</span>
                    <strong>{checkedInCount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Books borrowed:</span>
                    <strong>0</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Books returned:</span>
                    <strong>0</strong>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "25px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ marginTop: 0, color: "#333", fontSize: "18px" }}>
                  🎯 Quick Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={() => setActiveView('scanner')}
                    style={{
                      padding: "12px",
                      backgroundColor: "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "600",
                      textAlign: "left"
                    }}
                  >
                    📷 Scan QR Code
                  </button>
                  <button
                    onClick={() => setActiveView('students')}
                    style={{
                      padding: "12px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "600",
                      textAlign: "left"
                    }}
                  >
                    👥 View Students
                  </button>
                  <button
                    onClick={() => setActiveView('requests')}
                    style={{
                      padding: "12px",
                      backgroundColor: "#ff9800",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "600",
                      textAlign: "left"
                    }}
                  >
                    📋 Pending Requests
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Student List View */}
        {activeView === 'students' && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h2>Students ({students.length})</h2>
            {students.length === 0 ? (
              <p>No students found.</p>
            ) : (
              students.map(user => (
                <div key={user.id} style={{ 
                  marginBottom: 15, 
                  padding: "20px", 
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  border: "1px solid #ddd"
                }}>
                  <div style={{ marginBottom: "10px" }}>
                    <strong style={{ fontSize: "16px" }}>{user.name}</strong>
                    <span style={{ 
                      marginLeft: 10, 
                      padding: "3px 10px", 
                      backgroundColor: "#4caf50", 
                      color: "white",
                      borderRadius: "3px",
                      fontSize: "12px"
                    }}>
                      STUDENT
                    </span>
                  </div>
                  <div style={{ color: "#666", fontSize: "14px", marginBottom: "12px" }}>
                    📧 {user.email} | 🎓 {user.studentNumber}
                  </div>
                  <div>
                    <button 
                      onClick={() => promoteToAdmin(user.id)} 
                      style={{ 
                        marginRight: 10, 
                        backgroundColor: "#2196F3", 
                        color: "white", 
                        border: "none", 
                        padding: "8px 15px", 
                        borderRadius: "5px", 
                        cursor: "pointer"
                      }}
                    >
                      Promote to Admin
                    </button>
                    <button 
                      onClick={() => deleteUser(user.id)} 
                      style={{ 
                        backgroundColor: "#f44336", 
                        color: "white", 
                        border: "none", 
                        padding: "8px 15px", 
                        borderRadius: "5px", 
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Admin List View */}
        {activeView === 'admins' && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h2>Administrators ({admins.length})</h2>
            {admins.map(user => (
              <div key={user.id} style={{ 
                marginBottom: 15, 
                padding: "20px", 
                backgroundColor: "#e3f2fd",
                borderRadius: "8px",
                border: "1px solid #2196F3"
              }}>
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ fontSize: "16px" }}>{user.name}</strong>
                  <span style={{ 
                    marginLeft: 10, 
                    padding: "3px 10px", 
                    backgroundColor: "#2196F3", 
                    color: "white",
                    borderRadius: "3px",
                    fontSize: "12px"
                  }}>
                    ADMIN
                  </span>
                </div>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "12px" }}>
                  📧 {user.email} | 🎓 {user.studentNumber}
                </div>
                <div>
                  <button 
                    onClick={() => demoteToStudent(user.id)} 
                    disabled={currentUser?.id === user.id}
                    style={{ 
                      marginRight: 10, 
                      backgroundColor: currentUser?.id === user.id ? "#ccc" : "#ff9800", 
                      color: "white", 
                      border: "none", 
                      padding: "8px 15px", 
                      borderRadius: "5px", 
                      cursor: currentUser?.id === user.id ? "not-allowed" : "pointer"
                    }}
                  >
                    Demote to Student
                  </button>
                  <button 
                    onClick={() => deleteUser(user.id)} 
                    disabled={currentUser?.id === user.id}
                    style={{ 
                      backgroundColor: currentUser?.id === user.id ? "#ccc" : "#f44336", 
                      color: "white", 
                      border: "none", 
                      padding: "8px 15px", 
                      borderRadius: "5px", 
                      cursor: currentUser?.id === user.id ? "not-allowed" : "pointer"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h2>Profile</h2>
            <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
              <p><strong>Name:</strong> {currentUser?.name}</p>
              <p><strong>Email:</strong> {currentUser?.email}</p>
              <p><strong>Student Number:</strong> {currentUser?.studentNumber}</p>
              <p><strong>Role:</strong> Administrator</p>
            </div>
          </div>
        )}

        {/* Settings View */}
        {activeView === 'settings' && <Settings />}
      </main>
    </div>
  );
}