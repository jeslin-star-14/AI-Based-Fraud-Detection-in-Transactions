import React, { useState } from 'react';
import '../styles/reports.css';

function Reports() {
  const [reports, setReports] = useState([
    {
      id: 1,
      title: 'Monthly Fraud Report',
      desc: 'Comprehensive fraud statistics and trends for the current month',
      generated: '2024-09-26',
      transactions: 45230,
      fraudDetected: 342,
      riskLevel: 'LOW',
      colors: ['#5b7cfa', '#1dd1a1', '#ffa502']
    },
    {
      id: 2,
      title: 'Risk Analysis Dashboard',
      desc: 'Geographical and temporal risk distribution analysis',
      generated: '2024-09-25',
      transactions: 12450,
      fraudDetected: 89,
      riskLevel: 'MEDIUM',
      colors: ['#5b7cfa', '#1dd1a1', '#ffa502']
    },
    {
      id: 3,
      title: 'AI Model Performance',
      desc: 'Accuracy metrics and model performance evaluation',
      generated: '2024-09-24',
      transactions: 8950,
      fraudDetected: 156,
      riskLevel: 'HIGH',
      colors: ['#5b7cfa', '#1dd1a1', '#ff6348']
    }
  ]);

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Generate, review, and export fraud detection reports</p>
      </div>

      {/* Report Generator */}
      <div className="report-generator">
        <h3>Generate New Report</h3>

        <div className="generator-form">
          <div className="form-group">
            <label>Report Type</label>
            <select defaultValue="monthly">
              <option value="monthly">Monthly Fraud Report</option>
              <option value="risk">Risk Analysis</option>
              <option value="performance">Model Performance</option>
              <option value="custom">Custom Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <div className="date-range">
              <input type="date" defaultValue="2024-01-09" />
              <span>to</span>
              <input type="date" defaultValue="2024-23-09" />
            </div>
          </div>

          <button className="btn-generate">Generate Report</button>
          <button className="btn-schedule">Schedule Report</button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="reports-section">
        <h2>Recent Reports</h2>
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-icon">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <rect x="4" y="4" width="3" height="8" fill={report.colors[0]}/>
                  <rect x="10" y="8" width="3" height="8" fill={report.colors[1]}/>
                  <rect x="16" y="2" width="3" height="14" fill={report.colors[2]}/>
                </svg>
              </div>
              
              <h3>{report.title}</h3>
              <p>{report.desc}</p>

              <div className="report-stats">
                <div className="stat">
                  <span className="stat-label">TRANSACTIONS</span>
                  <span className="stat-value">{report.transactions.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">FRAUD DETECTED</span>
                  <span className="stat-value">{report.fraudDetected}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">RISK LEVEL</span>
                  <span className={`risk-badge risk-${report.riskLevel.toLowerCase()}`}>
                    {report.riskLevel}
                  </span>
                </div>
              </div>

              <div className="report-meta">
                Generated: {report.generated}
              </div>

              <div className="report-actions">
                <button className="export-btn">PDF</button>
                <button className="export-btn">Excel</button>
                <button className="export-btn">CSV</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reports;
