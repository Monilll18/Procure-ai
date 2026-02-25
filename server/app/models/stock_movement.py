import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(30), nullable=False)  # GOODS_IN, GOODS_OUT, ADJUSTMENT
    quantity = Column(Integer, nullable=False)  # positive = in, negative = out
    reference_type = Column(String(50), nullable=True)  # PO, PR, ADJUSTMENT, INITIAL
    reference_id = Column(UUID(as_uuid=True), nullable=True)  # PO id, PR id, etc.
    performed_by = Column(String(255), nullable=True)  # user email or clerk_id
    storage_location = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    stock_after = Column(Integer, nullable=True)  # stock level after this movement
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product")

    def __repr__(self):
        return f"<StockMovement {self.type} qty={self.quantity} product={self.product_id}>"
