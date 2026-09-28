import React, { useState, useEffect } from 'react';

function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/fraud-alerts/');
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slide-up">
      <h1>Fraud Alerts</h1>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        {loading ? (
          <div className="spinner"></div>
        ) : alerts.length > 0 ? (
          <div>
            {alerts.map((alert) => (
              <div key={alert.id} className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                <div>
                  <strong>Alert #{alert.id}</strong>
                  <p>{alert.reason}</p>
                  <small>Transaction ID: {alert.transaction_id}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No active alerts</p>
        )}
      </div>
    </div>
  );
}

export default FraudAlerts;
