"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  function login(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = new FormData(event.currentTarget); if (!String(values.get("name") ?? "").trim() || !String(values.get("password") ?? "").trim()) { setError("Enter your name and password."); return; } router.push("/admin/dashboard"); }
  return <main className="admin-login"><section><div className="admin-login-mark">IG</div><p>INDUS GAS · PARTNER PANEL</p><h1>Welcome back</h1><span>Sign in to manage business operations.</span><form onSubmit={login}><label>Name<input name="name" placeholder="Your name" autoComplete="name" /></label><label>Password<input name="password" type="password" placeholder="Password" autoComplete="current-password" /></label>{error && <small className="admin-error">{error}</small>}<button type="submit">Sign in →</button></form><small>Testing only: any non-empty name and password work.</small></section></main>;
}
