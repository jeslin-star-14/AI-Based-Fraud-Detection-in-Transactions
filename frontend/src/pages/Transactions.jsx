import React, { useEffect, useState } from "react";
import Topbar from "../components/common/Topbar";
import TransactionTable from "../components/transactions/TransactionTable";
import { getTransactions } from "../services/transactionService";

const filters = ["all", "flagged", "review", "cleared"];

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState("all");

  useEffect(() => {
    getTransactions().then(setRows);
  }, []);

  const filtered = active === "all" ? rows : rows.filter((r) => r.status === active);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <Topbar title="Transactions" subtitle="All processed transactions across channels" />
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              style={{
                background: active === f ? "var(--surface-2)" : "transparent",
                border: "1px solid var(--border)",
                color: active === f ? "var(--text)" : "var(--text-dim)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12.5,
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <TransactionTable rows={filtered} onSelect={(t) => console.log("Selected", t)} />
      </div>
    </div>
  );
}
