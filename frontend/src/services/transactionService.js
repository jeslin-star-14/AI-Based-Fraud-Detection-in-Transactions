import api from "./api";
import { transactions as mockTransactions, stats as mockStats, riskTrend as mockRiskTrend } from "../data/mockData";

// Each function tries the real backend first, and falls back to local
// mock data during development if the API isn't running yet.

export async function getDashboardStats() {
  try {
    const { data } = await api.get("/dashboard/stats");
    return data;
  } catch {
    return mockStats;
  }
}

export async function getRiskTrend() {
  try {
    const { data } = await api.get("/dashboard/risk-trend");
    return data;
  } catch {
    return mockRiskTrend;
  }
}

export async function getTransactions(params = {}) {
  try {
    const { data } = await api.get("/transactions", { params });
    return data;
  } catch {
    return mockTransactions;
  }
}

export async function getTransactionById(id) {
  try {
    const { data } = await api.get(`/transactions/${id}`);
    return data;
  } catch {
    return mockTransactions.find((t) => t.id === id) || null;
  }
}

export async function updateTransactionStatus(id, status) {
  try {
    const { data } = await api.patch(`/transactions/${id}`, { status });
    return data;
  } catch {
    return { id, status, updated: true };
  }
}
