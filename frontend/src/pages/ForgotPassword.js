import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: enter student number, 2: verify email, 3: reset password
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // Masked email from server
  const navigate = useNavigate();

  const handleCheckStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/check-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber })
      });

      const data = await response.json();

      if (response.ok) {
        setUserEmail(data.maskedEmail);
        setStep(2);
      } else {
        setMessage(data.error || "Student not found");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber, email })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
      } else {
        setMessage(data.error || "Email verification failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber, email, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.error || "Password reset failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
          Reset Password
        </h1>
        <p style={{ 
          textAlign: "center", 
          color: "#666",
          marginBottom: "30px",
          fontSize: "14px"
        }}>
          {step === 1 && "Enter your student number to begin"}
          {step === 2 && "Verify your email address"}
          {step === 3 && "Create a new password"}
        </p>

        {/* Progress indicator */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
          position: "relative"
        }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: step >= s ? "#667eea" : "#ddd",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "600",
              fontSize: "14px",
              zIndex: 1
            }}>
              {s}
            </div>
          ))}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "15px",
            right: "15px",
            height: "2px",
            backgroundColor: "#ddd",
            zIndex: 0
          }}>
            <div style={{
              height: "100%",
              backgroundColor: "#667eea",
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {/* Step 1: Enter Student Number */}
        {step === 1 && (
          <form onSubmit={handleCheckStudent}>
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
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value.replace(/[^0-9]/g, ''))}
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
              type="submit"
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
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2: Verify Email */}
        {step === 2 && (
          <form onSubmit={handleVerifyEmail}>
            <div style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#e3f2fd",
              borderRadius: "8px",
              fontSize: "14px"
            }}>
              <strong>📧 Email found:</strong> {userEmail}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px",
                color: "#333",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Enter Your Full Email
              </label>
              <input 
                type="email"
                placeholder="Enter your complete email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              type="submit"
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
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px",
                color: "#333",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                New Password
              </label>
              <input 
                type="password"
                placeholder="Enter new password (min 6 characters)" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                Confirm New Password
              </label>
              <input 
                type="password"
                placeholder="Confirm your new password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              type="submit"
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
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

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
          Remember your password?{" "}
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