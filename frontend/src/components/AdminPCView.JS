import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function AdminPCView() {
  const [pcs, setPcs] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all'); // 'all', 'available', 'inuse', 'active', 'history'
  const [message, setMessage] = useState({ type: '', text: '' });

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    loadAllData();

    // Refresh every 30 seconds
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = () => {
    loadPCs();
    loadActiveSessions();
    loadReservations();
    loadHistory();
  };

  const loadPCs = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs/detailed-status`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setPcs(data);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading PCs:", err);
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs/sessions`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setActiveSessions(data);
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  };

  const loadReservations = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs/reservations`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setReservations(data);
      }
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
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm("End this PC session?")) return;

    try {
      const response = await fetch(`${API_URL}/pcs/end-session/${sessionId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Session ended successfully!' });
        loadAllData();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to end session' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (err) {
      console.error("Error ending session:", err);
      setMessage({ type: 'error', text: 'Network error' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  const availablePCs = pcs.filter(pc => pc.status === 'available');
  const inUsePCs = pcs.filter(pc => pc.status === 'occupied');

  // Get displayed PCs based on view
  const getDisplayedPCs = () => {
    if (view === 'available') return availablePCs;
    if (view === 'inuse') return inUsePCs;
    return pcs;
  };

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ margin: 0 }}>PC Reservation Management</h2>
        <button
          onClick={loadAllData}
          style={{
            padding: "10px 20px",
            backgroundColor: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Refresh
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          padding: "15px",
          backgroundColor: message.type === 'success' ? "#e8f5e9" : "#ffebee",
          color: message.type === 'success' ? "#2e7d32" : "#c62828",
          borderRadius: "8px",
          marginBottom: "20px",
          fontWeight: "600"
        }}>
          {message.type === 'success' ? '✓' : '✗'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "15px",
        marginBottom: "25px"
      }}>
        <div style={{
          padding: "20px",
          backgroundColor: "#e3f2fd",
          borderRadius: "8px",
          borderLeft: "4px solid #2196F3",
          textAlign: "center"
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
          borderLeft: "4px solid #4caf50",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4caf50" }}>
            {availablePCs.length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Available</div>
        </div>
        <div style={{
          padding: "20px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
          borderLeft: "4px solid #ff9800",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff9800" }}>
            {inUsePCs.length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>In Use</div>
        </div>
        <div style={{
          padding: "20px",
          backgroundColor: "#fce4ec",
          borderRadius: "8px",
          borderLeft: "4px solid #e91e63",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#e91e63" }}>
            {reservations.length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Queued</div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "25px",
        backgroundColor: "#f8f9fa",
        padding: "5px",
        borderRadius: "8px",
        flexWrap: "wrap"
      }}>
        {[
          { key: 'all', label: 'All PCs', icon: '💻' },
          { key: 'available', label: 'Available', icon: '✅' },
          { key: 'inuse', label: 'In Use', icon: '🔒' },
          { key: 'active', label: `Active Sessions (${activeSessions.length})`, icon: '⏱️' },
          { key: 'history', label: 'History', icon: '📋' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            style={{
              padding: "10px 16px",
              backgroundColor: view === item.key ? "#667eea" : "transparent",
              color: view === item.key ? "white" : "#666",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* All PCs / Available / In Use View */}
      {(view === 'all' || view === 'available' || view === 'inuse') && (
        <div>
          <h3 style={{ marginBottom: "15px" }}>
            {view === 'all' ? 'All PCs' : view === 'available' ? 'Available PCs' : 'PCs In Use'}
            ({getDisplayedPCs().length})
          </h3>

          {getDisplayedPCs().length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No PCs to display
            </p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "15px"
            }}>
              {getDisplayedPCs().map(pc => {
                const isAvailable = pc.status === 'available';
                const session = activeSessions.find(s => s.pcNumber === pc.pcNumber);

                return (
                  <div
                    key={pc.id || pc.pcNumber}
                    style={{
                      padding: "15px",
                      backgroundColor: isAvailable ? "#f5f5f5" : "#fff3e0",
                      border: `2px solid ${isAvailable ? "#4caf50" : "#ff9800"}`,
                      borderRadius: "10px",
                      textAlign: "center",
                      transition: "transform 0.2s"
                    }}
                  >
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                      {isAvailable ? "💻" : "🔒"}
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
                      PC-{pc.pcNumber}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
                      {pc.location || 'Library'}
                    </div>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      backgroundColor: isAvailable ? "#4caf50" : "#ff9800",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "600"
                    }}>
                      {isAvailable ? "Available" : "In Use"}
                    </span>
                    {!isAvailable && session && (
                      <div style={{ marginTop: "8px", fontSize: "11px", color: "#666" }}>
                        {session.remainingMinutes > 0 ? `${session.remainingMinutes} min left` : 'Time up'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active Sessions View */}
      {view === 'active' && (
        <div>
          <h3 style={{ marginBottom: "15px" }}>Active Sessions ({activeSessions.length})</h3>
          {activeSessions.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No active sessions
            </p>
          ) : (
            <div>
              {activeSessions.map(session => (
                <div key={session.id} style={{
                  marginBottom: "15px",
                  padding: "20px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  border: "2px solid #ff9800"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "24px" }}>💻</span>
                        <h3 style={{ margin: 0, fontSize: "18px" }}>
                          PC-{session.pcNumber}
                        </h3>
                        <span style={{
                          padding: "4px 10px",
                          backgroundColor: session.remainingMinutes > 15 ? "#4caf50" : session.remainingMinutes > 0 ? "#ff9800" : "#f44336",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          {session.remainingMinutes > 0 ? `${session.remainingMinutes} min left` : 'Time up'}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Student:</strong> {session.name} ({session.studentNumber})
                      </p>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Location:</strong> {session.location || 'Library'}
                      </p>
                      <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Started:</strong> {new Date(session.startTime).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEndSession(session.id)}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px"
                      }}
                    >
                      End Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Queued Reservations */}
          {reservations.length > 0 && (
            <div style={{ marginTop: "30px" }}>
              <h3 style={{ marginBottom: "15px" }}>Queued Reservations ({reservations.length})</h3>
              {reservations.map(res => (
                <div key={res.id} style={{
                  marginBottom: "12px",
                  padding: "15px",
                  backgroundColor: "#fce4ec",
                  borderRadius: "8px",
                  border: "1px solid #e91e63"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>PC-{res.pcNumber}</strong> - {res.name} ({res.studentNumber})
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
                        Waiting for PC to become available
                      </p>
                    </div>
                    <span style={{
                      padding: "4px 10px",
                      backgroundColor: "#e91e63",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600"
                    }}>
                      Queued
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div>
          <h3 style={{ marginBottom: "15px" }}>Reservation History</h3>
          {history.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No history available
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>PC</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Student</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Start Time</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>End Time</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 50).map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>
                        <strong>PC-{item.pcNumber}</strong>
                        <div style={{ fontSize: "11px", color: "#666" }}>{item.location}</div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {item.name}
                        <div style={{ fontSize: "11px", color: "#666" }}>{item.studentNumber}</div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {new Date(item.startTime).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {item.endTime ? new Date(item.endTime).toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "4px 10px",
                          backgroundColor: item.status === 'active' ? "#4caf50" :
                                          item.status === 'completed' ? "#2196F3" :
                                          item.status === 'expired' ? "#ff9800" : "#9e9e9e",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
