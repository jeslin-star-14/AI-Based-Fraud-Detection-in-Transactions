import React from "react";

const statusPill = {
  flagged: { cls: "pill-risk", label: "Flagged" },
  review: { cls: "pill-warn", label: "Review" },
  cleared: { cls: "pill-safe", label: "Cleared" },
};

export default function TransactionTable({ rows, onSelect }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--text-dim)", borderBottom: "1px solid var(--border)" }}>
            {["Transaction", "Account", "Amount", "Location", "Method", "Risk", "Status", "Time"].map((h) => (
              <th key={h} style={{ padding: "12px 20px", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr
              key={t.id}
              onClick={() => onSelect?.(t)}
              style={{ borderBottom: "1px solid var(--border)", cursor: onSelect ? "pointer" : "default" }}
            >
              <td className="mono" style={{ padding: "12px 20px" }}>{t.id}</td>
              <td className="mono" style={{ padding: "12px 20px", color: "var(--text-dim)" }}>{t.account}</td>
              <td className="mono" style={{ padding: "12px 20px" }}>${t.amount.toLocaleString()}</td>
              <td style={{ padding: "12px 20px" }}>{t.location}</td>
              <td style={{ padding: "12px 20px" }}>{t.method}</td>
              <td style={{ padding: "12px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 48, height: 5, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${t.risk}%`,
                        height: "100%",
                        background: t.risk > 70 ? "var(--accent-risk)" : t.risk > 40 ? "var(--accent-warn)" : "var(--accent-safe)",
                      }}
                    />
                  </div>
                  <span className="mono" style={{ color: "var(--text-dim)" }}>{t.risk}</span>
                </div>
              </td>
              <td style={{ padding: "12px 20px" }}>
                <span className={`pill ${statusPill[t.status].cls}`}>{statusPill[t.status].label}</span>
              </td>
              <td className="mono" style={{ padding: "12px 20px", color: "var(--text-dim)" }}>{t.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
