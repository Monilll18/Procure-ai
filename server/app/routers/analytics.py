"""
Analytics router — aggregated spend, supplier performance, and trend data.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from app.database import get_db
from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.product import Product
from app.models.supplier import Supplier
from app.services.cache import cache, TTL_ANALYTICS

router = APIRouter()


@router.get("/spend-by-category")
async def spend_by_category(db: Session = Depends(get_db)):
    """Total spend grouped by product category."""
    cached = cache.get("analytics:spend-by-category")
    if cached is not None:
        return cached

    results = (
        db.query(
            Product.category,
            func.sum(POLineItem.total_price).label("total"),
        )
        .join(POLineItem, POLineItem.product_id == Product.id)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .group_by(Product.category)
        .order_by(func.sum(POLineItem.total_price).desc())
        .all()
    )
    data = [{"name": r.category, "value": round(r.total, 2)} for r in results]
    cache.set("analytics:spend-by-category", data, TTL_ANALYTICS)
    return data


@router.get("/supplier-performance")
async def supplier_performance(db: Session = Depends(get_db)):
    """Supplier ratings and PO counts for performance comparison."""
    cached = cache.get("analytics:supplier-performance")
    if cached is not None:
        return cached

    results = (
        db.query(
            Supplier.name,
            Supplier.rating,
            func.count(PurchaseOrder.id).label("order_count"),
            func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label("total_spend"),
        )
        .outerjoin(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .group_by(Supplier.id, Supplier.name, Supplier.rating)
        .order_by(func.sum(PurchaseOrder.total_amount).desc().nulls_last())
        .all()
    )
    data = [
        {
            "name": r.name,
            "rating": round(r.rating * 20, 1),
            "orders": r.order_count,
            "totalSpend": round(float(r.total_spend), 2),
        }
        for r in results
    ]
    cache.set("analytics:supplier-performance", data, TTL_ANALYTICS)
    return data


@router.get("/monthly-spend")
async def monthly_spend(months: int = 6, db: Session = Depends(get_db)):
    """Aggregate spend by month for the last N months."""
    cache_key = f"analytics:monthly-spend:{months}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    cutoff = datetime.utcnow() - timedelta(days=months * 30)
    results = (
        db.query(
            extract("year", PurchaseOrder.created_at).label("year"),
            extract("month", PurchaseOrder.created_at).label("month"),
            func.sum(PurchaseOrder.total_amount).label("total"),
            func.count(PurchaseOrder.id).label("count"),
        )
        .filter(
            PurchaseOrder.created_at >= cutoff,
            PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    data = [
        {
            "name": f"{month_names[int(r.month)]} {int(r.year)}",
            "total": round(float(r.total), 2),
            "orders": r.count,
        }
        for r in results
    ]
    cache.set(cache_key, data, TTL_ANALYTICS)
    return data


@router.get("/summary")
async def analytics_summary(db: Session = Depends(get_db)):
    """Key analytics KPIs."""
    cached = cache.get("analytics:summary")
    if cached is not None:
        return cached

    total_spend = (
        db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )
    avg_order = (
        db.query(func.coalesce(func.avg(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )
    active_suppliers = (
        db.query(func.count(Supplier.id))
        .filter(Supplier.status == "active")
        .scalar()
    )
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    monthly_pos = (
        db.query(func.count(PurchaseOrder.id))
        .filter(PurchaseOrder.created_at >= month_start)
        .scalar()
    )

    data = {
        "totalSpend": round(float(total_spend), 2),
        "avgOrderValue": round(float(avg_order), 2),
        "activeSuppliers": active_suppliers,
        "monthlyOrders": monthly_pos,
    }
    cache.set("analytics:summary", data, TTL_ANALYTICS)
    return data
