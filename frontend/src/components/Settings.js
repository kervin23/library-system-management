import { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Settings() {
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(profileForm)
      });

      const data = await response.json();

      if (response.ok) {
        // Update local storage
        const updatedUser = { ...user, ...profileForm };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage("Profile updated successfully!");
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

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
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ marginTop: 0, marginBottom: "10px" }}>Settings</h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "25px" }}>
        Manage your account settings and preferences
      </p>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "30px",
        borderBottom: "2px solid #f0f0f0"
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: "12px 24px",
            backgroundColor: "transparent",
            color: activeTab === 'profile' ? "#667eea" : "#666",
            border: "none",
            borderBottom: `3px solid ${activeTab === 'profile' ? '#667eea' : 'transparent'}`,
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            marginBottom: "-2px"
          }}
        >
          👤 Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: "12px 24px",
            backgroundColor: "transparent",
            color: activeTab === 'security' ? "#667eea" : "#666",
            border: "none",
            borderBottom: `3px solid ${activeTab === 'security' ? '#667eea' : 'transparent'}`,
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            marginBottom: "-2px"
          }}
        >
          🔒 Security
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            padding: "12px 24px",
            backgroundColor: "transparent",
            color: activeTab === 'preferences' ? "#667eea" : "#666",
            border: "none",
            borderBottom: `3px solid ${activeTab === 'preferences' ? '#667eea' : 'transparent'}`,
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            marginBottom: "-2px"
          }}
        >
          ⚙️ Preferences
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          <h3 style={{ marginBottom: "20px" }}>Update Profile Information</h3>
          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Student Number
              </label>
              <input
                type="text"
                value={profileForm.studentNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setProfileForm({ ...profileForm, studentNumber: value });
                }}
                required
                maxLength="10"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
              <small style={{ color: "#666", fontSize: "12px" }}>
                Only numbers are allowed
              </small>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                backgroundColor: loading ? "#ccc" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px"
              }}
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div>
          <h3 style={{ marginBottom: "20px" }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                placeholder="Enter your current password"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                placeholder="Enter new password (min 6 characters)"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                placeholder="Confirm your new password"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{
              padding: "15px",
              backgroundColor: "#fff3e0",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#e65100"
            }}>
              <strong>⚠️ Security Tips:</strong>
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
                backgroundColor: loading ? "#ccc" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px"
              }}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div>
          <h3 style={{ marginBottom: "20px" }}>Account Preferences</h3>
          
          <div style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            marginBottom: "15px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <div>
                <strong style={{ fontSize: "15px" }}>Email Notifications</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                  Receive email alerts for overdue books and reservations
                </p>
              </div>
              <input type="checkbox" defaultChecked style={{ width: "20px", height: "20px" }} />
            </div>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            marginBottom: "15px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <div>
                <strong style={{ fontSize: "15px" }}>Due Date Reminders</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                  Get reminded 1 day before book due dates
                </p>
              </div>
              <input type="checkbox" defaultChecked style={{ width: "20px", height: "20px" }} />
            </div>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <div>
                <strong style={{ fontSize: "15px" }}>Show QR Code on Dashboard</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                  Display QR code directly on your dashboard
                </p>
              </div>
              <input type="checkbox" style={{ width: "20px", height: "20px" }} />
            </div>
          </div>

          <button
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              backgroundColor: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "15px"
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
          backgroundColor: message.includes("success") ? "#d4edda" : "#f8d7da",
          color: message.includes("success") ? "#155724" : "#721c24",
          border: `1px solid ${message.includes("success") ? "#c3e6cb" : "#f5c6cb"}`,
          fontSize: "14px",
          textAlign: "center"
        }}>
          {message}
        </div>
      )}
    </div>
  );
}