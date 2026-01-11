import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Signin() {
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState(1); // 1: Email, 2: Verify Code, 3: Complete Registration
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const navigate = useNavigate();

  // Email domain validation
  const ALLOWED_EMAIL_DOMAIN = "@cvsu.edu.ph";

  const validateEmail = (email) => {
    return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
  };

  // Step 1: Send verification code
  const sendVerificationCode = async (e) => {
    e.preventDefault();

    const emailToSend = form.email.trim().toLowerCase();

    if (!validateEmail(emailToSend)) {
      setMessage(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
      return;
    }

    // Store the normalized email back to form
    setForm({ ...form, email: emailToSend });

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/send-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Verification code sent!");
        setStep(2);
      } else {
        setMessage(data.error || "Failed to send verification code");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the code
  const verifyCode = async (e) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setMessage("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setMessage("");

    const emailToVerify = form.email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_URL}/users/verify-email-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify, code: verificationCode.trim() })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setEmailVerified(true);
        setMessage("Email verified! Complete your registration.");
        setStep(3);
      } else {
        setMessage(data.error || "Invalid verification code");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete registration
  const registerBtn = async (e) => {
    e.preventDefault();

    if (!emailVerified) {
      setMessage("Please verify your email first");
      return;
    }

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

    const emailToRegister = form.email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: emailToRegister,
          studentNumber: form.studentNumber.trim(),
          password: form.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Registration successful! Redirecting...");
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.error || "Registration failed");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const resendCode = async () => {
    setLoading(true);
    setMessage("");

    const emailToResend = form.email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_URL}/users/send-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend })
      });

      const data = await response.json();
      setMessage(data.message || "New code sent!");
    } catch (err) {
      setMessage("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    border: `2px solid ${theme.border}`,
    borderRadius: "10px",
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
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : `0 4px 15px ${theme.primary}30`,
    transition: "all 0.2s ease"
  });

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
            marginBottom: "25px",
            fontSize: "15px"
          }}>
            {step === 1 && "Step 1: Verify your CvSU email"}
            {step === 2 && "Step 2: Enter verification code"}
            {step === 3 && "Step 3: Complete your registration"}
          </p>

          {/* Progress Steps */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "30px",
            position: "relative"
          }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                width: "40px",
                height: "40px",
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
              left: "20px",
              right: "20px",
              height: "3px",
              backgroundColor: theme.surfaceHover,
              zIndex: 0,
              borderRadius: "2px"
            }}>
              <div style={{
                height: "100%",
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                borderRadius: "2px",
                width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
                transition: "width 0.3s ease"
              }}></div>
            </div>
          </div>

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={sendVerificationCode}>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>
                  CvSU Email Address
                </label>
                <input
                  type="email"
                  placeholder="youremail@cvsu.edu.ph"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={{
                    ...inputStyle,
                    borderColor: form.email && !validateEmail(form.email) ? theme.error : inputStyle.borderColor
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.primary}
                  onBlur={(e) => {
                    if (form.email && !validateEmail(form.email)) {
                      e.target.style.borderColor = theme.error;
                    } else {
                      e.target.style.borderColor = theme.border;
                    }
                  }}
                />
                {form.email && !validateEmail(form.email) && (
                  <p style={{ color: theme.error, fontSize: "12px", marginTop: "6px", marginBottom: 0 }}>
                    Must use @cvsu.edu.ph email
                  </p>
                )}
              </div>

              <div style={{
                padding: "15px",
                backgroundColor: isDark ? `${theme.info}15` : "#e3f2fd",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "13px",
                color: theme.info,
                border: `1px solid ${theme.info}30`
              }}>
                <strong>Note:</strong> A verification code will be sent to your email to confirm it's yours.
              </div>

              <button
                type="submit"
                disabled={loading || !validateEmail(form.email)}
                style={buttonStyle(loading || !validateEmail(form.email))}
              >
                {loading ? "Sending Code..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {step === 2 && (
            <form onSubmit={verifyCode}>
              <div style={{
                padding: "15px",
                backgroundColor: isDark ? `${theme.success}15` : "#e8f5e9",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "14px",
                border: `1px solid ${theme.success}30`
              }}>
                <strong style={{ color: theme.success }}>Code sent to:</strong>{" "}
                <span style={{ color: theme.text }}>{form.email}</span>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Enter 6-Digit Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
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
                disabled={loading || verificationCode.length !== 6}
                style={buttonStyle(loading || verificationCode.length !== 6)}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={resendCode}
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "transparent",
                  color: theme.primary,
                  border: `2px solid ${theme.primary}`,
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                Resend Code
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setVerificationCode(""); setMessage(""); }}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  backgroundColor: "transparent",
                  color: theme.textSecondary,
                  border: "none",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Change Email
              </button>
            </form>
          )}

          {/* Step 3: Complete Registration */}
          {step === 3 && (
            <form onSubmit={registerBtn}>
              <div style={{
                padding: "12px 15px",
                backgroundColor: isDark ? `${theme.success}15` : "#e8f5e9",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: `1px solid ${theme.success}30`
              }}>
                <span style={{ fontSize: "18px" }}>✓</span>
                <span style={{ color: theme.success }}>
                  <strong>{form.email}</strong> verified
                </span>
              </div>

              <div style={{ marginBottom: "18px" }}>
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

              <div style={{ marginBottom: "18px" }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
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
                    style={{
                      ...inputStyle,
                      borderColor: form.confirmPassword && form.password !== form.confirmPassword
                        ? theme.error
                        : inputStyle.borderColor
                    }}
                    onFocus={(e) => e.target.style.borderColor = theme.primary}
                    onBlur={(e) => e.target.style.borderColor = theme.border}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={buttonStyle(loading)}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          {message && (
            <div style={{
              marginTop: "20px",
              padding: "12px 16px",
              borderRadius: "10px",
              backgroundColor: message.includes("successful") || message.includes("verified") || message.includes("sent")
                ? (isDark ? `${theme.success}15` : "#e8f5e9")
                : (isDark ? `${theme.error}15` : "#ffebee"),
              color: message.includes("successful") || message.includes("verified") || message.includes("sent")
                ? theme.success
                : theme.error,
              fontSize: "14px",
              textAlign: "center",
              border: `1px solid ${message.includes("successful") || message.includes("verified") || message.includes("sent") ? theme.success : theme.error}30`
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
