"""
AI Chat Service — RAG (Retrieval Augmented Generation) for procurement chat.
Classifies user intent, fetches relevant data from DB, passes to LLM.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json
import logging

from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.inventory import Inventory
from app.models.purchase_requisition import PurchaseRequisition
from app.models.budget import Budget
from app.services.llm_service import query_llm_with_context

logger = logging.getLogger(__name__)


# ─── Intent Classification ───────────────────────────────────

INTENT_KEYWORDS = {
    "spend": [
        "spent", "spend", "spending", "cost", "budget", "expense", "how much",
        "profit", "revenue", "money", "total", "saving", "savings", "saved",
        "price", "expensive", "cheap", "amount", "financial", "finance",
        "payment", "paid", "pay", "invoice", "bill", "procurement cost",
        "month", "quarter", "year", "weekly", "annual",
    ],
    "po_status": [
        "order", "po", "purchase order", "delivery", "arrive", "shipping",
        "track", "status", "pending", "approved", "sent", "received",
        "where is", "when will", "my order", "recent orders", "last order",
    ],
    "supplier": [
        "supplier", "vendor", "cheapest", "best", "compare", "alternative",
        "who supplies", "who sells", "provider", "partner", "source",
        "rating", "rated", "performance", "reliable", "lead time",
    ],
    "inventory": [
        "stock", "inventory", "quantity", "available", "remaining",
        "low stock", "reorder", "warehouse", "out of stock", "restock",
        "how many", "units", "shortage", "surplus",
    ],
    "overdue": [
        "overdue", "late", "delayed", "behind schedule", "missing",
        "not delivered", "past due", "deadline",
    ],
    "forecast": [
        "predict", "forecast", "next month", "future", "expect", "demand",
        "trend", "projection", "estimate",
    ],
    "category": ["category", "categories", "department"],
    "general": [],  # fallback
}


def classify_intent(question: str) -> str:
    """Classify the user's question into a data-fetching intent."""
    q = question.lower()
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        scores[intent] = sum(1 for kw in keywords if kw in q)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


# ─── Data Fetchers (per intent) ──────────────────────────────

def _fetch_spend_data(db: Session, question: str) -> Dict[str, Any]:
    """Fetch spending data for spend-related questions."""
    now = datetime.utcnow()

    # Last month spend
    month_start = now.replace(day=1, hour=0, minute=0, second=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    this_month = (
        db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.created_at >= month_start,
                PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )

    last_month = (
        db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.created_at >= last_month_start,
                PurchaseOrder.created_at < month_start,
                PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )

    # Spend by category (top 5)
    by_category = (
        db.query(Product.category, func.sum(POLineItem.total_price).label("total"))
        .join(POLineItem, POLineItem.product_id == Product.id)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .group_by(Product.category)
        .order_by(desc("total"))
        .limit(5)
        .all()
    )

    # Spend by supplier (top 5)
    by_supplier = (
        db.query(Supplier.name, func.sum(PurchaseOrder.total_amount).label("total"))
        .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .group_by(Supplier.name)
        .order_by(desc("total"))
        .limit(5)
        .all()
    )

    return {
        "type": "spend_data",
        "this_month_spend": float(this_month),
        "last_month_spend": float(last_month),
        "month_over_month_change": round(((float(this_month) - float(last_month)) / float(last_month) * 100), 1) if float(last_month) > 0 else 0,
        "top_categories": [{"name": c, "total": round(float(t), 2)} for c, t in by_category],
        "top_suppliers": [{"name": s, "total": round(float(t), 2)} for s, t in by_supplier],
        "today": now.strftime("%B %d, %Y"),
    }


def _fetch_po_status_data(db: Session, question: str) -> Dict[str, Any]:
    """Fetch PO status data."""
    recent_pos = (
        db.query(PurchaseOrder, Supplier.name.label("supplier_name"))
        .outerjoin(Supplier, Supplier.id == PurchaseOrder.supplier_id)
        .order_by(desc(PurchaseOrder.created_at))
        .limit(10)
        .all()
    )

    pos = []
    for po, supplier_name in recent_pos:
        pos.append({
            "po_number": po.po_number,
            "status": po.status.value if po.status else "unknown",
            "total": float(po.total_amount) if po.total_amount else 0,
            "supplier": supplier_name or "Unknown",
            "created": po.created_at.strftime("%Y-%m-%d") if po.created_at else "Unknown",
            "expected_delivery": str(po.expected_delivery) if po.expected_delivery else "Not set",
        })

    status_counts = (
        db.query(PurchaseOrder.status, func.count(PurchaseOrder.id))
        .group_by(PurchaseOrder.status)
        .all()
    )

    return {
        "type": "po_status",
        "recent_orders": pos,
        "status_summary": {s.value: c for s, c in status_counts},
        "total_orders": sum(c for _, c in status_counts),
    }


def _fetch_supplier_data(db: Session, question: str) -> Dict[str, Any]:
    """Fetch supplier comparison data."""
    suppliers = (
        db.query(
            Supplier,
            func.count(PurchaseOrder.id).label("order_count"),
            func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label("total_spend"),
        )
        .outerjoin(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .group_by(Supplier.id)
        .order_by(desc("total_spend"))
        .limit(10)
        .all()
    )

    return {
        "type": "supplier_data",
        "suppliers": [{
            "name": s.name,
            "rating": s.rating,
            "status": s.status.value if s.status else "unknown",
            "orders": oc,
            "total_spend": round(float(ts), 2),
            "payment_terms": s.payment_terms,
            "lead_time_days": s.lead_time_days,
        } for s, oc, ts in suppliers],
    }


def _fetch_inventory_data(db: Session, question: str) -> Dict[str, Any]:
    """Fetch inventory and stock data."""
    inventory = (
        db.query(Inventory, Product)
        .join(Product, Product.id == Inventory.product_id)
        .order_by(Inventory.current_stock)
        .limit(15)
        .all()
    )

    low_stock = []
    all_items = []
    for inv, prod in inventory:
        item = {
            "name": prod.name,
            "sku": prod.sku,
            "current_stock": inv.current_stock,
            "reorder_point": prod.reorder_point,
            "reorder_qty": prod.reorder_quantity,
            "unit": prod.unit,
        }
        all_items.append(item)
        if inv.current_stock <= prod.reorder_point:
            low_stock.append(item)

    return {
        "type": "inventory_data",
        "low_stock_items": low_stock,
        "low_stock_count": len(low_stock),
        "all_items": all_items,
    }


def _fetch_overdue_data(db: Session, question: str) -> Dict[str, Any]:
    """Fetch overdue POs."""
    today = datetime.utcnow().date()
    overdue = (
        db.query(PurchaseOrder, Supplier.name.label("supplier_name"))
        .outerjoin(Supplier, Supplier.id == PurchaseOrder.supplier_id)
        .filter(
            PurchaseOrder.expected_delivery < today,
            PurchaseOrder.status.in_([POStatus.sent, POStatus.approved, POStatus.partially_received]),
        )
        .all()
    )

    return {
        "type": "overdue_data",
        "overdue_count": len(overdue),
        "overdue_orders": [{
            "po_number": po.po_number,
            "supplier": sn or "Unknown",
            "expected": str(po.expected_delivery),
            "days_overdue": (today - po.expected_delivery).days,
            "total": float(po.total_amount) if po.total_amount else 0,
        } for po, sn in overdue],
    }


def _fetch_general_data(db: Session, question: str) -> Dict[str, Any]:
    """Fetch comprehensive summary data — includes financials, suppliers, POs, inventory."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)

    total_products = db.query(func.count(Product.id)).scalar()
    total_suppliers = db.query(func.count(Supplier.id)).filter(Supplier.status == "active").scalar()
    total_pos = db.query(func.count(PurchaseOrder.id)).scalar()
    pending_prs = db.query(func.count(PurchaseRequisition.id)).filter(
        PurchaseRequisition.status.in_(["submitted", "under_review"])
    ).scalar()

    # Financials
    total_spend = float(
        db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )
    this_month_spend = float(
        db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.created_at >= month_start,
                PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )
    avg_order = round(total_spend / total_pos, 2) if total_pos > 0 else 0

    # Top 5 suppliers by spend
    top_suppliers = (
        db.query(Supplier.name, func.sum(PurchaseOrder.total_amount).label("total"))
        .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .group_by(Supplier.name)
        .order_by(desc("total"))
        .limit(5)
        .all()
    )

    # Top 5 categories by spend
    top_categories = (
        db.query(Product.category, func.sum(POLineItem.total_price).label("total"))
        .join(POLineItem, POLineItem.product_id == Product.id)
        .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
        .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .group_by(Product.category)
        .order_by(desc("total"))
        .limit(5)
        .all()
    )

    # Recent POs (last 5)
    recent_pos = (
        db.query(PurchaseOrder.po_number, PurchaseOrder.status, PurchaseOrder.total_amount,
                 Supplier.name.label("supplier"))
        .outerjoin(Supplier, Supplier.id == PurchaseOrder.supplier_id)
        .order_by(desc(PurchaseOrder.created_at))
        .limit(5)
        .all()
    )

    # Low stock count
    low_stock_count = (
        db.query(func.count(Inventory.id))
        .join(Product, Product.id == Inventory.product_id)
        .filter(Inventory.current_stock <= Product.reorder_point)
        .scalar()
    )

    # PO status breakdown
    status_counts = (
        db.query(PurchaseOrder.status, func.count(PurchaseOrder.id))
        .group_by(PurchaseOrder.status)
        .all()
    )

    return {
        "type": "comprehensive_summary",
        "total_products": total_products,
        "active_suppliers": total_suppliers,
        "total_purchase_orders": total_pos,
        "pending_requisitions": pending_prs,
        "total_spend": total_spend,
        "this_month_spend": this_month_spend,
        "average_order_value": avg_order,
        "top_suppliers_by_spend": [{"name": s, "total": round(float(t), 2)} for s, t in top_suppliers],
        "top_categories_by_spend": [{"name": c, "total": round(float(t), 2)} for c, t in top_categories],
        "recent_orders": [
            {"po_number": po, "status": st.value if st else "unknown", "total": float(amt) if amt else 0, "supplier": sup}
            for po, st, amt, sup in recent_pos
        ],
        "low_stock_items_count": low_stock_count,
        "po_status_breakdown": {s.value: c for s, c in status_counts},
        "today": now.strftime("%B %d, %Y"),
        "note": "This procurement system tracks purchase orders, not revenue/profit. Total spend represents all non-draft, non-cancelled PO amounts.",
    }


# ─── Intent → Fetcher mapping ───────────────────────────

INTENT_FETCHERS = {
    "spend": _fetch_spend_data,
    "po_status": _fetch_po_status_data,
    "supplier": _fetch_supplier_data,
    "inventory": _fetch_inventory_data,
    "overdue": _fetch_overdue_data,
    "forecast": _fetch_spend_data,  # reuse spend data for forecast context
    "category": _fetch_spend_data,
    "general": _fetch_general_data,
}


# ─── Main Chat Function ────────────────────────────────────

async def chat_with_assistant(
    question: str,
    db: Session,
    user_name: str = "User",
    user_role: str = "admin",
) -> Dict[str, Any]:
    """
    Main RAG chat function:
    1. Classify intent
    2. Fetch relevant data
    3. Query LLM with context
    4. Return response
    """
    intent = classify_intent(question)
    logger.info(f"Chat intent: {intent} for question: '{question[:60]}...'")

    # Fetch relevant data
    fetcher = INTENT_FETCHERS.get(intent, _fetch_general_data)
    context_data = fetcher(db, question)
    context_data["user_name"] = user_name
    context_data["user_role"] = user_role

    # Query LLM
    result = await query_llm_with_context(question, context_data)

    return {
        "answer": result.get("content", "I'm sorry, I couldn't process your question right now."),
        "intent": intent,
        "success": result.get("success", False),
        "usage": result.get("usage"),
    }
