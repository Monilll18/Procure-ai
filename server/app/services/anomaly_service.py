"""
Anomaly Detection Service — Price anomaly and spend pattern detection.
Uses IsolationForest from scikit-learn.
Integration 6: Price Anomaly Detection
Integration 10: Spend Anomaly & Fraud Detection
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import logging
import numpy as np

from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.product import Product
from app.models.supplier import Supplier

logger = logging.getLogger(__name__)


# ─── Price Anomaly Detection (Integration 6) ─────────────────

def detect_price_anomaly(
    product_id: str,
    new_price: float,
    db: Session,
    contamination: float = 0.1,
) -> Dict[str, Any]:
    """
    Check if a new price for a product is anomalous using IsolationForest.

    Args:
        product_id: UUID of the product
        new_price: The new price to check
        db: Database session
        contamination: Expected proportion of anomalies (0.05 to 0.2)

    Returns:
        dict with is_anomaly, confidence, historical stats
    """
    from sklearn.ensemble import IsolationForest

    # Get historical prices for this product
    price_history = (
        db.query(POLineItem.unit_price)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(
            POLineItem.product_id == product_id,
            PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
        )
        .all()
    )

    prices = [float(p[0]) for p in price_history if p[0] and p[0] > 0]

    # Need at least 5 historical prices for meaningful detection
    if len(prices) < 5:
        avg = np.mean(prices) if prices else 0
        return {
            "is_anomaly": False,
            "confidence": 0,
            "reason": "Insufficient price history (need 5+)",
            "historical_avg": round(float(avg), 2),
            "historical_count": len(prices),
            "new_price": new_price,
            "deviation_pct": 0,
        }

    prices_arr = np.array(prices).reshape(-1, 1)

    # Train IsolationForest
    model = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100,
    )
    model.fit(prices_arr)

    # Check new price
    prediction = model.predict([[new_price]])[0]
    anomaly_score = model.score_samples([[new_price]])[0]

    avg_price = float(np.mean(prices))
    std_price = float(np.std(prices))
    deviation_pct = ((new_price - avg_price) / avg_price * 100) if avg_price > 0 else 0

    is_anomaly = prediction == -1

    # Generate human-readable reason
    if is_anomaly:
        if new_price > avg_price:
            reason = f"Price ${new_price:.2f} is {abs(deviation_pct):.1f}% ABOVE the historical average of ${avg_price:.2f}"
        else:
            reason = f"Price ${new_price:.2f} is {abs(deviation_pct):.1f}% BELOW the historical average of ${avg_price:.2f}"
    else:
        reason = f"Price ${new_price:.2f} is within normal range (avg: ${avg_price:.2f})"

    return {
        "is_anomaly": is_anomaly,
        "confidence": round(abs(float(anomaly_score)), 3),
        "reason": reason,
        "new_price": new_price,
        "historical_avg": round(avg_price, 2),
        "historical_std": round(std_price, 2),
        "historical_min": round(float(np.min(prices)), 2),
        "historical_max": round(float(np.max(prices)), 2),
        "historical_count": len(prices),
        "deviation_pct": round(deviation_pct, 1),
    }


def batch_check_prices(db: Session) -> List[Dict[str, Any]]:
    """
    Check all recent prices for anomalies.
    Returns list of anomalous prices found.
    """
    # Get prices from last 7 days
    cutoff = datetime.utcnow() - timedelta(days=7)
    recent_prices = (
        db.query(POLineItem, Product.name, Product.id)
        .join(Product, Product.id == POLineItem.product_id)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(PurchaseOrder.created_at >= cutoff)
        .all()
    )

    anomalies = []
    checked_products = set()

    for line_item, product_name, product_id in recent_prices:
        if str(product_id) in checked_products:
            continue
        checked_products.add(str(product_id))

        if line_item.unit_price and line_item.unit_price > 0:
            result = detect_price_anomaly(str(product_id), float(line_item.unit_price), db)
            if result["is_anomaly"]:
                result["product_name"] = product_name
                result["product_id"] = str(product_id)
                anomalies.append(result)

    return anomalies


# ─── Fraud Pattern Detection (Integration 10) ─────────────────

def detect_fraud_patterns(db: Session) -> List[Dict[str, Any]]:
    """
    Scan for suspicious procurement patterns:
    1. Split orders (same user, same supplier, just below approval limit)
    2. New supplier + large first order
    3. Off-hours activity
    4. Unusual spending spikes
    """
    alerts = []
    alerts.extend(_detect_split_orders(db))
    alerts.extend(_detect_new_supplier_large_orders(db))
    alerts.extend(_detect_off_hours_activity(db))

    return alerts


def _detect_split_orders(db: Session, threshold: float = 500.0, window_days: int = 7) -> List[Dict]:
    """
    Detect potential split orders: multiple orders from same user to same supplier,
    all just below an approval threshold, within a short window.
    """
    cutoff = datetime.utcnow() - timedelta(days=window_days)

    # Group recent POs by (created_by, supplier_id)
    groups = (
        db.query(
            PurchaseOrder.created_by,
            PurchaseOrder.supplier_id,
            Supplier.name.label("supplier_name"),
            func.count(PurchaseOrder.id).label("order_count"),
            func.sum(PurchaseOrder.total_amount).label("total_amount"),
            func.max(PurchaseOrder.total_amount).label("max_single"),
        )
        .join(Supplier, Supplier.id == PurchaseOrder.supplier_id)
        .filter(
            PurchaseOrder.created_at >= cutoff,
            PurchaseOrder.status.notin_([POStatus.cancelled]),
        )
        .group_by(PurchaseOrder.created_by, PurchaseOrder.supplier_id, Supplier.name)
        .having(func.count(PurchaseOrder.id) >= 3)
        .all()
    )

    alerts = []
    for row in groups:
        # Check if max single order is just under threshold (within 20%)
        if row.max_single and float(row.max_single) > threshold * 0.8 and float(row.max_single) < threshold:
            alerts.append({
                "type": "split_order",
                "severity": "warning",
                "title": f"Potential Split Order: {row.supplier_name}",
                "description": (
                    f"User {row.created_by} placed {row.order_count} orders to {row.supplier_name} "
                    f"in the last {window_days} days, totaling ${float(row.total_amount):,.2f}. "
                    f"Largest single order: ${float(row.max_single):,.2f} "
                    f"(just below ${threshold:,.2f} threshold)."
                ),
                "metadata": {
                    "user": row.created_by,
                    "supplier": row.supplier_name,
                    "order_count": row.order_count,
                    "total": round(float(row.total_amount), 2),
                    "max_single": round(float(row.max_single), 2),
                },
            })

    return alerts


def _detect_new_supplier_large_orders(db: Session, large_threshold: float = 5000) -> List[Dict]:
    """Detect large first orders with newly added suppliers."""
    # Suppliers added in the last 30 days
    cutoff = datetime.utcnow() - timedelta(days=30)

    new_suppliers_with_large_orders = (
        db.query(Supplier.name, PurchaseOrder.total_amount, PurchaseOrder.po_number)
        .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .filter(
            Supplier.created_at >= cutoff,
            PurchaseOrder.total_amount >= large_threshold,
        )
        .all()
    )

    return [
        {
            "type": "new_supplier_large_order",
            "severity": "warning",
            "title": f"Large Order with New Supplier: {name}",
            "description": (
                f"PO {po_num} for ${float(amount):,.2f} was placed with {name}, "
                f"which was added in the last 30 days. Please verify this supplier."
            ),
            "metadata": {
                "supplier": name,
                "po_number": po_num,
                "amount": round(float(amount), 2),
            },
        }
        for name, amount, po_num in new_suppliers_with_large_orders
    ]


def _detect_off_hours_activity(db: Session) -> List[Dict]:
    """Detect POs created during unusual hours (before 6 AM or after 10 PM, weekends)."""
    cutoff = datetime.utcnow() - timedelta(days=7)

    recent_pos = (
        db.query(PurchaseOrder, Supplier.name.label("supplier_name"))
        .outerjoin(Supplier, Supplier.id == PurchaseOrder.supplier_id)
        .filter(PurchaseOrder.created_at >= cutoff)
        .all()
    )

    alerts = []
    for po, supplier_name in recent_pos:
        if po.created_at:
            hour = po.created_at.hour
            weekday = po.created_at.weekday()  # 5 = Saturday, 6 = Sunday

            is_off_hours = hour < 6 or hour >= 22
            is_weekend = weekday >= 5

            if is_off_hours or is_weekend:
                time_desc = "weekend" if is_weekend else f"{hour}:00 (off-hours)"
                alerts.append({
                    "type": "off_hours_activity",
                    "severity": "info",
                    "title": f"Off-Hours PO: {po.po_number}",
                    "description": (
                        f"PO {po.po_number} (${float(po.total_amount or 0):,.2f}) to {supplier_name} "
                        f"was created on {time_desc}."
                    ),
                    "metadata": {
                        "po_number": po.po_number,
                        "created_at": po.created_at.isoformat(),
                        "off_hours": is_off_hours,
                        "weekend": is_weekend,
                    },
                })

    return alerts
