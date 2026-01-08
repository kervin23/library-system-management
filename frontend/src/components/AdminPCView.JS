import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function AdminPCView() {
  const [pcs, setPcs] = useState([]);
  const [activeReservations, setActiveReservations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview'); // 'overview', 'active', 'history'

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    loadPCs();
    loadActiveReservations();
    loadHistory();
  }, []);

  const loadPCs = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setPcs(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading PCs:", err);
      setLoading(false);
    }
  };

  const loadActiveReservations = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs/reservations`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setActiveReservations(data);
    } catch (err) {
      console.error("Error loading reservations:", err);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs/history`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const handleReleasePC = async (reservationId) => {
    if (!window.confirm("Release this PC reservation?")) return;

    try {
      const response = await fetch(`${API_URL}/pcs/release/${reservationId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });

      if (response.ok) {
        alert("PC released successfully!");
        loadPCs();
        loadActiveReservations();
      } else {
        alert("Failed to release PC");
      }
    } catch (err) {
      console.error("Error releasing PC:", err);
      alert("Network error");
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  const availableCount = pcs.filter(pc => pc.currentStatus === 'available').length;
  const reservedCount = pcs.filter(pc => pc.currentStatus === 'reserved').length;

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ marginTop: 0 }}>PC Reservation Management</h2>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "15px",
        marginBottom: "25px"
      }}>
        <div style={{
          padding: "20px",
          backgroundColor: "#e3f2fd",
          borderRadius: "8px",
          borderLeft: "4px solid #2196F3"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2196F3" }}>
            {pcs.length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Total PCs</div>
        </div>
        <div style={{
          padding: "20px",
          backgroundColor: "#e8f5e9",
          borderRadius: "8px",
          borderLeft: "4px solid #4caf50"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4caf50" }}>
            {availableCount}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Available</div>
        </div>
        <div style={{
          padding: "20px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
          borderLeft: "4px solid #ff9800"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff9800" }}>
            {reservedCount}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Currently Reserved</div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "25px",
        backgroundColor: "#f8f9fa",
        padding: "5px",
        borderRadius: "8px",
        width: "fit-content"
      }}>
        <button
          onClick={() => setView('overview')}
          style={{
            padding: "10px 20px",
            backgroundColor: view === 'overview' ? "#667eea" : "transparent",
            color: view === 'overview' ? "white" : "#666",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          💻 All PCs
        </button>
        <button
          onClick={() => setView('active')}
          style={{
            padding: "10px 20px",
            backgroundColor: view === 'active' ? "#667eea" : "transparent",
            color: view === 'active' ? "white" : "#666",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          🔒 Active ({activeReservations.length})
        </button>
        <button
          onClick={() => setView('history')}
          style={{
            padding: "10px 20px",
            backgroundColor: view === 'history' ? "#667eea" : "transparent",
            color: view === 'history' ? "white" : "#666",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          📋 History
        </button>
      </div>

      {/* All PCs View */}
      {view === 'overview' && (
        <div>
          <h3>All PC Stations</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "15px"
          }}>
            {pcs.map(pc => {
              const isAvailable = pc.currentStatus === 'available';
              
              return (
                <div
                  key={pc.id}
                  style={{
                    padding: "20px",
                    backgroundColor: isAvailable ? "#f5f5f5" : "#ffebee",
                    border: `2px solid ${isAvailable ? "#ddd" : "#f44336"}`,
                    borderRadius: "8px",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>
                    {isAvailable ? "💻" : "🔒"}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "5px" }}>
                    PC-{pc.pcNumber}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                    {pc.location}
                  </div>
                  <span style={{
                    padding: "4px 12px",
                    backgroundColor: isAvailable ? "#4caf50" : "#f44336",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600"
                  }}>
                    {isAvailable ? "Available" : "Reserved"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Reservations View */}
      {view === 'active' && (
        <div>
          <h3>Active Reservations</h3>
          {activeReservations.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No active reservations
            </p>
          ) : (
            activeReservations.map(res => (
              <div key={res.id} style={{
                marginBottom: "15px",
                padding: "20px",
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                border: "1px solid #ddd"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                      💻 PC-{res.pcNumber} - {res.location}
                    </h3>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Student:</strong> {res.name} ({res.studentNumber})
                    </p>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Reserved Since:</strong> {new Date(res.startTime).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleReleasePC(res.id)}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Release PC
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div>
          <h3>Reservation History</h3>
          {history.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No history available
            </p>
          ) : (
            history.slice(0, 50).map(res => (
              <div key={res.id} style={{
                marginBottom: "12px",
                padding: "15px",
                backgroundColor: res.status === 'active' ? "#e8f5e9" : "#f9f9f9",
                borderRadius: "8px",
                border: `1px solid ${res.status === 'active' ? '#4caf50' : '#ddd'}`
              }}>
                <div>
                  <strong style={{ fontSize: "16px" }}>
                    💻 PC-{res.pcNumber} - {res.name} ({res.studentNumber})
                  </strong>
                  <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>
                    Started: {new Date(res.startTime).toLocaleString()}
                    {res.endTime && ` • Ended: ${new Date(res.endTime).toLocaleString()}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}