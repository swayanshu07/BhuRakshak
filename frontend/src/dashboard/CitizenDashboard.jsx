import React, { useEffect, useState } from "react";
import axios from "axios";
import RiskMap from "./RiskMap";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="min-h-screen bg-muted p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Citizen Dashboard</h1>
        <Button variant="outline" onClick={onLogout}>Logout</Button>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 5.5rem)" }}>
        <div className="flex min-w-0 flex-[4] flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Report a landslide</CardTitle>
              <CardDescription>Officials verify each report.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitReport} className="flex flex-col gap-3">
                <Textarea
                  placeholder="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex gap-3">
                  <Input placeholder="latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
                  <Input placeholder="longitude" value={lon} onChange={(e) => setLon(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Submit report</Button>
                {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts / Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts yet.</p>}
              <ul className="flex flex-col gap-3">
                {alerts.map((a) => (
                  <li key={a.id} className="rounded-lg border p-3 text-sm">
                    <b>{a.title}</b> {a.risk_level && <span className="text-muted-foreground">({a.risk_level})</span>}
                    <p className="mt-1">{a.message}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="relative min-w-0 flex-[6] gap-0 overflow-hidden p-0">
          <div className="absolute inset-0">
            <RiskMap token={token} />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CitizenDashboard;
