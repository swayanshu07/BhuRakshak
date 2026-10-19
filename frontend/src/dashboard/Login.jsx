import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BorderBeam } from "@/components/ui/border-beam";

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
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="relative w-full max-w-sm overflow-hidden">
        <CardHeader>
          <CardTitle>BhuRakshak</CardTitle>
          <CardDescription>
            {mode === "login" ? "Login to continue" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Tabs value={role} onValueChange={setRole}>
              <TabsList className="w-full">
                <TabsTrigger value="citizen" className="flex-1">Citizen</TabsTrigger>
                <TabsTrigger value="official" className="flex-1">Official</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full">
              {mode === "login" ? "Login" : "Sign up"}
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-muted-foreground underline"
            >
              {mode === "login" ? "Need account? Signup" : "Have account? Login"}
            </button>
          </form>
        </CardContent>
        <BorderBeam size={200} duration={10} />
      </Card>
    </div>
  );
}

export default Login;
