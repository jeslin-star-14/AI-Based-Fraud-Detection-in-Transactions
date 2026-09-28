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
        <button className="navbar-toggle" onClick={onToggleSidebar}>
          ☰
        </button>
        <h2 className="navbar-title">Fraud Detection</h2>
      </div>
      
      <div className="navbar-right">
        <button className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
