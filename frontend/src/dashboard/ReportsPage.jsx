import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function ReportsPage({ token, onLogout }) {
  const [reports, setReports] = useState([]);
  const [msg, setMsg] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const loadReports = () => {
    axios.get("http://127.0.0.1:8000/reports", authHeader)
      .then((res) => { setReports(res.data); setMsg(""); })
      .catch((err) => {
        console.error(err);
        setMsg(err.response?.data?.detail || `failed to load reports (${err.response?.status || "no response"})`);
      });
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

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Citizen reports</h2>
        <div>
          <Link to="/official" style={{ marginRight: 12 }}>Back to dashboard</Link>
          <button onClick={onLogout} style={{ padding: "6px 14px" }}>Logout</button>
        </div>
      </div>

      {msg && <p style={{ color: "red" }}>{msg}</p>}

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
      {reports.length === 0 && !msg && <p>No reports yet.</p>}
    </div>
  );
}

export default ReportsPage;
