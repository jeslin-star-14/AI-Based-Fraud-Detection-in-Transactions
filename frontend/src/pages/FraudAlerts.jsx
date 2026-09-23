import React, { useEffect, useState } from "react";
import Topbar from "../components/common/Topbar";
import { getTransactions } from "../services/transactionService";

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    getTransactions().then((data) => setAlerts(data.filter((t) => t.status === "flagged")));
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <Topbar title="Fraud Alerts" subtitle="High-confidence anomalies requiring action" />
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map((a) => (
          <div
            key={a.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--accent-risk)",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="mono" style={{ fontWeight: 600 }}>{a.id} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>· {a.account}</span></div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 4 }}>
                ${a.amount.toLocaleString()} · {a.location} · {a.method}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ color: "var(--accent-risk)", fontWeight: 600 }}>Risk {a.risk}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{a.time}</div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && <div style={{ color: "var(--text-dim)" }}>No active fraud alerts right now.</div>}
      </div>
    </div>
  );
}
