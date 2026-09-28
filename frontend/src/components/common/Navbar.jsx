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
    <nav className={`navbar ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar} title="Toggle sidebar">
          ☰
        </button>
        <h2 className="navbar-title">Fraud Detection System</h2>
      </div>
      
      <div className="navbar-right">
        <div className="navbar-search">
          <input type="text" placeholder="Search transactions..." />
        </div>

        <div className="navbar-icons">
          <button className="navbar-icon-btn" title="Notifications">🔔</button>
          <button className="navbar-icon-btn" title="Settings">⚙️</button>
          <button className="navbar-icon-btn" title="Help">?</button>
        </div>

        <div className="navbar-user">
          <div className="navbar-user-avatar">AD</div>
          <div className="navbar-user-info">
            <div className="navbar-user-name">Admin</div>
            <div className="navbar-user-role">Administrator</div>
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
