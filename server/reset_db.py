"""
DB Reset Script — ProcureAI
============================
Clears ALL transactional data so the simulator can build everything live.

What gets DELETED:
  ✗  Purchase Requisitions (and PR line items)
  ✗  Purchase Orders (and PO line items, approvals)
  ✗  Notifications
  ✗  Supplier Prices
  ✗  Budgets
  ✗  Demand Forecasts
  ✗  Audit Logs

What gets KEPT (reference data):
  ✓  Users
  ✓  Suppliers
  ✓  Products
  ✓  Categories
  ✓  Departments
  ✓  Approval Rules
  ✓  Company Config

What gets RESET:
  ↺  Inventory → restocked to healthy starting levels per product

After running this, start the simulator fresh:
    python simulate.py --speed=fast

Usage:
    cd server
    source venv/bin/activate
    python reset_db.py
"""

import sys
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from app.database import SessionLocal
from app.models.purchase_requisition import PurchaseRequisition, PRLineItem
from app.models.purchase_order       import PurchaseOrder, POLineItem
from app.models.approval             import Approval
from app.models.notification         import Notification
from app.models.supplier_price       import SupplierPrice
from app.models.budget               import Budget
from app.models.demand_forecast      import DemandForecast
from app.models.audit_log            import AuditLog
from app.models.inventory            import Inventory
from app.models.product              import Product


# Starting inventory levels — simulator (Sales Agent) will drain these
# Set all to a comfortable level so you can watch them decline
STARTING_STOCK = 50


def reset(db):
    print("\n🗑️  Clearing transactional data...")

    # Order matters due to foreign keys
    deleted = {}

    deleted["Audit Logs"]          = db.query(AuditLog).delete()
    deleted["Notifications"]       = db.query(Notification).delete()
    deleted["Approvals"]           = db.query(Approval).delete()
    deleted["PO Line Items"]       = db.query(POLineItem).delete()
    deleted["Purchase Orders"]     = db.query(PurchaseOrder).delete()
    deleted["PR Line Items"]       = db.query(PRLineItem).delete()
    deleted["Purchase Requisitions"] = db.query(PurchaseRequisition).delete()
    deleted["Supplier Prices"]     = db.query(SupplierPrice).delete()
    deleted["Budgets"]             = db.query(Budget).delete()
    deleted["Demand Forecasts"]    = db.query(DemandForecast).delete()

    for label, count in deleted.items():
        if count > 0:
            print(f"   ✗  {label}: {count} records removed")
        else:
            print(f"   –  {label}: already empty")

    print("\n♻️  Resetting inventory levels...")
    products = db.query(Product).all()
    inv_reset = 0
    inv_created = 0

    for product in products:
        inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if inv:
            inv.current_stock = STARTING_STOCK
            inv_reset += 1
        else:
            # Create inventory entry if missing
            db.add(Inventory(
                product_id=product.id,
                current_stock=STARTING_STOCK,
                min_stock=product.reorder_point,
                max_stock=product.reorder_quantity * 3,
            ))
            inv_created += 1

    if inv_reset:
        print(f"   ↺  Reset {inv_reset} inventory records → {STARTING_STOCK} units each")
    if inv_created:
        print(f"   ✚  Created {inv_created} new inventory records → {STARTING_STOCK} units each")

    db.commit()


def main():
    print()
    print("╔══════════════════════════════════════════════════╗")
    print("║   ProcureAI — Database Reset                     ║")
    print("╠══════════════════════════════════════════════════╣")
    print("║   This will DELETE all transactional data.       ║")
    print("║   Suppliers, Products, Users are KEPT.           ║")
    print("╚══════════════════════════════════════════════════╝")
    print()

    confirm = input("  Type 'yes' to confirm reset: ").strip().lower()
    if confirm != "yes":
        print("\n  Aborted. No changes made.\n")
        sys.exit(0)

    db = SessionLocal()
    try:
        reset(db)
        print()
        print("✅  Database reset complete!")
        print()
        print("  Next steps:")
        print("  1. Keep your server running (Terminal 1)")
        print("  2. Start the simulator in a new terminal:")
        print()
        print("     python simulate.py --speed=fast")
        print()
        print("  3. Open your app — watch data appear live! 🚀")
        print()

    except Exception as e:
        db.rollback()
        print(f"\n❌  Error during reset: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
