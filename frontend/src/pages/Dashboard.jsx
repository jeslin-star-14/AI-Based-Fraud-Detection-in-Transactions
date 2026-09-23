import React, { useEffect, useState } from "react";
import Topbar from "../components/common/Topbar";
import StatCard from "../components/dashboard/StatCard";
import RiskTrendChart from "../components/dashboard/RiskTrendChart";
import TransactionTable from "../components/transactions/TransactionTable";
import { getDashboardStats, getRiskTrend, getTransactions } from "../services/transactionService";

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [trend, setTrend] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getDashboardStats().then(setStats);
    getRiskTrend().then(setTrend);
    getTransactions().then((data) => setRows(data.slice(0, 5)));
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <Topbar title="Dashboard" subtitle="Real-time transaction monitoring and anomaly detection" />
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <RiskTrendChart data={trend} />

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Recent Transactions</div>
          <TransactionTable rows={rows} />
        </div>
      </div>
    </div>
  );
}
