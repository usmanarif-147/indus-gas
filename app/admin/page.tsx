"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const username = String(values.get("username") ?? "").trim();
    const password = String(values.get("password") ?? "");
    if (!username || !password) { setError("Enter your username and password."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to sign in."); return; }
      router.replace("/admin/dashboard"); router.refresh();
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setLoading(false); }
  }
  return <main className="admin-login"><section><div className="admin-login-mark">IG</div><p>INDUS GAS · PARTNER PANEL</p><h1>Welcome back</h1><span>Sign in to manage business operations.</span><form onSubmit={login}><label>Username<input name="username" placeholder="Your username" autoComplete="username" /></label><label>Password<input name="password" type="password" placeholder="Password" autoComplete="current-password" /></label>{error && <small className="admin-error">{error}</small>}<button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in →"}</button></form><small>Use your administrator account to access the partner panel.</small></section></main>;
}
