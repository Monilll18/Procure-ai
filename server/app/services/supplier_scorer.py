"""
Supplier Scoring Service — Weighted algorithm for ranking suppliers.
Integration 7 (Part A): ML-based supplier scoring.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import logging

from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.product import Product
from app.models.supplier import Supplier

logger = logging.getLogger(__name__)

# Scoring weights (configurable)
WEIGHTS = {
    "price": 0.30,
    "delivery": 0.30,
    "quality": 0.25,
    "response": 0.15,
}


def score_supplier(
    supplier_id: str,
    product_id: Optional[str],
    db: Session,
) -> Dict[str, Any]:
    """
    Calculate a composite score (0-10) for a supplier.
    
    Components:
    - Price competitiveness (30%): vs market average
    - Delivery reliability (30%): on-time rate from PO history
    - Quality rating (25%): existing DB rating
    - Response time (15%): based on lead_time_days
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return {"error": "Supplier not found", "total_score": 0}

    # ─── Price Score (0-10) ─────────────────────────
    price_score = 5.0  # default
    if product_id:
        # Get this supplier's average price for the product
        supplier_avg = (
            db.query(func.avg(POLineItem.unit_price))
            .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
            .filter(
                POLineItem.product_id == product_id,
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
            )
            .scalar()
        )

        # Get market average (all suppliers) for the product
        market_avg = (
            db.query(func.avg(POLineItem.unit_price))
            .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
            .filter(
                POLineItem.product_id == product_id,
                PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
            )
            .scalar()
        )

        if supplier_avg and market_avg and market_avg > 0:
            # Lower price = better score
            ratio = float(supplier_avg) / float(market_avg)
            if ratio <= 0.8:
                price_score = 10.0  # 20%+ below market
            elif ratio <= 0.9:
                price_score = 8.5
            elif ratio <= 1.0:
                price_score = 7.0
            elif ratio <= 1.1:
                price_score = 5.0
            elif ratio <= 1.2:
                price_score = 3.0
            else:
                price_score = 1.5

    # ─── Delivery Score (0-10) ──────────────────────
    total_pos = (
        db.query(func.count(PurchaseOrder.id))
        .filter(
            PurchaseOrder.supplier_id == supplier_id,
            PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
        )
        .scalar() or 0
    )

    delivered_pos = (
        db.query(func.count(PurchaseOrder.id))
        .filter(
            PurchaseOrder.supplier_id == supplier_id,
            PurchaseOrder.status.in_([POStatus.received, POStatus.paid, POStatus.invoiced]),
        )
        .scalar() or 0
    )

    if total_pos > 0:
        delivery_rate = delivered_pos / total_pos
        delivery_score = round(delivery_rate * 10, 1)
    else:
        delivery_score = 5.0  # No history = neutral

    # ─── Quality Score (0-10) ──────────────────────
    # Convert 5-star rating to 10-point scale
    quality_score = round((supplier.rating or 4.0) * 2, 1)

    # ─── Response Score (0-10) ─────────────────────
    lead_time = supplier.lead_time_days or 7
    if lead_time <= 2:
        response_score = 10.0
    elif lead_time <= 5:
        response_score = 8.0
    elif lead_time <= 7:
        response_score = 6.0
    elif lead_time <= 14:
        response_score = 4.0
    else:
        response_score = 2.0

    # ─── Weighted Total ────────────────────────────
    total_score = round(
        price_score * WEIGHTS["price"]
        + delivery_score * WEIGHTS["delivery"]
        + quality_score * WEIGHTS["quality"]
        + response_score * WEIGHTS["response"],
        1,
    )

    return {
        "supplier_id": str(supplier.id),
        "supplier_name": supplier.name,
        "total_score": total_score,
        "breakdown": {
            "price": {"score": price_score, "weight": WEIGHTS["price"], "weighted": round(price_score * WEIGHTS["price"], 2)},
            "delivery": {"score": delivery_score, "weight": WEIGHTS["delivery"], "weighted": round(delivery_score * WEIGHTS["delivery"], 2)},
            "quality": {"score": quality_score, "weight": WEIGHTS["quality"], "weighted": round(quality_score * WEIGHTS["quality"], 2)},
            "response": {"score": response_score, "weight": WEIGHTS["response"], "weighted": round(response_score * WEIGHTS["response"], 2)},
        },
        "metadata": {
            "total_orders": total_pos,
            "delivered_orders": delivered_pos,
            "rating": supplier.rating,
            "lead_time_days": lead_time,
            "payment_terms": supplier.payment_terms,
            "status": supplier.status.value if supplier.status else "unknown",
        },
    }


def rank_suppliers_for_product(
    product_id: str,
    db: Session,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Score and rank all active suppliers for a given product.
    Returns sorted list (best first) with scores.
    """
    # Get all active suppliers who have supplied this product
    supplier_ids = (
        db.query(PurchaseOrder.supplier_id)
        .join(POLineItem, POLineItem.po_id == PurchaseOrder.id)
        .filter(
            POLineItem.product_id == product_id,
            PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
        )
        .distinct()
        .all()
    )

    scores = []
    for (sid,) in supplier_ids:
        if sid:
            result = score_supplier(str(sid), product_id, db)
            if "error" not in result:
                scores.append(result)

    # If no supplier history, just score all active suppliers without product context
    if not scores:
        all_suppliers = db.query(Supplier).filter(Supplier.status == "active").limit(limit).all()
        for s in all_suppliers:
            result = score_supplier(str(s.id), None, db)
            if "error" not in result:
                scores.append(result)

    # Sort by total score (descending)
    scores.sort(key=lambda x: x["total_score"], reverse=True)

    # Add rank
    for i, s in enumerate(scores[:limit]):
        s["rank"] = i + 1

    return scores[:limit]
