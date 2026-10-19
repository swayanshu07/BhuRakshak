import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import RiskMap from "./RiskMap";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function OfficialDashboard({ token, onLogout }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [msg, setMsg] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

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
    <div className="min-h-screen bg-muted p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Official Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/official/reports"
            className="inline-flex h-9 items-center justify-center rounded-full border bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Citizen reports
          </Link>
          <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 5.5rem)" }}>
        <div className="flex min-w-0 flex-[4] flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Issue alert / warning</CardTitle>
              <CardDescription>Citizens see this on their dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={issueAlert} className="flex flex-col gap-3">
                <Input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="message" value={message} onChange={(e) => setMessage(e.target.value)} />
                <Input placeholder="risk level (optional)" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} />
                <Button type="submit" className="w-full">Issue alert</Button>
                {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
              </form>
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

export default OfficialDashboard;
