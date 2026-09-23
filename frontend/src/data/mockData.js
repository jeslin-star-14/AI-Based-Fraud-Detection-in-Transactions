// Placeholder data so the UI is fully functional before the Python
// backend (FastAPI) and AI engine are connected. Swap out once
// services/transactionService.js points at real endpoints.

export const stats = [
  { label: "Transactions Today", value: "48,213", trend: "+4.2%", trendUp: true },
  { label: "Flagged as Fraud", value: "312", trend: "+18%", trendUp: true, tone: "risk" },
  { label: "Under Review", value: "97", trend: "-6%", trendUp: false, tone: "warn" },
  { label: "Model Precision", value: "94.6%", trend: "+0.8%", trendUp: true, tone: "safe" },
];

export const riskTrend = [
  { day: "Mon", flagged: 42, cleared: 812 },
  { day: "Tue", flagged: 38, cleared: 790 },
  { day: "Wed", flagged: 55, cleared: 845 },
  { day: "Thu", flagged: 61, cleared: 900 },
  { day: "Fri", flagged: 74, cleared: 960 },
  { day: "Sat", flagged: 49, cleared: 705 },
  { day: "Sun", flagged: 44, cleared: 690 },
];

export const transactions = [
  { id: "TXN-88213", account: "AC-4471", amount: 12500.0, location: "Chennai, IN", method: "Card", risk: 91, status: "flagged", time: "09:41:12" },
  { id: "TXN-88214", account: "AC-2290", amount: 320.5, location: "Austin, US", method: "UPI", risk: 12, status: "cleared", time: "09:42:03" },
  { id: "TXN-88215", account: "AC-7742", amount: 8900.0, location: "Lagos, NG", method: "Wire", risk: 78, status: "review", time: "09:44:51" },
  { id: "TXN-88216", account: "AC-1038", amount: 54.99, location: "Berlin, DE", method: "Card", risk: 4, status: "cleared", time: "09:45:22" },
  { id: "TXN-88217", account: "AC-9921", amount: 15200.0, location: "Manila, PH", method: "Wire", risk: 96, status: "flagged", time: "09:46:07" },
  { id: "TXN-88218", account: "AC-5543", amount: 210.0, location: "Toronto, CA", method: "UPI", risk: 8, status: "cleared", time: "09:47:40" },
  { id: "TXN-88219", account: "AC-6610", amount: 4100.0, location: "Mumbai, IN", method: "Card", risk: 63, status: "review", time: "09:48:15" },
];

export const agentSuggestedQuestions = [
  "Why was TXN-88213 flagged?",
  "Summarize today's fraud pattern",
  "Which accounts have repeat risk flags?",
];
