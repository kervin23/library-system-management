import { useEffect, useState } from "react";
import StudentActionVerification from "./StudentActionVerification";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function PCReservationRedesigned() {
  const [pcs, setPcs] = useState([]);
  const [mySession, setMySession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationAction, setVerificationAction] = useState(null);
  const [user, setUser] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'occupied'

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    loadPCs();
    loadMySession();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadPCs();
      loadMySession();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPCs = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs/detailed-status`, {
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

  const loadMySession = async () => {
    try {
      const response = await fetch(`${API_URL}/pcs/my-session`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setMySession(data);
    } catch (err) {
      console.error("Error loading session:", err);
    }
  };

  const handleQuickApply = () => {
    const availablePC = pcs.find(pc => pc.status === 'available');
    
    if (availablePC) {
      // Quick apply to first available
      setVerificationAction({
        type: 'pc_apply',
        data: availablePC.pcNumber
      });
    } else {
      // Quick reserve to PC with shortest wait
      const sortedPCs = [...pcs]
        .filter(pc => pc.status === 'occupied')
        .sort((a, b) => a.remainingMinutes - b.remainingMinutes);
      
      if (sortedPCs.length > 0) {
        setVerificationAction({
          type: 'pc_reserve',
          data: sortedPCs[0].pcNumber
        });
      } else {
        // No PCs available - do nothing
        return;
      }
    }
    
    setShowVerification(true);
  };

  const handleApplyPC = (pcNumber) => {
    setVerificationAction({
      type: 'pc_apply',
      data: pcNumber
    });
    setShowVerification(true);
  };

  const handleReservePC = (pcNumber) => {
    setVerificationAction({
      type: 'pc_reserve',
      data: pcNumber
    });
    setShowVerification(true);
  };

  const handleEndSession = () => {
    if (!mySession) return;
    
    setVerificationAction({
      type: 'pc_end',
      data: mySession.id
    });
    setShowVerification(true);
  };

  const handleVerificationSuccess = (data) => {
    setShowVerification(false);
    setVerificationAction(null);
    loadPCs();
    loadMySession();
  };

  const handleVerificationCancel = () => {
    setShowVerification(false);
    setVerificationAction(null);
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  const availableCount = pcs.filter(pc => pc.status === 'available').length;
  const occupiedCount = pcs.filter(pc => pc.status === 'occupied').length;
  const hasAvailable = availableCount > 0;

  // Filter PCs
  const filteredPCs = pcs.filter(pc => {
    const matchesSearch = pc.pcNumber.toString().includes(searchFilter) || 
                         pc.location.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      {/* Verification Modal */}
      {showVerification && verificationAction && user && (
        <StudentActionVerification
          user={user}
          actionType={verificationAction.type}
          actionData={verificationAction.data}
          onSuccess={handleVerificationSuccess}
          onCancel={handleVerificationCancel}
        />
      )}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h2 style={{ margin: 0 }}>Computer Reservation</h2>
        
        {/* Quick Apply/Reserve Button */}
        {!mySession && (
          <button
            onClick={handleQuickApply}
            style={{
              padding: "12px 24px",
              backgroundColor: hasAvailable ? "#4caf50" : "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
            }}
          >
            ⚡ {hasAvailable ? "Quick Apply" : "Quick Reserve"}
          </button>
        )}
      </div>

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
          <div style={{ fontSize: "14px", color: "#666" }}>Total Computers</div>
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
          <div style={{ fontSize: "14px", color: "#666" }}>Available Now</div>
        </div>
        <div style={{
          padding: "20px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
          borderLeft: "4px solid #ff9800"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff9800" }}>
            {occupiedCount}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Currently Occupied</div>
        </div>
      </div>

      {/* My Current Session */}
      {mySession && (
        <div style={{
          padding: "20px",
          backgroundColor: mySession.type === 'active' ? "#e8f5e9" : "#fff3e0",
          borderRadius: "8px",
          border: `2px solid ${mySession.type === 'active' ? '#4caf50' : '#ff9800'}`,
          marginBottom: "25px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 10px 0", color: mySession.type === 'active' ? "#2e7d32" : "#f57c00" }}>
                {mySession.type === 'active' ? "✓ Active Session" : "⏰ Reserved"}
              </h3>
              <p style={{ margin: "5px 0", fontSize: "16px" }}>
                <strong>Computer {mySession.pcNumber}</strong> - {mySession.location}
              </p>
              {mySession.type === 'active' ? (
                <>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                    Started: {new Date(mySession.startTime).toLocaleTimeString()}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                    Time Remaining: <strong style={{ color: mySession.remainingMinutes < 15 ? "#f44336" : "#4caf50" }}>
                      {mySession.remainingMinutes} minutes
                    </strong>
                  </p>
                </>
              ) : (
                <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                  Will be available in: <strong>{mySession.waitMinutes} minutes</strong>
                </p>
              )}
            </div>
            {mySession.type === 'active' && (
              <button
                onClick={handleEndSession}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "15px"
                }}
              >
                End Session
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "15px",
        marginBottom: "25px",
        flexWrap: "wrap"
      }}>
        <input
          type="text"
          placeholder="Search by computer number or location..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: "250px",
            padding: "10px 15px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px"
          }}
        />
        <div style={{
          display: "flex",
          gap: "5px",
          backgroundColor: "#f8f9fa",
          padding: "5px",
          borderRadius: "8px"
        }}>
          {['all', 'available', 'occupied'].map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: "8px 16px",
                backgroundColor: statusFilter === filter ? "#667eea" : "transparent",
                color: statusFilter === filter ? "white" : "#666",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                textTransform: "capitalize"
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Computer List */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "15px" }}>Available Computers ({filteredPCs.length})</h3>
        
        {filteredPCs.length === 0 ? (
          <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
            No computers match your filters
          </p>
        ) : (
          filteredPCs.map(pc => {
            const isAvailable = pc.status === 'available';
            const isMyPC = mySession && mySession.pcNumber === pc.pcNumber;
            
            return (
              <div
                key={pc.id}
                style={{
                  marginBottom: "15px",
                  padding: "20px",
                  backgroundColor: isMyPC ? "#e8f5e9" : isAvailable ? "#f5f5f5" : "#fff3e0",
                  borderRadius: "8px",
                  border: `2px solid ${isMyPC ? "#4caf50" : isAvailable ? "#ddd" : "#ff9800"}`,
                  opacity: isMyPC ? 1 : 1
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "15px"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "18px" }}>
                        💻 Computer {pc.pcNumber}
                      </h3>
                      <span style={{
                        padding: "4px 12px",
                        backgroundColor: isAvailable ? "#4caf50" : "#ff9800",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {isAvailable ? "Available" : "Occupied"}
                      </span>
                      {isMyPC && (
                        <span style={{
                          padding: "4px 12px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          YOUR SESSION
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Location:</strong> {pc.location}
                    </p>
                    {!isAvailable && (
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Available in:</strong> 
                        <span style={{ 
                          color: pc.remainingMinutes < 15 ? "#4caf50" : "#ff9800",
                          fontWeight: "600",
                          marginLeft: "5px"
                        }}>
                          {pc.remainingMinutes} minutes
                        </span>
                      </p>
                    )}
                  </div>
                  
                  {!mySession && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {isAvailable ? (
                        <button
                          onClick={() => handleApplyPC(pc.pcNumber)}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px"
                          }}
                        >
                          Apply (1 hour)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReservePC(pc.pcNumber)}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#ff9800",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px"
                          }}
                        >
                          Reserve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Instructions */}
      <div style={{
        padding: "20px",
        backgroundColor: "#e3f2fd",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#1976d2"
      }}>
        <strong>📖 How to use:</strong>
        <ul style={{ marginBottom: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
          <li><strong>Quick Apply:</strong> Automatically assigns you to an available computer</li>
          <li><strong>Quick Reserve:</strong> Reserves the computer with shortest wait time</li>
          <li><strong>Apply:</strong> Request a specific available computer for 1 hour</li>
          <li><strong>Reserve:</strong> Queue for a specific occupied computer</li>
          <li><strong>End Session:</strong> Finish using the computer before time expires</li>
          <li>You can only have one active session or reservation at a time</li>
        </ul>
      </div>
    </div>
  );
}