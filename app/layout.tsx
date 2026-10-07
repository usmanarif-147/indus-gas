import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./service-worker-registration";

export const metadata: Metadata = {
  title: "Indus Gas",
  description: "Reliable LPG distribution for businesses.",
  applicationName: "Indus Gas",
  icons: { icon: "/icon-192.svg", apple: "/icon-192.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ServiceWorkerRegistration />{children}</body></html>;
}
