"""
SQLAlchemy ORM models for fraud detection system.

Tables:
- users: analysts and admins
- accounts: originating and destination accounts
- transactions: raw transaction data with features
- predictions: model scores, predictions, SHAP explanations
- alerts: flagged transactions requiring review
- analyst_reviews: analyst feedback on alerts
- audit_log: all actions for compliance
"""

from datetime import datetime
import json
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, JSON,
    ForeignKey, Index, Enum as SQLEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class User(Base):
    """Analysts and administrators."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="analyst")  # analyst, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviews = relationship("AnalystReview", back_populates="analyst")
    audit_entries = relationship("AuditLog", back_populates="user")

    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_role', 'role'),
    )


class Account(Base):
    """Bank accounts (originating and destination)."""
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, unique=True, index=True, nullable=False)
    account_name = Column(String, nullable=False)
    country = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions_sent = relationship("Transaction", foreign_keys="Transaction.origin_account_id")
    transactions_received = relationship("Transaction", foreign_keys="Transaction.dest_account_id")

    __table_args__ = (
        Index('idx_accounts_account_id', 'account_id'),
    )


class TransactionType(str, enum.Enum):
    """PaySim transaction types."""
    PAYMENT = "PAYMENT"
    TRANSFER = "TRANSFER"
    CASH_IN = "CASH_IN"
    CASH_OUT = "CASH_OUT"
    DEBIT = "DEBIT"


class Transaction(Base):
    """Individual transactions."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False)  # idempotency key
    origin_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    dest_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    old_balance_origin = Column(Float, nullable=True)
    new_balance_origin = Column(Float, nullable=True)
    old_balance_dest = Column(Float, nullable=True)
    new_balance_dest = Column(Float, nullable=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    prediction = relationship("Prediction", uselist=False, back_populates="transaction")
    alert = relationship("Alert", uselist=False, back_populates="transaction")

    __table_args__ = (
        Index('idx_transactions_origin', 'origin_account_id'),
        Index('idx_transactions_dest', 'dest_account_id'),
        Index('idx_transactions_timestamp', 'timestamp'),
        Index('idx_transactions_created', 'created_at'),
    )


class Prediction(Base):
    """Model predictions and explanations."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False)
    model_version = Column(String, nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    supervised_score = Column(Float, nullable=False)
    unsupervised_score = Column(Float, nullable=False)
    flagged = Column(Boolean, default=False, nullable=False)
    blocked = Column(Boolean, default=False, nullable=False)
    shap_values = Column(JSON, nullable=True)  # dict: feature_name -> shap_value
    cluster_id = Column(Integer, nullable=True)  # KMeans cluster for behavior grouping
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    transaction = relationship("Transaction", back_populates="prediction")
    alert = relationship("Alert", uselist=False, back_populates="prediction")

    __table_args__ = (
        Index('idx_predictions_transaction', 'transaction_id'),
        Index('idx_predictions_model', 'model_version'),
        Index('idx_predictions_risk', 'risk_score'),
        Index('idx_predictions_flagged', 'flagged'),
    )


class AlertStatus(str, enum.Enum):
    """Alert lifecycle."""
    OPEN = "open"
    ASSIGNED = "assigned"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class Alert(Base):
    """Flagged transactions awaiting analyst review."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), unique=True, nullable=False)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.OPEN, nullable=False, index=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String, nullable=False, default="medium")  # low, medium, high
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="alert")
    prediction = relationship("Prediction", back_populates="alert")
    reviews = relationship("AnalystReview", back_populates="alert")

    __table_args__ = (
        Index('idx_alerts_transaction', 'transaction_id'),
        Index('idx_alerts_status', 'status'),
        Index('idx_alerts_assigned', 'assigned_to'),
        Index('idx_alerts_created', 'created_at'),
    )


class AnalystReview(Base):
    """Analyst feedback on alerts."""
    __tablename__ = "analyst_reviews"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    analyst_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_fraud = Column(Boolean, nullable=False)  # True: fraud, False: legitimate
    confidence = Column(Float, nullable=True)  # 0-1 confidence in decision
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    alert = relationship("Alert", back_populates="reviews")
    analyst = relationship("User", back_populates="reviews")

    __table_args__ = (
        Index('idx_reviews_alert', 'alert_id'),
        Index('idx_reviews_analyst', 'analyst_id'),
        Index('idx_reviews_created', 'created_at'),
    )


class AuditLog(Base):
    """Audit trail for compliance."""
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False, index=True)  # ingest, score, flag, review, etc.
    resource_type = Column(String, nullable=False)  # transaction, alert, etc.
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # additional context
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_entries")

    __table_args__ = (
        Index('idx_audit_user', 'user_id'),
        Index('idx_audit_action', 'action'),
        Index('idx_audit_created', 'created_at'),
    )
