import { useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function StudentActionVerification({ 
  user, 
  actionType, // 'borrow', 'return', 'pc_reserve', 'pc_release'
  actionData, // bookId or pcNumber
  onSuccess,
  onCancel 
}) {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getToken = () => localStorage.getItem("token");

  const handleVerify = async () => {
    // For now, we'll use student number as verification
    // In production, admin would scan QR and approve
    if (verificationCode !== user.studentNumber) {
      setMessage("Incorrect student number!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let endpoint = "";
      let method = "POST";
      let body = {};

      switch (actionType) {
        case 'borrow':
          endpoint = `${API_URL}/books/borrow`;
          body = { bookId: actionData };
          break;
        case 'return':
          endpoint = `${API_URL}/books/return/${actionData}`;
          break;
        case 'pc_reserve':
          endpoint = `${API_URL}/pcs/reserve`;
          body = { pcNumber: actionData };
          break;
        case 'pc_release':
          endpoint = `${API_URL}/pcs/release/${actionData}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
      } else {
        setMessage(data.error || "Action failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error");
      setLoading(false);
    }
  };

  const getActionText = () => {
    switch (actionType) {
      case 'borrow': return 'Borrow Book';
      case 'return': return 'Return Book';
      case 'pc_reserve': return 'Reserve PC';
      case 'pc_release': return 'Release PC';
      default: return 'Action';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>📷</div>
        
        <h2 style={{ marginTop: 0, marginBottom: "15px" }}>Verification Required</h2>
        
        <p style={{ color: "#666", marginBottom: "25px", fontSize: "14px" }}>
          To {getActionText().toLowerCase()}, please have the admin scan your QR code or enter your student number for verification.
        </p>

        <div style={{
          padding: "20px",
          backgroundColor: "#e3f2fd",
          borderRadius: "10px",
          marginBottom: "25px"
        }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#1976d2" }}>
            <strong>Student:</strong> {user.name}
          </p>
          <p style={{ margin: "0", fontSize: "14px", color: "#1976d2" }}>
            <strong>ID:</strong> {user.studentNumber}
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "600",
            textAlign: "left"
          }}>
            Enter Student Number for Verification:
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Enter your student number"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              textAlign: "center",
              fontWeight: "600"
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleVerify();
              }
            }}
          />
        </div>

        {message && (
          <div style={{
            padding: "12px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {message}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !verificationCode}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: loading || !verificationCode ? "#ccc" : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: loading || !verificationCode ? "not-allowed" : "pointer",
              fontSize: "15px"
            }}
          >
            {loading ? "Verifying..." : "Verify & Proceed"}
          </button>
        </div>

        <div style={{
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#e65100",
          textAlign: "left"
        }}>
          <strong>💡 Note:</strong> In a real scenario, you would show your QR code to the admin who would scan it to approve this action. For testing, enter your student number.
        </div>
      </div>
    </div>
  );
}