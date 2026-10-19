import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./dashboard/Login";
import CitizenDashboard from "./dashboard/CitizenDashboard";
import OfficialDashboard from "./dashboard/OfficialDashboard";
import ReportsPage from "./dashboard/ReportsPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  const handleLogin = (t, r) => {
    localStorage.setItem("token", t);
    localStorage.setItem("role", r);
    setToken(t);
    setRole(r);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      {role === "official" ? (
        <Routes>
          <Route path="/official" element={<OfficialDashboard token={token} onLogout={logout} />} />
          <Route path="/official/reports" element={<ReportsPage token={token} onLogout={logout} />} />
          <Route path="*" element={<Navigate to="/official" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<CitizenDashboard token={token} onLogout={logout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
