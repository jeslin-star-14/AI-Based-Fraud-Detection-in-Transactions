import React from "react";

export default function Topbar({ title, subtitle }) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 32px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: 13 }}>{subtitle}</p>
        )}
      </div>
      <input
        placeholder="Search transaction ID or account..."
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "8px 14px",
          color: "var(--text)",
          fontSize: 13,
          width: 280,
          outline: "none",
        }}
      />
    </header>
  );
}
