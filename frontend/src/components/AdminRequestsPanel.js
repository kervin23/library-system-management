import { useEffect, useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function AdminRequestsPanel() {
  const { theme, isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [verificationStudentNumber, setVerificationStudentNumber] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    loadRequests();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/requests/pending`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setRequests(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading requests:", err);
      setLoading(false);
    }
  };

  // QR Scanner functions
  const startScanner = () => {
    setShowQRScanner(true);
    setScannerReady(false);

    setTimeout(async () => {
      if (scannerRef.current && !html5QrcodeScannerRef.current) {
        try {
          const { Html5QrcodeScanner } = await import("html5-qrcode");
          html5QrcodeScannerRef.current = new Html5QrcodeScanner(
            "verification-qr-reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              videoConstraints: {
                facingMode: "environment"
              }
            },
            false
          );

          html5QrcodeScannerRef.current.render(
            (decodedText) => {
              handleQRScanResult(decodedText);
            },
            (error) => {
              console.warn("QR scan error:", error);
            }
          );
          setScannerReady(true);
        } catch (err) {
          console.error("Failed to load QR scanner:", err);
          setErrorMessage("Failed to load QR scanner. Please enter manually.");
          setShowQRScanner(false);
        }
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
      html5QrcodeScannerRef.current = null;
    }
    setShowQRScanner(false);
    setScannerReady(false);
  };

  const handleQRScanResult = (scannedData) => {
    // Parse QR data: STUDENT:1:20240001
    const parts = scannedData.split(':');
    if (parts[0] === 'STUDENT' && parts[2]) {
      setVerificationStudentNumber(parts[2]);
      stopScanner();
    } else {
      // Try using the whole scanned data as student number
      setVerificationStudentNumber(scannedData);
      stopScanner();
    }
  };

  // Cleanup scanner on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
        html5QrcodeScannerRef.current = null;
      }
    };
  }, []);

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setVerificationStudentNumber("");
    setShowVerification(true);
    setShowQRScanner(false);
  };

  const handleApprove = async () => {
    setErrorMessage("");

    if (verificationStudentNumber !== selectedRequest.studentNumber) {
      setErrorMessage("Student number does not match!");
      return;
    }

    setProcessingId(selectedRequest.id);

    try {
      const response = await fetch(`${API_URL}/requests/approve/${selectedRequest.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          verifiedStudentNumber: verificationStudentNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Request approved successfully!");
        setShowVerification(false);
        setSelectedRequest(null);
        loadRequests();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.error || "Failed to approve request");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setErrorMessage("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this request?")) {
      return;
    }

    setProcessingId(id);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/requests/reject/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Request rejected");
        loadRequests();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.error || "Failed to reject request");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      setErrorMessage("Network error");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const getRequestIcon = (type) => {
    switch (type) {
      case 'borrow_book': return '📚';
      case 'return_book': return '📖';
      case 'reserve_pc': return '💻';
      default: return '📋';
    }
  };

  const getRequestText = (request) => {
    switch (request.type) {
      case 'borrow_book':
        return `Borrow: ${request.bookTitle}`;
      case 'return_book':
        return `Return: ${request.bookTitle}`;
      case 'reserve_pc':
        return `Reserve PC-${request.pcNumber}`;
      default:
        return 'Unknown request';
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: "white",
        borderRadius: "10px",
        padding: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <h2>Loading requests...</h2>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      {/* Verification Modal */}
      {showVerification && selectedRequest && (
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
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔍</div>
            
            <h2 style={{ marginTop: 0, marginBottom: "15px" }}>Verify Student</h2>
            
            <div style={{
              padding: "20px",
              backgroundColor: "#e3f2fd",
              borderRadius: "10px",
              marginBottom: "25px",
              textAlign: "left"
            }}>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#1976d2" }}>
                <strong>Student:</strong> {selectedRequest.studentName}
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#1976d2" }}>
                <strong>Expected ID:</strong> {selectedRequest.studentNumber}
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#1976d2" }}>
                <strong>Request:</strong> {getRequestText(selectedRequest)}
              </p>
            </div>

            {/* QR Scanner Toggle */}
            <div style={{ marginBottom: "15px" }}>
              <button
                onClick={showQRScanner ? stopScanner : startScanner}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: showQRScanner ? "#f44336" : (isDark ? theme.primary : "#667eea"),
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                📷 {showQRScanner ? "Stop Scanner" : "Scan QR Code"}
              </button>
            </div>

            {/* QR Scanner View */}
            {showQRScanner && (
              <div style={{
                marginBottom: "15px",
                padding: "15px",
                backgroundColor: "#000",
                borderRadius: "10px"
              }}>
                <div
                  id="verification-qr-reader"
                  ref={scannerRef}
                  style={{ width: "100%", maxWidth: "300px", margin: "0 auto" }}
                ></div>
                {!scannerReady && (
                  <p style={{ color: "#fff", textAlign: "center", marginTop: "10px" }}>
                    Loading camera...
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{
              display: "flex",
              alignItems: "center",
              margin: "15px 0",
              color: isDark ? theme.textMuted : "#999"
            }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? theme.border : "#ddd" }}></div>
              <span style={{ padding: "0 15px", fontSize: "12px" }}>OR ENTER MANUALLY</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? theme.border : "#ddd" }}></div>
            </div>

            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: isDark ? theme.text : "#333"
              }}>
                Student Number:
              </label>
              <input
                type="text"
                value={verificationStudentNumber}
                onChange={(e) => setVerificationStudentNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter student number"
                autoFocus={!showQRScanner}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `2px solid ${verificationStudentNumber === selectedRequest.studentNumber ? "#4caf50" : (isDark ? theme.border : "#ddd")}`,
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  textAlign: "center",
                  fontWeight: "600",
                  backgroundColor: isDark ? theme.surface : "#fff",
                  color: isDark ? theme.text : "#333"
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && verificationStudentNumber) {
                    handleApprove();
                  }
                }}
              />
              {verificationStudentNumber && verificationStudentNumber === selectedRequest.studentNumber && (
                <p style={{ color: "#4caf50", fontSize: "12px", marginTop: "5px", textAlign: "center" }}>
                  ✓ Student number matches!
                </p>
              )}
            </div>

            {errorMessage && (
              <div style={{
                padding: "12px",
                backgroundColor: "#ffebee",
                color: "#c62828",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "14px"
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  stopScanner();
                  setShowVerification(false);
                  setSelectedRequest(null);
                  setErrorMessage("");
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "15px"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={!verificationStudentNumber || processingId === selectedRequest.id}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: !verificationStudentNumber || processingId === selectedRequest.id ? "#ccc" : "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: !verificationStudentNumber || processingId === selectedRequest.id ? "not-allowed" : "pointer",
                  fontSize: "15px"
                }}
              >
                {processingId === selectedRequest.id ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          padding: "15px",
          backgroundColor: "#e8f5e9",
          color: "#2e7d32",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span>✓</span> {successMessage}
        </div>
      )}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px"
      }}>
        <div>
          <h2 style={{ margin: "0 0 5px 0" }}>Pending Requests</h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>
        <button
          onClick={loadRequests}
          style={{
            padding: "10px 20px",
            backgroundColor: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div style={{
          padding: "60px 20px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>✅</div>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>No Pending Requests</h3>
          <p style={{ margin: 0, color: "#999", fontSize: "14px" }}>
            All requests have been processed!
          </p>
        </div>
      ) : (
        <div>
          {requests.map(request => {
            const isProcessing = processingId === request.id;
            const requestAge = Math.floor((new Date() - new Date(request.createdAt)) / 60000);
            
            return (
              <div
                key={request.id}
                style={{
                  marginBottom: "15px",
                  padding: "20px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  border: "2px solid #667eea",
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "15px"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px"
                    }}>
                      <span style={{ fontSize: "28px" }}>{getRequestIcon(request.type)}</span>
                      <h3 style={{ margin: 0, fontSize: "18px" }}>
                        {getRequestText(request)}
                      </h3>
                    </div>
                    
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Student:</strong> {request.studentName}
                    </p>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Student ID:</strong> {request.studentNumber}
                    </p>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Requested:</strong> {new Date(request.createdAt).toLocaleString()}
                      <span style={{
                        marginLeft: "10px",
                        padding: "2px 8px",
                        backgroundColor: requestAge > 10 ? "#ffebee" : "#e8f5e9",
                        color: requestAge > 10 ? "#c62828" : "#2e7d32",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {requestAge < 1 ? "Just now" : `${requestAge} min ago`}
                      </span>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleApproveClick(request)}
                      disabled={isProcessing}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: isProcessing ? "#ccc" : "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "14px"
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={isProcessing}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: isProcessing ? "#ccc" : "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "14px"
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: "25px",
        padding: "15px",
        backgroundColor: "#e3f2fd",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#1976d2"
      }}>
        <strong>💡 How it works:</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>Students request actions (borrow, return, reserve PC)</li>
          <li>Requests appear here in real-time</li>
          <li>Verify student identity by scanning QR or entering student number</li>
          <li>Approve to complete the action or reject to cancel</li>
        </ul>
      </div>
    </div>
  );
}