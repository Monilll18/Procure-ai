from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    StockAdjustRequest, StockMovementResponse,
)
from app.middleware.auth import get_current_user

router = APIRouter()


def _enrich_inventory(inv: Inventory) -> dict:
    """Add product name/sku to inventory response."""
    data = {
        "id": inv.id,
        "product_id": inv.product_id,
        "current_stock": inv.current_stock,
        "min_stock": inv.min_stock,
        "max_stock": inv.max_stock,
        "last_updated": inv.last_updated,
        "product_name": inv.product.name if inv.product else None,
        "product_sku": inv.product.sku if inv.product else None,
    }
    return data


def _enrich_movement(mov: StockMovement) -> dict:
    """Add product name/sku to movement response."""
    return {
        "id": mov.id,
        "product_id": mov.product_id,
        "type": mov.type,
        "quantity": mov.quantity,
        "reference_type": mov.reference_type,
        "reference_id": mov.reference_id,
        "performed_by": mov.performed_by,
        "storage_location": mov.storage_location,
        "notes": mov.notes,
        "stock_after": mov.stock_after,
        "created_at": mov.created_at,
        "product_name": mov.product.name if mov.product else None,
        "product_sku": mov.product.sku if mov.product else None,
    }


@router.get("/", response_model=List[InventoryResponse])
async def list_inventory(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all inventory items with product info."""
    items = (
        db.query(Inventory)
        .options(joinedload(Inventory.product))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_enrich_inventory(item) for item in items]


@router.get("/alerts", response_model=List[InventoryResponse])
async def get_low_stock_alerts(db: Session = Depends(get_db)):
    """Get inventory items where current_stock <= min_stock."""
    items = (
        db.query(Inventory)
        .options(joinedload(Inventory.product))
        .filter(Inventory.current_stock <= Inventory.min_stock)
        .all()
    )
    return [_enrich_inventory(item) for item in items]


# ─── Stock Movements ────────────────────────────────────────

@router.get("/movements", response_model=List[StockMovementResponse])
async def list_stock_movements(
    product_id: Optional[UUID] = None,
    movement_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List stock movement history, optionally filtered by product or type."""
    query = db.query(StockMovement).options(joinedload(StockMovement.product))

    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    if movement_type:
        query = query.filter(StockMovement.type == movement_type)

    movements = query.order_by(StockMovement.created_at.desc()).limit(limit).all()
    return [_enrich_movement(m) for m in movements]


@router.post("/adjust", response_model=StockMovementResponse, status_code=201)
async def adjust_stock(
    data: StockAdjustRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Adjust stock level for a product and log the movement.
    - Positive quantity = stock increase (goods in)
    - Negative quantity = stock decrease (goods out)
    """
    # Find inventory record
    inv = db.query(Inventory).filter(Inventory.product_id == data.product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found for this product")

    # Calculate new stock
    new_stock = inv.current_stock + data.quantity
    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reduce stock below 0. Current: {inv.current_stock}, adjustment: {data.quantity}",
        )

    # Update inventory
    inv.current_stock = new_stock

    # Log the movement
    movement = StockMovement(
        product_id=data.product_id,
        type=data.type,
        quantity=data.quantity,
        reference_type=data.reference_type or "MANUAL",
        reference_id=data.reference_id,
        performed_by=user_id,
        storage_location=data.storage_location,
        notes=data.notes,
        stock_after=new_stock,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)

    # Reload with product relationship
    movement = (
        db.query(StockMovement)
        .options(joinedload(StockMovement.product))
        .filter(StockMovement.id == movement.id)
        .first()
    )
    return _enrich_movement(movement)


# ─── Original CRUD ──────────────────────────────────────────

@router.post("/", response_model=InventoryResponse, status_code=201)
async def create_inventory(
    data: InventoryCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create an inventory record for a product (requires auth)."""
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(Inventory).filter(Inventory.product_id == data.product_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory record already exists for this product")

    inv = Inventory(**data.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)

    return _enrich_inventory(inv)


@router.patch("/{inventory_id}", response_model=InventoryResponse)
async def update_inventory(
    inventory_id: UUID,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update an inventory record (requires auth). Also logs a stock movement if stock changed."""
    inv = (
        db.query(Inventory)
        .options(joinedload(Inventory.product))
        .filter(Inventory.id == inventory_id)
        .first()
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    old_stock = inv.current_stock
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inv, key, value)

    # Log stock movement if stock was changed
    if "current_stock" in update_data and update_data["current_stock"] != old_stock:
        diff = update_data["current_stock"] - old_stock
        movement = StockMovement(
            product_id=inv.product_id,
            type="ADJUSTMENT",
            quantity=diff,
            reference_type="MANUAL",
            performed_by=user_id,
            notes=f"Stock adjusted from {old_stock} to {update_data['current_stock']}",
            stock_after=update_data["current_stock"],
        )
        db.add(movement)

    db.commit()
    db.refresh(inv)
    return _enrich_inventory(inv)
