import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScopeBot — Technical Scoping & Proposal Generator",
  description:
    "Convert unformatted client briefs into structured engineering scopes, risk registers, task hour estimates, milestone schedules, and client proposal emails.",
  metadataBase: new URL("https://scopebot-three.vercel.app"),
  openGraph: {
    title: "ScopeBot — Technical Scoping & Proposal Generator",
    description:
      "Convert unformatted client briefs into structured engineering scopes, risk registers, task hour estimates, milestone schedules, and client proposal emails.",
    url: "https://scopebot-three.vercel.app",
    siteName: "ScopeBot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeBot — Technical Scoping & Proposal Generator",
    description:
      "Convert unformatted client briefs into structured engineering scopes, risk registers, task hour estimates, milestone schedules, and client proposal emails.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
