import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../src/styles/navbar.css';

function Navbar({ onToggleSidebar }) {
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
        <h2 className="navbar-title">Fraud Detection System</h2>
      </div>
      
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-user-avatar">AD</div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Admin</span>
        </div>
        <button className="navbar-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
