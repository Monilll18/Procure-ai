"""
Company Config + Industry Templates router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict

from app.database import get_db
from app.models.company_config import CompanyConfig
from app.models.category import Category

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────

class CompanyConfigResponse(BaseModel):
    id: int
    company_name: str
    industry: str
    company_size: str
    base_currency: str
    fiscal_year_start: int
    tax_id: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    setup_completed: bool
    setup_step: int
    expiry_tracking: bool
    batch_tracking: bool
    serial_tracking: bool

    class Config:
        from_attributes = True


class CompanyConfigUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    base_currency: Optional[str] = None
    fiscal_year_start: Optional[int] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    setup_completed: Optional[bool] = None
    setup_step: Optional[int] = None
    expiry_tracking: Optional[bool] = None
    batch_tracking: Optional[bool] = None
    serial_tracking: Optional[bool] = None


# ─── Industry Templates ──────────────────────────────────────────

INDUSTRY_TEMPLATES: Dict[str, List[Dict]] = {
    "general": [
        {"name": "Office Supplies", "slug": "office-supplies", "children": [
            {"name": "Stationery", "slug": "stationery"},
            {"name": "Paper Products", "slug": "paper-products"},
            {"name": "Writing Instruments", "slug": "writing-instruments"},
        ]},
        {"name": "IT & Technology", "slug": "it-technology", "children": [
            {"name": "Hardware", "slug": "hardware"},
            {"name": "Software Licenses", "slug": "software-licenses"},
            {"name": "Peripherals", "slug": "peripherals"},
            {"name": "Networking", "slug": "networking"},
        ]},
        {"name": "Furniture & Equipment", "slug": "furniture-equipment", "children": [
            {"name": "Desks & Tables", "slug": "desks-tables"},
            {"name": "Chairs", "slug": "chairs"},
            {"name": "Storage", "slug": "furniture-storage"},
        ]},
        {"name": "Cleaning & Maintenance", "slug": "cleaning-maintenance", "children": [
            {"name": "Cleaning Supplies", "slug": "cleaning-supplies"},
            {"name": "Maintenance Tools", "slug": "maintenance-tools"},
        ]},
        {"name": "Marketing Materials", "slug": "marketing-materials"},
        {"name": "Professional Services", "slug": "professional-services"},
    ],
    "manufacturing": [
        {"name": "Raw Materials", "slug": "raw-materials", "children": [
            {"name": "Metals", "slug": "metals"},
            {"name": "Polymers", "slug": "polymers"},
            {"name": "Chemicals", "slug": "chemicals"},
        ]},
        {"name": "Machine Parts", "slug": "machine-parts", "children": [
            {"name": "Bearings & Seals", "slug": "bearings-seals"},
            {"name": "Belts & Chains", "slug": "belts-chains"},
            {"name": "Filters", "slug": "filters"},
            {"name": "Gears", "slug": "gears"},
        ]},
        {"name": "Safety & PPE", "slug": "safety-ppe", "children": [
            {"name": "Helmets", "slug": "helmets"},
            {"name": "Gloves", "slug": "gloves"},
            {"name": "Goggles", "slug": "goggles"},
            {"name": "Safety Boots", "slug": "safety-boots"},
        ]},
        {"name": "Tools & Equipment", "slug": "tools-equipment"},
        {"name": "Packaging Materials", "slug": "packaging"},
        {"name": "Office & Admin", "slug": "office-admin"},
    ],
    "restaurant": [
        {"name": "Food Ingredients", "slug": "food-ingredients", "children": [
            {"name": "Vegetables & Fruits", "slug": "vegetables-fruits"},
            {"name": "Meat & Seafood", "slug": "meat-seafood"},
            {"name": "Dairy & Eggs", "slug": "dairy-eggs"},
        ]},
        {"name": "Dry Goods", "slug": "dry-goods", "children": [
            {"name": "Spices & Seasonings", "slug": "spices"},
            {"name": "Oils & Vinegars", "slug": "oils-vinegars"},
            {"name": "Flour & Grains", "slug": "flour-grains"},
            {"name": "Rice & Pasta", "slug": "rice-pasta"},
        ]},
        {"name": "Beverages", "slug": "beverages"},
        {"name": "Packaging", "slug": "food-packaging"},
        {"name": "Cleaning Supplies", "slug": "restaurant-cleaning"},
        {"name": "Kitchen Equipment", "slug": "kitchen-equipment"},
    ],
    "healthcare": [
        {"name": "Medical Supplies", "slug": "medical-supplies", "children": [
            {"name": "Disposables", "slug": "disposables"},
            {"name": "Instruments", "slug": "instruments"},
            {"name": "Diagnostic Equipment", "slug": "diagnostic-equipment"},
        ]},
        {"name": "Pharmaceuticals", "slug": "pharmaceuticals"},
        {"name": "Laboratory Supplies", "slug": "lab-supplies"},
        {"name": "Protective Equipment", "slug": "protective-equipment"},
        {"name": "Cleaning & Sterilization", "slug": "sterilization"},
        {"name": "Office & Admin", "slug": "health-office"},
    ],
    "it": [
        {"name": "Computing", "slug": "computing", "children": [
            {"name": "Laptops & Desktops", "slug": "laptops-desktops"},
            {"name": "Servers", "slug": "servers"},
            {"name": "Components", "slug": "components"},
        ]},
        {"name": "Software", "slug": "software", "children": [
            {"name": "Enterprise Licenses", "slug": "enterprise-licenses"},
            {"name": "Development Tools", "slug": "dev-tools"},
            {"name": "Security Software", "slug": "security-software"},
        ]},
        {"name": "Cloud Services", "slug": "cloud-services"},
        {"name": "Networking", "slug": "it-networking"},
        {"name": "Peripherals & Accessories", "slug": "it-peripherals"},
        {"name": "Office Supplies", "slug": "it-office"},
    ],
    "retail": [
        {"name": "Products for Resale", "slug": "resale", "children": [
            {"name": "Electronics", "slug": "retail-electronics"},
            {"name": "Clothing", "slug": "clothing"},
            {"name": "Home Goods", "slug": "home-goods"},
        ]},
        {"name": "Packaging", "slug": "retail-packaging"},
        {"name": "Store Supplies", "slug": "store-supplies"},
        {"name": "Marketing & Display", "slug": "marketing-display"},
        {"name": "Office & Admin", "slug": "retail-office"},
    ],
    "construction": [
        {"name": "Building Materials", "slug": "building-materials", "children": [
            {"name": "Cement & Concrete", "slug": "cement-concrete"},
            {"name": "Steel & Metals", "slug": "steel-metals"},
            {"name": "Lumber & Wood", "slug": "lumber"},
        ]},
        {"name": "Heavy Equipment", "slug": "heavy-equipment"},
        {"name": "Safety Gear", "slug": "construction-safety"},
        {"name": "Tools", "slug": "construction-tools"},
        {"name": "Electrical Supplies", "slug": "electrical"},
        {"name": "Plumbing Supplies", "slug": "plumbing"},
    ],
}


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/", response_model=CompanyConfigResponse)
async def get_company_config(db: Session = Depends(get_db)):
    """Get company configuration (creates default if none exists)."""
    config = db.query(CompanyConfig).first()
    if not config:
        config = CompanyConfig(company_name="My Company", industry="general")
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/", response_model=CompanyConfigResponse)
async def update_company_config(updates: CompanyConfigUpdate, db: Session = Depends(get_db)):
    """Update company configuration."""
    config = db.query(CompanyConfig).first()
    if not config:
        config = CompanyConfig()
        db.add(config)

    for key, value in updates.dict(exclude_unset=True).items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)
    return config


@router.get("/industries")
async def list_industries():
    """List available industry templates."""
    return {
        "industries": [
            {"id": "general", "name": "General Business", "description": "Suitable for any business type"},
            {"id": "manufacturing", "name": "Manufacturing", "description": "Factories, production facilities"},
            {"id": "restaurant", "name": "Restaurant / Food Service", "description": "Restaurants, cafes, catering"},
            {"id": "healthcare", "name": "Healthcare", "description": "Hospitals, clinics, pharma"},
            {"id": "it", "name": "IT & Technology", "description": "Software, hardware companies"},
            {"id": "retail", "name": "Retail", "description": "Stores, e-commerce"},
            {"id": "construction", "name": "Construction", "description": "Building, infrastructure"},
        ]
    }


@router.get("/templates/{industry}")
async def get_industry_template(industry: str):
    """Get category template for a specific industry."""
    template = INDUSTRY_TEMPLATES.get(industry)
    if not template:
        raise HTTPException(status_code=404, detail=f"No template found for industry: {industry}")
    return {"industry": industry, "categories": template}


@router.post("/apply-template/{industry}")
async def apply_industry_template(industry: str, db: Session = Depends(get_db)):
    """Apply an industry template — creates categories in DB."""
    template = INDUSTRY_TEMPLATES.get(industry)
    if not template:
        raise HTTPException(status_code=404, detail=f"No template for: {industry}")

    # Clear existing template categories
    db.query(Category).filter(Category.industry_template == industry).delete()

    count = 0
    for idx, cat_data in enumerate(template):
        parent = Category(
            name=cat_data["name"],
            slug=cat_data["slug"],
            industry_template=industry,
            sort_order=idx,
            is_active=True,
        )
        db.add(parent)
        db.flush()
        count += 1

        for child_idx, child_data in enumerate(cat_data.get("children", [])):
            child = Category(
                name=child_data["name"],
                slug=child_data["slug"],
                parent_id=parent.id,
                industry_template=industry,
                sort_order=child_idx,
                is_active=True,
            )
            db.add(child)
            count += 1

    # Update company config
    config = db.query(CompanyConfig).first()
    if config:
        config.industry = industry
    else:
        db.add(CompanyConfig(industry=industry))

    db.commit()
    return {"message": f"Applied {industry} template", "categories_created": count}
