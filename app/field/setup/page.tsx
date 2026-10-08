"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function FieldSetupPage() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [message, setMessage] = useState("Preparing the install option…");

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      window.location.replace("/field");
      return;
    }
    const receivePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setMessage("Install the Indus Gas app on this phone.");
    };
    window.addEventListener("beforeinstallprompt", receivePrompt);
    const timeout = window.setTimeout(() => {
      setMessage((current) => current.startsWith("Preparing") ? "Use Chrome menu (⋮) and choose Install app." : current);
    }, 2500);
    return () => { window.removeEventListener("beforeinstallprompt", receivePrompt); window.clearTimeout(timeout); };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setMessage(choice.outcome === "accepted" ? "Indus Gas has been installed. Open it from your home screen." : "Installation cancelled. You can try again from the Chrome menu.");
  };

  return <main className="setup"><section className="setup-card"><div className="setup-icon">IG</div><p className="eyebrow">INDUS GAS</p><h1>Employee App</h1><p className="muted">Install this app once. After that, open Indus Gas from the app icon on this phone.</p><button className="button install" onClick={install} disabled={!installPrompt}>{installPrompt ? "Install Indus Gas" : "Install from Chrome menu"}</button><p className="setup-help">{message}</p><p className="setup-help">After installation, sign in. Your work options will appear automatically.</p></section></main>;
}
