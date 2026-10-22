import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScopeBot — Turn Messy Client Briefs into Board-Ready Scopes",
  description:
    "Autonomous scoping assistant for software agencies and engineers. Generates executive scope summaries, assumptions, task hour breakdowns, visual timelines, and proposal emails.",
  metadataBase: new URL("https://scopebot-three.vercel.app"),
  openGraph: {
    title: "ScopeBot — AI Scope & Proposal Generator",
    description:
      "Turn messy client briefs into board-ready scopes, task hour breakdowns, milestone timelines, and proposal emails in seconds.",
    url: "https://scopebot-three.vercel.app",
    siteName: "ScopeBot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeBot — AI Scope & Proposal Generator",
    description:
      "Turn messy client briefs into board-ready scopes, task hour breakdowns, milestone timelines, and proposal emails in seconds.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('scopebot-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen font-sans bg-[var(--bg-page)] text-[var(--text-primary)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
