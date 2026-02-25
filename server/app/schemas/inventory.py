from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class InventoryCreate(BaseModel):
    product_id: UUID
    current_stock: int = Field(default=0, ge=0)
    min_stock: int = Field(default=5, ge=0)
    max_stock: int = Field(default=500, ge=1)


class InventoryUpdate(BaseModel):
    current_stock: Optional[int] = Field(None, ge=0)
    min_stock: Optional[int] = Field(None, ge=0)
    max_stock: Optional[int] = Field(None, ge=1)


class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    current_stock: int
    min_stock: int
    max_stock: int
    last_updated: Optional[datetime] = None

    # Nested product name for display
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Stock Movement Schemas ──────────────────────────────────

class StockAdjustRequest(BaseModel):
    """Request to adjust stock with a reason (logs a movement)."""
    product_id: UUID
    quantity: int  # positive or negative
    type: str = "ADJUSTMENT"  # GOODS_IN, GOODS_OUT, ADJUSTMENT
    reference_type: Optional[str] = None  # PO, PR, MANUAL
    reference_id: Optional[UUID] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None


class StockMovementResponse(BaseModel):
    id: UUID
    product_id: UUID
    type: str
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    performed_by: Optional[str] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None
    stock_after: Optional[int] = None
    created_at: Optional[datetime] = None

    # Joined fields
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

    model_config = {"from_attributes": True}

