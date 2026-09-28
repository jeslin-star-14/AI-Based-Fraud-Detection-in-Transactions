import React from 'react';

function Reports() {
  return (
    <div className="slide-up">
      <h1>Reports</h1>
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Fraud Detection Reports</h2>
        <p>Generate and analyze comprehensive fraud detection reports.</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <div className="card">
            <h4>Monthly Report</h4>
            <p>Download monthly fraud statistics</p>
            <button className="btn btn-primary">Generate</button>
          </div>
          <div className="card">
            <h4>Risk Analysis</h4>
            <p>Risk distribution across regions</p>
            <button className="btn btn-primary">Generate</button>
          </div>
          <div className="card">
            <h4>Model Performance</h4>
            <p>AI model accuracy and metrics</p>
            <button className="btn btn-primary">Generate</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
