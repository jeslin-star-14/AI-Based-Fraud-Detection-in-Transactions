import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalTransactions: 45230,
    fraudulentTransactions: 342,
    successRate: 99.24,
    riskLevel: 'Low',
    pendingReview: 8
  });

  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, type: 'high', amount: '$2,450', reason: 'Unusual location', time: '2 min ago' },
    { id: 2, type: 'medium', amount: '$1,230', reason: 'Velocity check failed', time: '15 min ago' },
    { id: 3, type: 'high', amount: '$5,890', reason: 'Multiple declines', time: '28 min ago' }
  ]);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time fraud detection & transaction monitoring</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon primary">📊</div>
          <div className="metric-content">
            <div className="metric-label">Total Transactions</div>
            <div className="metric-value">{stats.totalTransactions.toLocaleString()}</div>
            <div className="metric-change positive">↑ 12.5% from last week</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon danger">🚨</div>
          <div className="metric-content">
            <div className="metric-label">Fraudulent Detected</div>
            <div className="metric-value">{stats.fraudulentTransactions}</div>
            <div className="metric-change negative">↑ 2.3% from last week</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon success">✓</div>
          <div className="metric-content">
            <div className="metric-label">Success Rate</div>
            <div className="metric-value">{stats.successRate}%</div>
            <div className="metric-change positive">↓ 0.2% from last week</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">⚠</div>
          <div className="metric-content">
            <div className="metric-label">Pending Review</div>
            <div className="metric-value">{stats.pendingReview}</div>
            <div className="metric-change neutral">Review recommended</div>
          </div>
        </div>
      </div>

      {/* Recent Alerts & Activity */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Alerts</h3>
            <a href="/fraud-alerts" className="link-text">View all →</a>
          </div>
          <div className="alerts-list">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="alert-item">
                <div className={`alert-badge ${alert.type}`}></div>
                <div className="alert-details">
                  <div className="alert-main">
                    <span className="alert-amount">{alert.amount}</span>
                    <span className="alert-reason">{alert.reason}</span>
                  </div>
                  <div className="alert-time">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>System Status</h3>
          </div>
          <div className="status-box">
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div>
                <div className="status-label">AI Engine</div>
                <div className="status-value">Active</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div>
                <div className="status-label">Database</div>
                <div className="status-value">Connected</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div>
                <div className="status-label">API Gateway</div>
                <div className="status-value">Operational</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="actions-grid">
          <button className="action-btn">
            <span className="action-icon">🔍</span>
            <span>Search Transaction</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📋</span>
            <span>Export Report</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">⚙️</span>
            <span>Configure Rules</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📞</span>
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
