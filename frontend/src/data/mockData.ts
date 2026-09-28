import { Transaction, TransactionDetail } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: '#3G327H',
    customerName: 'Jeff Henry',
    customerId: 'CUST-1001',
    location: 'Howesville',
    date: '23 Jun',
    amount: 234.22,
    riskScore: 987,
    status: 'approved',
    updatedAt: '11-10-2020',
  },
  {
    id: '#4M231J',
    customerName: 'Marc Shaw',
    customerId: 'CUST-1002',
    location: 'Howesville',
    date: '23 Jun',
    amount: 234.22,
    riskScore: 931,
    status: 'approved',
    updatedAt: '11-10-2020',
  },
  {
    id: '#2L894K',
    customerName: 'Evelyn Lopez',
    customerId: 'CUST-1003',
    location: 'East Nash',
    date: '23 Jun',
    amount: 541,
    riskScore: 933,
    status: 'approved',
    updatedAt: '11-10-2020',
  },
  {
    id: '#8N453P',
    customerName: 'Hattie Cobb',
    customerId: 'CUST-1004',
    location: 'Gutkowskiton',
    date: '23 Jun',
    amount: 41,
    riskScore: 453,
    status: 'flagged',
    updatedAt: '11-10-2020',
  },
  {
    id: '#7K219M',
    customerName: 'Bobby Page',
    customerId: 'CUST-1005',
    location: 'South Lillydury',
    date: '23 Jun',
    amount: 591,
    riskScore: 641,
    status: 'pending',
    updatedAt: '11-10-2020',
  },
  {
    id: '#1P876L',
    customerName: 'Daniel Harper',
    customerId: 'CUST-1006',
    location: 'East Nash',
    date: '23 Jun',
    amount: 543,
    riskScore: 933,
    status: 'approved',
    updatedAt: '11-10-2020',
  },
];

export const mockTransactionDetail: TransactionDetail = {
  id: '#3G327H',
  customerName: 'Jeff Henry',
  customerId: 'CUST-1001',
  location: 'Howesville',
  date: '23 Jun',
  amount: 234.22,
  riskScore: 987,
  status: 'approved',
  updatedAt: '11-10-2020',
  address: {
    shipping: '2471 Henry, OH Island Extensions Suite 766',
    billing: '2471 Henry, OH Island Extensions Suite 766',
    confirmed: true,
  },
  device: {
    count: 3,
    types: ['MacBook Pro', 'iPhone 12', 'iPad Air'],
  },
  email: {
    orderCount: 23,
    merchantCount: 4,
  },
  account: {
    number: '130942',
    orderCount: 23,
    orderAmount: 233.2,
    creationDate: '05-27-2020',
  },
  shipping: {
    address: '2471 Henry, OH Island Extensions Suite 766',
    city: 'Howesville',
    state: 'OH',
    zip: '102209',
    country: 'USA',
    coordinates: {
      lat: 40.7128,
      lng: -74.0060,
    },
  },
  orders: [
    {
      product: 'Nike Jordan A50',
      sku: '676278',
      price: 233.2,
      quantity: 2,
    },
    {
      product: 'AirPod - Black Matte',
      sku: '643278',
      price: 143.3,
      quantity: 1,
    },
  ],
  team: 'Howesville',
  customer: "Jerry's Livins",
  notes: [
    {
      id: 'NOTE-001',
      title: 'Case Submitted for Quarantine',
      author: "Harry's Living • Production",
      date: '24-10-19',
      content: 'Transaction flagged for manual review due to unusual pattern.',
    },
    {
      id: 'NOTE-002',
      title: 'Case Approval for Quarantine',
      author: 'Signifyd',
      date: '3h-10-19',
      content: 'After review, transaction approved based on customer history.',
    },
  ],
};

export const getRiskScoreColor = (score: number): string => {
  if (score >= 900) return 'green';
  if (score >= 700) return 'yellow';
  if (score >= 500) return 'orange';
  return 'red';
};

export const getRiskScoreLabel = (score: number): string => {
  if (score >= 900) return 'Low Risk';
  if (score >= 700) return 'Medium Risk';
  if (score >= 500) return 'High Risk';
  return 'Critical Risk';
};
