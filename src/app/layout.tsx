import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScopeBot — Messy client brief to scope, estimate & proposal",
  description:
    "Paste a messy client brief and get a scope summary, assumptions & questions, hour-estimated task breakdown, milestone timeline and a proposal email. Built for the BharatCode Build League.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
