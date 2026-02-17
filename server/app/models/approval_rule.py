"""
ApprovalRule model — configurable multi-level approval engine.
Supports amount-based, category-based, and urgency-based rules.
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
import uuid
from app.database import Base


class RuleType(str, enum.Enum):
    amount = "amount"
    category = "category"
    urgency = "urgency"


class ApprovalFlow(str, enum.Enum):
    sequential = "sequential"
    parallel = "parallel"


class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    rule_type = Column(String(20), nullable=False, default="amount")
    is_active = Column(Boolean, nullable=False, default=True)
    priority = Column(Integer, nullable=False, default=0)  # Higher = checked first

    # Amount-based rules
    min_amount = Column(Float, nullable=True)  # Trigger above this amount
    max_amount = Column(Float, nullable=True)  # Up to this amount

    # Category-based rules
    category_name = Column(String(200), nullable=True)  # e.g. "IT Equipment"

    # Urgency-based rules
    urgency_level = Column(String(20), nullable=True)  # "low", "medium", "high", "critical"

    # Who must approve
    approver_role = Column(String(50), nullable=False, default="manager")  # Role that must approve
    approval_flow = Column(String(20), nullable=False, default="sequential")  # sequential or parallel

    # SLA
    sla_hours = Column(Integer, nullable=False, default=24)  # Hours to respond
    auto_approve = Column(Boolean, nullable=False, default=False)  # Auto-approve if under threshold
    escalate_after_hours = Column(Integer, nullable=True, default=48)  # Escalate if no response

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
