"""
Department model — organizational units with budget allocations.
"""
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    code = Column(String(20), nullable=True)  # Short code like "IT", "FIN", "OPS"
    description = Column(String(500), nullable=True)

    # Budget
    annual_budget = Column(Float, nullable=False, default=0)
    monthly_budget = Column(Float, nullable=False, default=0)

    # Manager (references users table)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
