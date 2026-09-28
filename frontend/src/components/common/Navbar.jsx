import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../src/styles/navbar.css';

function Navbar({ onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar} title="Toggle sidebar">
          ☰
        </button>
        <div className="navbar-brand">
          <div className="navbar-brand-icon">=</div>
          <div className="navbar-brand-text">
            <p className="navbar-brand-name">Fraud Detection</p>
            <p className="navbar-brand-sub">System</p>
          </div>
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="navbar-search">
          <input type="text" placeholder="Search transactions..." />
        </div>

        <div className="navbar-actions">
          <button className="navbar-icon-btn notification" title="Notifications">🔔</button>
          <button className="navbar-icon-btn" title="Settings">⚙</button>
          <button className="navbar-icon-btn" title="Help">?</button>
        </div>

        <div className="navbar-divider"></div>

        <div className="navbar-user">
          <div className="navbar-user-avatar">AD</div>
          <div className="navbar-user-info">
            <p className="navbar-user-name">Admin</p>
            <p className="navbar-user-role">Administrator</p>
          </div>
        </div>

        <button className="navbar-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
