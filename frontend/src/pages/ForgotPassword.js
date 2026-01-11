import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function ForgotPassword() {
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
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

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/send-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber, email })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
      } else {
        setMessage(data.error || "Failed to send reset code");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber, code: resetCode })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(4);
      } else {
        setMessage(data.error || "Invalid code");
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
        body: JSON.stringify({ studentNumber, code: resetCode, newPassword })
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

  const handleResendCode = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/send-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber, email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("New code sent! Check backend console.");
      } else {
        setMessage(data.error || "Failed to resend code");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    border: `2px solid ${theme.border}`,
    borderRadius: "12px",
    fontSize: "15px",
    boxSizing: "border-box",
    backgroundColor: theme.surface,
    color: theme.text,
    transition: "all 0.2s ease",
    outline: "none"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "10px",
    color: theme.text,
    fontSize: "14px",
    fontWeight: "600"
  };

  const buttonStyle = (disabled) => ({
    width: "100%",
    padding: "14px",
    background: disabled
      ? theme.textMuted
      : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : `0 8px 20px ${theme.primary}40`,
    transition: "all 0.3s ease"
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: isDark
        ? `linear-gradient(135deg, ${theme.background} 0%, #2d2d2d 50%, ${theme.background} 100%)`
        : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 50%, ${theme.primary} 100%)`,
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative circles */}
      <div style={{
        position: "absolute",
        top: "-100px",
        right: "-100px",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: isDark ? `${theme.primary}15` : "rgba(255, 255, 255, 0.15)",
        pointerEvents: "none"
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "-150px",
        left: "-150px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: isDark ? `${theme.primary}08` : "rgba(255, 255, 255, 0.1)",
        pointerEvents: "none"
      }}></div>

      <div style={{
        backgroundColor: theme.surface,
        padding: "40px 45px",
        borderRadius: "20px",
        boxShadow: isDark
          ? "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)"
          : "0 25px 50px rgba(0, 0, 0, 0.15)",
        width: "100%",
        maxWidth: "480px",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo/Icon */}
        <div style={{
          width: "70px",
          height: "70px",
          margin: "0 auto 25px",
          borderRadius: "18px",
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 10px 30px ${theme.primary}40`
        }}>
          <span style={{ fontSize: "32px" }}>🔐</span>
        </div>

        <h1 style={{
          textAlign: "center",
          color: theme.text,
          marginBottom: "8px",
          fontSize: "28px",
          fontWeight: "700"
        }}>
          Reset Password
        </h1>
        <p style={{
          textAlign: "center",
          color: theme.textSecondary,
          marginBottom: "30px",
          fontSize: "15px"
        }}>
          {step === 1 && "Enter your student number to begin"}
          {step === 2 && "Verify your email address"}
          {step === 3 && "Enter the code sent to your email"}
          {step === 4 && "Create a new password"}
        </p>

        {/* Progress indicator */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
          position: "relative"
        }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: step >= s
                ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`
                : theme.surfaceHover,
              color: step >= s ? "white" : theme.textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "14px",
              zIndex: 1,
              boxShadow: step >= s ? `0 4px 12px ${theme.primary}40` : "none",
              transition: "all 0.3s ease"
            }}>
              {s}
            </div>
          ))}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "18px",
            right: "18px",
            height: "3px",
            backgroundColor: theme.surfaceHover,
            zIndex: 0,
            borderRadius: "2px"
          }}>
            <div style={{
              height: "100%",
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
              borderRadius: "2px",
              width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%",
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {/* Step 1: Enter Student Number */}
        {step === 1 && (
          <form onSubmit={handleCheckStudent}>
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Student Number</label>
              <input
                type="text"
                placeholder="Enter your student number"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value.replace(/[^0-9]/g, ''))}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2: Enter Email */}
        {step === 2 && (
          <form onSubmit={handleSendCode}>
            <div style={{
              marginBottom: "22px",
              padding: "15px",
              backgroundColor: isDark ? `${theme.primary}15` : "#e8f5e8",
              borderRadius: "12px",
              fontSize: "14px",
              border: `1px solid ${theme.primary}30`
            }}>
              <strong style={{ color: theme.primary }}>Email found:</strong>{" "}
              <span style={{ color: theme.text }}>{userEmail}</span>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Enter Your Full Email</label>
              <input
                type="email"
                placeholder="Enter your complete email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? "Sending Code..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* Step 3: Enter Reset Code */}
        {step === 3 && (
          <form onSubmit={handleVerifyCode}>
            <div style={{
              marginBottom: "22px",
              padding: "15px",
              backgroundColor: isDark ? `${theme.success}15` : "#e8f5e8",
              borderRadius: "12px",
              fontSize: "14px",
              border: `1px solid ${theme.success}30`
            }}>
              <strong style={{ color: theme.success }}>Code sent to:</strong>{" "}
              <span style={{ color: theme.text }}>{email}</span>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: theme.textMuted }}>
                Check the backend console/terminal for the reset code
              </p>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Enter 6-Digit Code</label>
              <input
                type="text"
                placeholder="000000"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                required
                maxLength="6"
                style={{
                  ...inputStyle,
                  fontSize: "24px",
                  textAlign: "center",
                  letterSpacing: "10px",
                  fontWeight: "bold"
                }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <button
              type="submit"
              disabled={loading || resetCode.length !== 6}
              style={buttonStyle(loading || resetCode.length !== 6)}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                backgroundColor: "transparent",
                color: theme.primary,
                border: `2px solid ${theme.primary}`,
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Resend Code
            </button>
          </form>
        )}

        {/* Step 4: Reset Password */}
        {step === 4 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {message && (
          <div style={{
            marginTop: "20px",
            padding: "14px",
            borderRadius: "12px",
            backgroundColor: message.includes("successful") || message.includes("sent")
              ? (isDark ? `${theme.success}15` : "#d4edda")
              : (isDark ? `${theme.error}15` : "#f8d7da"),
            color: message.includes("successful") || message.includes("sent") ? theme.success : theme.error,
            border: `1px solid ${message.includes("successful") || message.includes("sent") ? theme.success : theme.error}30`,
            fontSize: "14px",
            textAlign: "center",
            fontWeight: "500"
          }}>
            {message}
          </div>
        )}

        <div style={{
          marginTop: "25px",
          textAlign: "center",
          fontSize: "15px",
          color: theme.textSecondary
        }}>
          Remember your password?{" "}
          <a
            href="/login"
            style={{
              color: theme.primary,
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
