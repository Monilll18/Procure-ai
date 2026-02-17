"""
Categories router — hierarchical category CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

from app.database import get_db
from app.models.category import Category

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    sort_order: int
    is_active: bool
    industry_template: Optional[str] = None
    children: List["CategoryResponse"] = []

    class Config:
        from_attributes = True


def _cat_to_response(cat: Category) -> dict:
    return {
        "id": str(cat.id),
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "icon": cat.icon,
        "parent_id": str(cat.parent_id) if cat.parent_id else None,
        "sort_order": cat.sort_order,
        "is_active": cat.is_active,
        "industry_template": cat.industry_template,
        "children": [],
    }


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/")
async def list_categories(db: Session = Depends(get_db)):
    """Get all categories as a flat list."""
    cats = db.query(Category).filter(Category.is_active == True).order_by(Category.sort_order).all()
    return [_cat_to_response(c) for c in cats]


@router.get("/tree")
async def get_category_tree(db: Session = Depends(get_db)):
    """Get categories as a nested tree structure."""
    all_cats = db.query(Category).filter(Category.is_active == True).order_by(Category.sort_order).all()

    # Build tree
    cat_map = {}
    for cat in all_cats:
        cat_map[str(cat.id)] = {**_cat_to_response(cat)}

    roots = []
    for cat_id, cat_dict in cat_map.items():
        parent_id = cat_dict.get("parent_id")
        if parent_id and parent_id in cat_map:
            cat_map[parent_id]["children"].append(cat_dict)
        else:
            roots.append(cat_dict)

    return roots


@router.post("/")
async def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category."""
    cat = Category(
        name=data.name,
        slug=data.slug,
        description=data.description,
        icon=data.icon,
        parent_id=data.parent_id if data.parent_id else None,
        sort_order=data.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _cat_to_response(cat)


@router.patch("/{category_id}")
async def update_category(category_id: str, updates: CategoryUpdate, db: Session = Depends(get_db)):
    """Update a category."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in updates.dict(exclude_unset=True).items():
        setattr(cat, key, value)

    db.commit()
    db.refresh(cat)
    return _cat_to_response(cat)


@router.delete("/{category_id}")
async def delete_category(category_id: str, db: Session = Depends(get_db)):
    """Soft-delete a category (set inactive)."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    cat.is_active = False
    db.commit()
    return {"message": "Category deactivated"}
