import { useState } from "react";
import Login from "./Login";
import CitizenDashboard from "./CitizenDashboard";
import OfficialDashboard from "./OfficialDashboard";
import { Button } from "@/components/ui/button";

export default function App() {
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

  return role === "official"
    ? <OfficialDashboard token={token} onLogout={logout} />
    : <CitizenDashboard token={token} onLogout={logout} />;
}