import { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function RequestApprovalScanner({ onApproved, onClose }) {
  const { theme, isDark } = useTheme();
  const [manualInput, setManualInput] = useState("");
  const [scanMode, setScanMode] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  const startScanner = () => {
    setScanMode(true);

    setTimeout(() => {
      if (scannerRef.current && !html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "request-qr-reader",
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: "environment",
              focusMode: "continuous"
            },
            rememberLastUsedCamera: true
          },
          false
        );

        html5QrcodeScannerRef.current.render(
          (decodedText) => {
            handleScanResult(decodedText);
            stopScanner();
          },
          (error) => {
            console.warn("QR scan error:", error);
          }
        );
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
      html5QrcodeScannerRef.current = null;
    }
    setScanMode(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
      }
    };
  }, []);

  const handleScanResult = (scannedData) => {
    // Parse QR data: STUDENT:1:20240001
    const parts = scannedData.split(':');
    if (parts[0] === 'STUDENT' && parts[2]) {
      searchPendingRequests(parts[2]);
    } else {
      // Try using the whole scanned data as student number
      searchPendingRequests(scannedData);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setResult({ success: false, message: "Please enter a student number" });
      return;
    }
    searchPendingRequests(manualInput.trim());
  };

  const searchPendingRequests = async (studentNumber) => {
    setSearchLoading(true);
    setResult(null);
    setPendingRequests([]);
    setSelectedRequest(null);

    try {
      // Fetch all pending requests
      const response = await fetch(`${API_URL}/requests/pending`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const allRequests = await response.json();
        // Filter for this student
        const studentRequests = allRequests.filter(
          req => req.studentNumber === studentNumber
        );

        if (studentRequests.length > 0) {
          setPendingRequests(studentRequests);
          setManualInput(studentNumber);
        } else {
          setResult({
            success: false,
            message: `No pending requests found for student ${studentNumber}`
          });
        }
      } else {
        setResult({
          success: false,
          message: "Failed to fetch pending requests"
        });
      }
    } catch (err) {
      console.error("Error searching requests:", err);
      setResult({
        success: false,
        message: "Network error. Please try again."
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const approveRequest = async (request) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/requests/approve/${request.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          verifiedStudentNumber: request.studentNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Request approved successfully!",
          request: request
        });

        // Remove approved request from list
        setPendingRequests(prev => prev.filter(r => r.id !== request.id));

        // Notify parent component
        if (onApproved) {
          onApproved(request);
        }
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to approve request"
        });
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setResult({
        success: false,
        message: "Network error. Please try again."
      });
    } finally {
      setLoading(false);
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

  const getRequestLabel = (type) => {
    switch (type) {
      case 'borrow_book': return 'Borrow Book';
      case 'return_book': return 'Return Book';
      case 'reserve_pc': return 'Reserve PC';
      default: return type;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: "16px",
        padding: "24px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{ margin: 0, color: theme.text, fontSize: "20px" }}>
            🔍 Approve Request
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: theme.textMuted
            }}
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <p style={{
          color: theme.textSecondary,
          fontSize: "14px",
          marginBottom: "20px"
        }}>
          Scan student's QR code or enter student number to find their pending requests.
        </p>

        {/* Scan Button */}
        <button
          onClick={scanMode ? stopScanner : startScanner}
          disabled={loading || searchLoading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: scanMode ? theme.error : theme.primary,
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          📷 {scanMode ? "Stop Scanning" : "Scan QR Code"}
        </button>

        {/* Camera View */}
        {scanMode && (
          <div style={{
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#000",
            borderRadius: "12px"
          }}>
            <div
              id="request-qr-reader"
              ref={scannerRef}
              style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
            ></div>
          </div>
        )}

        {/* Manual Input */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px"
        }}>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Enter student number"
            disabled={loading || searchLoading}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: `2px solid ${theme.border}`,
              borderRadius: "10px",
              fontSize: "15px",
              backgroundColor: theme.surface,
              color: theme.text
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading && !searchLoading) {
                handleManualSubmit();
              }
            }}
          />
          <button
            onClick={handleManualSubmit}
            disabled={loading || searchLoading || !manualInput}
            style={{
              padding: "12px 20px",
              backgroundColor: loading || searchLoading || !manualInput
                ? theme.textMuted
                : theme.primary,
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            {searchLoading ? "..." : "Search"}
          </button>
        </div>

        {/* Pending Requests List */}
        {pendingRequests.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{
              color: theme.text,
              fontSize: "16px",
              marginBottom: "12px"
            }}>
              Pending Requests ({pendingRequests.length})
            </h3>

            {pendingRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  padding: "16px",
                  backgroundColor: isDark ? theme.surfaceHover : "#f8f9fa",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  border: `2px solid ${selectedRequest?.id === request.id ? theme.primary : 'transparent'}`
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "28px" }}>
                    {getRequestIcon(request.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: "600",
                      color: theme.text,
                      marginBottom: "4px"
                    }}>
                      {getRequestLabel(request.type)}
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: theme.textSecondary,
                      marginBottom: "4px"
                    }}>
                      {request.bookTitle || `PC-${request.pcNumber}`}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: theme.textMuted
                    }}>
                      {request.studentName} • {formatTime(request.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => approveRequest(request)}
                    disabled={loading}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: theme.success,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "14px"
                    }}
                  >
                    {loading ? "..." : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div style={{
            padding: "16px",
            backgroundColor: result.success
              ? (isDark ? "#1b4332" : "#d4edda")
              : (isDark ? "#4a1c1c" : "#f8d7da"),
            border: `2px solid ${result.success ? theme.success : theme.error}`,
            borderRadius: "12px",
            marginBottom: "16px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{ fontSize: "24px" }}>
                {result.success ? "✓" : "✗"}
              </span>
              <div>
                <div style={{
                  fontWeight: "600",
                  color: result.success ? theme.success : theme.error
                }}>
                  {result.success ? "Success!" : "Error"}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: theme.text
                }}>
                  {result.message}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "transparent",
            color: theme.textSecondary,
            border: `2px solid ${theme.border}`,
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px"
          }}
        >
          Close
        </button>
      </div>

      <style>{`
        #request-qr-reader video {
          border-radius: 8px;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}
