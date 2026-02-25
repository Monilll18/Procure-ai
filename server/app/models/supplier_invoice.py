"""
SupplierInvoice + InvoiceLineItem models.
Tracks invoices submitted by suppliers, with 3-way matching against POs & shipments.
"""
import uuid
import enum
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Date, Text,
    Enum, ForeignKey, Boolean, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    paid = "paid"
    partially_paid = "partially_paid"


class SupplierInvoice(Base):
    __tablename__ = "supplier_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    po_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)

    status = Column(Enum(InvoiceStatus), nullable=False, default=InvoiceStatus.draft)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    subtotal = Column(Float, nullable=False, default=0)
    tax_amount = Column(Float, nullable=False, default=0)
    total_amount = Column(Float, nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="USD")
    notes = Column(Text, nullable=True)

    # 3-way match result
    match_status = Column(String(50), nullable=True)  # matched, mismatch_qty, mismatch_price, unmatched
    match_notes = Column(Text, nullable=True)

    created_by = Column(String(255), nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    review_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    purchase_order = relationship("PurchaseOrder", backref="invoices")
    supplier = relationship("Supplier", backref="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Invoice {self.invoice_number} po={self.po_id} total={self.total_amount}>"


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("supplier_invoices.id", ondelete="CASCADE"), nullable=False)
    po_line_item_id = Column(UUID(as_uuid=True), ForeignKey("po_line_items.id", ondelete="SET NULL"), nullable=True)

    description = Column(String(500), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    tax_rate = Column(Float, nullable=True, default=0)

    # Match fields
    po_quantity = Column(Integer, nullable=True)  # qty from PO
    po_unit_price = Column(Float, nullable=True)  # price from PO
    quantity_match = Column(Boolean, nullable=True)
    price_match = Column(Boolean, nullable=True)

    invoice = relationship("SupplierInvoice", back_populates="line_items")
    po_line_item = relationship("POLineItem", backref="invoice_items")

    def __repr__(self):
        return f"<InvoiceItem {self.description} qty={self.quantity} price={self.unit_price}>"
