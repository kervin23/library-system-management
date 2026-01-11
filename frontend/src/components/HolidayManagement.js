import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHoliday, setNewHoliday] = useState({ date: "", description: "" });
  const [adding, setAdding] = useState(false);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const response = await fetch(`${API_URL}/holidays`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setHolidays(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading holidays:", err);
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.date) {
      alert("Please select a date");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch(`${API_URL}/holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(newHoliday)
      });

      const data = await response.json();

      if (response.ok) {
        // Ask if they want to extend existing due dates
        const extend = window.confirm(
          "Holiday added! Do you want to extend due dates that fall on this holiday?"
        );

        if (extend) {
          await fetch(`${API_URL}/holidays/extend-due-dates`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({ holidayDate: newHoliday.date })
          });
        }

        setNewHoliday({ date: "", description: "" });
        loadHolidays();
        alert("Holiday added successfully!");
      } else {
        alert(data.error || "Failed to add holiday");
      }
    } catch (err) {
      console.error("Error adding holiday:", err);
      alert("Network error");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;

    try {
      const response = await fetch(`${API_URL}/holidays/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });

      if (response.ok) {
        loadHolidays();
        alert("Holiday deleted");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete holiday");
      }
    } catch (err) {
      console.error("Error deleting holiday:", err);
      alert("Network error");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateStr + "T00:00:00");
    return holidayDate >= today;
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  const upcomingHolidays = holidays.filter(h => isUpcoming(h.date));
  const pastHolidays = holidays.filter(h => !isUpcoming(h.date));

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ marginTop: 0 }}>Holiday Management</h2>
      <p style={{ color: "#666", marginBottom: "25px" }}>
        Mark days when the library is closed. Book due dates will automatically skip holidays.
      </p>

      {/* Add Holiday Form */}
      <div style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        marginBottom: "25px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "16px" }}>Add New Holiday</h3>
        <form onSubmit={handleAddHoliday}>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>
                Date
              </label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div style={{ flex: 2, minWidth: "200px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={newHoliday.description}
                onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                placeholder="e.g., National Holiday, Library Maintenance"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              style={{
                padding: "10px 25px",
                backgroundColor: adding ? "#ccc" : "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: adding ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              {adding ? "Adding..." : "Add Holiday"}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div style={{
        padding: "15px",
        backgroundColor: "#e3f2fd",
        borderRadius: "8px",
        marginBottom: "25px",
        fontSize: "14px",
        color: "#1565c0"
      }}>
        <strong>How it works:</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>Library is closed every <strong>Thursday</strong> by default</li>
          <li>Book due dates (24 hours) automatically skip Thursdays and marked holidays</li>
          <li>When you add a holiday, you can extend existing due dates that fall on that day</li>
        </ul>
      </div>

      {/* Upcoming Holidays */}
      <h3>Upcoming Holidays ({upcomingHolidays.length})</h3>
      {upcomingHolidays.length === 0 ? (
        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
          No upcoming holidays scheduled.
        </p>
      ) : (
        <div style={{ marginBottom: "30px" }}>
          {upcomingHolidays.map(holiday => (
            <div key={holiday.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px",
              backgroundColor: "#fff3e0",
              borderRadius: "8px",
              border: "1px solid #ff9800",
              marginBottom: "10px"
            }}>
              <div>
                <strong style={{ fontSize: "16px" }}>{formatDate(holiday.date)}</strong>
                {holiday.description && (
                  <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
                    {holiday.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteHoliday(holiday.id)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px"
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Past Holidays */}
      {pastHolidays.length > 0 && (
        <>
          <h3 style={{ color: "#999" }}>Past Holidays ({pastHolidays.length})</h3>
          <div style={{ opacity: 0.7 }}>
            {pastHolidays.slice(0, 10).map(holiday => (
              <div key={holiday.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 15px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                marginBottom: "8px"
              }}>
                <div>
                  <span style={{ fontSize: "14px" }}>{formatDate(holiday.date)}</span>
                  {holiday.description && (
                    <span style={{ color: "#999", fontSize: "13px", marginLeft: "10px" }}>
                      - {holiday.description}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteHoliday(holiday.id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
