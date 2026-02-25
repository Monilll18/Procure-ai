"""
SupplierPriceUpdate model.
Tracks price change requests submitted by suppliers for buyer approval.
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


class PriceUpdateStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class SupplierPriceUpdate(Base):
    __tablename__ = "supplier_price_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    current_price = Column(Float, nullable=False)
    proposed_price = Column(Float, nullable=False)
    change_percent = Column(Float, nullable=False)  # auto-calc: ((new-old)/old)*100
    reason = Column(Text, nullable=True)
    effective_date = Column(Date, nullable=False)

    status = Column(Enum(PriceUpdateStatus), nullable=False, default=PriceUpdateStatus.pending)
    reviewed_by = Column(String(255), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_by = Column(String(255), nullable=True)  # supplier user id
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    supplier = relationship("Supplier", backref="price_updates")
    product = relationship("Product", backref="price_updates")

    def __repr__(self):
        return f"<PriceUpdate supplier={self.supplier_id} product={self.product_id} {self.current_price}->{self.proposed_price}>"
