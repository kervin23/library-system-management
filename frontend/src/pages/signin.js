import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;


export default function Signin() {
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
        role: "user" // Always register as student
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.error) {
          setMessage("Register failed: " + data.error);
        } else {
          setMessage("Registration successful! Redirecting to login...");
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      })
      .catch(err => {
        setLoading(false);
        console.error("Error registering:", err);
        setMessage("Register failed: server error");
      });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "Arial, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "10px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        width: "100%",
        maxWidth: "450px"
      }}>
        <h1 style={{ 
          textAlign: "center", 
          color: "#333",
          marginBottom: "10px",
          fontSize: "28px"
        }}>
          Create Account
        </h1>
        <p style={{ 
          textAlign: "center", 
          color: "#666",
          marginBottom: "30px",
          fontSize: "14px"
        }}>
          Sign up as a student
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
              Full Name
            </label>
            <input 
              type="text"
              placeholder="Enter your full name" 
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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

          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              color: "#333",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Email
            </label>
            <input 
              type="email"
              placeholder="Enter your email" 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              placeholder="Enter your student number (numbers only)" 
              value={form.studentNumber}
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, studentNumber: value });
              }}
              required
              maxLength="10"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Only numbers are allowed
            </small>
          </div>

          <div style={{ marginBottom: "20px" }}>
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
              placeholder="Create a password (min 6 characters)" 
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

          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              color: "#333",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Confirm Password
            </label>
            <input 
              type="password"
              placeholder="Confirm your password" 
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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

          <button 
            onClick={registerBtn}
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
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "10px"
            }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
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
          Already have an account?{" "}
          <a 
            href="/login"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}