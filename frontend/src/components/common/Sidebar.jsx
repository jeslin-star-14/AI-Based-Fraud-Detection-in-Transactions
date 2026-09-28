import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../../src/styles/sidebar.css';

function Sidebar({ isOpen }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const mainNav = [
    { path: '/dashboard', label: 'Dashboard', icon: '■' },
    { path: '/transactions', label: 'Transactions', icon: '□' },
    { path: '/fraud-alerts', label: 'Fraud Alerts', icon: '▲' },
    { path: '/reports', label: 'Reports', icon: '▢' }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">F</div>
        <h1>Fraud Shield</h1>
      </div>

      <nav className="sidebar-nav">
        {mainNav.map((nav) => (
          <Link
            key={nav.path}
            to={nav.path}
            className={`nav-link ${isActive(nav.path) ? 'active' : ''}`}
            title={nav.label}
          >
            <span className="nav-icon">{nav.icon}</span>
            <span>{nav.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        Fraud Detection v1.0
      </div>
    </aside>
  );
}

export default Sidebar;
