import React, { useState, useRef, useEffect } from "react";
import { askAgent } from "../../services/agentService";
import { agentSuggestedQuestions } from "../../data/mockData";

export default function AgentWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "agent", text: "Hi, I'm the Sentinel fraud agent. Ask me why a transaction was flagged, or for a risk summary." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(question) {
    const q = question || input;
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    const answer = await askAgent(q);
    setMessages((m) => [...m, { role: "agent", text: answer }]);
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "var(--accent-primary)",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "12px 20px",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(91,141,239,0.35)",
        }}
      >
        Ask the fraud agent
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 340,
        height: 440,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Fraud Agent</div>
          <div style={{ fontSize: 11, color: "var(--accent-safe)" }}>● Connected to ai_agent</div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 16 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "var(--accent-primary)" : "var(--surface-2)",
              color: m.role === "user" ? "#fff" : "var(--text)",
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12.5,
              maxWidth: "85%",
              lineHeight: 1.5,
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && <div style={{ color: "var(--text-dim)", fontSize: 12 }}>Analyzing transaction data…</div>}
        <div ref={endRef} />
      </div>

      {messages.length < 2 && (
        <div style={{ padding: "0 16px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {agentSuggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              style={{
                textAlign: "left",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 11.5,
                color: "var(--text-dim)",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", borderTop: "1px solid var(--border)", padding: 10, gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about a transaction..."
          style={{
            flex: 1,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 10px",
            color: "var(--text)",
            fontSize: 12.5,
            outline: "none",
          }}
        />
        <button
          onClick={() => send()}
          style={{ background: "var(--accent-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontSize: 12.5, fontWeight: 600 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
