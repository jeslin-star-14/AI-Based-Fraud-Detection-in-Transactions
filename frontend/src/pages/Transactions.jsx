import React, { useState, useEffect } from 'react';
import '../styles/transactions.css';

function Transactions() {
  const [transactions, setTransactions] = useState([
    { id: 1, amount: 125.50, merchant: 'Amazon', location: 'New York, NY', timestamp: '2024-09-23 14:32', status: 'completed', risk: 'low' },
    { id: 2, amount: 2500.00, merchant: 'Unknown Store', location: 'Moscow, RU', timestamp: '2024-09-23 14:15', status: 'flagged', risk: 'high' },
    { id: 3, amount: 45.99, merchant: 'Starbucks', location: 'Chicago, IL', timestamp: '2024-09-23 13:45', status: 'completed', risk: 'low' },
    { id: 4, amount: 890.00, merchant: 'Electronics Plus', location: 'London, UK', timestamp: '2024-09-23 13:20', status: 'reviewed', risk: 'medium' },
    { id: 5, amount: 156.75, merchant: 'Walmart', location: 'Texas, TX', timestamp: '2024-09-23 12:50', status: 'completed', risk: 'low' },
  ]);

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all' && tx.risk !== filter) return false;
    if (searchTerm && !tx.merchant.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getRiskBadgeClass = (risk) => {
    return `status-badge ${risk}`;
  };

  const getRiskIcon = (risk) => {
    const icons = { low: '✓', medium: '⚠', high: '✕' };
    return icons[risk] || '—';
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Monitor and review all transaction activities</p>
      </div>

      {/* Filters & Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by merchant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Transactions
          </button>
          <button
            className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
            onClick={() => setFilter('high')}
          >
            High Risk
          </button>
          <button
            className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
            onClick={() => setFilter('medium')}
          >
            Medium Risk
          </button>
          <button
            className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
            onClick={() => setFilter('low')}
          >
            Low Risk
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Merchant</th>
                  <th>Location</th>
                  <th>Time</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className={`risk-${tx.risk}`}>
                    <td><span className="tx-id">#{tx.id}</span></td>
                    <td><span className="amount">${tx.amount.toFixed(2)}</span></td>
                    <td>{tx.merchant}</td>
                    <td>{tx.location}</td>
                    <td><span className="time-stamp">{tx.timestamp}</span></td>
                    <td>
                      <div className={getRiskBadgeClass(tx.risk)}>
                        <span className="risk-icon">{getRiskIcon(tx.risk)}</span>
                        <span className="risk-label">{tx.risk.charAt(0).toUpperCase() + tx.risk.slice(1)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-label status-${tx.status}`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button className="action-link">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      <div className="pagination-info">
        <p>Showing {filteredTransactions.length} of {transactions.length} transactions</p>
      </div>
    </div>
  );
}

export default Transactions;
