import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Settings() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    studentNumber: ""
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfileForm({
        name: parsedUser.name,
        email: parsedUser.email,
        studentNumber: parsedUser.studentNumber
      });
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("New passwords do not match!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setMessage(data.error || "Failed to change password");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (!user) {
    return <div style={{ padding: "20px", textAlign: "center", color: theme.text }}>Loading...</div>;
  }

  const tabStyle = (isActive) => ({
    padding: "12px 24px",
    backgroundColor: "transparent",
    color: isActive ? theme.primary : theme.textSecondary,
    border: "none",
    borderBottom: `3px solid ${isActive ? theme.primary : 'transparent'}`,
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    marginBottom: "-2px",
    transition: "all 0.2s ease"
  });

  const inputStyle = (disabled = false) => ({
    width: "100%",
    padding: "12px",
    border: `2px solid ${theme.border}`,
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: disabled ? theme.surfaceHover : theme.surface,
    color: disabled ? theme.textMuted : theme.text,
    cursor: disabled ? "not-allowed" : "text",
    transition: "border-color 0.2s ease"
  });

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: "12px",
      padding: "30px",
      boxShadow: `0 4px 20px ${theme.shadow}`
    }}>
      <h2 style={{ marginTop: 0, marginBottom: "10px", color: theme.text }}>Settings</h2>
      <p style={{ color: theme.textSecondary, fontSize: "14px", marginBottom: "25px" }}>
        Manage your account settings and preferences
      </p>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "30px",
        borderBottom: `2px solid ${theme.borderLight}`,
        flexWrap: "wrap"
      }}>
        <button onClick={() => setActiveTab('profile')} style={tabStyle(activeTab === 'profile')}>
          Profile
        </button>
        <button onClick={() => setActiveTab('security')} style={tabStyle(activeTab === 'security')}>
          Security
        </button>
        <button onClick={() => setActiveTab('appearance')} style={tabStyle(activeTab === 'appearance')}>
          Appearance
        </button>
        <button onClick={() => setActiveTab('preferences')} style={tabStyle(activeTab === 'preferences')}>
          Preferences
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          <h3 style={{ marginBottom: "20px", color: theme.text }}>Profile Information</h3>

          <div style={{
            padding: "15px",
            backgroundColor: isDark ? 'rgba(2, 228, 155, 0.1)' : '#e8f8f2',
            borderRadius: "8px",
            marginBottom: "25px",
            fontSize: "13px",
            color: theme.primary,
            border: `1px solid ${theme.primary}30`
          }}>
            <strong>Note:</strong> Name and email cannot be changed. Please contact an administrator if you need to update these details.
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: theme.text
            }}>
              Full Name
            </label>
            <input type="text" value={profileForm.name} disabled style={inputStyle(true)} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: theme.text
            }}>
              Email Address
            </label>
            <input type="email" value={profileForm.email} disabled style={inputStyle(true)} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: theme.text
            }}>
              Student Number
            </label>
            <input type="text" value={profileForm.studentNumber} disabled style={inputStyle(true)} />
          </div>

          <div style={{
            padding: "15px",
            backgroundColor: theme.surfaceHover,
            borderRadius: "8px",
            fontSize: "14px",
            color: theme.text
          }}>
            <strong>Role:</strong> {user?.role === 'headadmin' ? 'Head Administrator' : user?.role === 'admin' ? 'Administrator' : 'Student'}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div>
          <h3 style={{ marginBottom: "20px", color: theme.text }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: theme.text
              }}>
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                placeholder="Enter your current password"
                style={inputStyle()}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: theme.text
              }}>
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                placeholder="Enter new password (min 6 characters)"
                style={inputStyle()}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: theme.text
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                placeholder="Confirm your new password"
                style={inputStyle()}
              />
            </div>

            <div style={{
              padding: "15px",
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fff3e0',
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              color: theme.warning,
              border: `1px solid ${theme.warning}30`
            }}>
              <strong>Security Tips:</strong>
              <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                <li>Use at least 6 characters</li>
                <li>Mix letters, numbers, and symbols</li>
                <li>Don't reuse passwords from other sites</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                backgroundColor: loading ? theme.textMuted : theme.primary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div>
          <h3 style={{ marginBottom: "20px", color: theme.text }}>Appearance</h3>

          <div style={{
            padding: "25px",
            backgroundColor: theme.surfaceHover,
            borderRadius: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px"
            }}>
              <div>
                <strong style={{ fontSize: "16px", color: theme.text }}>Theme Mode</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: theme.textSecondary }}>
                  Choose between light and dark appearance
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => isDark && toggleTheme()}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: !isDark ? theme.primary : theme.surface,
                    color: !isDark ? "white" : theme.text,
                    border: `2px solid ${!isDark ? theme.primary : theme.border}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: "18px" }}>☀️</span> Light
                </button>
                <button
                  onClick={() => !isDark && toggleTheme()}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: isDark ? theme.primary : theme.surface,
                    color: isDark ? "white" : theme.text,
                    border: `2px solid ${isDark ? theme.primary : theme.border}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: "18px" }}>🌙</span> Dark
                </button>
              </div>
            </div>
          </div>

          {/* Theme Preview */}
          <div style={{
            padding: "20px",
            backgroundColor: theme.surface,
            borderRadius: "12px",
            border: `2px solid ${theme.border}`
          }}>
            <h4 style={{ margin: "0 0 15px 0", color: theme.text }}>Preview</h4>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: "10px"
            }}>
              <div style={{
                padding: "15px",
                backgroundColor: theme.primary,
                borderRadius: "8px",
                textAlign: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "12px"
              }}>
                Primary
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: theme.success,
                borderRadius: "8px",
                textAlign: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "12px"
              }}>
                Success
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: theme.warning,
                borderRadius: "8px",
                textAlign: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "12px"
              }}>
                Warning
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: theme.error,
                borderRadius: "8px",
                textAlign: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "12px"
              }}>
                Error
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div>
          <h3 style={{ marginBottom: "20px", color: theme.text }}>Account Preferences</h3>

          {[
            {
              title: "Email Notifications",
              description: "Receive email alerts for overdue books and reservations",
              defaultChecked: true
            },
            {
              title: "Due Date Reminders",
              description: "Get reminded before book due dates",
              defaultChecked: true
            },
            {
              title: "Show QR Code on Dashboard",
              description: "Display QR code directly on your dashboard",
              defaultChecked: false
            }
          ].map((pref, index) => (
            <div key={index} style={{
              padding: "20px",
              backgroundColor: theme.surfaceHover,
              borderRadius: "8px",
              marginBottom: "15px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <strong style={{ fontSize: "15px", color: theme.text }}>{pref.title}</strong>
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: theme.textSecondary }}>
                    {pref.description}
                  </p>
                </div>
                <label style={{
                  position: "relative",
                  display: "inline-block",
                  width: "50px",
                  height: "28px"
                }}>
                  <input
                    type="checkbox"
                    defaultChecked={pref.defaultChecked}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: pref.defaultChecked ? theme.primary : theme.border,
                    borderRadius: "28px",
                    transition: "0.3s"
                  }}>
                    <span style={{
                      position: "absolute",
                      content: "",
                      height: "20px",
                      width: "20px",
                      left: pref.defaultChecked ? "26px" : "4px",
                      bottom: "4px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.3s"
                    }}></span>
                  </span>
                </label>
              </div>
            </div>
          ))}

          <button
            style={{
              marginTop: "10px",
              padding: "12px 24px",
              backgroundColor: theme.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "15px",
              transition: "all 0.2s ease"
            }}
          >
            Save Preferences
          </button>
        </div>
      )}

      {/* Success/Error Message */}
      {message && (
        <div style={{
          marginTop: "20px",
          padding: "12px",
          borderRadius: "8px",
          backgroundColor: message.includes("success")
            ? (isDark ? 'rgba(34, 197, 94, 0.1)' : '#d4edda')
            : (isDark ? 'rgba(239, 68, 68, 0.1)' : '#f8d7da'),
          color: message.includes("success") ? theme.success : theme.error,
          border: `1px solid ${message.includes("success") ? theme.success : theme.error}30`,
          fontSize: "14px",
          textAlign: "center"
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
