from sqlalchemy import Column, String, Boolean, Integer, DateTime, Float, JSON, UUID, Date, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_paid = Column(Boolean, default=False)
    profile_count = Column(Integer, default=0)
    subscription_start_date = Column(DateTime(timezone=True))
    subscription_end_date = Column(DateTime(timezone=True))
    subscription_type = Column(String(50))
    subscription_price = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Chart(Base):
    __tablename__ = "charts"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(PG_UUID(as_uuid=True), nullable=False)
    birth_data = Column(JSON, nullable=False)
    chart_data = Column(JSON, nullable=False)
    is_additional = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    chart_id = Column(PG_UUID(as_uuid=True), ForeignKey("charts.id", ondelete="CASCADE"))
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    profile_id = Column(PG_UUID(as_uuid=True), nullable=False)
    parent_prediction_id = Column(PG_UUID(as_uuid=True))
    prediction_code = Column(String(100), unique=True, nullable=False)
    prediction_type = Column(String(50), nullable=False)
    text = Column(String, nullable=False)
    source_rule = Column(String(100))
    confidence = Column(Float, CheckConstraint('confidence BETWEEN 0 AND 1'))
    week_start = Column(Date)
    validated = Column(Integer, CheckConstraint('validated BETWEEN 1 AND 5'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())