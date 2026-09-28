import React, { useState } from 'react';
import '../styles/fraud-alerts.css';

function FraudAlerts() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      transactionId: 2,
      amount: '$2,450.00',
      merchant: 'Unknown Store',
      risk: 'high',
      reason: 'Transaction from unusual location',
      location: 'Moscow, Russia',
      timestamp: '2024-09-23 14:15',
      action: 'blocked'
    },
    {
      id: 2,
      transactionId: 5,
      amount: '$1,230.50',
      merchant: 'Electronics Plus',
      risk: 'medium',
      reason: 'Multiple transaction attempts',
      location: 'London, UK',
      timestamp: '2024-09-23 13:48',
      action: 'flagged'
    },
    {
      id: 3,
      transactionId: 8,
      amount: '$890.00',
      merchant: 'Jewelry Store',
      risk: 'high',
      reason: 'Velocity check failed - 3 transactions in 5 minutes',
      location: 'New York, NY',
      timestamp: '2024-09-23 13:20',
      action: 'pending'
    },
    {
      id: 4,
      transactionId: 12,
      amount: '$3,500.00',
      merchant: 'Wire Transfer Service',
      risk: 'high',
      reason: 'Large amount from new device',
      location: 'Beijing, China',
      timestamp: '2024-09-23 12:45',
      action: 'blocked'
    }
  ]);

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.action === filter);

  const handleResolve = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    setSelectedAlert(null);
  };

  const getRiskIcon = (risk) => {
    const icons = { high: '🚨', medium: '⚠️', low: 'ℹ️' };
    return icons[risk] || '—';
  };

  return (
    <div className="fraud-alerts-page">
      <div className="page-header">
        <h1>Fraud Alerts</h1>
        <p>Active fraud detection alerts requiring review</p>
      </div>

      {/* Stats */}
      <div className="alerts-stats">
        <div className="stat-box">
          <div className="stat-value">{alerts.filter(a => a.risk === 'high').length}</div>
          <div className="stat-label">High Risk</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{alerts.filter(a => a.action === 'pending').length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">${alerts.reduce((sum, a) => sum + parseFloat(a.amount.replace(/[$,]/g, '')), 0).toFixed(2)}</div>
          <div className="stat-label">Total at Risk</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="alert-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          className={`filter-btn ${filter === 'blocked' ? 'active' : ''}`}
          onClick={() => setFilter('blocked')}
        >
          Blocked ({alerts.filter(a => a.action === 'blocked').length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({alerts.filter(a => a.action === 'pending').length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="alerts-container">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card ${alert.risk} ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="alert-header">
                <div className="alert-risk">
                  <span className="risk-icon">{getRiskIcon(alert.risk)}</span>
                  <span className="risk-label">{alert.risk.toUpperCase()} RISK</span>
                </div>
                <div className="alert-time">{alert.timestamp}</div>
              </div>

              <div className="alert-body">
                <div className="alert-merchant">
                  <span className="merchant-name">{alert.merchant}</span>
                  <span className="merchant-id">Tx #{alert.transactionId}</span>
                </div>
                <div className="alert-amount">{alert.amount}</div>
              </div>

              <div className="alert-details">
                <p className="alert-reason">{alert.reason}</p>
                <p className="alert-location">📍 {alert.location}</p>
              </div>

              <div className="alert-footer">
                <span className={`action-badge action-${alert.action}`}>{alert.action}</span>
                {alert.action === 'pending' && (
                  <button
                    className="alert-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolve(alert.id);
                    }}
                  >
                    Review & Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-alerts">
            <div className="empty-icon">✓</div>
            <h3>No alerts</h3>
            <p>Great! All fraud alerts have been resolved.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FraudAlerts;
