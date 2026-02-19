"""
AI Insights Engine — generates smart procurement recommendations.
Analyzes inventory levels, spending patterns, supplier risk,
price anomalies (ML), and fraud patterns.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from app.models.product import Product
from app.models.supplier import Supplier
from app.models.inventory import Inventory
from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus

logger = logging.getLogger(__name__)


def generate_insights(db: Session) -> List[Dict[str, Any]]:
    """Generate all AI-driven insights from current data."""
    insights: List[Dict[str, Any]] = []

    insights.extend(_reorder_alerts(db))
    insights.extend(_spend_anomalies(db))
    insights.extend(_supplier_risk_alerts(db))

    # ML-powered insights (graceful fallback if sklearn not available)
    try:
        from app.services.anomaly_service import batch_check_prices, detect_fraud_patterns

        # Price anomalies from IsolationForest
        price_anomalies = batch_check_prices(db)
        for pa in price_anomalies:
            insights.append({
                "type": "price_anomaly",
                "severity": "warning",
                "title": f"Price Anomaly: {pa.get('product_name', 'Unknown')}",
                "description": pa.get("reason", "Unusual price detected"),
                "impact": "High" if abs(pa.get("deviation_pct", 0)) > 30 else "Medium",
                "action": "Review Price",
                "metadata": pa,
            })

        # Fraud pattern detection
        fraud_alerts = detect_fraud_patterns(db)
        insights.extend(fraud_alerts)

    except Exception as e:
        logger.warning(f"ML insights unavailable: {e}")

    # Sort by severity: critical > warning > info
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    insights.sort(key=lambda x: severity_order.get(x["severity"], 3))

    return insights


def _reorder_alerts(db: Session) -> List[Dict[str, Any]]:
    """Products where current stock is at or below reorder point."""
    low_stock_items = (
        db.query(Inventory, Product)
        .join(Product, Product.id == Inventory.product_id)
        .filter(Inventory.current_stock <= Product.reorder_point)
        .all()
    )

    alerts = []
    for inv, product in low_stock_items:
        stock_pct = (inv.current_stock / product.reorder_point * 100) if product.reorder_point > 0 else 0
        severity = "critical" if inv.current_stock == 0 else "warning"

        alerts.append({
            "type": "reorder",
            "severity": severity,
            "title": f"{'Out of Stock' if inv.current_stock == 0 else 'Low Stock'}: {product.name}",
            "description": (
                f"{product.name} ({product.sku}) has {inv.current_stock} {product.unit} remaining "
                f"(reorder point: {product.reorder_point}). "
                f"Recommended order: {product.reorder_quantity} {product.unit}."
            ),
            "impact": "High" if severity == "critical" else "Medium",
            "action": "Create Purchase Order",
            "metadata": {
                "product_id": str(product.id),
                "product_name": product.name,
                "current_stock": inv.current_stock,
                "reorder_point": product.reorder_point,
                "recommended_qty": product.reorder_quantity,
                "stock_percentage": round(stock_pct, 1),
            },
        })

    return alerts


def _spend_anomalies(db: Session) -> List[Dict[str, Any]]:
    """
    Categories where recent spending is significantly above average.
    Compares last 30 days vs. overall average.
    """
    # Overall average spend per category
    overall = (
        db.query(
            Product.category,
            func.sum(POLineItem.total_price).label("total"),
            func.count(func.distinct(PurchaseOrder.id)).label("po_count"),
        )
        .join(POLineItem, POLineItem.product_id == Product.id)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .group_by(Product.category)
        .all()
    )

    # Recent spend (last 30 days)
    cutoff = datetime.utcnow() - timedelta(days=30)
    recent = (
        db.query(
            Product.category,
            func.sum(POLineItem.total_price).label("total"),
        )
        .join(POLineItem, POLineItem.product_id == Product.id)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(
            PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
            PurchaseOrder.created_at >= cutoff,
        )
        .group_by(Product.category)
        .all()
    )

    recent_map = {r.category: float(r.total) for r in recent}
    anomalies = []

    for row in overall:
        category = row.category
        total = float(row.total)
        # Average monthly spend (assume 3 months of data)
        avg_monthly = total / 3
        recent_total = recent_map.get(category, 0)

        if avg_monthly > 0 and recent_total > avg_monthly * 1.3:  # 30% above average
            pct_above = round(((recent_total - avg_monthly) / avg_monthly) * 100)
            anomalies.append({
                "type": "spend_anomaly",
                "severity": "warning" if pct_above < 50 else "critical",
                "title": f"Unusual Spending: {category}",
                "description": (
                    f"{category} spending this month is ${recent_total:,.0f}, "
                    f"which is {pct_above}% above the monthly average of ${avg_monthly:,.0f}."
                ),
                "impact": "High" if pct_above >= 50 else "Medium",
                "action": "Investigate Spend",
                "metadata": {
                    "category": category,
                    "recent_spend": round(recent_total, 2),
                    "avg_monthly": round(avg_monthly, 2),
                    "pct_above_avg": pct_above,
                },
            })

    return anomalies


def _supplier_risk_alerts(db: Session) -> List[Dict[str, Any]]:
    """Flag suppliers with low ratings or inactive status who have active POs."""
    # Suppliers with rating < 4.0 or inactive that have non-closed POs
    risky_suppliers = (
        db.query(Supplier, func.count(PurchaseOrder.id).label("active_pos"))
        .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .filter(
            PurchaseOrder.status.in_([POStatus.pending_approval, POStatus.approved, POStatus.sent]),
            (Supplier.rating < 4.0) | (Supplier.status != "active"),
        )
        .group_by(Supplier.id)
        .all()
    )

    alerts = []
    for supplier, active_pos in risky_suppliers:
        reasons = []
        if supplier.rating < 4.0:
            reasons.append(f"rating is {supplier.rating}/5.0")
        if supplier.status != "active":
            reasons.append(f"status is '{supplier.status}'")

        alerts.append({
            "type": "supplier_risk",
            "severity": "warning",
            "title": f"Supplier Risk: {supplier.name}",
            "description": (
                f"{supplier.name} has {active_pos} active purchase order(s) but "
                f"{' and '.join(reasons)}. Consider alternative suppliers."
            ),
            "impact": "Medium",
            "action": "View Alternatives",
            "metadata": {
                "supplier_id": str(supplier.id),
                "supplier_name": supplier.name,
                "rating": supplier.rating,
                "status": supplier.status,
                "active_pos": active_pos,
            },
        })

    return alerts


def generate_forecast(db: Session) -> List[Dict[str, Any]]:
    """
    Generate demand forecast based on historical PO data.
    Uses Exponential Smoothing (Holt's double smoothing) with
    trend detection, seasonality adjustment, and confidence intervals.
    """
    import math

    # Fetch up to 12 months of history for better trend detection
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)

    monthly_data = (
        db.query(
            func.extract("year", PurchaseOrder.created_at).label("year"),
            func.extract("month", PurchaseOrder.created_at).label("month"),
            func.sum(PurchaseOrder.total_amount).label("total"),
            func.count(PurchaseOrder.id).label("count"),
        )
        .filter(
            PurchaseOrder.created_at >= twelve_months_ago,
            PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # Build actual data points
    data = []
    actuals = []
    month_indices = []  # track which calendar month each point is

    for row in monthly_data:
        val = round(float(row.total), 2)
        actuals.append(val)
        month_indices.append(int(row.month))
        data.append({
            "month": month_names[int(row.month)],
            "actual": val,
            "predicted": val,
            "lower": None,
            "upper": None,
            "order_count": int(row.count),
        })

    if not actuals:
        return data

    # ── Holt's Double Exponential Smoothing ──────────────────────
    # Parameters
    alpha = 0.4   # level smoothing (higher = more weight on recent)
    beta = 0.2    # trend smoothing

    # Initialize
    level = actuals[0]
    trend = (actuals[-1] - actuals[0]) / max(len(actuals) - 1, 1)

    smoothed = []
    for val in actuals:
        prev_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - prev_level) + (1 - beta) * trend
        smoothed.append(level)

    # ── Seasonal Adjustment ───────────────────────────────────────
    # Q4 (Oct-Dec) typically spikes, Q1 (Jan-Mar) dips
    SEASONAL_FACTORS = {
        1: 0.90, 2: 0.88, 3: 0.92, 4: 0.95,
        5: 1.00, 6: 1.02, 7: 0.98, 8: 1.00,
        9: 1.05, 10: 1.10, 11: 1.18, 12: 1.20,
    }

    # ── Residual std dev for confidence intervals ─────────────────
    residuals = [abs(actuals[i] - smoothed[i]) for i in range(len(actuals))]
    std_dev = (sum(r ** 2 for r in residuals) / max(len(residuals), 1)) ** 0.5

    # ── Forecast next 3 months ────────────────────────────────────
    now = datetime.utcnow()
    for i in range(1, 4):
        future = now + timedelta(days=30 * i)
        future_month = future.month
        seasonal = SEASONAL_FACTORS.get(future_month, 1.0)

        # Project level + trend, apply seasonal factor
        projected = round((level + trend * i) * seasonal, 2)
        projected = max(projected, 0)  # no negative spend

        # 80% confidence interval (±1.28 std devs)
        margin = round(1.28 * std_dev * math.sqrt(i), 2)
        data.append({
            "month": month_names[future_month],
            "actual": None,
            "predicted": projected,
            "lower": max(round(projected - margin, 2), 0),
            "upper": round(projected + margin, 2),
            "order_count": None,
        })

    return data


def generate_product_forecast(db: Session) -> List[Dict[str, Any]]:
    """
    Per-product demand forecast: predicts next-month quantity needed
    for each product based on historical PO line items.
    Returns top products with reorder urgency.
    """
    three_months_ago = datetime.utcnow() - timedelta(days=90)

    # Aggregate qty ordered per product in last 3 months
    results = (
        db.query(
            Product.id,
            Product.name,
            Product.sku,
            Product.unit,
            Product.reorder_point,
            Product.reorder_quantity,
            func.sum(POLineItem.quantity).label("total_qty"),
            func.count(func.distinct(PurchaseOrder.id)).label("order_count"),
        )
        .join(POLineItem, POLineItem.product_id == Product.id)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(
            PurchaseOrder.created_at >= three_months_ago,
            PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]),
        )
        .group_by(Product.id, Product.name, Product.sku, Product.unit,
                  Product.reorder_point, Product.reorder_quantity)
        .order_by(func.sum(POLineItem.quantity).desc())
        .limit(10)
        .all()
    )

    forecasts = []
    for r in results:
        avg_monthly = round(float(r.total_qty) / 3, 1)
        next_month_forecast = round(avg_monthly * 1.05, 1)  # 5% growth factor
        forecasts.append({
            "product_id": str(r.id),
            "product_name": r.name,
            "sku": r.sku,
            "unit": r.unit,
            "avg_monthly_qty": avg_monthly,
            "next_month_forecast": next_month_forecast,
            "reorder_point": r.reorder_point,
            "reorder_quantity": r.reorder_quantity,
            "order_frequency": r.order_count,
            "urgency": (
                "critical" if next_month_forecast > r.reorder_point * 2
                else "high" if next_month_forecast > r.reorder_point
                else "normal"
            ),
        })

    return forecasts
