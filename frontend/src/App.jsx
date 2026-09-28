import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';

// Import pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import FraudAlerts from './pages/FraudAlerts';
import Reports from './pages/Reports';
import Login from './pages/Login';

// Import components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Layout wrapper for authenticated pages
  const Layout = ({ children }) => (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ 
          flex: 1, 
          padding: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          overflowY: 'auto'
        }}>
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        
        {isAuthenticated ? (
          <>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
            <Route path="/fraud-alerts" element={<Layout><FraudAlerts /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
