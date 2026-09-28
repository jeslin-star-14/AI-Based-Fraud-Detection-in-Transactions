import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalTransactions: 10000,
    fraudulentTransactions: 245,
    successRate: 97.55,
    riskLevel: 'Low'
  });

  useEffect(() => {
    // Fetch dashboard data
    console.log('Dashboard loaded');
  }, []);

  return (
    <div className="slide-up">
      <h1>Dashboard</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        <div className="card">
          <h3>Total Transactions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {stats.totalTransactions.toLocaleString()}
          </p>
        </div>
        
        <div className="card">
          <h3>Fraudulent Detected</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
            {stats.fraudulentTransactions}
          </p>
        </div>
        
        <div className="card">
          <h3>Success Rate</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {stats.successRate}%
          </p>
        </div>
        
        <div className="card">
          <h3>Risk Level</h3>
          <div className="badge badge-success">{stats.riskLevel}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Recent Activity</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor real-time transactions and fraud alerts</p>
      </div>
    </div>
  );
}

export default Dashboard;
