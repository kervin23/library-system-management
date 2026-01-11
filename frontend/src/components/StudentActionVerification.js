import { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function StudentActionVerification({
  user,
  actionType, // 'borrow', 'return', 'pc_reserve', 'pc_release'
  actionData, // bookId or pcNumber or borrowId
  bookTitle, // optional - for display purposes
  onSuccess,
  onCancel
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [checkingInterval, setCheckingInterval] = useState(null);

  const getToken = () => localStorage.getItem("token");

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [checkingInterval]);

  const handleSendRequest = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Handle PC end session directly (no admin approval needed)
      if (actionType === 'pc_end') {
        const response = await fetch(`${API_URL}/pcs/end-session/${actionData}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (response.ok) {
          onSuccess({ message: "Session ended successfully" });
        } else {
          setMessage(data.error || "Failed to end session");
        }
        setLoading(false);
        return;
      }

      // Determine request type
      let requestType;
      if (actionType === 'borrow') {
        requestType = 'borrow_book';
      } else if (actionType === 'return') {
        requestType = 'return_book';
      } else if (actionType === 'pc_reserve' || actionType === 'pc_apply') {
        requestType = 'reserve_pc';
      } else {
        setMessage("Invalid action type");
        setLoading(false);
        return;
      }

      let requestBody = { type: requestType };

      if (actionType === 'borrow') {
        // Fetch book details
        const bookResponse = await fetch(`${API_URL}/books`, {
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
        const books = await bookResponse.json();
        const book = books.find(b => b.id === actionData);

        if (!book) {
          setMessage("Book not found");
          setLoading(false);
          return;
        }

        requestBody.bookId = actionData;
        requestBody.bookTitle = book.title;
      } else if (actionType === 'return') {
        // Fetch borrowed book details
        const borrowedResponse = await fetch(`${API_URL}/books/my-books`, {
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
        const borrowedBooks = await borrowedResponse.json();
        const borrowedBook = borrowedBooks.find(b => b.id === actionData);

        if (!borrowedBook) {
          setMessage("Borrow record not found");
          setLoading(false);
          return;
        }

        requestBody.bookId = borrowedBook.bookId;
        requestBody.bookTitle = borrowedBook.title;
        requestBody.transactionId = actionData;
      } else if (actionType === 'pc_reserve' || actionType === 'pc_apply') {
        requestBody.pcNumber = actionData;
        requestBody.pcName = `PC-${actionData}`;
      }

      // Create pending request
      const response = await fetch(`${API_URL}/requests/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setRequestSent(true);
        setMessage("Request sent! Waiting for admin approval...");

        // Start checking for approval (poll every 3 seconds)
        const interval = setInterval(async () => {
          try {
            // Check if the action has been completed
            if (actionType === 'borrow' || actionType === 'return') {
              await fetch(`${API_URL}/books/my-stats`, {
                headers: { "Authorization": `Bearer ${getToken()}` }
              });

              // Check borrowed books to see if our request was processed
              const borrowedResponse = await fetch(`${API_URL}/books/my-books`, {
                headers: { "Authorization": `Bearer ${getToken()}` }
              });
              const borrowedBooks = await borrowedResponse.json();

              if (actionType === 'borrow') {
                // Check if the book was borrowed
                const nowBorrowed = borrowedBooks.find(b =>
                  b.bookId === actionData && b.status === 'borrowed'
                );
                if (nowBorrowed) {
                  clearInterval(interval);
                  onSuccess({ dueDate: nowBorrowed.dueDate });
                }
              } else if (actionType === 'return') {
                // Check if the book was returned
                const stillBorrowed = borrowedBooks.find(b =>
                  b.id === actionData && b.status === 'borrowed'
                );
                if (!stillBorrowed) {
                  clearInterval(interval);
                  onSuccess({});
                }
              }
            } else if (actionType === 'pc_reserve' || actionType === 'pc_apply') {
              // Check if PC reservation was approved
              const sessionResponse = await fetch(`${API_URL}/pcs/my-session`, {
                headers: { "Authorization": `Bearer ${getToken()}` }
              });
              const session = await sessionResponse.json();

              if (session && session.pcNumber === actionData) {
                clearInterval(interval);
                onSuccess({ pcNumber: actionData, session: session });
              }
            }
          } catch (err) {
            console.error("Error checking request status:", err);
          }
        }, 3000);

        setCheckingInterval(interval);

        // Stop checking after 5 minutes
        setTimeout(() => {
          clearInterval(interval);
        }, 5 * 60 * 1000);

      } else {
        setMessage(data.error || "Failed to send request");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  const getActionText = () => {
    switch (actionType) {
      case 'borrow': return 'Borrow Book';
      case 'return': return 'Return Book';
      case 'pc_apply': return 'Apply for PC';
      case 'pc_reserve': return 'Reserve PC';
      case 'pc_release': return 'Release PC';
      case 'pc_end': return 'End PC Session';
      default: return 'Action';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'borrow':
        return 'Your borrow request will be sent to the admin for approval. Please wait near the counter.';
      case 'return':
        return 'Your return request will be sent to the admin. Please bring the book to the counter.';
      case 'pc_apply':
        return 'Your PC application will be sent to the admin for approval.';
      case 'pc_reserve':
        return 'Your PC reservation request will be sent to the admin for approval.';
      case 'pc_release':
        return 'Your PC release request will be sent to the admin.';
      case 'pc_end':
        return 'End your current PC session.';
      default:
        return 'Your request will be sent to the admin for approval.';
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
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>
          {requestSent ? "⏳" : "📋"}
        </div>

        <h2 style={{ marginTop: 0, marginBottom: "15px" }}>
          {requestSent ? "Request Pending" : getActionText()}
        </h2>

        <p style={{ color: "#666", marginBottom: "25px", fontSize: "14px" }}>
          {requestSent
            ? "Your request has been sent to the admin. Please wait for approval."
            : getActionDescription()
          }
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
          <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#1976d2" }}>
            <strong>ID:</strong> {user.studentNumber}
          </p>
          <p style={{ margin: "0", fontSize: "14px", color: "#1976d2" }}>
            <strong>Action:</strong> {getActionText()}
          </p>
        </div>

        {message && (
          <div style={{
            padding: "12px",
            backgroundColor: requestSent ? "#e8f5e9" : "#ffebee",
            color: requestSent ? "#2e7d32" : "#c62828",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {message}
            {requestSent && (
              <div style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "3px solid #4caf50",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                <span style={{ fontSize: "12px", color: "#666" }}>Checking for approval...</span>
              </div>
            )}
          </div>
        )}

        {!requestSent ? (
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
              onClick={handleSendRequest}
              disabled={loading}
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: loading ? "#ccc" : "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px"
              }}
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        ) : (
          <button
            onClick={onCancel}
            style={{
              width: "100%",
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
            Close
          </button>
        )}

        <div style={{
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#e65100",
          textAlign: "left"
        }}>
          <strong>How it works:</strong>
          <ol style={{ margin: "8px 0 0 0", paddingLeft: "20px", lineHeight: "1.6" }}>
            <li>Click "Send Request" to notify the admin</li>
            <li>Go to the library counter with your student ID</li>
            <li>Admin will verify and approve your request</li>
            <li>This window will update automatically when approved</li>
          </ol>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
