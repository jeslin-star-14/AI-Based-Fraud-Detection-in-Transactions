-- Reference schema for moving from the in-memory demo store to a real
-- database (PostgreSQL/MySQL/SQLite). Not required to run the project
-- as-is — see backend/app/services/transaction_service.py.

CREATE TABLE accounts (
    account_id      VARCHAR(20) PRIMARY KEY,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    home_location   VARCHAR(100)
);

CREATE TABLE transactions (
    txn_id          VARCHAR(20) PRIMARY KEY,
    account_id      VARCHAR(20) REFERENCES accounts(account_id),
    amount          DECIMAL(12, 2) NOT NULL,
    location        VARCHAR(100),
    method          VARCHAR(20),
    hour            SMALLINT,
    distance_from_home DECIMAL(10, 2),
    is_new_location BOOLEAN DEFAULT FALSE,
    velocity        SMALLINT,
    is_foreign      BOOLEAN DEFAULT FALSE,
    risk_score      SMALLINT,
    cluster_id      SMALLINT,
    status          VARCHAR(20) CHECK (status IN ('flagged', 'review', 'cleared')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fraud_alerts (
    alert_id        SERIAL PRIMARY KEY,
    txn_id          VARCHAR(20) REFERENCES transactions(txn_id),
    reason_summary  TEXT,
    resolved        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_status ON transactions(status);
