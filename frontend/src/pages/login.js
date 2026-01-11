import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Login() {
  const { theme, isDark } = useTheme();
  const [form, setForm] = useState({ studentNumber: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_URL}/users/verify`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          if (data.user.role === 'admin' || data.user.role === 'headadmin') {
            navigate('/admin');
          } else {
            navigate('/student');
          }
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
    }
  }, [navigate]);

  const loginBtn = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.error) {
          setMessage(data.error);
        } else {
          setMessage("Login successful!");
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          setTimeout(() => {
            if (data.user.role === 'admin' || data.user.role === 'headadmin') {
              navigate('/admin');
            } else {
              navigate('/student');
            }
          }, 500);
        }
      })
      .catch(err => {
        setLoading(false);
        setMessage("Login failed: server error");
      });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      backgroundColor: theme.background
    }}>
      {/* Left side - Branding */}
      <div style={{
        flex: 1,
        background: `linear-gradient(145deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
        display: window.innerWidth > 900 ? "flex" : "none",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        color: "white"
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "80px", marginBottom: "30px" }}>📚</div>
          <h1 style={{ fontSize: "36px", marginBottom: "20px", fontWeight: "700" }}>
            Library Management System
          </h1>
          <p style={{ fontSize: "18px", opacity: 0.9, lineHeight: 1.6 }}>
            Manage your books, reserve PCs, and track your library activities all in one place.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px"
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Mobile Logo */}
          <div style={{
            display: window.innerWidth <= 900 ? "block" : "none",
            textAlign: "center",
            marginBottom: "40px"
          }}>
            <div style={{ fontSize: "50px", marginBottom: "15px" }}>📚</div>
            <h1 style={{ color: theme.primary, fontSize: "24px", margin: 0 }}>Library System</h1>
          </div>

          <h2 style={{
            color: theme.text,
            marginBottom: "10px",
            fontSize: "28px",
            fontWeight: "600"
          }}>
            Welcome back
          </h2>
          <p style={{
            color: theme.textSecondary,
            marginBottom: "35px",
            fontSize: "15px"
          }}>
            Sign in to your account
          </p>

          <form onSubmit={loginBtn}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: theme.text,
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Student Number
              </label>
              <input
                type="text"
                placeholder="Enter your student number"
                value={form.studentNumber}
                onChange={(e) => setForm({ ...form, studentNumber: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: `1px solid ${theme.border}`,
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  backgroundColor: theme.surface,
                  color: theme.text,
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: theme.text,
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: `1px solid ${theme.border}`,
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  backgroundColor: theme.surface,
                  color: theme.text,
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: "24px" }}>
              <a
                href="/forgot-password"
                style={{
                  color: theme.primary,
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: loading ? theme.textMuted : theme.primary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = theme.primaryDark)}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = theme.primary)}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {message && (
            <div style={{
              marginTop: "20px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: message.includes("successful")
                ? (isDark ? "rgba(76, 175, 80, 0.15)" : "#e8f5e9")
                : (isDark ? "rgba(239, 83, 80, 0.15)" : "#ffebee"),
              color: message.includes("successful") ? theme.success : theme.error,
              fontSize: "14px",
              textAlign: "center"
            }}>
              {message}
            </div>
          )}

          <p style={{
            marginTop: "30px",
            textAlign: "center",
            fontSize: "14px",
            color: theme.textSecondary
          }}>
            Don't have an account?{" "}
            <a href="/signin" style={{ color: theme.primary, textDecoration: "none", fontWeight: "600" }}>
              Sign up
            </a>
          </p>

          <div style={{
            marginTop: "40px",
            padding: "16px",
            backgroundColor: theme.surfaceHover,
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted }}>
              Demo: <strong style={{ color: theme.textSecondary }}>0000</strong> / <strong style={{ color: theme.textSecondary }}>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
