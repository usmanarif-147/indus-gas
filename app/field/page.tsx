"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function FieldLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"username" | "pin">("username");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinInputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step === "pin") pinInputs.current[0]?.focus();
  }, [step]);

  async function checkUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/field/auth/username", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Username not found.");
      setPin(["", "", "", ""]);
      setStep("pin");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Username not found.");
    } finally {
      setLoading(false);
    }
  }

  function updatePin(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    setError("");
    if (digit && index < 3) pinInputs.current[index + 1]?.focus();
  }

  function handlePinKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !pin[index] && index > 0) pinInputs.current[index - 1]?.focus();
  }

  function pastePin(event: React.ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!digits) return;
    event.preventDefault();
    setPin(Array.from({ length: 4 }, (_, index) => digits[index] || ""));
    pinInputs.current[Math.min(digits.length, 4) - 1]?.focus();
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = pin.join("");
    if (password.length !== 4) {
      setError("Enter all 4 PIN digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/field/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      router.replace("/field/home");
      router.refresh();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Unable to sign in.");
      setPin(["", "", "", ""]);
      pinInputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  return <main className="field-shell"><section className="login-card">
    <div className="app-mark">IG</div>
    <p className="field-brand">INDUS<span>GAS</span></p>
    <h1>{step === "username" ? "Employee App" : "Enter your PIN"}</h1>
    <p className="muted">{step === "username" ? "Enter your username to continue." : <>Username: {username}</>}</p>
    {step === "username" ? <form className="simple-form" onSubmit={checkUsername}>
      <label>Username<input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" required autoFocus /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="button form-button" type="submit" disabled={loading}>{loading ? "Checking…" : "Continue →"}</button>
    </form> : <form className="simple-form" onSubmit={login}>
      <div className="pin-group" aria-label="4-digit PIN">
        {pin.map((digit, index) => <input key={index} ref={(element) => { pinInputs.current[index] = element; }} value={digit} type="password" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={"PIN digit " + (index + 1)} onChange={(event) => updatePin(index, event.target.value)} onKeyDown={(event) => handlePinKeyDown(index, event)} onPaste={pastePin} />)}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="button form-button" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in →"}</button>
      <button className="text-button" type="button" onClick={() => { setStep("username"); setPin(["", "", "", ""]); setError(""); }}>← Change username</button>
    </form>}
    <p className="login-note">Your work options are selected automatically after sign-in.</p>
  </section></main>;
}
