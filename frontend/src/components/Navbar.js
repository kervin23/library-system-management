import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Navbar({ user, menuItems }) {
  const { theme, isDark } = useTheme();
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
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
        color: "white",
        padding: "15px 20px",
        boxShadow: `0 4px 20px ${theme.primary}40`,
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
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "10px 14px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s ease",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.25)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.15)"}
            >
              ☰
            </button>
            <h2 style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "28px" }}>📚</span>
              Library System
            </h2>
          </div>

          {/* Desktop User Info */}
          <div style={{
            display: window.innerWidth > 768 ? "flex" : "none",
            alignItems: "center",
            gap: "15px"
          }}>
            <span style={{ fontSize: "14px", opacity: 0.9 }}>
              Welcome, <strong>{user?.name}</strong>
            </span>
            <span style={{
              padding: "6px 14px",
              backgroundColor: user?.role === 'headadmin'
                ? "#9333ea"
                : user?.role === 'admin'
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.2)",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)"
            }}>
              {user?.role === 'headadmin' ? 'HEAD ADMIN' : user?.role === 'admin' ? 'ADMIN' : 'STUDENT'}
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
            backdropFilter: "blur(4px)",
            zIndex: 998
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: "fixed",
        top: 0,
        left: sidebarOpen ? 0 : "-320px",
        width: "300px",
        height: "100vh",
        backgroundColor: theme.surface,
        boxShadow: `4px 0 30px ${theme.shadow}`,
        transition: "left 0.3s ease",
        zIndex: 999,
        overflowY: "auto"
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: "25px 20px",
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
          color: "white"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>Menu</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "none",
                color: "white",
                fontSize: "20px",
                cursor: "pointer",
                padding: "5px 10px",
                borderRadius: "8px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.25)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.15)"}
            >
              x
            </button>
          </div>
          <div style={{ marginTop: "20px" }}>
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
              fontSize: "24px"
            }}>
              👤
            </div>
            <div style={{ fontWeight: "600", fontSize: "16px" }}>{user?.name}</div>
            <div style={{ opacity: 0.8, fontSize: "13px", marginTop: "4px" }}>{user?.email}</div>
            <div style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "4px 10px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "15px",
              fontSize: "11px",
              fontWeight: "600"
            }}>
              {user?.role === 'headadmin' ? 'HEAD ADMIN' : user?.role === 'admin' ? 'ADMIN' : 'STUDENT'}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ padding: "15px 10px" }}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleMenuClick(item)}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: "none",
                backgroundColor: item.action === 'logout'
                  ? (isDark ? "rgba(239, 68, 68, 0.1)" : "#fff5f5")
                  : "transparent",
                color: item.action === 'logout' ? theme.error : theme.text,
                textAlign: "left",
                cursor: "pointer",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transition: "all 0.2s ease",
                borderRadius: "12px",
                marginBottom: "5px",
                fontWeight: item.action === 'logout' ? "600" : "500"
              }}
              onMouseEnter={(e) => {
                if (item.action === 'logout') {
                  e.currentTarget.style.backgroundColor = isDark ? "rgba(239, 68, 68, 0.2)" : "#ffe5e5";
                } else {
                  e.currentTarget.style.backgroundColor = theme.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (item.action === 'logout') {
                  e.currentTarget.style.backgroundColor = isDark ? "rgba(239, 68, 68, 0.1)" : "#fff5f5";
                } else {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span style={{
                fontSize: "22px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: item.action === 'logout'
                  ? "transparent"
                  : (isDark ? "rgba(2, 228, 155, 0.1)" : "#e8f8f2"),
                borderRadius: "8px"
              }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </>
  );
}
