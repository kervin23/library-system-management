import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ user, menuItems }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/login');
  };

  const handleMenuClick = (item) => {
    setSidebarOpen(false);
    if (typeof item.action === 'function') {
      item.action();
    } else if (item.action === 'logout') {
      logout();
    }
  };

  return (
    <>
      {/* Header */}
      <header style={{
        backgroundColor: "#667eea",
        color: "white",
        padding: "15px 20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {/* Logo/Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                backgroundColor: "transparent",
                border: "2px solid white",
                color: "white",
                padding: "8px 12px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              ☰
            </button>
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              📚 Library System
            </h2>
          </div>

          {/* Desktop User Info */}
          <div style={{
            display: window.innerWidth > 768 ? "flex" : "none",
            alignItems: "center",
            gap: "15px"
          }}>
            <span style={{ fontSize: "14px" }}>
              Welcome, <strong>{user?.name}</strong>
            </span>
            <span style={{
              padding: "5px 12px",
              backgroundColor: user?.role === 'admin' ? "#2196F3" : "#4caf50",
              borderRadius: "15px",
              fontSize: "12px",
              fontWeight: "600"
            }}>
              {user?.role === 'admin' ? 'ADMIN' : 'STUDENT'}
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 998
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: "fixed",
        top: 0,
        left: sidebarOpen ? 0 : "-300px",
        width: "280px",
        height: "100vh",
        backgroundColor: "white",
        boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
        transition: "left 0.3s ease",
        zIndex: 999,
        overflowY: "auto"
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: "20px",
          backgroundColor: "#667eea",
          color: "white",
          borderBottom: "1px solid rgba(255,255,255,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Menu</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                padding: "0",
                width: "30px",
                height: "30px"
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: "15px", fontSize: "14px" }}>
            <div>{user?.name}</div>
            <div style={{ opacity: 0.8, fontSize: "12px" }}>{user?.email}</div>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ padding: "10px 0" }}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleMenuClick(item)}
              style={{
                width: "100%",
                padding: "15px 20px",
                border: "none",
                backgroundColor: item.action === 'logout' ? "#fff5f5" : "transparent",
                color: item.action === 'logout' ? "#dc3545" : "#333",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "background-color 0.2s",
                borderLeft: "3px solid transparent"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = item.action === 'logout' ? "#ffe5e5" : "#f5f5f5";
                e.target.style.borderLeftColor = "#667eea";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = item.action === 'logout' ? "#fff5f5" : "transparent";
                e.target.style.borderLeftColor = "transparent";
              }}
            >
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <span style={{ fontWeight: item.action === 'logout' ? "600" : "normal" }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}