export interface Transaction {
  id: string;
  customerName: string;
  customerId: string;
  location: string;
  date: string;
  amount: number;
  riskScore: number;
  status: 'approved' | 'pending' | 'flagged' | 'blocked';
  updatedAt: string;
}

export interface TransactionDetail extends Transaction {
  address: {
    shipping: string;
    billing: string;
    confirmed: boolean;
  };
  device: {
    count: number;
    types: string[];
  };
  email: {
    orderCount: number;
    merchantCount: number;
  };
  account: {
    number: string;
    orderCount: number;
    orderAmount: number;
    creationDate: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  orders: Array<{
    product: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
  team: string;
  customer: string;
  notes: Array<{
    id: string;
    title: string;
    author: string;
    date: string;
    content?: string;
  }>;
}

export interface DashboardMetrics {
  totalTransactions: number;
  flaggedTransactions: number;
  blockedTransactions: number;
  averageRiskScore: number;
  fraudRate: number;
}

export interface Alert {
  id: string;
  transactionId: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}
