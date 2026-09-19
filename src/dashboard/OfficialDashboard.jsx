import React, { useEffect, useState } from "react";
import axios from "axios";

function OfficialDashboard({ token, onLogout }) {
  const [reports, setReports] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [msg, setMsg] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const loadReports = () => {
    axios.get("http://127.0.0.1:8000/reports", authHeader)
      .then((res) => setReports(res.data))
      .catch((err) => setMsg(err.response?.data?.detail || "failed to load reports"));
  };

  useEffect(() => { loadReports(); }, []);

  const verify = async (id, status) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/reports/${id}/verify`, { status }, authHeader);
      loadReports();
    } catch (err) {
      setMsg(err.response?.data?.detail || "failed");
    }
  };

  const issueAlert = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/alerts", {
        title, message, risk_level: riskLevel || null
      }, authHeader);
      setMsg("Alert issued.");
      setTitle(""); setMessage(""); setRiskLevel("");
    } catch (err) {
      setMsg(err.response?.data?.detail || "failed");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Official Dashboard</h2>
        <button onClick={onLogout}>Logout</button>
      </div>

      <h3>Citizen reports</h3>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr><th>ID</th><th>Reporter</th><th>Role</th><th>Description</th><th>Lat</th><th>Lon</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td><td>{r.reporter}</td><td>{r.role}</td><td>{r.description}</td>
              <td>{r.latitude}</td><td>{r.longitude}</td><td>{r.status}</td>
              <td>
                {r.status === "pending" && (
                  <>
                    <button onClick={() => verify(r.id, "verified")}>Verify</button>
                    <button onClick={() => verify(r.id, "rejected")}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 30 }}>Issue alert / warning</h3>
      <form onSubmit={issueAlert} style={{ maxWidth: 400 }}>
        <input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: 8, padding: 8 }} />
        <textarea placeholder="message" value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: "100%", marginBottom: 8, padding: 8 }} />
        <input placeholder="risk level (optional)" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} style={{ width: "100%", marginBottom: 8, padding: 8 }} />
        <button type="submit" style={{ width: "100%", padding: 8 }}>Issue alert</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}

export default OfficialDashboard;