"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UnclaimedUser {
  id: number;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "claim">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [unclaimedUsers, setUnclaimedUsers] = useState<UnclaimedUser[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "claim") {
      fetch("/api/auth/unclaimed")
        .then((r) => r.json())
        .then((data) => setUnclaimedUsers(data.users || []))
        .catch(() => setUnclaimedUsers([]));
    }
  }, [mode]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(selectedUserId), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Claim failed");
        return;
      }
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent italic skew-x-[-8deg]">
            2/16
          </h1>
          <p className="mt-3 text-sm tracking-widest uppercase text-muted-foreground">
            Share music. Discover together.
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-name">Name</Label>
              <Input
                id="login-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              First time?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("claim");
                  setError("");
                }}
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
              >
                Set up your account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claim-name">Pick your name</Label>
              <Select
                value={selectedUserId}
                onValueChange={(val) => setSelectedUserId(val ?? "")}
              >
                <SelectTrigger id="claim-name">
                  <SelectValue placeholder="Select your name" />
                </SelectTrigger>
                <SelectContent>
                  {unclaimedUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unclaimedUsers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No unclaimed accounts available.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-password">Set a password</Label>
              <Input
                id="claim-password"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-confirm">Confirm password</Label>
              <Input
                id="claim-confirm"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={submitting || !selectedUserId}
              className="w-full"
            >
              {submitting ? "Setting up..." : "Claim Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have a password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
