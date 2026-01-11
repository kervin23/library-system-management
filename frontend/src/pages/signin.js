import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Signin() {
  const { theme, isDark } = useTheme();
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const registerBtn = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    setMessage("");

    fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        studentNumber: form.studentNumber,
        password: form.password,
        role: "user"
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.error) {
          setMessage("Registration failed: " + data.error);
        } else {
          setMessage("Registration successful! Redirecting...");
          setTimeout(() => navigate('/login'), 1500);
        }
      })
      .catch(err => {
        setLoading(false);
        setMessage("Registration failed: server error");
      });
  };

  const inputStyle = {
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
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: theme.text,
    fontSize: "14px",
    fontWeight: "500"
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
          <div style={{ fontSize: "80px", marginBottom: "30px" }}>📝</div>
          <h1 style={{ fontSize: "36px", marginBottom: "20px", fontWeight: "700" }}>
            Join Our Library
          </h1>
          <p style={{ fontSize: "18px", opacity: 0.9, lineHeight: 1.6 }}>
            Create an account to access library resources, borrow books, and reserve PCs.
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        overflowY: "auto"
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Mobile Logo */}
          <div style={{
            display: window.innerWidth <= 900 ? "block" : "none",
            textAlign: "center",
            marginBottom: "30px"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📚</div>
            <h1 style={{ color: theme.primary, fontSize: "22px", margin: 0 }}>Library System</h1>
          </div>

          <h2 style={{
            color: theme.text,
            marginBottom: "10px",
            fontSize: "28px",
            fontWeight: "600"
          }}>
            Create account
          </h2>
          <p style={{
            color: theme.textSecondary,
            marginBottom: "30px",
            fontSize: "15px"
          }}>
            Register as a new student
          </p>

          <form onSubmit={registerBtn}>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Student Number</label>
              <input
                type="text"
                placeholder="Numbers only"
                value={form.studentNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setForm({ ...form, studentNumber: value });
                }}
                required
                maxLength="10"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Min 6 chars"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = theme.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm</label>
                <input
                  type="password"
                  placeholder="Repeat"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = theme.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              </div>
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
              {loading ? "Creating account..." : "Create Account"}
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
            Already have an account?{" "}
            <a href="/login" style={{ color: theme.primary, textDecoration: "none", fontWeight: "600" }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
