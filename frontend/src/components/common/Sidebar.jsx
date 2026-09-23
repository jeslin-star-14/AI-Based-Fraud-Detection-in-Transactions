import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/transactions", label: "Transactions" },
  { to: "/alerts", label: "Fraud Alerts" },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ padding: "0 8px 28px" }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Sentinel</div>
        <div style={{ color: "var(--text-dim)", fontSize: 12 }}>Fraud Intelligence</div>
      </div>

      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.exact}
          style={({ isActive }) => ({
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: isActive ? "var(--text)" : "var(--text-dim)",
            background: isActive ? "var(--surface-2)" : "transparent",
          })}
        >
          {link.label}
        </NavLink>
      ))}

      <div style={{ marginTop: "auto", padding: "0 8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--accent-safe)",
            fontSize: 12,
          }}
        >
          <span className="dot" />
          Model online
        </div>
      </div>
    </aside>
  );
}
