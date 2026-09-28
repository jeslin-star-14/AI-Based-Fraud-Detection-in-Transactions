import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../../src/styles/sidebar.css';

function Sidebar({ isOpen }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h1>FDS</h1>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
        >
          📊 Dashboard
        </Link>
        <Link
          to="/transactions"
          className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
        >
          💳 Transactions
        </Link>
        <Link
          to="/fraud-alerts"
          className={`nav-link ${isActive('/fraud-alerts') ? 'active' : ''}`}
        >
          🚨 Fraud Alerts
        </Link>
        <Link
          to="/reports"
          className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
        >
          📈 Reports
        </Link>
      </nav>

      <div className="sidebar-footer">
        <p>v1.0.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;
