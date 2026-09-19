import React, { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [role, setRole] = useState("citizen");
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const base = `http://127.0.0.1:8000/auth/${role}`;
    try {
      if (mode === "signup") {
        await axios.post(`${base}/signup`, { username, password });
        setMode("login");
        setError("Signup done, now login");
        return;
      }
      const res = await axios.post(`${base}/login`, { username, password });
      onLogin(res.data.access_token, role);
    } catch (err) {
      setError(err.response?.data?.detail || "failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: 24, borderRadius: 8, width: 300 }}>
        <h2>BhuRakshak {mode === "login" ? "Login" : "Signup"}</h2>
        <div style={{ marginBottom: 10 }}>
          <label><input type="radio" checked={role === "citizen"} onChange={() => setRole("citizen")} /> Citizen</label>
          <label style={{ marginLeft: 10 }}><input type="radio" checked={role === "official"} onChange={() => setRole("official")} /> Official</label>
        </div>
        <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 8 }} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 8 }} />
        {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
        <Button type="submit" className="w-full">{mode === "login" ? "Login" : "Sign up"}</Button>
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <span onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ cursor: "pointer", color: "blue" }}>
            {mode === "login" ? "Need account? Signup" : "Have account? Login"}
          </span>
        </div>
      </form>
    </div>
  );
}

export default Login;