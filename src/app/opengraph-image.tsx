import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ScopeBot — Technical Scoping & Proposal Generator";
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
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          color: "#ededed",
          border: "1px solid #242424",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              background: "#18181b",
              border: "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "#3b82f6",
              fontWeight: "700",
              fontFamily: "monospace",
            }}
          >
            &gt;_
          </div>
          <span style={{ fontSize: "32px", fontWeight: "700", letterSpacing: "-0.03em" }}>
            ScopeBot
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "500",
              color: "#a1a1aa",
              background: "#18181b",
              padding: "4px 12px",
              borderRadius: "6px",
              border: "1px solid #27272a",
              marginLeft: "8px",
              fontFamily: "monospace",
            }}
          >
            BharatCode Build League
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: "700",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "#ffffff",
            }}
          >
            Convert unstructured client briefs into structured engineering scopes.
          </h1>
          <p style={{ fontSize: "22px", color: "#8a8a8a", margin: 0, lineHeight: 1.4 }}>
            Scope Summary • Risk Register • Task Hour Breakdown • Milestone Schedule • Proposal Draft
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #242424",
            paddingTop: "24px",
            fontSize: "16px",
            color: "#71717a",
            fontFamily: "monospace",
          }}
        >
          <span>Model: qwen-3.8-27b (BharatCode API)</span>
          <span style={{ color: "#3b82f6" }}>scopebot-three.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
