"""
AI Router — endpoints for all AI/LLM features.
Integrations: NL Purchase Requests, Chat Assistant, Supplier Explanation,
Email Parsing, Price Sheet Parsing.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.services.llm_service import (
    parse_natural_language_request,
    generate_supplier_explanation,
    parse_supplier_email,
    parse_price_sheet_text,
)
from app.services.ai_chat import chat_with_assistant

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────

class NLParseRequest(BaseModel):
    user_input: str
    include_stock: bool = True


class ChatRequest(BaseModel):
    question: str
    user_name: Optional[str] = "User"
    user_role: Optional[str] = "admin"


class SupplierExplainRequest(BaseModel):
    product_name: str
    quantity: int = 1
    urgency: str = "medium"
    supplier_scores: List[dict]


class EmailParseRequest(BaseModel):
    email_text: str


class PriceSheetParseRequest(BaseModel):
    raw_text: str


# ─── Integration 1: Natural Language Purchase Request ─────────

@router.post("/parse-request")
async def parse_purchase_request(data: NLParseRequest, db: Session = Depends(get_db)):
    """
    Parse a natural language purchase request into structured PR data.

    Example input: "I need 50 boxes of A4 paper and 10 ink cartridges
                    for the marketing team by next Friday"
    """
    # Fetch product catalog from DB
    products = db.query(Product).limit(100).all()
    catalog = [
        {
            "id": str(p.id),
            "name": p.name,
            "sku": p.sku,
            "category": p.category,
            "unit": p.unit,
            "price": p.price,
        }
        for p in products
    ]

    # Optionally include stock levels
    stock = None
    if data.include_stock:
        inv_items = (
            db.query(Inventory, Product)
            .join(Product, Product.id == Inventory.product_id)
            .limit(50)
            .all()
        )
        stock = [
            {
                "product": prod.name,
                "sku": prod.sku,
                "current_stock": inv.current_stock,
                "reorder_point": prod.reorder_point,
            }
            for inv, prod in inv_items
        ]

    result = await parse_natural_language_request(
        user_input=data.user_input,
        product_catalog=catalog,
        current_stock=stock,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "AI parsing failed"))

    return {
        "parsed": result.get("content"),
        "raw_response": result.get("raw"),
        "usage": result.get("usage"),
    }


# ─── Integration 8: AI Chat Assistant (RAG) ──────────────────

@router.post("/chat")
async def ai_chat(data: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG-powered AI chat. User asks questions in natural language,
    system fetches relevant data and answers using LLM.

    Examples:
    - "How much did we spend on IT last quarter?"
    - "Which supplier is cheapest for ink?"
    - "Show me all overdue deliveries"
    """
    try:
        result = await chat_with_assistant(
            question=data.question,
            db=db,
            user_name=data.user_name or "User",
            user_role=data.user_role or "admin",
        )

        return {
            "answer": result.get("answer", "Sorry, I couldn't process that."),
            "intent": result.get("intent", "general"),
            "success": result.get("success", False),
            "usage": result.get("usage"),
        }
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return {
            "answer": f"AI service error: {str(e)}",
            "intent": "error",
            "success": False,
        }


# ─── Integration 7B: Supplier Recommendation Explanation ─────

@router.post("/explain-supplier")
async def explain_supplier_choice(data: SupplierExplainRequest):
    """
    Take ML supplier scores and generate a human-friendly
    recommendation using LLM.
    """
    result = await generate_supplier_explanation(
        product_name=data.product_name,
        quantity=data.quantity,
        supplier_scores=data.supplier_scores,
        urgency=data.urgency,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "AI explanation failed"))

    return {
        "explanation": result.get("content"),
        "usage": result.get("usage"),
    }


# ─── Integration 5: Supplier Email Parsing ───────────────────

@router.post("/parse-email")
async def parse_email(data: EmailParseRequest, db: Session = Depends(get_db)):
    """
    Parse a supplier email/quote into structured data.
    Extracts: items, prices, availability, terms, delivery timeline.
    """
    products = db.query(Product).limit(100).all()
    catalog = [
        {"id": str(p.id), "name": p.name, "sku": p.sku}
        for p in products
    ]

    result = await parse_supplier_email(
        email_text=data.email_text,
        product_catalog=catalog,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Email parsing failed"))

    return {
        "parsed": result.get("content"),
        "usage": result.get("usage"),
    }


# ─── Integration 3: Price Sheet Text Parsing ─────────────────

@router.post("/parse-price-sheet")
async def parse_price_sheet(data: PriceSheetParseRequest, db: Session = Depends(get_db)):
    """
    Parse OCR-extracted text from a price sheet into structured prices.
    Called after OCR extracts raw text from PDF/image.
    """
    products = db.query(Product).limit(100).all()
    catalog = [
        {"id": str(p.id), "name": p.name, "sku": p.sku}
        for p in products
    ]

    result = await parse_price_sheet_text(
        raw_text=data.raw_text,
        product_catalog=catalog,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Price sheet parsing failed"))

    return {
        "parsed": result.get("content"),
        "usage": result.get("usage"),
    }


# ─── Integration 7A: ML Supplier Scoring ─────────────────────

@router.get("/score-supplier/{supplier_id}")
async def score_supplier_endpoint(supplier_id: str, product_id: str = None, db: Session = Depends(get_db)):
    """
    Score a supplier using weighted ML algorithm.
    Components: price (30%), delivery (30%), quality (25%), response (15%).
    """
    from app.services.supplier_scorer import score_supplier
    result = score_supplier(supplier_id, product_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/rank-suppliers/{product_id}")
async def rank_suppliers_endpoint(product_id: str, limit: int = 5, db: Session = Depends(get_db)):
    """
    Rank all suppliers for a product using ML scoring.
    Returns sorted list with scores and breakdown.
    """
    from app.services.supplier_scorer import rank_suppliers_for_product
    return rank_suppliers_for_product(product_id, db, limit)


# ─── Integration 6: Price Anomaly Detection ──────────────────

class PriceCheckRequest(BaseModel):
    product_id: str
    new_price: float


@router.post("/check-price")
async def check_price_anomaly(data: PriceCheckRequest, db: Session = Depends(get_db)):
    """
    Check if a new price is anomalous using IsolationForest ML.
    Returns: is_anomaly, deviation %, historical stats.
    """
    from app.services.anomaly_service import detect_price_anomaly
    return detect_price_anomaly(data.product_id, data.new_price, db)


@router.get("/price-anomalies")
async def get_price_anomalies(db: Session = Depends(get_db)):
    """Scan all recent prices and return any anomalies found."""
    from app.services.anomaly_service import batch_check_prices
    return batch_check_prices(db)


# ─── Integration 10: Fraud Detection ─────────────────────────

@router.get("/fraud-scan")
async def scan_fraud_patterns(db: Session = Depends(get_db)):
    """
    Scan for suspicious procurement patterns:
    - Split orders (same user, same supplier, just below limit)
    - Large orders with new suppliers
    - Off-hours PO activity
    """
    from app.services.anomaly_service import detect_fraud_patterns
    return detect_fraud_patterns(db)


# ─── Health Check ─────────────────────────────────────────────

@router.get("/health")
async def ai_health():
    """Check if AI service is configured and ready."""
    import os
    api_key = os.getenv("ZHIPU_API_KEY", "")
    return {
        "llm_configured": bool(api_key),
        "llm_provider": "Zhipu AI (GLM-4)",
        "model": os.getenv("GLM_MODEL", "glm-4-flash"),
        "features": {
            "llm": [
                "parse-request (NL → structured PR)",
                "chat (RAG assistant)",
                "explain-supplier (LLM recommendation)",
                "parse-email (supplier quote extraction)",
                "parse-price-sheet (OCR text → prices)",
            ],
            "ml": [
                "score-supplier (weighted scoring)",
                "rank-suppliers (product-level ranking)",
                "check-price (IsolationForest anomaly)",
                "fraud-scan (pattern detection)",
            ],
        },
    }
