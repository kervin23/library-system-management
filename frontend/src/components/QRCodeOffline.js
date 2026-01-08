import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeOffline({ user, show, onClose }) {
  const canvasRef = useRef(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (show && user && canvasRef.current) {
      generateAndDownloadQR();
    }
  }, [show, user]);

  const generateAndDownloadQR = async () => {
    try {
      const canvas = canvasRef.current;
      const qrData = `STUDENT:${user.id}:${user.studentNumber}`;
      
      // Generate real QR code
      await QRCode.toCanvas(canvas, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrGenerated(true);

      // Auto-download immediately after generation
      setTimeout(() => {
        autoDownload();
      }, 500);

    } catch (err) {
      console.error("Error generating QR code:", err);
      alert("Failed to generate QR code");
    }
  };

  const autoDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library-qr-${user.studentNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const downloadAgain = () => {
    autoDownload();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ marginTop: 0, color: '#333', fontSize: '24px' }}>
          Your Library QR Code
        </h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px' }}>
          Show this to the admin for check-in/out
        </p>

        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid #e9ecef'
        }}>
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto'
            }}
          />
          {qrGenerated && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#d4edda',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#155724'
            }}>
              ✓ QR code downloaded automatically!
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '18px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '15px', color: '#1565c0', marginBottom: '8px' }}>
            <strong>Student ID:</strong> {user.studentNumber}
          </div>
          <div style={{ fontSize: '15px', color: '#1565c0' }}>
            <strong>Name:</strong> {user.name}
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button
            onClick={downloadAgain}
            style={{
              padding: '14px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
          >
            📥 Download Again
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '14px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
              e.target.style.borderColor = '#bbb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
              e.target.style.borderColor = '#ddd';
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#e65100',
          textAlign: 'left'
        }}>
          <strong>📱 How to use:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Save the downloaded QR code to your phone</li>
            <li>Show it to admin when entering/leaving library</li>
            <li>Keep it accessible for quick check-in/out</li>
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}