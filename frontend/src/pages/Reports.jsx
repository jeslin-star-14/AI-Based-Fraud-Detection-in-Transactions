import React, { useState } from 'react';
import '../styles/reports.css';

function Reports() {
  const [reports, setReports] = useState([
    {
      id: 1,
      title: 'Monthly Fraud Report',
      description: 'Comprehensive fraud statistics and trends for the current month',
      generated: '2024-09-20',
      transactions: 45230,
      fraudDetected: 342,
      riskLevel: 'Low'
    },
    {
      id: 2,
      title: 'Risk Analysis Dashboard',
      description: 'Geographical and temporal risk distribution analysis',
      generated: '2024-09-19',
      transactions: 12450,
      fraudDetected: 89,
      riskLevel: 'Medium'
    },
    {
      id: 3,
      title: 'AI Model Performance',
      description: 'Accuracy metrics and model performance evaluation',
      generated: '2024-09-18',
      transactions: 8950,
      fraudDetected: 156,
      riskLevel: 'High'
    }
  ]);

  const [reportType, setReportType] = useState('monthly');

  const handleGenerateReport = () => {
    alert('Report generation started. This may take a few moments...');
  };

  const handleExport = (format) => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Generate, review, and export fraud detection reports</p>
      </div>

      {/* Report Generator */}
      <div className="report-generator">
        <div className="generator-header">
          <h3>Generate New Report</h3>
        </div>

        <div className="generator-form">
          <div className="form-group">
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="monthly">Monthly Fraud Report</option>
              <option value="risk">Risk Analysis</option>
              <option value="performance">Model Performance</option>
              <option value="custom">Custom Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <div className="date-range">
              <input type="date" defaultValue="2024-09-01" />
              <span>to</span>
              <input type="date" defaultValue="2024-09-23" />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleGenerateReport}>
              Generate Report
            </button>
            <button className="btn-secondary">
              Schedule Report
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="reports-section">
        <h3>Recent Reports</h3>
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-icon">📊</div>
              <h4>{report.title}</h4>
              <p className="report-description">{report.description}</p>

              <div className="report-stats">
                <div className="stat">
                  <span className="label">Transactions</span>
                  <span className="value">{report.transactions.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="label">Fraud Detected</span>
                  <span className="value">{report.fraudDetected}</span>
                </div>
                <div className="stat">
                  <span className="label">Risk Level</span>
                  <span className={`risk-label risk-${report.riskLevel.toLowerCase()}`}>
                    {report.riskLevel}
                  </span>
                </div>
              </div>

              <div className="report-meta">
                <small>Generated: {report.generated}</small>
              </div>

              <div className="report-actions">
                <button className="export-btn" onClick={() => handleExport('pdf')}>
                  📄 PDF
                </button>
                <button className="export-btn" onClick={() => handleExport('excel')}>
                  📊 Excel
                </button>
                <button className="export-btn" onClick={() => handleExport('csv')}>
                  📋 CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Export */}
      <div className="quick-export">
        <h3>Quick Export</h3>
        <div className="export-options">
          <button className="export-option">
            <span className="icon">📈</span>
            <span className="label">Executive Summary</span>
          </button>
          <button className="export-option">
            <span className="icon">📊</span>
            <span className="label">Detailed Analytics</span>
          </button>
          <button className="export-option">
            <span className="icon">🗂️</span>
            <span className="label">Raw Data</span>
          </button>
          <button className="export-option">
            <span className="icon">📧</span>
            <span className="label">Email Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
