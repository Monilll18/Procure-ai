"""
PurchaseRequisition model — request-to-purchase pipeline.
A PR is created by any user, goes through approval, and becomes a PO.
"""
import uuid
import enum
from sqlalchemy import Column, String, Float, Integer, DateTime, Date, Text, ForeignKey, Enum, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class PRStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    converted_to_po = "converted_to_po"
    cancelled = "cancelled"


class PRPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class PurchaseRequisition(Base):
    __tablename__ = "purchase_requisitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pr_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)

    # Requester info
    requested_by = Column(String(255), nullable=False)  # Clerk user ID
    department = Column(String(100), nullable=True)

    # Classification
    category = Column(String(200), nullable=True)
    priority = Column(Enum(PRPriority), nullable=False, default=PRPriority.medium)
    status = Column(Enum(PRStatus), nullable=False, default=PRStatus.draft)

    # Financial
    estimated_total = Column(Float, nullable=False, default=0.0)
    budget_code = Column(String(50), nullable=True)

    # Suggested supplier
    preferred_supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)

    # Dates
    needed_by = Column(Date, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)

    # Approval tracking
    approved_by = Column(String(255), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Converted PO reference
    po_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True)

    # AI assistance flags
    ai_suggested_supplier = Column(Boolean, nullable=False, default=False)
    ai_suggested_quantity = Column(Boolean, nullable=False, default=False)

    # Notes
    notes = Column(Text, nullable=True)
    justification = Column(Text, nullable=True)  # Business justification

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    line_items = relationship("PRLineItem", back_populates="requisition", cascade="all, delete-orphan")
    preferred_supplier = relationship("Supplier", foreign_keys=[preferred_supplier_id])

    def __repr__(self):
        return f"<PurchaseRequisition {self.pr_number}>"


class PRLineItem(Base):
    __tablename__ = "pr_line_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pr_id = Column(UUID(as_uuid=True), ForeignKey("purchase_requisitions.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)

    # Item details (can specify product or free-text)
    item_name = Column(String(300), nullable=False)
    item_description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    estimated_unit_price = Column(Float, nullable=False, default=0.0)
    estimated_total = Column(Float, nullable=False, default=0.0)
    unit = Column(String(20), nullable=False, default="pcs")

    # Relationships
    requisition = relationship("PurchaseRequisition", back_populates="line_items")
    product = relationship("Product")

    def __repr__(self):
        return f"<PRLineItem pr={self.pr_id} item={self.item_name}>"
