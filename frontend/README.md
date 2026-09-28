# Fraud Detection System - Frontend

Modern React TypeScript frontend for the AI-based fraud detection system with real-time transaction monitoring, risk scoring, and analyst workflow tools.

## 🎨 Features

- **Transaction Search & Monitoring**: Real-time search with color-coded risk scores
- **Detailed Transaction View**: Comprehensive overview with customer, device, and account information
- **Risk Assessment Dashboard**: Visual risk indicators and model predictions
- **Analyst Workflow**: Case notes, review checklists, and approval actions
- **Responsive Design**: Beautiful gradient UI with Tailwind CSS
- **Type Safety**: Full TypeScript support with strict type checking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000` (see `../backend/PHASE2_README.md`)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Navbar.tsx     # Top navigation with branding
│   │   ├── SearchSidebar.tsx  # Transaction search & list
│   │   └── TransactionDetail.tsx  # Main detail view
│   ├── pages/             # Page components
│   │   └── TransactionDetailPage.tsx
│   ├── services/          # API clients
│   │   └── api.ts         # Axios-based API service
│   ├── types/             # TypeScript types
│   │   └── index.ts       # Shared type definitions
│   ├── data/              # Mock data
│   │   └── mockData.ts    # Development data
│   ├── App.tsx            # Root component with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles + Tailwind
├── public/                # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS config
└── tsconfig.json          # TypeScript config
```

## 🎨 UI Components

### Navbar
- **FraudGuard** branding with shield icon
- Navigation links: Transactions, Dashboard, Alerts, Reports, Team
- Notification bell with live indicator
- User profile dropdown

### SearchSidebar
- Search input with filter options
- Pagination (34 results across 3 pages)
- Transaction cards with:
  - Transaction ID
  - Risk score badge (color-coded: green 900+, yellow 700+, orange 500+, red <500)
  - Customer name
  - Location and date
  - Transaction amount

### TransactionDetail
- **Header**: Customer name, amount, risk score, update timestamp
- **Tabs**: Overview, Summary, Details, History
- **Overview Section**:
  - Address card (shipping/billing confirmation)
  - Device card (device count and types)
  - Email card (order count across merchants)
- **Account Summary**:
  - Account information (number, order count, amount, creation date)
  - Shipping address with mini map visualization
  - Order details table (products, prices, quantities)
  - Team and customer info with approval status
- **Review Panel** (right sidebar):
  - Model Approved card (green gradient)
  - Order Review Checklist (collapsible)
  - Case Notes with add note functionality

## 🔌 API Integration

The frontend connects to the backend API (Phase 2) via `/api` endpoints:

### Transaction APIs
```typescript
// Get all transactions
GET /api/transactions?search=322&page=1&limit=10

// Get transaction detail
GET /api/transactions/{id}

// Ingest new transaction
POST /api/transactions/ingest
```

### Alert APIs
```typescript
// Get alerts
GET /api/alerts?status=open

// Review alert
POST /api/alerts/{id}/review
```

### Dashboard APIs
```typescript
// Get metrics
GET /api/dashboard/metrics

// Get timeline
GET /api/dashboard/alerts/timeline
```

See `src/services/api.ts` for full API client implementation.

## 🎯 Risk Score Color Coding

- **Green (900-1000)**: Low risk, approved transactions
- **Yellow (700-899)**: Medium risk, requires attention
- **Orange (500-699)**: High risk, needs review
- **Red (0-499)**: Critical risk, flagged/blocked

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Environment Variables

Create `.env` file (see `.env.example`):

```env
VITE_API_URL=http://localhost:8000
VITE_ENV=development
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_ANALYTICS=true
```

### Mock Data Mode

For development without backend:
1. Set `VITE_ENABLE_MOCK_DATA=true` in `.env`
2. Mock data is available in `src/data/mockData.ts`

## 🎨 Styling

- **Framework**: Tailwind CSS 3.4+
- **Icons**: Lucide React
- **Colors**: Custom blue/indigo/purple gradient theme
- **Design**: Clean, modern, card-based layout
- **Responsive**: Mobile-first approach

### Custom Tailwind Colors
```javascript
primary: {
  500: '#3b82f6',  // Blue
  600: '#2563eb',
  700: '#1d4ed8',
}
```

## 🔐 Authentication

JWT-based authentication flow:
1. User logs in via `/api/auth/login`
2. Token stored in `localStorage`
3. Axios interceptor adds `Authorization: Bearer <token>` to all requests
4. Token refresh on expiry

## 📊 Future Enhancements (Phase 4)

- [ ] Real-time WebSocket updates for live alerts
- [ ] SHAP value visualization charts
- [ ] Account transaction timeline
- [ ] Bulk alert actions
- [ ] LLM agent chat interface with streaming
- [ ] Model health monitoring page
- [ ] Advanced filters and saved searches
- [ ] Export transactions to CSV/PDF
- [ ] Dark mode toggle

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.ts
server: {
  port: 3001,  // Use different port
}
```

### API Connection Error
- Verify backend is running on `http://localhost:8000`
- Check CORS settings in backend (`CORS_ORIGINS=http://localhost:3000`)
- Verify `VITE_API_URL` in `.env`

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notes

- This is the **frontend UI** for Phase 4 of the fraud detection system
- Currently displays mock data - integrate with Phase 2 backend for real transactions
- All components are typed with TypeScript for type safety
- Follows React best practices with hooks and functional components
- Ready for Phase 3 (LLM agent) and Phase 4 (full integration) features

## 🔗 Related Documentation

- Backend API: `../backend/PHASE2_README.md`
- ML Pipeline: `../ai_engine/PHASE1_README.md`
- Main README: `../README.md`
