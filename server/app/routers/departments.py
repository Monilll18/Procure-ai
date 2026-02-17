"""
Departments router — organizational unit CRUD with budget tracking.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.department import Department

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    annual_budget: float = 0
    monthly_budget: float = 0
    manager_id: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    annual_budget: Optional[float] = None
    monthly_budget: Optional[float] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    annual_budget: float
    monthly_budget: float
    manager_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


def _dept_to_response(d: Department) -> dict:
    return {
        "id": str(d.id),
        "name": d.name,
        "code": d.code,
        "description": d.description,
        "annual_budget": d.annual_budget,
        "monthly_budget": d.monthly_budget,
        "manager_id": str(d.manager_id) if d.manager_id else None,
        "is_active": d.is_active,
    }


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/")
async def list_departments(db: Session = Depends(get_db)):
    """List all active departments."""
    depts = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
    return [_dept_to_response(d) for d in depts]


@router.post("/")
async def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    """Create a new department."""
    dept = Department(
        name=data.name,
        code=data.code,
        description=data.description,
        annual_budget=data.annual_budget,
        monthly_budget=data.monthly_budget,
        manager_id=data.manager_id if data.manager_id else None,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return _dept_to_response(dept)


@router.patch("/{dept_id}")
async def update_department(dept_id: str, updates: DepartmentUpdate, db: Session = Depends(get_db)):
    """Update a department."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    for key, value in updates.dict(exclude_unset=True).items():
        setattr(dept, key, value)

    db.commit()
    db.refresh(dept)
    return _dept_to_response(dept)


@router.delete("/{dept_id}")
async def delete_department(dept_id: str, db: Session = Depends(get_db)):
    """Soft-delete a department."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.is_active = False
    db.commit()
    return {"message": "Department deactivated"}
