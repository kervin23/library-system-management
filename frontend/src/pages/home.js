import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Home() {
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (!token || !user) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/verify`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user.role === 'admin' || data.user.role === 'headadmin') {
            navigate('/admin');
          } else {
            navigate('/student');
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate('/login');
        }
      } catch (err) {
        try {
          const parsedUser = JSON.parse(user);
          if (parsedUser.role === 'admin' || parsedUser.role === 'headadmin') {
            navigate('/admin');
          } else {
            navigate('/student');
          }
        } catch {
          navigate('/login');
        }
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: isDark
        ? `linear-gradient(135deg, ${theme.background} 0%, #2d2d2d 50%, ${theme.background} 100%)`
        : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 50%, ${theme.primary} 100%)`,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "-80px",
        right: "-80px",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: isDark ? `${theme.primary}15` : "rgba(255, 255, 255, 0.15)",
        pointerEvents: "none"
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "-100px",
        left: "-100px",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: isDark ? `${theme.primary}08` : "rgba(255, 255, 255, 0.1)",
        pointerEvents: "none"
      }}></div>

      <div style={{
        textAlign: "center",
        color: isDark ? theme.text : "white",
        zIndex: 1
      }}>
        {/* Spinner */}
        <div style={{
          width: "60px",
          height: "60px",
          border: `4px solid ${isDark ? `${theme.primary}30` : "rgba(255,255,255,0.3)"}`,
          borderTopColor: isDark ? theme.primary : "white",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 25px"
        }}></div>

        {/* Logo */}
        <div style={{
          width: "70px",
          height: "70px",
          margin: "0 auto 20px",
          borderRadius: "18px",
          background: isDark
            ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`
            : "rgba(255, 255, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(10px)",
          boxShadow: isDark ? `0 10px 30px ${theme.primary}30` : "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <span style={{ fontSize: "32px" }}>📚</span>
        </div>

        <h2 style={{
          margin: 0,
          fontWeight: "600",
          fontSize: "22px",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
          Loading Library...
        </h2>
        <p style={{
          marginTop: "10px",
          opacity: 0.8,
          fontSize: "14px"
        }}>
          Please wait while we set things up
        </p>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
