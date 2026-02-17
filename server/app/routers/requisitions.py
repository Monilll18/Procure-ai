"""
Purchase Requisitions router — full PR lifecycle with AI assistance.
Supports: create → submit → review → approve/reject → convert to PO.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from app.database import get_db
from app.models.purchase_requisition import PurchaseRequisition, PRLineItem, PRStatus, PRPriority
from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.supplier_price import SupplierPrice

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────

class PRLineItemCreate(BaseModel):
    product_id: Optional[str] = None
    item_name: str
    item_description: Optional[str] = None
    quantity: int = 1
    estimated_unit_price: float = 0
    unit: str = "pcs"


class PRCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    priority: str = "medium"
    estimated_total: float = 0
    budget_code: Optional[str] = None
    preferred_supplier_id: Optional[str] = None
    needed_by: Optional[str] = None
    justification: Optional[str] = None
    notes: Optional[str] = None
    line_items: List[PRLineItemCreate] = []


class PRUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    budget_code: Optional[str] = None
    preferred_supplier_id: Optional[str] = None
    needed_by: Optional[str] = None
    justification: Optional[str] = None
    notes: Optional[str] = None


def _pr_to_response(pr: PurchaseRequisition) -> dict:
    return {
        "id": str(pr.id),
        "pr_number": pr.pr_number,
        "title": pr.title,
        "description": pr.description,
        "requested_by": pr.requested_by,
        "department": pr.department,
        "category": pr.category,
        "priority": pr.priority.value if pr.priority else "medium",
        "status": pr.status.value if pr.status else "draft",
        "estimated_total": pr.estimated_total,
        "budget_code": pr.budget_code,
        "preferred_supplier_id": str(pr.preferred_supplier_id) if pr.preferred_supplier_id else None,
        "needed_by": str(pr.needed_by) if pr.needed_by else None,
        "submitted_at": pr.submitted_at.isoformat() if pr.submitted_at else None,
        "approved_at": pr.approved_at.isoformat() if pr.approved_at else None,
        "rejected_at": pr.rejected_at.isoformat() if pr.rejected_at else None,
        "approved_by": pr.approved_by,
        "rejection_reason": pr.rejection_reason,
        "po_id": str(pr.po_id) if pr.po_id else None,
        "ai_suggested_supplier": pr.ai_suggested_supplier,
        "ai_suggested_quantity": pr.ai_suggested_quantity,
        "notes": pr.notes,
        "justification": pr.justification,
        "created_at": pr.created_at.isoformat() if pr.created_at else None,
        "line_items": [
            {
                "id": str(li.id),
                "product_id": str(li.product_id) if li.product_id else None,
                "item_name": li.item_name,
                "item_description": li.item_description,
                "quantity": li.quantity,
                "estimated_unit_price": li.estimated_unit_price,
                "estimated_total": li.estimated_total,
                "unit": li.unit,
            }
            for li in (pr.line_items or [])
        ],
    }


def _generate_pr_number(db: Session) -> str:
    """Generate next PR number like PR-2026-0001."""
    year = datetime.utcnow().year
    count = db.query(PurchaseRequisition).filter(
        PurchaseRequisition.pr_number.like(f"PR-{year}-%")
    ).count()
    return f"PR-{year}-{str(count + 1).zfill(4)}"


# ─── AI Assistance ───────────────────────────────────────────────

def _suggest_supplier(db: Session, product_ids: List[str]) -> Optional[dict]:
    """AI: Find the best supplier based on price and rating for given products."""
    if not product_ids:
        return None

    # Get all supplier prices for these products
    prices = (
        db.query(SupplierPrice, Supplier)
        .join(Supplier, Supplier.id == SupplierPrice.supplier_id)
        .filter(
            SupplierPrice.product_id.in_(product_ids),
            SupplierPrice.is_active == True,
            Supplier.status == "active",
        )
        .all()
    )

    if not prices:
        return None

    # Score suppliers: lower price + higher rating = better
    supplier_scores: dict = {}
    for sp, supplier in prices:
        sid = str(supplier.id)
        if sid not in supplier_scores:
            supplier_scores[sid] = {
                "id": sid,
                "name": supplier.name,
                "rating": supplier.rating or 3.0,
                "total_price": 0,
                "products_covered": 0,
            }
        supplier_scores[sid]["total_price"] += sp.unit_price
        supplier_scores[sid]["products_covered"] += 1

    # Rank by: products covered (desc), then rating (desc), then price (asc)
    ranked = sorted(
        supplier_scores.values(),
        key=lambda x: (-x["products_covered"], -x["rating"], x["total_price"]),
    )

    return ranked[0] if ranked else None


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/")
async def list_requisitions(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """List purchase requisitions with optional filters."""
    q = db.query(PurchaseRequisition).options(joinedload(PurchaseRequisition.line_items))

    if status:
        q = q.filter(PurchaseRequisition.status == status)
    if priority:
        q = q.filter(PurchaseRequisition.priority == priority)

    prs = q.order_by(desc(PurchaseRequisition.created_at)).limit(limit).all()
    return [_pr_to_response(pr) for pr in prs]


@router.get("/{pr_id}")
async def get_requisition(pr_id: str, db: Session = Depends(get_db)):
    """Get a single PR with details."""
    pr = (
        db.query(PurchaseRequisition)
        .options(joinedload(PurchaseRequisition.line_items))
        .filter(PurchaseRequisition.id == pr_id)
        .first()
    )
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return _pr_to_response(pr)


@router.post("/")
async def create_requisition(data: PRCreate, db: Session = Depends(get_db)):
    """Create a new purchase requisition."""
    pr = PurchaseRequisition(
        pr_number=_generate_pr_number(db),
        title=data.title,
        description=data.description,
        requested_by="current_user",  # Will be replaced by auth middleware
        department=data.department,
        category=data.category,
        priority=PRPriority(data.priority) if data.priority else PRPriority.medium,
        estimated_total=data.estimated_total,
        budget_code=data.budget_code,
        preferred_supplier_id=data.preferred_supplier_id if data.preferred_supplier_id else None,
        needed_by=data.needed_by,
        justification=data.justification,
        notes=data.notes,
    )

    total = 0
    product_ids = []
    for item in data.line_items:
        li_total = item.quantity * item.estimated_unit_price
        total += li_total
        line = PRLineItem(
            product_id=item.product_id if item.product_id else None,
            item_name=item.item_name,
            item_description=item.item_description,
            quantity=item.quantity,
            estimated_unit_price=item.estimated_unit_price,
            estimated_total=li_total,
            unit=item.unit,
        )
        pr.line_items.append(line)
        if item.product_id:
            product_ids.append(item.product_id)

    pr.estimated_total = total or data.estimated_total

    # AI Suggestion: find best supplier if none specified
    if not data.preferred_supplier_id and product_ids:
        suggestion = _suggest_supplier(db, product_ids)
        if suggestion:
            pr.preferred_supplier_id = suggestion["id"]
            pr.ai_suggested_supplier = True

    db.add(pr)
    db.commit()
    db.refresh(pr)
    return _pr_to_response(pr)


@router.patch("/{pr_id}")
async def update_requisition(pr_id: str, updates: PRUpdate, db: Session = Depends(get_db)):
    """Update a draft PR."""
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    if pr.status not in [PRStatus.draft, PRStatus.rejected]:
        raise HTTPException(status_code=400, detail="Can only edit draft or rejected PRs")

    for key, value in updates.dict(exclude_unset=True).items():
        if key == "priority":
            value = PRPriority(value)
        setattr(pr, key, value)

    db.commit()
    db.refresh(pr)
    return _pr_to_response(pr)


@router.post("/{pr_id}/submit")
async def submit_requisition(pr_id: str, db: Session = Depends(get_db)):
    """Submit a PR for approval."""
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    if pr.status not in [PRStatus.draft, PRStatus.rejected]:
        raise HTTPException(status_code=400, detail="Can only submit draft or rejected PRs")

    pr.status = PRStatus.submitted
    pr.submitted_at = datetime.utcnow()
    db.commit()
    return {"message": "Requisition submitted for approval", "pr_number": pr.pr_number}


@router.post("/{pr_id}/approve")
async def approve_requisition(pr_id: str, db: Session = Depends(get_db)):
    """Approve a submitted PR."""
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    if pr.status not in [PRStatus.submitted, PRStatus.under_review]:
        raise HTTPException(status_code=400, detail="Can only approve submitted PRs")

    pr.status = PRStatus.approved
    pr.approved_at = datetime.utcnow()
    pr.approved_by = "current_approver"  # Will be replaced by auth middleware
    db.commit()
    return {"message": "Requisition approved", "pr_number": pr.pr_number}


@router.post("/{pr_id}/reject")
async def reject_requisition(pr_id: str, reason: str = "No reason provided", db: Session = Depends(get_db)):
    """Reject a submitted PR."""
    pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")

    pr.status = PRStatus.rejected
    pr.rejected_at = datetime.utcnow()
    pr.rejection_reason = reason
    db.commit()
    return {"message": "Requisition rejected", "pr_number": pr.pr_number}


@router.post("/{pr_id}/convert-to-po")
async def convert_to_po(pr_id: str, db: Session = Depends(get_db)):
    """Convert an approved PR into a Purchase Order."""
    pr = (
        db.query(PurchaseRequisition)
        .options(joinedload(PurchaseRequisition.line_items))
        .filter(PurchaseRequisition.id == pr_id)
        .first()
    )
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    if pr.status != PRStatus.approved:
        raise HTTPException(status_code=400, detail="Only approved PRs can be converted to POs")

    # Generate PO number
    year = datetime.utcnow().year
    po_count = db.query(PurchaseOrder).filter(
        PurchaseOrder.po_number.like(f"PO-{year}-%")
    ).count()
    po_number = f"PO-{year}-{str(po_count + 1).zfill(4)}"

    # Create PO from PR
    po = PurchaseOrder(
        po_number=po_number,
        supplier_id=pr.preferred_supplier_id,
        created_by=pr.requested_by,
        status=POStatus.draft,
        total_amount=pr.estimated_total,
        expected_delivery=pr.needed_by,
        notes=f"Auto-generated from {pr.pr_number}. {pr.notes or ''}",
    )

    # Convert line items
    for li in pr.line_items:
        po_line = POLineItem(
            product_id=li.product_id,
            quantity=li.quantity,
            unit_price=li.estimated_unit_price,
            total_price=li.estimated_total,
        )
        po.line_items.append(po_line)

    db.add(po)

    # Update PR
    pr.status = PRStatus.converted_to_po
    pr.po_id = po.id

    db.commit()
    db.refresh(po)

    return {
        "message": f"{pr.pr_number} converted to {po.po_number}",
        "po_id": str(po.id),
        "po_number": po.po_number,
    }


@router.get("/stats/summary")
async def get_pr_stats(db: Session = Depends(get_db)):
    """Get summary statistics for PRs."""
    total = db.query(PurchaseRequisition).count()
    by_status = (
        db.query(PurchaseRequisition.status, func.count(PurchaseRequisition.id))
        .group_by(PurchaseRequisition.status)
        .all()
    )
    status_counts = {s.value: c for s, c in by_status}

    return {
        "total": total,
        "by_status": status_counts,
        "pending_review": status_counts.get("submitted", 0) + status_counts.get("under_review", 0),
    }
