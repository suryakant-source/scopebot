import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ScopeBot — Turn messy briefs into scopes, estimates & proposals";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          color: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            ⚡
          </div>
          <span style={{ fontSize: "36px", fontWeight: "700", letterSpacing: "-0.03em" }}>
            ScopeBot
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#818cf8",
              background: "rgba(99, 102, 241, 0.15)",
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              marginLeft: "12px",
            }}
          >
            BharatCode Build League
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "950px" }}>
          <h1
            style={{
              fontSize: "58px",
              fontWeight: "800",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              margin: 0,
              background: "linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Turn messy client briefs into board-ready scopes & proposals.
          </h1>
          <p style={{ fontSize: "24px", color: "#a1a1aa", margin: 0, lineHeight: 1.4 }}>
            Scope Summary • Assumptions • Task Breakdown • Visual Timeline • Client Proposal Email
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #27272a",
            paddingTop: "28px",
            fontSize: "18px",
            color: "#71717a",
          }}
        >
          <span>Powered by qwen-3.8-27b on BharatCode API</span>
          <span style={{ color: "#818cf8" }}>scopebot-three.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
