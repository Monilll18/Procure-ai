"""
LLM Service — Central wrapper for Zhipu AI GLM-4.
All AI features route through this service for consistent
error handling, retries, and token tracking.
"""
import os
import json
import logging
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# GLM-4 API configuration
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
GLM_MODEL = os.getenv("GLM_MODEL", "glm-4.5-flash")  # Free tier model


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

    Args:
        prompt: User message
        system_prompt: System instruction
        json_mode: If True, forces JSON output
        temperature: Creativity (0.0 = deterministic, 1.0 = creative)
        max_tokens: Maximum response length
        model: Override default model

    Returns:
        dict with 'content' (str), 'usage' (dict), 'success' (bool)
    """
    client = _get_client()
    use_model = model or GLM_MODEL

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]

    try:
        kwargs: Dict[str, Any] = {
            "model": use_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        response = client.chat.completions.create(**kwargs)

        content = response.choices[0].message.content
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

        logger.info(f"LLM call success — model={use_model}, tokens={usage['total_tokens']}")

        # Parse JSON if requested
        if json_mode:
            try:
                # Try to extract JSON from the response
                content_stripped = content.strip()
                if content_stripped.startswith("```json"):
                    content_stripped = content_stripped[7:]
                if content_stripped.startswith("```"):
                    content_stripped = content_stripped[3:]
                if content_stripped.endswith("```"):
                    content_stripped = content_stripped[:-3]
                parsed = json.loads(content_stripped.strip())
                return {"content": parsed, "raw": content, "usage": usage, "success": True}
            except json.JSONDecodeError:
                logger.warning("LLM returned non-JSON despite json_mode=True")
                return {"content": content, "raw": content, "usage": usage, "success": True, "json_error": True}

        return {"content": content, "usage": usage, "success": True}

    except Exception as e:
        logger.error(f"LLM call failed: {str(e)}")
        return {"content": None, "error": str(e), "success": False}


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
