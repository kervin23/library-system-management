import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/home";
import Login from "./pages/login";
import Signin from "./pages/signin";
import ForgotPassword from "./pages/ForgotPassword";
import Student from "./pages/student";
import Admin from "./pages/admin";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/student" element={<Student />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
