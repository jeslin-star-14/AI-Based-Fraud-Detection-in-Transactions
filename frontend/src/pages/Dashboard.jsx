import React, { useState } from 'react';
import '../styles/dashboard.css';

function Dashboard() {
  const [transactions, setTransactions] = useState([
    { id: '#JG3227H', name: 'Jeff Henry', amount: '$234.22', score: '987', status: 'verified', date: 'Updated on 11-30-2020' },
    { id: '#MJ4521K', name: 'Marc Shaw', amount: '$234.22', score: '931', status: 'verified', date: 'Updated on 11-30-2020' },
    { id: '#EV9334L', name: 'Evelyn Lopez', amount: '$541', score: '933', status: 'verified', date: 'Updated on 11-30-2020' },
    { id: '#HC5327M', name: 'Hettie Cobb', amount: '$41', score: '453', status: 'pending', date: 'Updated on 11-30-2020' },
  ]);

  const [selectedTx, setSelectedTx] = useState(transactions[0]);

  return (
    <div className="dashboard-container">
      {/* Left Panel - Search & Results */}
      <div className="dashboard-left">
        <div className="search-section">
          <div className="search-header">
            <input type="text" placeholder="322" className="search-input" />
            <button className="search-btn">⌕</button>
            <button className="filter-btn">≡</button>
          </div>
          <div className="search-results-info">
            34 SEARCH RESULTS FOUND
          </div>
        </div>

        <div className="results-list">
          {transactions.map((tx, idx) => (
            <div 
              key={idx} 
              className={`result-item ${selectedTx.id === tx.id ? 'active' : ''}`}
              onClick={() => setSelectedTx(tx)}
            >
              <div className="result-header">
                <h4 className="result-name">{tx.name}</h4>
                <span className={`score-badge score-${tx.score.charAt(0)}`}>{tx.score}</span>
              </div>
              <div className="result-details">
                <span className="result-location">Howeville - 23 Jun</span>
                <span className="result-amount">{tx.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Details */}
      <div className="dashboard-right">
        <div className="details-header">
          <div className="details-title-row">
            <h2 className="details-title">{selectedTx.name}</h2>
            <span className="details-amount">{selectedTx.amount}</span>
            <span className={`score-badge score-${selectedTx.score.charAt(0)}`}>{selectedTx.score}</span>
          </div>
          <div className="details-meta">
            <span>{selectedTx.id}</span>
            <span>{selectedTx.date}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="details-tabs">
          <button className="tab active">OVERVIEW</button>
          <button className="tab">SUMMARY</button>
          <button className="tab">DETAILS</button>
          <button className="tab">HISTORY</button>
        </div>

        {/* Content Grid */}
        <div className="details-content">
          <div className="content-row">
            <div className="content-box">
              <div className="content-title">ADDRESS</div>
              <div className="address-item">
                <span className="label">Shipping and Billing</span>
                <span className="value">Address collected</span>
              </div>
            </div>

            <div className="content-box">
              <div className="content-title">DEVICE</div>
              <div className="device-item">
                <span className="label">Uses Multiple Devices</span>
                <span className="value">Distance is 3 Miles</span>
              </div>
            </div>

            <div className="content-box">
              <div className="content-title">EMAIL</div>
              <div className="email-item">
                <span className="label">Email Collected</span>
                <span className="value">SignUpH has heard of none 23 records from this account</span>
              </div>
            </div>
          </div>

          <div className="review-box approved">
            <div className="review-header">
              <span className="review-icon">✓</span>
              <span className="review-title">Model Approved</span>
            </div>
            <div className="review-description">
              Case is required on this basis of Model
            </div>
          </div>

          <div className="account-summary">
            <h3>Account Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Account</span>
                <span className="summary-value">Number</span>
                <span className="summary-data">510943</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Shipping</span>
                <span className="summary-value">Order Quash</span>
                <span className="summary-data">$353.2</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Order Amount</span>
                <span className="summary-value">Creation</span>
                <span className="summary-data">05-27-2020</span>
              </div>
            </div>
          </div>

          <div className="order-details">
            <h3>Order Details</h3>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nike Jordan ASR 990 - 676278</td>
                  <td>$233.2</td>
                  <td>02</td>
                </tr>
                <tr>
                  <td>AirPod - Black Matte - 665778</td>
                  <td>$143.3</td>
                  <td>01</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="case-notes">
            <div className="case-notes-header">
              <h3>Case Notes</h3>
              <input type="text" placeholder="Add a new note" className="note-input" />
              <button className="add-note-btn">ADD NOTE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
