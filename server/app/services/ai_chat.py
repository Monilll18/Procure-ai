"""
AI Chat Service — RBAC-Layered RAG (Retrieval Augmented Generation).

Role-based access control for AI assistant responses:
  • admin        → Full system data: financials, suppliers, team, fraud, all POs
  • manager      → Operational + financial data: spend, suppliers, POs, inventory
  • procurement_officer → Operational data: inventory, POs, products, suppliers (no financials)
  • approver     → Financial oversight: budgets, spend, approvals (no supplier details)
  • viewer       → Generic help only: system guidance, no live data
  • supplier     → Own orders only: their POs, responses, no other supplier data

Each role gets a tailored system prompt that instructs the LLM to refuse
out-of-scope questions with a polite boundary message.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json
import logging
import re

from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.inventory import Inventory
from app.models.purchase_requisition import PurchaseRequisition
from app.models.budget import Budget
from app.services.llm_service import query_llm

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# Intent Classification
# ═══════════════════════════════════════════════════════════════

INTENT_KEYWORDS = {
    "spend": [
        "spent", "spend", "spending", "cost", "budget", "expense", "how much",
        "money", "total", "saving", "savings", "price", "amount", "financial",
        "payment", "paid", "invoice", "bill", "procurement cost",
        "month", "quarter", "year", "annual",
    ],
    "po_status": [
        "order", "po", "purchase order", "delivery", "arrive", "shipping",
        "track", "status", "pending", "approved", "sent", "received",
        "where is", "when will", "my order", "recent orders",
    ],
    "supplier": [
        "supplier", "vendor", "cheapest", "best", "compare", "alternative",
        "who supplies", "who sells", "provider", "rating", "performance",
        "reliable", "lead time",
    ],
    "inventory": [
        "stock", "inventory", "quantity", "available", "remaining",
        "low stock", "reorder", "out of stock", "restock",
        "how many", "units", "shortage",
    ],
    "overdue": [
        "overdue", "late", "delayed", "behind schedule", "missing",
        "not delivered", "past due", "deadline",
    ],
    "approval": [
        "approval", "approve", "reject", "pending approval", "backlog",
        "review", "requisition",
    ],
    "help": [
        "how do i", "how to", "what is", "what does", "explain",
        "help", "guide", "tutorial", "where can i", "show me how",
    ],
    "general": [],
}

GREETING_RE = re.compile(
    r"^\s*(h(i|ey|ello|yy|ii|ola)|yo|sup|what'?s?\s*up|"
    r"good\s*(morning|evening|afternoon)|greetings|howdy|namaste)\s*[!?.]*\s*$",
    re.IGNORECASE,
)


# Patterns that indicate the user wants navigational help, not raw data
HOW_TO_RE = re.compile(
    r"(how\s+(can|do|to|should)\s+i|where\s+(can|do)\s+i|what\s+steps|walk\s+me|guide\s+me|show\s+me\s+how|i\s+am\s+(new|a\s+new))",
    re.IGNORECASE,
)


def classify_intent(question: str) -> str:
    """Classify the user's question into a data-fetching intent."""
    if GREETING_RE.match(question):
        return "greeting"

    q = question.lower()

    # Priority: if the user is asking HOW to do something, route to help
    # regardless of data keywords like 'approve', 'order', etc.
    if HOW_TO_RE.search(q):
        return "help"

    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        scores[intent] = sum(1 for kw in keywords if kw in q)
    
    if not any(scores.values()):
        return "general"
    
    top_score = max(scores.values())
    # When multiple intents tie, use a priority order.
    # More specific intents win over broad ones.
    INTENT_PRIORITY = ["po_status", "approval", "overdue", "supplier", "inventory", "spend", "help", "general"]
    for intent in INTENT_PRIORITY:
        if scores.get(intent, 0) == top_score:
            return intent
    
    return max(scores, key=scores.get)


# ═══════════════════════════════════════════════════════════════
# RBAC Access Definitions
# ═══════════════════════════════════════════════════════════════

# Which intents each role is allowed to query with live data
ROLE_ALLOWED_INTENTS: Dict[str, set] = {
    "admin": {"spend", "po_status", "supplier", "inventory", "overdue", "approval", "help", "general"},
    "manager": {"spend", "po_status", "supplier", "inventory", "overdue", "approval", "help", "general"},
    "procurement_officer": {"po_status", "supplier", "inventory", "overdue", "help", "general"},
    "approver": {"spend", "approval", "help", "general"},
    "viewer": {"help"},
    "supplier": {"po_status", "help"},
}

ROLE_DENIED_MSG = {
    "viewer": "I can help you navigate the system and answer general questions. For detailed procurement data, your current role (Viewer) doesn't have access. Please contact your admin for elevated permissions.",
    "supplier": "I can only assist with your own purchase orders and communications with the procurement team. I cannot share information about other suppliers, internal pricing, or system-wide data.",
    "procurement_officer": "That information is outside your role's scope. As a Procurement Officer, I can help with inventory, orders, suppliers, and product data. For financial analytics or approvals, please contact your manager.",
    "approver": "As a Finance Approver, I can help with spend analysis, budgets, and approval workflows. For operational data like inventory or supplier management, please contact the procurement team.",
}


# ═══════════════════════════════════════════════════════════════
# Role-Aware System Prompts
# ═══════════════════════════════════════════════════════════════

def _build_system_prompt(role: str, user_name: str) -> str:
    """Build a role-specific system prompt that enforces data boundaries."""

    base = f"""You are ProcureAI, a concise AI procurement assistant. The user is "{user_name}" with role "{role}".

RESPONSE RULES:
- STRICT NAVIGATIONAL RULE: For "how do I" or navigational questions, ONLY give 1-2 sentence action steps (e.g. "Go to Approvals page > click Approve"). DO NOT mention any specific orders, amounts, or suppliers from the context data.
- NEVER volunteer extra data. If the user asks a simple question, give a short answer.
- Answer ONLY from the provided context data. Never invent numbers or math.
- If context data is missing fields like 'total', it means the user's role is restricted. Do not guess the amounts.
- If context data is insufficient, say "I don't have enough data to answer that."
- Keep responses under 60 words by default unless explicitly asked for detail."""

    role_rules = {
        "admin": """
ACCESS LEVEL: FULL — You may discuss all system data including financials, team performance, fraud, suppliers, and operational metrics.
You are speaking to an administrator. Be precise and detailed when asked.""",

        "manager": """
ACCESS LEVEL: HIGH — You may discuss spend, suppliers, orders, inventory, and approvals.
You MUST NOT reveal: individual team member salaries, system configuration secrets, or raw API keys.
If asked about admin-only settings, respond: "This requires admin access. Please contact your system administrator." """,

        "procurement_officer": """
ACCESS LEVEL: OPERATIONAL — You may discuss inventory, purchase orders, products, and supplier info.
You MUST NOT reveal: total company spend, budget allocations, approval workflows, financial analytics, or other teams' data.
If asked about financials or budgets, respond: "Financial data is restricted to your role. For budget inquiries, please contact your manager." """,

        "approver": """
ACCESS LEVEL: FINANCIAL — You may discuss spend analytics, budget utilization, and approval queues.
You MUST NOT reveal: supplier contact details, negotiation terms, inventory operational data, or procurement workflows.
If asked about operational procurement, respond: "Operational procurement data is outside your scope. Please contact the procurement team." """,

        "viewer": """
ACCESS LEVEL: READ-ONLY HELP — You may ONLY answer generic questions about how the system works, navigation help, and feature explanations.
You MUST NOT reveal any live data: no spend numbers, no supplier names, no order details, no inventory counts.
For ANY data question, respond: "Your Viewer role provides read-only dashboard access. For detailed data queries, please contact your admin for role elevation." """,

        "supplier": """
ACCESS LEVEL: SUPPLIER-RESTRICTED — You may ONLY discuss this supplier's own purchase orders and communications.
You MUST NOT reveal: other suppliers' data, internal pricing strategies, company spend, inventory levels, or any internal operational data.
For ANY question about other suppliers or internal data, respond: "I can only assist with your own orders and communications with the procurement team. This information is not available to supplier accounts." """,
    }

    return base + role_rules.get(role, role_rules["viewer"])


# ═══════════════════════════════════════════════════════════════
# Data Fetchers (per intent) — with role-based filtering
# ═══════════════════════════════════════════════════════════════

def _fetch_spend_data(db: Session, question: str, role: str, supplier_id: Optional[str] = None) -> Dict[str, Any]:
    """Fetch spending data. Only for admin/manager/approver."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)
    
    if supplier_id:
        # Suppliers only see their own total spend
        total_val = float(
            db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
            .filter(PurchaseOrder.supplier_id == supplier_id)
            .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
            .scalar()
        )
        return {
            "type": "spend_analysis",
            "total_order_value": total_val,
            "scope": "your_company_orders",
            "today": now.strftime("%B %d, %Y"),
        }

    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    this_month = float(
        db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.created_at >= month_start,
                PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )
    last_month = float(
        db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
        .filter(PurchaseOrder.created_at >= last_month_start,
                PurchaseOrder.created_at < month_start,
                PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
        .scalar()
    )

    data = {
        "type": "spend_data",
        "this_month_spend": this_month,
        "last_month_spend": last_month,
        "month_over_month_change": round(((this_month - last_month) / last_month * 100), 1) if last_month > 0 else 0,
        "today": now.strftime("%B %d, %Y"),
    }

    # Admin/Manager get supplier + category breakdown
    if role in ("admin", "manager"):
        by_category = (
            db.query(Product.category, func.sum(POLineItem.total_price).label("total"))
            .join(POLineItem, POLineItem.product_id == Product.id)
            .join(PurchaseOrder, PurchaseOrder.id == POLineItem.po_id)
            .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
            .group_by(Product.category).order_by(desc("total")).limit(5).all()
        )
        by_supplier = (
            db.query(Supplier.name, func.sum(PurchaseOrder.total_amount).label("total"))
            .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
            .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
            .group_by(Supplier.name).order_by(desc("total")).limit(5).all()
        )
        data["top_categories"] = [{"name": c, "total": round(float(t), 2)} for c, t in by_category]
        data["top_suppliers"] = [{"name": s, "total": round(float(t), 2)} for s, t in by_supplier]

    return data


def _fetch_po_status_data(db: Session, question: str, role: str, supplier_id: Optional[str] = None) -> Dict[str, Any]:
    """Fetch PO status data."""
    query = db.query(PurchaseOrder, Supplier.name.label("supplier_name")).outerjoin(
        Supplier, Supplier.id == PurchaseOrder.supplier_id
    )

    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)

    recent_pos = query.order_by(desc(PurchaseOrder.created_at)).limit(10).all()

    pos = []
    for po, supplier_name in recent_pos:
        item = {
            "po_number": po.po_number,
            "status": po.status.value if po.status else "unknown",
            "total": float(po.total_amount) if po.total_amount else 0,
            "supplier": supplier_name or "Unknown",
            "created": po.created_at.strftime("%Y-%m-%d") if po.created_at else "Unknown",
        }
        # Only admin/manager see amounts (internal)
        # Suppliers CAN see their own amounts
        if role not in ("admin", "manager", "supplier"):
            item.pop("total", None)
        pos.append(item)

    count_query = db.query(PurchaseOrder.status, func.count(PurchaseOrder.id))
    if supplier_id:
        count_query = count_query.filter(PurchaseOrder.supplier_id == supplier_id)

    status_counts = count_query.group_by(PurchaseOrder.status).all()

    # Also compute total amount per status for richer answers
    amount_query = db.query(
        PurchaseOrder.status,
        func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label("total")
    )
    if supplier_id:
        amount_query = amount_query.filter(PurchaseOrder.supplier_id == supplier_id)
    status_amounts = amount_query.group_by(PurchaseOrder.status).all()

    return {
        "type": "po_status",
        "recent_orders": pos,
        "status_summary": {s.value: c for s, c in status_counts},
        "status_totals": {s.value: round(float(t), 2) for s, t in status_amounts},
        "total_orders": sum(c for _, c in status_counts),
        "total_value": round(sum(float(t) for _, t in status_amounts), 2),
    }


def _fetch_supplier_data(db: Session, question: str, role: str) -> Dict[str, Any]:
    """Fetch supplier data. Admin/Manager get full details, officer gets limited."""
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

    result = []
    for s, oc, ts in suppliers:
        item = {
            "name": s.name,
            "rating": s.rating,
            "status": s.status.value if s.status else "unknown",
            "orders": oc,
        }
        # Only admin/manager see spend + financial details
        if role in ("admin", "manager"):
            item["total_spend"] = round(float(ts), 2)
            item["payment_terms"] = s.payment_terms
            item["lead_time_days"] = s.lead_time_days

        result.append(item)

    return {"type": "supplier_data", "suppliers": result}


def _fetch_inventory_data(db: Session, question: str, role: str) -> Dict[str, Any]:
    """Fetch inventory data."""
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
            "unit": prod.unit,
        }
        all_items.append(item)
        if inv.current_stock <= prod.reorder_point:
            low_stock.append(item)

    return {
        "type": "inventory_data",
        "low_stock_items": low_stock,
        "low_stock_count": len(low_stock),
        "all_items": all_items[:10],  # Cap to reduce tokens
    }


def _fetch_overdue_data(db: Session, question: str, role: str) -> Dict[str, Any]:
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
        } for po, sn in overdue],
    }


def _fetch_approval_data(db: Session, question: str, role: str) -> Dict[str, Any]:
    """Fetch approval queue data."""
    pending_prs = (
        db.query(func.count(PurchaseRequisition.id))
        .filter(PurchaseRequisition.status.in_(["submitted", "under_review"]))
        .scalar()
    )
    pending_pos = (
        db.query(func.count(PurchaseOrder.id))
        .filter(PurchaseOrder.status == POStatus.pending_approval)
        .scalar()
    )

    return {
        "type": "approval_data",
        "pending_requisitions": pending_prs,
        "pending_purchase_orders": pending_pos,
        "total_pending": pending_prs + pending_pos,
    }


def _fetch_help_data(db: Session, question: str, role: str) -> Dict[str, Any]:
    """Return system help context (no live data)."""
    return {
        "type": "system_help",
        "system_name": "ProcureAI — AI-Powered Procurement Platform",
        "features": [
            "Dashboard: overview of KPIs and recent activity",
            "Products: manage product catalog with categories",
            "Suppliers: track supplier performance and ratings",
            "Inventory: monitor stock levels and reorder alerts",
            "Requisitions: create and submit purchase requests",
            "Purchase Orders: generate, approve, and track POs",
            "AI Insights: automated spend analysis and forecasts",
            "Analytics: charts and reports on procurement metrics",
        ],
        "user_role": role,
        "note": "Answer based on the user's role. Explain only features they have access to.",
    }


def _fetch_general_data(db: Session, question: str, role: str, supplier_id: Optional[str] = None) -> Dict[str, Any]:
    """Fetch a compact summary — scoped by role."""
    now = datetime.utcnow()

    if supplier_id:
        # Supplier specific summary
        total_catalog = db.query(func.count(SupplierPrice.id)).filter(SupplierPrice.supplier_id == supplier_id).scalar()
        total_pos = db.query(func.count(PurchaseOrder.id)).filter(PurchaseOrder.supplier_id == supplier_id).scalar()
        total_value = float(
            db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
            .filter(PurchaseOrder.supplier_id == supplier_id)
            .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
            .scalar()
        )
        return {
            "type": "summary",
            "catalog_items": total_catalog,
            "your_purchase_orders": total_pos,
            "total_order_value": total_value,
            "today": now.strftime("%B %d, %Y"),
            "scope": "your_supplier_portal",
        }

    total_products = db.query(func.count(Product.id)).scalar()
    total_suppliers = db.query(func.count(Supplier.id)).filter(Supplier.status == "active").scalar()
    total_pos = db.query(func.count(PurchaseOrder.id)).scalar()

    data: Dict[str, Any] = {
        "type": "summary",
        "total_products": total_products,
        "active_suppliers": total_suppliers,
        "total_purchase_orders": total_pos,
        "today": now.strftime("%B %d, %Y"),
    }

    # Only admin/manager/approver get financials
    if role in ("admin", "manager", "approver"):
        total_spend = float(
            db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
            .filter(PurchaseOrder.status.notin_([POStatus.draft, POStatus.cancelled]))
            .scalar()
        )
        data["total_spend"] = total_spend

    # Status breakdown for operational roles
    if role in ("admin", "manager", "procurement_officer"):
        status_counts = (
            db.query(PurchaseOrder.status, func.count(PurchaseOrder.id))
            .group_by(PurchaseOrder.status).all()
        )
        data["po_status_breakdown"] = {s.value: c for s, c in status_counts}

    return data


# ─── Intent → Fetcher mapping ───────────────────────────
INTENT_FETCHERS = {
    "spend": _fetch_spend_data,
    "po_status": _fetch_po_status_data,
    "supplier": _fetch_supplier_data,
    "inventory": _fetch_inventory_data,
    "overdue": _fetch_overdue_data,
    "approval": _fetch_approval_data,
    "help": _fetch_help_data,
    "general": _fetch_general_data,
}


# ═══════════════════════════════════════════════════════════════
# Main Chat Function
# ═══════════════════════════════════════════════════════════════

async def chat_with_assistant(
    question: str,
    db: Session,
    user_name: str = "User",
    user_role: str = "viewer",
    supplier_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    RBAC-layered RAG chat:
    1. Detect greetings → respond without LLM
    2. Classify intent based on role
    3. Gate intent (Role-Based Access Control)
    4. Fetch context scoped by role and supplier_id
    5. Generate persona-driven response
    """
    intent = classify_intent(question)
    logger.info(f"Chat intent={intent} role={user_role} q='{question[:60]}'")

    # ── Greeting shortcut (no LLM, no DB) ──
    if intent == "greeting":
        return {
            "answer": f"Hey {user_name.split(' ')[0]}! 👋 How can I help you with procurement today?",
            "intent": "greeting",
            "success": True,
            "usage": {"total_tokens": 0},
        }

    # ── RBAC gate ──
    allowed = ROLE_ALLOWED_INTENTS.get(user_role, set())
    if intent not in allowed and intent != "greeting":
        denied_msg = ROLE_DENIED_MSG.get(user_role, "This query is outside your role's access level. Please contact your administrator.")
        return {
            "answer": denied_msg,
            "intent": intent,
            "success": True,
            "usage": {"total_tokens": 0},
        }

    # ── Fetch role-filtered data ──
    fetcher = INTENT_FETCHERS.get(intent, _fetch_general_data)
    
    # Check if fetcher accepts supplier_id
    import inspect
    sig = inspect.signature(fetcher)
    if "supplier_id" in sig.parameters:
        context_data = fetcher(db, question, user_role, supplier_id)
    else:
        context_data = fetcher(db, question, user_role)

    # ── Build role-aware prompt ──
    system_prompt = _build_system_prompt(user_role, user_name)

    # Detect if user wants detail
    wants_detail = any(w in question.lower() for w in [
        "detail", "explain", "break down", "tell me more", "elaborate",
        "briefly", "in depth", "full", "everything", "all",
    ])
    word_limit = 150 if wants_detail else 60

    prompt = f"""CONTEXT (live company data - filtered for {user_role} role):
{json.dumps(context_data, indent=2, default=str)}

USER QUESTION: {question}

Rules:
- If this is a "how do I" question, give short action steps (navigate to X, click Y). DO NOT summarize the context data.
- Do NOT volunteer information the user did not ask for.
- Keep under {word_limit} words."""

    result = await query_llm(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.3,
        max_tokens=512,
    )

    return {
        "answer": result.get("content", "I'm sorry, I couldn't process your question right now."),
        "intent": intent,
        "success": result.get("success", False),
        "usage": result.get("usage"),
    }
