"""
Approval Rules router — configurable multi-level approval engine.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.models.approval_rule import ApprovalRule

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────

class ApprovalRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str = "amount"  # "amount", "category", "urgency"
    priority: int = 0
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    category_name: Optional[str] = None
    urgency_level: Optional[str] = None
    approver_role: str = "manager"
    approval_flow: str = "sequential"
    sla_hours: int = 24
    auto_approve: bool = False
    escalate_after_hours: Optional[int] = 48


class ApprovalRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rule_type: Optional[str] = None
    priority: Optional[int] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    category_name: Optional[str] = None
    urgency_level: Optional[str] = None
    approver_role: Optional[str] = None
    approval_flow: Optional[str] = None
    sla_hours: Optional[int] = None
    auto_approve: Optional[bool] = None
    escalate_after_hours: Optional[int] = None
    is_active: Optional[bool] = None


def _rule_to_response(r: ApprovalRule) -> dict:
    return {
        "id": str(r.id),
        "name": r.name,
        "description": r.description,
        "rule_type": r.rule_type,
        "priority": r.priority,
        "min_amount": r.min_amount,
        "max_amount": r.max_amount,
        "category_name": r.category_name,
        "urgency_level": r.urgency_level,
        "approver_role": r.approver_role,
        "approval_flow": r.approval_flow,
        "sla_hours": r.sla_hours,
        "auto_approve": r.auto_approve,
        "escalate_after_hours": r.escalate_after_hours,
        "is_active": r.is_active,
    }


# ─── The Approval Engine — core logic ────────────────────────────

def determine_required_approvers(
    db: Session,
    amount: float,
    category: Optional[str] = None,
    urgency: str = "medium",
) -> List[dict]:
    """
    Given a PO amount, category, and urgency, determine which approvers
    are needed and in what order.
    """
    rules = (
        db.query(ApprovalRule)
        .filter(ApprovalRule.is_active == True)
        .order_by(ApprovalRule.priority.desc())
        .all()
    )

    matched_approvers = []

    for rule in rules:
        matched = False

        if rule.rule_type == "amount":
            min_ok = rule.min_amount is None or amount >= rule.min_amount
            max_ok = rule.max_amount is None or amount <= rule.max_amount
            if min_ok and max_ok:
                matched = True

        elif rule.rule_type == "category" and category:
            if rule.category_name and rule.category_name.lower() == category.lower():
                matched = True

        elif rule.rule_type == "urgency":
            if rule.urgency_level and rule.urgency_level.lower() == urgency.lower():
                matched = True

        if matched:
            # Check for auto-approve
            if rule.auto_approve and rule.rule_type == "amount":
                if rule.max_amount and amount <= rule.max_amount:
                    return [{"rule": _rule_to_response(rule), "action": "auto_approve"}]

            matched_approvers.append({
                "rule": _rule_to_response(rule),
                "approver_role": rule.approver_role,
                "flow": rule.approval_flow,
                "sla_hours": rule.sla_hours,
            })

    if not matched_approvers:
        # Default: require manager approval
        matched_approvers.append({
            "rule": None,
            "approver_role": "manager",
            "flow": "sequential",
            "sla_hours": 24,
        })

    return matched_approvers


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/")
async def list_rules(db: Session = Depends(get_db)):
    """List all approval rules."""
    rules = db.query(ApprovalRule).order_by(ApprovalRule.priority.desc()).all()
    return [_rule_to_response(r) for r in rules]


@router.post("/")
async def create_rule(data: ApprovalRuleCreate, db: Session = Depends(get_db)):
    """Create a new approval rule."""
    rule = ApprovalRule(
        name=data.name,
        description=data.description,
        rule_type=data.rule_type,
        priority=data.priority,
        min_amount=data.min_amount,
        max_amount=data.max_amount,
        category_name=data.category_name,
        urgency_level=data.urgency_level,
        approver_role=data.approver_role,
        approval_flow=data.approval_flow,
        sla_hours=data.sla_hours,
        auto_approve=data.auto_approve,
        escalate_after_hours=data.escalate_after_hours,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _rule_to_response(rule)


@router.patch("/{rule_id}")
async def update_rule(rule_id: str, updates: ApprovalRuleUpdate, db: Session = Depends(get_db)):
    """Update an approval rule."""
    rule = db.query(ApprovalRule).filter(ApprovalRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for key, value in updates.dict(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return _rule_to_response(rule)


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str, db: Session = Depends(get_db)):
    """Delete an approval rule."""
    rule = db.query(ApprovalRule).filter(ApprovalRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted"}


@router.post("/evaluate")
async def evaluate_rules(
    amount: float,
    category: Optional[str] = None,
    urgency: str = "medium",
    db: Session = Depends(get_db),
):
    """
    Evaluate which approvers are needed for a given amount/category/urgency.
    Used by: PR creation form to show who needs to approve.
    """
    approvers = determine_required_approvers(db, amount, category, urgency)
    return {
        "amount": amount,
        "category": category,
        "urgency": urgency,
        "required_approvers": approvers,
    }
