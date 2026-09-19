import React, { useEffect, useState } from "react";
import axios from "axios";
import RiskMap from "./RiskMap";

function CitizenDashboard({ token, onLogout }) {
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [msg, setMsg] = useState("");
  const [alerts, setAlerts] = useState([]);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/alerts")
      .then((res) => setAlerts(res.data))
      .catch(() => {});
  }, []);

  const submitReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://127.0.0.1:8000/reports",
        {
          description,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        },
        authHeader
      );
      setMsg("Report submitted, pending verification.");
      setDescription("");
      setLat("");
      setLon("");
    } catch (err) {
      setMsg(err.response?.data?.detail || "failed");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Citizen Dashboard</h2>
          <div>
             <Link to="/official/reports" style={{ marginRight: 12 }}>Citizen reports</Link>
             <button onClick={onLogout} style={{ padding: "6px 14px" }}>Logout</button>
          </div>
      </div>

      <div style={{ display: "flex", gap: 20, height: "calc(100vh - 90px)" }}>
        {/* Left 4: report + alerts */}
        <div style={{ flex: 4, minWidth: 0, overflowY: "auto", paddingRight: 8 }}>
          <h3 style={{ marginTop: 0 }}>Report a landslide</h3>
          <form onSubmit={submitReport}>
            <textarea
              placeholder="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", marginBottom: 8, padding: 8, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: 8 }}
              />
              <input
                placeholder="longitude"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: 8 }}
              />
            </div>
            <button type="submit" style={{ display: "block", marginTop: 10, padding: 8, width: "100%" }}>
              Submit report
            </button>
          </form>
          {msg && <p>{msg}</p>}

          <h3 style={{ marginTop: 30 }}>Alerts / Warnings</h3>
          {alerts.length === 0 && <p>No alerts yet.</p>}
          <ul style={{ paddingLeft: 20 }}>
            {alerts.map((a) => (
              <li key={a.id}>
                <b>{a.title}</b> — {a.message} {a.risk_level && `(${a.risk_level})`}
              </li>
            ))}
          </ul>
        </div>

        {/* Right 6: heat map */}
        <div style={{ flex: 6, minWidth: 0, height: "100%" }}>
          <RiskMap token={token} />
        </div>
      </div>
    </div>
  );
}

export default CitizenDashboard;