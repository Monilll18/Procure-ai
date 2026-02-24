"""
Live Data Simulation Seed Script
=================================
Run this script to populate the database with a realistic dataset of:
  - 5 Suppliers (mix of ratings and lead times)
  - 10 Products (across multiple categories)
  - Inventory entries for each product
  - Budget entries (yearly + monthly) 
  - 30 Purchase Requisitions (various statuses, departments, priorities)
  - 15 Purchase Orders (various statuses)
  - Demand Forecast entries

IMPORTANT: This script is designed to be safe to re-run. It will skip records
that already exist (based on unique fields like SKU or PR number).

Usage:
    cd server
    python seed_data.py
"""

import sys
import os
import uuid
import random
from datetime import date, datetime, timedelta

# Load environment variables FIRST before importing app modules
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.supplier import Supplier, SupplierStatus
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.budget import Budget
from app.models.purchase_requisition import PurchaseRequisition, PRLineItem, PRStatus, PRPriority
from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.demand_forecast import DemandForecast
from app.models.supplier_price import SupplierPrice


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def rand_date_past(days_back=180) -> date:
    return date.today() - timedelta(days=random.randint(1, days_back))

def rand_date_future(days_ahead=60) -> date:
    return date.today() + timedelta(days=random.randint(5, days_ahead))

def rand_dt_past(days_back=180) -> datetime:
    return datetime.utcnow() - timedelta(days=random.randint(1, days_back))


# ---------------------------------------------------------------------------
# 1. Suppliers
# ---------------------------------------------------------------------------

SUPPLIERS_DATA = [
    {
        "name": "TechCore Solutions",
        "email": "orders@techcore.com",
        "phone": "+1-555-0101",
        "contact_person": "Alice Mercer",
        "rating": 4.8,
        "status": SupplierStatus.active,
        "lead_time_days": 5,
        "payment_terms": "Net 30",
        "categories": "IT Hardware, Electronics",
        "notes": "Primary IT supplier. Excellent on-time delivery.",
    },
    {
        "name": "OfficeWorld Inc.",
        "email": "supply@officeworld.com",
        "phone": "+1-555-0202",
        "contact_person": "Bob Stanley",
        "rating": 3.9,
        "status": SupplierStatus.active,
        "lead_time_days": 7,
        "payment_terms": "Net 60",
        "categories": "Office Supplies, Stationery",
        "notes": "Occasional delays in large orders.",
    },
    {
        "name": "GlobalMed Supplies",
        "email": "procurement@globalmed.com",
        "phone": "+1-555-0303",
        "contact_person": "Clara Hobbs",
        "rating": 4.5,
        "status": SupplierStatus.active,
        "lead_time_days": 10,
        "payment_terms": "Net 30",
        "categories": "Medical, Safety",
        "notes": "Certified medical supplies vendor.",
    },
    {
        "name": "FurniCraft Ltd.",
        "email": "biz@furnicraft.com",
        "phone": "+1-555-0404",
        "contact_person": "David Chen",
        "rating": 3.2,  # LOW RATING — triggers AI Supplier Scorer warning
        "status": SupplierStatus.active,
        "lead_time_days": 21,
        "payment_terms": "Net 45",
        "categories": "Furniture",
        "notes": "Multiple late deliveries reported. Under review.",
    },
    {
        "name": "InkJet Pro",
        "email": "sales@inkjetpro.com",
        "phone": "+1-555-0505",
        "contact_person": "Eva Morrison",
        "rating": 4.1,
        "status": SupplierStatus.active,
        "lead_time_days": 3,
        "payment_terms": "Prepaid",
        "categories": "Printing, Office Supplies",
        "notes": "Fast delivery, competitive pricing.",
    },
]


def seed_suppliers(db: Session):
    print("  → Seeding suppliers...")
    suppliers = []
    for s in SUPPLIERS_DATA:
        existing = db.query(Supplier).filter(Supplier.email == s["email"]).first()
        if existing:
            suppliers.append(existing)
            continue
        obj = Supplier(**s)
        db.add(obj)
        db.flush()
        suppliers.append(obj)
    db.commit()
    print(f"     ✓ {len(suppliers)} suppliers ready.")
    return suppliers


# ---------------------------------------------------------------------------
# 2. Products
# ---------------------------------------------------------------------------

PRODUCTS_DATA = [
    {"sku": "IT-001", "name": "Dell Laptop 15\" (i7)", "category": "IT Hardware", "unit": "pcs", "reorder_point": 5, "reorder_quantity": 20},
    {"sku": "IT-002", "name": "HP Monitor 27\" 4K",    "category": "IT Hardware", "unit": "pcs", "reorder_point": 3, "reorder_quantity": 10},
    {"sku": "IT-003", "name": "USB-C Hub (7-port)",    "category": "Electronics", "unit": "pcs", "reorder_point": 10, "reorder_quantity": 50},
    {"sku": "OF-001", "name": "A4 Copy Paper (Box-500)","category": "Office Supplies", "unit": "box", "reorder_point": 20, "reorder_quantity": 100},
    {"sku": "OF-002", "name": "Whiteboard Markers Set","category": "Office Supplies", "unit": "set", "reorder_point": 15, "reorder_quantity": 60},
    {"sku": "FU-001", "name": "Ergonomic Office Chair","category": "Furniture",      "unit": "pcs", "reorder_point": 2, "reorder_quantity": 10},
    {"sku": "FU-002", "name": "Standing Desk (Electric)","category": "Furniture",   "unit": "pcs", "reorder_point": 1, "reorder_quantity": 5},
    {"sku": "MD-001", "name": "First Aid Kit (Standard)","category": "Medical",     "unit": "kit", "reorder_point": 5, "reorder_quantity": 20},
    {"sku": "PR-001", "name": "HP Ink Cartridge (Black)","category": "Printing",    "unit": "pcs", "reorder_point": 10, "reorder_quantity": 40},
    {"sku": "PR-002", "name": "A3 Color Printer",       "category": "Printing",    "unit": "pcs", "reorder_point": 1, "reorder_quantity": 3},
]

PRODUCT_PRICES = {
    # sku -> {supplier_name -> price}
    "IT-001": {"TechCore Solutions": 1100.00},
    "IT-002": {"TechCore Solutions": 420.00},
    "IT-003": {"TechCore Solutions": 45.00,  "OfficeWorld Inc.": 52.00},
    "OF-001": {"OfficeWorld Inc.": 28.00},
    "OF-002": {"OfficeWorld Inc.": 12.00,    "InkJet Pro": 11.50},
    "FU-001": {"FurniCraft Ltd.": 320.00},
    "FU-002": {"FurniCraft Ltd.": 850.00},
    "MD-001": {"GlobalMed Supplies": 65.00},
    "PR-001": {"InkJet Pro": 18.00,          "OfficeWorld Inc.": 21.00},
    "PR-002": {"InkJet Pro": 680.00,         "TechCore Solutions": 720.00},
}

INVENTORY_LEVELS = {
    # sku -> current_stock (some intentionally low to trigger reorder alerts)
    "IT-001": 3,   # BELOW reorder_point=5 → triggers AI alert
    "IT-002": 8,
    "IT-003": 45,
    "OF-001": 12,  # BELOW reorder_point=20 → triggers AI alert
    "OF-002": 30,
    "FU-001": 4,
    "FU-002": 2,
    "MD-001": 7,
    "PR-001": 35,
    "PR-002": 2,
}


def seed_products(db: Session, suppliers: list):
    print("  → Seeding products & inventory...")
    supplier_map = {s.name: s for s in suppliers}
    products = []

    for p in PRODUCTS_DATA:
        existing = db.query(Product).filter(Product.sku == p["sku"]).first()
        if existing:
            products.append(existing)
        else:
            obj = Product(**p)
            db.add(obj)
            db.flush()

            # Inventory
            inv = Inventory(
                product_id=obj.id,
                current_stock=INVENTORY_LEVELS.get(p["sku"], 50),
                min_stock=p["reorder_point"],
                max_stock=p["reorder_quantity"] * 3,
            )
            db.add(inv)

            # Supplier prices
            for sup_name, price in PRODUCT_PRICES.get(p["sku"], {}).items():
                sup = supplier_map.get(sup_name)
                if sup:
                    sp = SupplierPrice(
                        product_id=obj.id,
                        supplier_id=sup.id,
                        unit_price=price,
                        currency="USD",
                        effective_date=rand_date_past(90),
                        lead_time_days=sup.lead_time_days,
                    )
                    db.add(sp)
            products.append(obj)

    db.commit()
    print(f"     ✓ {len(products)} products ready.")
    return products


# ---------------------------------------------------------------------------
# 3. Budgets
# ---------------------------------------------------------------------------

BUDGET_CATEGORIES = [
    ("IT Hardware",    120000, 12000),
    ("Office Supplies", 18000,  1800),
    ("Furniture",       45000,  4500),
    ("Medical",         10000,  1000),
    ("Printing",         8000,   800),
]


def seed_budgets(db: Session):
    print("  → Seeding budgets...")
    year = date.today().year
    for cat, yearly, monthly in BUDGET_CATEGORIES:
        # Yearly budget
        if not db.query(Budget).filter(Budget.category == cat, Budget.period_year == year, Budget.period_month == None).first():
            db.add(Budget(
                category=cat, budget_type="category",
                period_year=year, period_month=None,
                allocated_amount=yearly,
                spent_amount=round(yearly * random.uniform(0.4, 0.85), 2),
            ))
        # Monthly budget for current month
        month = date.today().month
        if not db.query(Budget).filter(Budget.category == cat, Budget.period_year == year, Budget.period_month == month).first():
            db.add(Budget(
                category=cat, budget_type="category",
                period_year=year, period_month=month,
                allocated_amount=monthly,
                spent_amount=round(monthly * random.uniform(0.3, 0.95), 2),
            ))
    db.commit()
    print("     ✓ Budgets seeded.")


# ---------------------------------------------------------------------------
# 4. Purchase Requisitions
# ---------------------------------------------------------------------------

# These use a placeholder clerk_id since users are managed by Clerk (external)
# Replace "user_clerk_XXX" with actual Clerk IDs from your system if needed.
DUMMY_CLERK_IDS = {
    "admin":    "user_clerk_admin_001",
    "manager":  "user_clerk_manager_001",
    "officer":  "user_clerk_officer_001",
    "approver": "user_clerk_approver_001",
    "viewer":   "user_clerk_viewer_001",
}

PR_TEMPLATE = [
    # (title, category, dept, priority, status, estimated_total, requester_role)
    ("Laptop refresh for Engineering team",   "IT Hardware",    "Engineering", PRPriority.high,     PRStatus.approved,        22000.0, "manager"),
    ("Office chairs for new hires (10 units)","Furniture",      "HR",          PRPriority.medium,   PRStatus.submitted,        3200.0, "officer"),
    ("Quarterly paper supply restock",         "Office Supplies","Admin",       PRPriority.low,      PRStatus.converted_to_po,   840.0, "officer"),
    ("Standing desks — Remote worker kit",    "Furniture",      "Operations",  PRPriority.medium,   PRStatus.under_review,     8500.0, "manager"),
    ("First aid kit restock (all floors)",    "Medical",        "Facilities",  PRPriority.high,     PRStatus.approved,         1300.0, "officer"),
    ("4K Monitors for Design team",           "IT Hardware",    "Design",      PRPriority.medium,   PRStatus.draft,            6300.0, "officer"),
    ("HP Ink cartridges (bulk 200 pcs)",      "Printing",       "Admin",       PRPriority.low,      PRStatus.approved,         3600.0, "officer"),
    # ANOMALY CASE: Price spike on a normally cheap item — should trigger AI anomaly
    ("USB-C Hubs — urgent replacement",       "Electronics",   "IT",          PRPriority.critical, PRStatus.submitted,       15000.0, "manager"),
    ("A3 Color Printer for Marketing",        "Printing",       "Marketing",   PRPriority.medium,   PRStatus.rejected,          680.0, "officer"),
    ("Annual stationery pack",                "Office Supplies","Finance",     PRPriority.low,      PRStatus.converted_to_po,  1200.0, "officer"),
    ("Emergency laptop for CFO",             "IT Hardware",    "Finance",     PRPriority.critical, PRStatus.approved,         1100.0, "manager"),
    ("Whiteboard markers (bulk 10 sets)",     "Office Supplies","Operations",  PRPriority.low,      PRStatus.draft,             120.0, "viewer"),
    ("Server room UPS replacement",          "IT Hardware",    "IT",          PRPriority.critical, PRStatus.under_review,    45000.0, "manager"),
    ("New hire onboarding pack (5 staff)",   "Furniture",      "HR",          PRPriority.medium,   PRStatus.submitted,        7500.0, "manager"),
    ("Ergonomic accessories for Dev team",   "IT Hardware",    "Engineering", PRPriority.low,      PRStatus.draft,            2200.0, "officer"),
]


def seed_requisitions(db: Session, products: list, suppliers: list):
    print("  → Seeding requisitions...")
    prs = []
    product_map = {p.category: p for p in products}
    supplier_map = {s.name: s for s in suppliers}

    for i, (title, cat, dept, priority, status, total, req_role) in enumerate(PR_TEMPLATE):
        pr_number = f"PR-2026-{1000 + i:04d}"
        existing = db.query(PurchaseRequisition).filter(PurchaseRequisition.pr_number == pr_number).first()
        if existing:
            prs.append(existing)
            continue

        submitted_at = rand_dt_past(60) if status != PRStatus.draft else None
        approved_at  = rand_dt_past(30) if status in (PRStatus.approved, PRStatus.converted_to_po) else None

        pr = PurchaseRequisition(
            pr_number=pr_number,
            title=title,
            description=f"Procurement request for {title.lower()}.",
            requested_by=DUMMY_CLERK_IDS[req_role],
            department=dept,
            category=cat,
            priority=priority,
            status=status,
            estimated_total=total,
            budget_code=f"BUD-{dept[:3].upper()}-2026",
            needed_by=rand_date_future(),
            submitted_at=submitted_at,
            approved_at=approved_at,
            approved_by=DUMMY_CLERK_IDS["manager"] if approved_at else None,
            rejection_reason="Duplicate request found in system." if status == PRStatus.rejected else None,
            justification=f"Required for {dept} operations. Approved by department head.",
            ai_suggested_supplier=random.choice([True, False]),
            ai_suggested_quantity=random.choice([True, False]),
        )

        # Add a line item
        product = product_map.get(cat)
        if product:
            qty = max(1, int(total / max(1, product.reorder_quantity)))
            unit_price = total / max(qty, 1)
            li = PRLineItem(
                item_name=product.name,
                item_description=f"Standard {product.unit} order.",
                quantity=qty,
                estimated_unit_price=unit_price,
                estimated_total=total,
                unit=product.unit,
                product_id=product.id,
            )
            pr.line_items.append(li)

        db.add(pr)
        prs.append(pr)

    db.commit()
    print(f"     ✓ {len(prs)} requisitions ready.")
    return prs


# ---------------------------------------------------------------------------
# 5. Purchase Orders
# ---------------------------------------------------------------------------

PO_TEMPLATE = [
    # (supplier_name, total_amount, status, days_until_delivery)
    ("TechCore Solutions",  22000.00, POStatus.approved,           5),
    ("OfficeWorld Inc.",      840.00, POStatus.received,          -10),  # Past delivery
    ("TechCore Solutions",   1100.00, POStatus.paid,              -20),
    ("InkJet Pro",           3600.00, POStatus.sent,               7),
    ("FurniCraft Ltd.",      8500.00, POStatus.pending_approval,  14),  # Low-rated supplier
    ("GlobalMed Supplies",   1300.00, POStatus.approved,          10),
    ("OfficeWorld Inc.",     1200.00, POStatus.received,          -5),
    ("TechCore Solutions",   6300.00, POStatus.draft,             30),
    ("FurniCraft Ltd.",      3200.00, POStatus.approved,          18),  # Another FurniCraft—slow
    ("InkJet Pro",            680.00, POStatus.cancelled,          0),
]


def seed_purchase_orders(db: Session, suppliers: list, products: list):
    print("  → Seeding purchase orders...")
    supplier_map = {s.name: s for s in suppliers}
    product_map  = {p.category: p for p in products}
    pos = []

    for i, (sup_name, total, status, delivery_offset) in enumerate(PO_TEMPLATE):
        po_number = f"PO-2026-{5000 + i:04d}"
        existing  = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_number).first()
        if existing:
            pos.append(existing)
            continue

        sup     = supplier_map.get(sup_name)
        delivery = date.today() + timedelta(days=delivery_offset) if delivery_offset else None

        po = PurchaseOrder(
            po_number=po_number,
            supplier_id=sup.id,
            created_by=DUMMY_CLERK_IDS["officer"],
            status=status,
            total_amount=total,
            expected_delivery=delivery,
            notes=f"PO raised for {sup_name}.",
            created_at=rand_dt_past(90),
        )

        # Line item
        for cat, prod in product_map.items():
            if sup_name in PRODUCT_PRICES.get(prod.sku, {}):
                unit_price = PRODUCT_PRICES[prod.sku][sup_name]
                qty        = max(1, int(total / unit_price))
                li         = POLineItem(
                    product_id=prod.id,
                    quantity=qty,
                    unit_price=unit_price,
                    total_price=unit_price * qty,
                    quantity_received=qty if status in (POStatus.received, POStatus.paid) else 0,
                )
                po.line_items.append(li)
                break

        db.add(po)
        pos.append(po)

    db.commit()
    print(f"     ✓ {len(pos)} purchase orders ready.")
    return pos


# ---------------------------------------------------------------------------
# 6. Demand Forecasts
# ---------------------------------------------------------------------------

def seed_demand_forecasts(db: Session, products: list):
    print("  → Seeding demand forecasts...")
    count = 0
    for product in products:
        for month_offset in range(1, 4):  # next 3 months
            forecast_month = (date.today().replace(day=1) + timedelta(days=30 * month_offset))
            exists = db.query(DemandForecast).filter(
                DemandForecast.product_id == product.id,
                DemandForecast.forecast_month == forecast_month,
            ).first()
            if not exists:
                db.add(DemandForecast(
                    product_id=product.id,
                    forecast_month=forecast_month,
                    predicted_quantity=random.randint(product.reorder_point, product.reorder_quantity),
                    confidence_score=round(random.uniform(0.65, 0.95), 2),
                ))
                count += 1
    db.commit()
    print(f"     ✓ {count} demand forecasts seeded.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("\n🚀 AI Procurement System — Live Data Seed Script")
    print("=" * 52)
    db: Session = SessionLocal()

    try:
        suppliers = seed_suppliers(db)
        products  = seed_products(db, suppliers)
        seed_budgets(db)
        seed_requisitions(db, products, suppliers)
        seed_purchase_orders(db, suppliers, products)
        seed_demand_forecasts(db, products)

        print("\n✅  Database seeded successfully!")
        print("\nNow open your app and verify:")
        print("  • Dashboard shows realistic spend across categories")
        print("  • Requisitions list is populated with various statuses")
        print("  • Inventory shows LOW STOCK warnings for IT-001 and OF-001")
        print("  • Supplier page shows FurniCraft Ltd. with a LOW SCORE (3.2 rating)")
        print("  • AI anomaly detect the $15,000 USB-C Hub PR as unusual")
        print("  • Demand Forecasts show predicted orders for next 3 months\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
