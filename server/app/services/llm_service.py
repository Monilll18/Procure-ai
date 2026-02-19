"""
LLM Service — Central wrapper for Zhipu AI GLM-4.
All AI features route through this service for consistent
error handling, retries, and token tracking.
"""
import os
import re
import json
import time
import asyncio
import logging
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# GLM-4 API configuration
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
GLM_MODEL = os.getenv("GLM_MODEL", "glm-4.5-flash")  # Free tier model

# ─── Hardening Constants ──────────────────────────────────────
LLM_TIMEOUT_SECONDS = 30          # Max seconds to wait for LLM response
LLM_MAX_RETRIES = 2               # Retry transient failures this many times
LLM_MAX_TOKENS_CAP = 4096        # Never exceed this token budget
LLM_MAX_PROMPT_CHARS = 8000      # Truncate prompts longer than this

# Regex to strip prompt injection / control characters from user input
_CONTROL_CHAR_RE = re.compile(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]')


def _sanitize_input(text: str, max_chars: int = LLM_MAX_PROMPT_CHARS) -> str:
    """Strip control chars and truncate to max_chars."""
    cleaned = _CONTROL_CHAR_RE.sub('', text)
    if len(cleaned) > max_chars:
        logger.warning(f"Input truncated from {len(cleaned)} to {max_chars} chars")
        cleaned = cleaned[:max_chars] + "\n[...truncated]"
    return cleaned


def _get_client():
    """Lazy-load the ZhipuAI client."""
    try:
        from zhipuai import ZhipuAI
        if not ZHIPU_API_KEY:
            raise ValueError("ZHIPU_API_KEY not set in .env")
        return ZhipuAI(api_key=ZHIPU_API_KEY)
    except ImportError as e:
        raise ImportError(f"zhipuai import failed: {e}. Run: pip install zhipuai sniffio")


async def query_llm(
    prompt: str,
    system_prompt: str = "You are a helpful procurement assistant.",
    json_mode: bool = False,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Send a query to GLM-4 and return the response.
    Hardened with: timeout, retry+backoff, input sanitization, token budget cap.

    Args:
        prompt: User message
        system_prompt: System instruction
        json_mode: If True, forces JSON output
        temperature: Creativity (0.0 = deterministic, 1.0 = creative)
        max_tokens: Maximum response length (capped at LLM_MAX_TOKENS_CAP)
        model: Override default model

    Returns:
        dict with 'content' (str|dict), 'usage' (dict), 'success' (bool)
    """
    client = _get_client()
    use_model = model or GLM_MODEL

    # ── Input hardening ──────────────────────────────────────────
    prompt = _sanitize_input(prompt, LLM_MAX_PROMPT_CHARS)
    system_prompt = _sanitize_input(system_prompt, 2000)
    max_tokens = min(max_tokens, LLM_MAX_TOKENS_CAP)  # enforce budget cap

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]

    kwargs: Dict[str, Any] = {
        "model": use_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    # ── Retry loop with exponential backoff ──────────────────────
    last_error: Exception = Exception("Unknown error")
    for attempt in range(LLM_MAX_RETRIES + 1):
        try:
            # ── Timeout guard ────────────────────────────────────
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: client.chat.completions.create(**kwargs)),
                timeout=LLM_TIMEOUT_SECONDS,
            )

            content = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

            logger.info(
                f"LLM call success — model={use_model}, "
                f"tokens={usage['total_tokens']}, attempt={attempt + 1}"
            )

            # ── JSON stripping ───────────────────────────────────
            if json_mode:
                try:
                    content_stripped = content.strip()
                    content_stripped = re.sub(r'^```(?:json)?\s*', '', content_stripped)
                    content_stripped = re.sub(r'\s*```$', '', content_stripped)
                    content_stripped = content_stripped.strip()
                    if not content_stripped.startswith(('{', '[')):
                        m = re.search(r'[{\[]', content_stripped)
                        if m:
                            content_stripped = content_stripped[m.start():]
                    parsed = json.loads(content_stripped)
                    return {"content": parsed, "raw": content, "usage": usage, "success": True}
                except json.JSONDecodeError as je:
                    logger.warning(f"LLM returned non-JSON despite json_mode=True: {je}")
                    return {"content": content, "raw": content, "usage": usage, "success": True, "json_error": True}

            return {"content": content, "usage": usage, "success": True}

        except asyncio.TimeoutError:
            last_error = TimeoutError(f"LLM call timed out after {LLM_TIMEOUT_SECONDS}s")
            logger.error(f"LLM timeout on attempt {attempt + 1}")
            # Don't retry timeouts — the model is overloaded, fail fast
            break

        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            # Only retry on transient network/server errors, not on auth/quota errors
            is_transient = any(kw in err_str for kw in ["connection", "timeout", "503", "502", "500", "network"])
            if is_transient and attempt < LLM_MAX_RETRIES:
                wait = 2 ** attempt  # 1s, 2s
                logger.warning(f"LLM transient error (attempt {attempt + 1}), retrying in {wait}s: {e}")
                await asyncio.sleep(wait)
            else:
                logger.error(f"LLM call failed (attempt {attempt + 1}): {e}")
                break

    return {"content": None, "error": str(last_error), "success": False}


async def query_llm_with_context(
    question: str,
    context_data: Dict[str, Any],
    system_prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    RAG-style query: send question + database context to LLM.
    Used by the AI chat assistant.
    """
    default_system = """You are an AI procurement assistant with access to live company data.
Answer questions accurately using ONLY the data provided in the context.
Be specific with numbers, dates, and names. Keep answers concise but helpful.
If the data doesn't contain enough information to answer, say so clearly.
Format currency amounts with $ and commas. Use bullet points for lists."""

    prompt = f"""CONTEXT (live company data):
{json.dumps(context_data, indent=2, default=str)}

USER QUESTION: {question}

Answer based on the context above. Be specific and cite actual numbers."""

    return await query_llm(
        prompt=prompt,
        system_prompt=system_prompt or default_system,
        temperature=0.3,  # Lower for factual accuracy
        max_tokens=1024,
    )


async def parse_natural_language_request(
    user_input: str,
    product_catalog: List[Dict],
    current_stock: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Parse a natural language purchase request into structured PR data.
    Integration 1: NL Purchase Request

    Example input: "I need 50 boxes of A4 paper and 10 ink cartridges for the marketing team"
    """
    system_prompt = """You are a procurement assistant that converts natural language purchase requests
into structured data. You must:
1. Extract product items, quantities, and specifications
2. Match items to the product catalog when possible
3. Suggest urgency level based on language cues
4. Identify the department if mentioned
5. Calculate reasonable quantities if not specified

Return ONLY valid JSON in this exact format:
{
  "title": "Short title for this purchase request",
  "department": "department name or null",
  "urgency": "low|medium|high|critical",
  "purpose": "brief purpose description",
  "items": [
    {
      "item_name": "matched product name",
      "matched_sku": "SKU if matched, null otherwise",
      "matched_product_id": "product ID if matched, null otherwise",
      "quantity": number,
      "unit": "pcs|boxes|reams|packs|kg|liters",
      "estimated_unit_price": number or 0,
      "reason": "why this item and quantity"
    }
  ],
  "needed_by_days": number of days from now or null,
  "ai_notes": "any additional observations"
}"""

    catalog_summary = []
    for p in product_catalog[:50]:  # Limit catalog size for token efficiency
        catalog_summary.append({
            "id": str(p.get("id", "")),
            "name": p.get("name", ""),
            "sku": p.get("sku", ""),
            "category": p.get("category", ""),
            "unit": p.get("unit", "pcs"),
            "price": p.get("price", 0),
        })

    prompt = f"""PRODUCT CATALOG:
{json.dumps(catalog_summary, indent=2)}

{"CURRENT STOCK LEVELS:" + json.dumps(current_stock[:30], indent=2) if current_stock else ""}

USER REQUEST (natural language):
"{user_input}"

Parse this into a structured purchase requisition. Match to catalog products where possible."""

    result = await query_llm(
        prompt=prompt,
        system_prompt=system_prompt,
        json_mode=True,
        temperature=0.2,
    )

    return result


async def generate_supplier_explanation(
    product_name: str,
    quantity: int,
    supplier_scores: List[Dict],
    urgency: str = "medium",
) -> Dict[str, Any]:
    """
    Generate human-friendly supplier recommendation explanation.
    Integration 7 (Part B): LLM explains ML scores.
    """
    system_prompt = """You are a procurement advisor. Given supplier scoring data,
write a clear, actionable recommendation in 3-5 sentences.
Explain WHY the top supplier is best. Mention price savings if applicable.
Use ✅ for strengths and ⚠️ for concerns. Keep it concise."""

    prompt = f"""PURCHASE: {quantity}x {product_name} (Urgency: {urgency})

SUPPLIER SCORES (ranked by AI):
{json.dumps(supplier_scores, indent=2)}

Write a procurement recommendation explaining which supplier to choose and why."""

    return await query_llm(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.5,
    )


async def parse_supplier_email(
    email_text: str,
    product_catalog: List[Dict],
) -> Dict[str, Any]:
    """
    Parse a supplier email/quote into structured data.
    Integration 5: Supplier Email Parsing.
    """
    system_prompt = """You are a procurement data extraction system.
Extract quote information from supplier emails.
Match products to the catalog when possible.
Return ONLY valid JSON:
{
  "supplier_name": "name",
  "responding_to": "RFQ number or null",
  "valid_until": "YYYY-MM-DD or null",
  "delivery_days": "estimated days or range",
  "payment_terms": "terms string",
  "items": [
    {
      "description": "item description from email",
      "catalog_match_name": "matched catalog product name or null",
      "catalog_match_id": "matched product ID or null",
      "quoted_price": number,
      "available": true/false,
      "moq": minimum order quantity or null,
      "substitute_offered": {name, price} or null
    }
  ],
  "notes": "any other relevant info"
}"""

    catalog_summary = [{"id": str(p.get("id", "")), "name": p.get("name", ""), "sku": p.get("sku", "")}
                       for p in product_catalog[:50]]

    prompt = f"""PRODUCT CATALOG:
{json.dumps(catalog_summary)}

SUPPLIER EMAIL:
{email_text}

Extract all quote data. Match products to catalog."""

    return await query_llm(prompt=prompt, system_prompt=system_prompt, json_mode=True, temperature=0.1)


async def parse_price_sheet_text(
    raw_text: str,
    product_catalog: List[Dict],
) -> Dict[str, Any]:
    """
    Parse OCR-extracted text from a price sheet into structured data.
    Integration 3: Price Sheet Reading.
    """
    system_prompt = """You are a document parsing system for procurement.
Extract product names, prices, and units from price sheet text.
Match items to the provided product catalog.
Return ONLY valid JSON:
{
  "supplier_prices": [
    {
      "description": "item as written on sheet",
      "matched_product_name": "catalog match or null",
      "matched_product_id": "ID or null",
      "price": number,
      "unit": "unit of measure",
      "confidence": 0.0 to 1.0
    }
  ],
  "valid_until": "date or null",
  "payment_terms": "terms or null",
  "minimum_order": number or null,
  "currency": "currency code"
}"""

    catalog_summary = [{"id": str(p.get("id", "")), "name": p.get("name", ""), "sku": p.get("sku", "")}
                       for p in product_catalog[:50]]

    prompt = f"""PRODUCT CATALOG:
{json.dumps(catalog_summary)}

PRICE SHEET TEXT (extracted via OCR):
{raw_text}

Extract all prices and match to catalog products."""

    return await query_llm(prompt=prompt, system_prompt=system_prompt, json_mode=True, temperature=0.1)


async def generate_po_draft(
    po_data: Dict[str, Any],
    supplier: Dict[str, Any],
    line_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Integration 4: AI Purchase Order Generation.
    Takes structured PO data and generates a professional email draft
    and a plain-text PO document ready to send to the supplier.
    """
    system_prompt = """You are a professional procurement officer writing purchase orders.
Generate a formal, polite PO email and a structured PO document.
Return ONLY valid JSON:
{
  "email_subject": "Purchase Order PO-XXXX - [brief description]",
  "email_body": "Full professional email text to send to supplier",
  "po_document": "Formatted plain-text PO document with all line items",
  "special_notes": ["any important notes or flags"],
  "estimated_delivery_note": "suggested delivery timeline note"
}"""

    items_text = "\n".join([
        f"- {item.get('product_name', 'Item')} | Qty: {item.get('quantity', 0)} {item.get('unit', 'pcs')} | Unit Price: ${item.get('unit_price', 0):.2f} | Total: ${item.get('total_price', 0):.2f}"
        for item in line_items
    ])

    prompt = f"""Generate a professional Purchase Order for:

PO NUMBER: {po_data.get('po_number', 'PO-DRAFT')}
DATE: {po_data.get('date', 'Today')}
TOTAL AMOUNT: ${po_data.get('total_amount', 0):.2f}
REQUIRED BY: {po_data.get('required_by', 'ASAP')}
PAYMENT TERMS: {po_data.get('payment_terms', 'Net 30')}
PURPOSE: {po_data.get('purpose', 'General procurement')}

SUPPLIER:
Name: {supplier.get('name', 'Supplier')}
Email: {supplier.get('email', 'N/A')}
Contact: {supplier.get('contact_person', 'N/A')}
Address: {supplier.get('address', 'N/A')}

LINE ITEMS:
{items_text}

Generate a professional PO email and document."""

    return await query_llm(prompt=prompt, system_prompt=system_prompt, json_mode=True, temperature=0.3)


async def match_invoice_to_po(
    invoice_text: str,
    po_data: Dict[str, Any],
    received_items: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Integration 9: Invoice Matching AI.
    Performs 3-way matching: PO vs Invoice vs Goods Received.
    Extracts invoice data from OCR text and compares to PO.
    Returns match status, discrepancies, and recommended actions.
    """
    system_prompt = """You are an accounts payable AI performing 3-way invoice matching.
Compare the invoice text against the PO data and goods received.
Return ONLY valid JSON:
{
  "invoice_extracted": {
    "invoice_number": "string or null",
    "invoice_date": "date string or null",
    "supplier_name": "string or null",
    "total_amount": number or null,
    "line_items": [
      {
        "description": "item description",
        "quantity": number,
        "unit_price": number,
        "total": number
      }
    ],
    "payment_terms": "string or null",
    "due_date": "string or null"
  },
  "match_result": "approved" | "discrepancy" | "rejected",
  "match_score": 0.0 to 1.0,
  "discrepancies": [
    {
      "type": "price_mismatch" | "quantity_mismatch" | "item_not_on_po" | "missing_item",
      "description": "human-readable explanation",
      "po_value": "what PO says",
      "invoice_value": "what invoice says",
      "financial_impact": number
    }
  ],
  "recommended_action": "approve_for_payment" | "request_credit_note" | "contact_supplier" | "reject",
  "action_reason": "explanation of recommended action",
  "total_dispute_amount": number
}"""

    po_items_text = json.dumps(po_data.get("line_items", []), indent=2)
    received_text = json.dumps(received_items or [], indent=2)

    prompt = f"""INVOICE TEXT (from OCR):
{invoice_text}

PURCHASE ORDER DATA:
PO Number: {po_data.get('po_number', 'N/A')}
PO Total: ${po_data.get('total_amount', 0):.2f}
Supplier: {po_data.get('supplier_name', 'N/A')}
Agreed Payment Terms: {po_data.get('payment_terms', 'Net 30')}
PO Line Items:
{po_items_text}

GOODS RECEIVED (if any):
{received_text}

Perform 3-way matching and identify all discrepancies."""

    return await query_llm(prompt=prompt, system_prompt=system_prompt, json_mode=True, temperature=0.1)
