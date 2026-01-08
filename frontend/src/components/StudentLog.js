import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function StudentLog() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'checkin', 'checkout'
  const [searchTerm, setSearchTerm] = useState('');

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filter, searchTerm]);

  const loadLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/attendance/logs`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setLogs(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading logs:", err);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by action (all/checkin/checkout)
    if (filter !== 'all') {
      filtered = filtered.filter(log => log.action === filter);
    }

    // Search by student number or name
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.studentNumber.toLowerCase().includes(search) ||
        log.name.toLowerCase().includes(search)
      );
    }

    // Sort by time (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Student Number', 'Name', 'Action'];
    const rows = filteredLogs.map(log => {
      const date = new Date(log.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        log.studentNumber,
        log.name,
        log.action === 'checkin' ? 'Check In' : 'Check Out'
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <h2>Loading attendance logs...</h2>
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
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h2 style={{ margin: "0 0 5px 0" }}>Student Attendance Log</h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={exportToCSV}
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
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: "grid",
        gridTemplateColumns: window.innerWidth > 768 ? "auto 1fr auto" : "1fr",
        gap: "15px",
        marginBottom: "25px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px"
      }}>
        {/* Action Filter */}
        <div>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#333"
          }}>
            Filter by Action
          </label>
          <div style={{
            display: "flex",
            gap: "8px",
            backgroundColor: "white",
            padding: "4px",
            borderRadius: "6px",
            border: "1px solid #ddd"
          }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: "8px 16px",
                backgroundColor: filter === 'all' ? "#667eea" : "transparent",
                color: filter === 'all' ? "white" : "#666",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('checkin')}
              style={{
                padding: "8px 16px",
                backgroundColor: filter === 'checkin' ? "#4caf50" : "transparent",
                color: filter === 'checkin' ? "white" : "#666",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
            >
              Check In
            </button>
            <button
              onClick={() => setFilter('checkout')}
              style={{
                padding: "8px 16px",
                backgroundColor: filter === 'checkout' ? "#ff9800" : "transparent",
                color: filter === 'checkout' ? "white" : "#666",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
            >
              Check Out
            </button>
          </div>
        </div>

        {/* Search */}
        <div>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#333"
          }}>
            Search Student
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID or name..."
            style={{
              width: "100%",
              padding: "10px 15px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Clear Filters */}
        <div style={{
          display: "flex",
          alignItems: "flex-end"
        }}>
          <button
            onClick={clearFilters}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              whiteSpace: "nowrap"
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "15px",
        marginBottom: "25px"
      }}>
        <div style={{
          padding: "15px",
          backgroundColor: "#e3f2fd",
          borderRadius: "8px",
          borderLeft: "4px solid #2196F3"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2196F3" }}>
            {logs.length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Total Records</div>
        </div>
        <div style={{
          padding: "15px",
          backgroundColor: "#e8f5e9",
          borderRadius: "8px",
          borderLeft: "4px solid #4caf50"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4caf50" }}>
            {logs.filter(l => l.action === 'checkin').length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Total Check-ins</div>
        </div>
        <div style={{
          padding: "15px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
          borderLeft: "4px solid #ff9800"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff9800" }}>
            {logs.filter(l => l.action === 'checkout').length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Total Check-outs</div>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div style={{
          padding: "40px",
          textAlign: "center",
          color: "#666",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>📋</div>
          <h3 style={{ margin: "0 0 10px 0" }}>No Records Found</h3>
          <p style={{ margin: 0 }}>
            {searchTerm || filter !== 'all' 
              ? "Try adjusting your filters" 
              : "No attendance logs yet"}
          </p>
        </div>
      ) : (
        <div style={{
          overflowX: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Time</th>
                <th style={tableHeaderStyle}>Student ID</th>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => {
                const date = new Date(log.timestamp);
                const isCheckIn = log.action === 'checkin';
                
                return (
                  <tr 
                    key={log.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "white" : "#f8f9fa",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e3f2fd"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#f8f9fa"}
                  >
                    <td style={tableCellStyle}>
                      {date.toLocaleDateString()}
                    </td>
                    <td style={tableCellStyle}>
                      {date.toLocaleTimeString()}
                    </td>
                    <td style={{...tableCellStyle, fontWeight: "600", fontFamily: "monospace"}}>
                      {log.studentNumber}
                    </td>
                    <td style={tableCellStyle}>
                      {log.name}
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: "6px 12px",
                        backgroundColor: isCheckIn ? "#4caf50" : "#ff9800",
                        color: "white",
                        borderRadius: "15px",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "inline-block"
                      }}>
                        {isCheckIn ? "✓ Check In" : "✗ Check Out"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      <div style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#666"
      }}>
        <strong>💡 Tips:</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
          <li>Logs are sorted by most recent first</li>
          <li>Use filters to view specific check-ins or check-outs</li>
          <li>Search works with both student ID and name</li>
          <li>Export to CSV for backup or analysis</li>
        </ul>
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: "15px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "600",
  color: "#333",
  borderBottom: "2px solid #ddd",
  whiteSpace: "nowrap"
};

const tableCellStyle = {
  padding: "15px",
  fontSize: "14px",
  color: "#333",
  borderBottom: "1px solid #eee"
};