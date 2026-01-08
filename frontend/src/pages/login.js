import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Login() {
  const [form, setForm] = useState({ studentNumber: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token is still valid
      fetch(`${API_URL}/users/verify`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          // Token is valid, redirect based on role
          if (data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/student');
          }
        }
      })
      .catch(() => {
        // Token is invalid, remove it
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
          setMessage("Login successful! Redirecting...");
          
          // Store token and user info
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // Redirect based on role
          setTimeout(() => {
            if (data.user.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/student');
            }
          }, 500);
        }
      })
      .catch(err => {
        setLoading(false);
        console.error("Error logging in:", err);
        setMessage("Login failed: server error");
      });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "10px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h1 style={{ 
          textAlign: "center", 
          color: "#333",
          marginBottom: "10px",
          fontSize: "28px"
        }}>
          Welcome Back
        </h1>
        <p style={{ 
          textAlign: "center", 
          color: "#666",
          marginBottom: "30px",
          fontSize: "14px"
        }}>
          Login to your account
        </p>

        <div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              color: "#333",
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
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              color: "#333",
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
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{
            textAlign: "right",
            marginBottom: "20px"
          }}>
            <a 
              href="/forgot-password"
              style={{
                color: "#667eea",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Forgot Password?
            </a>
          </div>

          <button 
            onClick={loginBtn}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#ccc" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        {message && (
          <div style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "5px",
            backgroundColor: message.includes("successful") ? "#d4edda" : "#f8d7da",
            color: message.includes("successful") ? "#155724" : "#721c24",
            border: `1px solid ${message.includes("successful") ? "#c3e6cb" : "#f5c6cb"}`,
            fontSize: "14px",
            textAlign: "center"
          }}>
            {message}
          </div>
        )}

        <div style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "14px",
          color: "#666"
        }}>
          Don't have an account?{" "}
          <a 
            href="/signin"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Sign up
          </a>
        </div>

        <div style={{
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: "1px solid #eee",
          textAlign: "center",
          fontSize: "12px",
          color: "#999"
        }}>
          <strong>Default Admin:</strong><br />
          Student Number: 0000 | Password: admin123
        </div>
      </div>
    </div>
  );
}