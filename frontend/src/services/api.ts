import axios from 'axios';
import { Transaction, TransactionDetail, DashboardMetrics, Alert } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Transaction APIs
export const transactionApi = {
  // Get all transactions with optional filters
  getAll: async (params?: {
    search?: string;
    status?: string;
    minRiskScore?: number;
    maxRiskScore?: number;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> => {
    const response = await api.get('/api/transactions', { params });
    return response.data;
  },

  // Get single transaction by ID
  getById: async (id: string): Promise<TransactionDetail> => {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  },

  // Ingest new transaction for scoring
  ingest: async (transactionData: {
    transaction_id: string;
    user_id: string;
    account_id_origin: string;
    account_id_dest: string;
    amount: number;
    transaction_type: string;
  }): Promise<TransactionDetail> => {
    const response = await api.post('/api/transactions/ingest', transactionData);
    return response.data;
  },

  // Search transactions
  search: async (query: string): Promise<Transaction[]> => {
    const response = await api.get('/api/transactions/search', {
      params: { q: query },
    });
    return response.data;
  },
};

// Alert APIs
export const alertApi = {
  // Get all alerts
  getAll: async (params?: {
    status?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }): Promise<{ alerts: Alert[]; total: number }> => {
    const response = await api.get('/api/alerts', { params });
    return response.data;
  },

  // Get alert by ID
  getById: async (id: string): Promise<Alert> => {
    const response = await api.get(`/api/alerts/${id}`);
    return response.data;
  },

  // Review alert
  review: async (
    id: string,
    data: {
      is_fraud: boolean;
      notes: string;
      analyst_id: string;
    }
  ): Promise<Alert> => {
    const response = await api.post(`/api/alerts/${id}/review`, data);
    return response.data;
  },

  // Assign alert to analyst
  assign: async (
    id: string,
    data: { analyst_id: string }
  ): Promise<Alert> => {
    const response = await api.post(`/api/alerts/${id}/assign`, data);
    return response.data;
  },
};

// Dashboard APIs
export const dashboardApi = {
  // Get dashboard metrics
  getMetrics: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<DashboardMetrics> => {
    const response = await api.get('/api/dashboard/metrics', { params });
    return response.data;
  },

  // Get alerts timeline
  getAlertsTimeline: async (params?: {
    days?: number;
  }): Promise<any[]> => {
    const response = await api.get('/api/dashboard/alerts/timeline', { params });
    return response.data;
  },

  // Get transactions by type
  getTransactionsByType: async (): Promise<any[]> => {
    const response = await api.get('/api/dashboard/transactions/by-type');
    return response.data;
  },

  // Get risk distribution
  getRiskDistribution: async (): Promise<any[]> => {
    const response = await api.get('/api/dashboard/risk-distribution');
    return response.data;
  },
};

// Auth APIs
export const authApi = {
  login: async (credentials: {
    username: string;
    password: string;
  }): Promise<{ access_token: string; token_type: string }> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; model_loaded: boolean }> => {
    const response = await api.get('/health');
    return response.data;
  },

  readiness: async (): Promise<{ ready: boolean; details: any }> => {
    const response = await api.get('/readiness');
    return response.data;
  },
};

export default api;
