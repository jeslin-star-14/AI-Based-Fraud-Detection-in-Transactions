# Frontend Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- React 18.2
- TypeScript 5.2
- Vite 5.1 (fast dev server)
- Tailwind CSS 3.4 (styling)
- React Router 6.22 (routing)
- Axios 1.6 (API calls)
- Lucide React (icons)

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed:
```env
VITE_API_URL=http://localhost:8000  # Backend API URL
VITE_ENV=development
VITE_ENABLE_MOCK_DATA=false
```

### Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser! 🎉

## 🎨 What You'll See

### Beautiful Fraud Detection UI with:
- **Navbar**: FraudGuard branding with Shield icon
- **Search Sidebar**: Transaction search with color-coded risk scores
- **Transaction Detail**: Complete overview with customer, device, and account info
- **Review Panel**: Model approval status and case notes

### Color-Coded Risk Scores:
- 🟢 **Green (900+)**: Low risk - Approved
- 🟡 **Yellow (700-899)**: Medium risk - Attention needed
- 🟠 **Orange (500-699)**: High risk - Review required
- 🔴 **Red (<500)**: Critical risk - Flagged/Blocked

## 🔗 Connect to Backend (Phase 2)

To see real transactions instead of mock data:

1. Start the backend server:
```bash
cd ../backend
python -m uvicorn app.main_new:app --reload --port 8000
```

2. Verify backend is running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","model_loaded":true}
```

3. Frontend will automatically proxy API calls to backend via `/api`

## 📦 Build for Production

```bash
npm run build
```

Production files will be in `dist/` folder.

## 🛠️ Common Issues

### Issue: Port 3000 already in use
**Solution**: Change port in `vite.config.ts`:
```typescript
server: {
  port: 3001,  // Use different port
}
```

### Issue: Cannot connect to API
**Solution**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `VITE_API_URL` in `.env`
3. Check CORS settings in backend `.env`: `CORS_ORIGINS=http://localhost:3000`

### Issue: Module not found errors
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. ✅ **Frontend UI** (You are here!)
2. 🔄 **Connect to Phase 2 Backend** - Real transaction scoring
3. 🤖 **Phase 3: LLM Agent** - Conversational fraud investigation
4. 🚀 **Phase 4: Full Integration** - WebSockets, real-time updates, SHAP charts

## 🎯 Test the UI

Try these actions:
- Click different transactions in the sidebar
- Search for "322" in search bar
- Expand/collapse "Order Review Checklist"
- Add a new case note
- View the Account Summary and shipping details

## 📝 Files Overview

```
frontend/
├── src/
│   ├── components/         # UI components
│   │   ├── Navbar.tsx
│   │   ├── SearchSidebar.tsx
│   │   └── TransactionDetail.tsx
│   ├── pages/
│   │   └── TransactionDetailPage.tsx
│   ├── services/
│   │   └── api.ts          # Backend API client
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   ├── data/
│   │   └── mockData.ts     # Sample data
│   └── App.tsx
└── package.json
```

## 💡 Pro Tips

- Use **React DevTools** to inspect component state
- Check **Network tab** to see API calls
- Use **Tailwind CSS IntelliSense** extension in VS Code
- Press `Ctrl+Shift+I` to open browser DevTools

---

**Need help?** Check `README.md` for detailed documentation or see `../backend/PHASE2_README.md` for backend setup.
