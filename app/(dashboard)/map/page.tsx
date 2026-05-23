"use client";

import dynamic from "next/dynamic";

// MapLibre requires browser APIs — load only on client
const WorldMap = dynamic(() => import("@/components/map/WorldMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--obsidian)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "2px solid var(--surface3)",
          borderTopColor: "var(--mint)",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }} />
        <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--text-dim)", fontFamily: "'Orbitron', sans-serif" }}>
          LOADING MAP
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--obsidian)" }}>
      {/* Page header */}
      <div style={{
        padding: "14px 24px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, background: "var(--surface)",
      }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 2 }} className="font-orbitron">
            INTELLIGENCE
          </div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Global Supply Map
          </h1>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-dim)", textAlign: "right", lineHeight: 1.6 }}>
          Click any region to explore<br />
          <span style={{ color: "var(--mint)" }}>suppliers · scores · products</span>
        </div>
      </div>

      {/* Full-height map */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <WorldMap />
      </div>
    </div>
  );
}
