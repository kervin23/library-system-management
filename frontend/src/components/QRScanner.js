import { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function QRScanner() {
  const [manualInput, setManualInput] = useState("");
  const [scanMode, setScanMode] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  const startScanner = () => {
    setScanMode(true);
    
    setTimeout(() => {
      if (scannerRef.current && !html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10,
            qrbox: { width: 350, height: 350 }, // BIGGER scanning box
            aspectRatio: 1.0,
            // Enhanced camera settings for better far-distance scanning
            videoConstraints: {
              facingMode: "environment", // Use back camera on mobile
              focusMode: "continuous",   // Auto-focus
              advanced: [{ zoom: 1.5 }]  // Slight zoom for better capture
            },
            // Better detection
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            },
            rememberLastUsedCamera: true
          },
          false
        );

        html5QrcodeScannerRef.current.render(
          (decodedText) => {
            // Success callback
            handleScanResult(decodedText);
            stopScanner();
          },
          (error) => {
            // Error callback - mostly camera access issues
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
      // Cleanup on unmount
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
      }
    };
  }, []);

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      alert("Please enter a student number");
      return;
    }
    processStudent(manualInput);
  };

  const handleScanResult = (scannedData) => {
    // Parse QR data: STUDENT:1:20240001
    const parts = scannedData.split(':');
    if (parts[0] === 'STUDENT' && parts[2]) {
      processStudent(parts[2]);
    } else {
      setResult({
        success: false,
        message: "Invalid QR code format"
      });
    }
  };

  const processStudent = async (studentNumber) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/attendance/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ studentNumber })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          action: data.action,
          user: data.user,
          timestamp: new Date(data.timestamp).toLocaleString(),
          studentNumber: studentNumber
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to process student"
        });
      }
    } catch (err) {
      console.error("Error processing student:", err);
      setResult({
        success: false,
        message: "Network error. Please try again."
      });
    } finally {
      setLoading(false);
      setManualInput("");
      
      // Auto-clear result after 5 seconds
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ marginTop: 0 }}>Student Check-in/out Scanner</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Smart toggle: automatically checks in or out based on current status
      </p>

      {/* Scan Mode Toggle */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px"
      }}>
        <button
          onClick={scanMode ? stopScanner : startScanner}
          disabled={loading}
          style={{
            flex: 1,
            padding: "15px",
            backgroundColor: scanMode ? "#f44336" : "#667eea",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "15px",
            transition: "background-color 0.2s"
          }}
        >
          📷 {scanMode ? "Stop Scanning" : "Start QR Scanner"}
        </button>
      </div>

      {/* Camera View - BIGGER */}
      {scanMode && (
        <div style={{
          marginBottom: "20px",
          padding: "20px",
          backgroundColor: "#000",
          borderRadius: "12px",
          minHeight: "500px" // Bigger container
        }}>
          <div 
            id="qr-reader" 
            ref={scannerRef}
            style={{
              width: "100%",
              maxWidth: "600px", // Wider scanner
              margin: "0 auto"
            }}
          ></div>
          
          <div style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "white",
            textAlign: "center",
            fontSize: "14px"
          }}>
            💡 <strong>Tips for better scanning:</strong>
            <ul style={{ 
              textAlign: "left", 
              marginTop: "10px",
              paddingLeft: "20px",
              lineHeight: "1.8"
            }}>
              <li>Hold phone steady</li>
              <li>Keep QR code within the green box</li>
              <li>Ensure good lighting</li>
              <li>QR code should be clear and not blurry</li>
              <li>Distance: 15-30cm (6-12 inches) works best</li>
            </ul>
          </div>
        </div>
      )}

      {/* Manual Input */}
      <div style={{
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        marginTop: "20px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "#333" }}>
          Manual Entry
        </h3>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
          If student can't show QR code, enter their student number manually
        </p>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setManualInput(value);
            }}
            placeholder="Enter student number"
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              border: "2px solid #ddd",
              borderRadius: "5px",
              fontSize: "15px"
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleManualSubmit();
              }
            }}
          />
          <button
            onClick={handleManualSubmit}
            disabled={loading || !manualInput}
            style={{
              padding: "12px 25px",
              backgroundColor: loading || !manualInput ? "#ccc" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: loading || !manualInput ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "15px"
            }}
          >
            {loading ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: result.success ? "#d4edda" : "#f8d7da",
          border: `2px solid ${result.success ? "#4caf50" : "#f44336"}`,
          borderRadius: "8px",
          animation: "slideIn 0.3s ease"
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "15px"
          }}>
            <span style={{ fontSize: "40px" }}>
              {result.success ? "✓" : "✗"}
            </span>
            <div style={{ flex: 1 }}>
              {result.success ? (
                <>
                  <h3 style={{ margin: "0 0 10px 0", color: "#155724", fontSize: "18px" }}>
                    {result.action === "checkin" ? "✓ Checked In Successfully" : "✓ Checked Out Successfully"}
                  </h3>
                  <div style={{ fontSize: "14px", color: "#155724" }}>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Student:</strong> {result.user.name}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>ID:</strong> {result.studentNumber}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Time:</strong> {result.timestamp}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 10px 0", color: "#721c24", fontSize: "18px" }}>
                    Error
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#721c24" }}>
                    {result.message}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: "30px",
        padding: "15px",
        backgroundColor: "#e3f2fd",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#1976d2"
      }}>
        <strong>📖 How it works:</strong>
        <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
          <li>System automatically detects if student is checked in or out</li>
          <li>If checked out → scanning will check them in</li>
          <li>If checked in → scanning will check them out</li>
          <li>Use manual entry if camera doesn't work</li>
        </ul>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Style the QR scanner elements */
        #qr-reader video {
          border-radius: 8px;
          width: 100% !important;
        }

        #qr-reader__scan_region {
          border-radius: 8px !important;
        }

        /* Make scan region bigger */
        #qr-reader__dashboard_section_csr {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}