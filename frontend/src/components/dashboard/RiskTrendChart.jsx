import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RiskTrendChart({ data }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 24px" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Flagged vs. Cleared — Last 7 Days</div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>Anomaly model output across all channels</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="flaggedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b5b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ff6b5b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a3552" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" stroke="#8791ab" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#8791ab" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#1e2740", border: "1px solid #2a3552", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#e8ebf3" }}
          />
          <Area type="monotone" dataKey="flagged" stroke="#ff6b5b" fill="url(#flaggedFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
