import React from "react";

const toneColor = {
  risk: "var(--accent-risk)",
  warn: "var(--accent-warn)",
  safe: "var(--accent-safe)",
};

export default function StatCard({ label, value, trend, trendUp, tone }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "18px 20px",
        flex: 1,
      }}
    >
      <div style={{ color: "var(--text-dim)", fontSize: 12.5 }}>{label}</div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 600, marginTop: 8, color: toneColor[tone] || "var(--text)" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, marginTop: 6, color: trendUp ? "var(--accent-safe)" : "var(--accent-risk)" }}>
        {trend} vs yesterday
      </div>
    </div>
  );
}
