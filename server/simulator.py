"""
🚀 AI Procurement System — Live Simulator
==========================================
Populates the system with realistic data to test every feature:
  • Supplier catalogs with varied prices & quantities
  • Purchase Requisitions in every status
  • Purchase Orders across the full lifecycle
  • Goods receipts with stock movements
  • Inventory with healthy/low/critical items
  • Notifications for all event types

Run:  python simulator.py
"""
import random
import uuid
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session

# ─── Setup ──────────────────────────────────────────────────
from app.database import SessionLocal
from app.models.product import Product
from app.models.supplier import Supplier, SupplierStatus
from app.models.supplier_price import SupplierPrice
from app.models.purchase_requisition import PurchaseRequisition, PRLineItem, PRStatus, PRPriority
from app.models.purchase_order import PurchaseOrder, POLineItem, POStatus
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from app.models.notification import Notification

SYSTEM_USER = "simulator"


def log(icon, msg):
    print(f"  {icon}  {msg}")


def run():
    db: Session = SessionLocal()
    try:
        print("\n" + "=" * 60)
        print("  🚀  AI PROCUREMENT SYSTEM — LIVE SIMULATOR")
        print("=" * 60)

        products = db.query(Product).all()
        suppliers = db.query(Supplier).filter(Supplier.status == SupplierStatus.active).all()

        if not products:
            print("  ❌  No products found. Please add products first.")
            return
        if not suppliers:
            print("  ❌  No active suppliers found. Please add suppliers first.")
            return

        print(f"\n  📦 Found {len(products)} products, {len(suppliers)} suppliers\n")

        # ─── 1. SUPPLIER CATALOGS ─────────────────────────────────
        print("━" * 50)
        print("  📋  PHASE 1: Supplier Catalogs")
        print("━" * 50)
        catalog_count = populate_catalogs(db, products, suppliers)
        log("✅", f"Created {catalog_count} catalog entries")

        # ─── 2. INVENTORY ─────────────────────────────────────────
        print("\n" + "━" * 50)
        print("  📦  PHASE 2: Inventory Setup")
        print("━" * 50)
        inv_count = setup_inventory(db, products)
        log("✅", f"Set up inventory for {inv_count} products")

        # ─── 3. PURCHASE REQUISITIONS ─────────────────────────────
        print("\n" + "━" * 50)
        print("  📝  PHASE 3: Purchase Requisitions")
        print("━" * 50)
        pr_count = create_requisitions(db, products, suppliers)
        log("✅", f"Created {pr_count} purchase requisitions")

        # ─── 4. PURCHASE ORDERS ───────────────────────────────────
        print("\n" + "━" * 50)
        print("  🛒  PHASE 4: Purchase Orders")
        print("━" * 50)
        po_count = create_purchase_orders(db, products, suppliers)
        log("✅", f"Created {po_count} purchase orders")

        # ─── 5. GOODS RECEIPTS ────────────────────────────────────
        print("\n" + "━" * 50)
        print("  📥  PHASE 5: Goods Receipts & Stock Movements")
        print("━" * 50)
        recv_count = simulate_goods_receipts(db)
        log("✅", f"Processed {recv_count} goods receipts")

        # ─── 6. NOTIFICATIONS ─────────────────────────────────────
        print("\n" + "━" * 50)
        print("  🔔  PHASE 6: Notifications")
        print("━" * 50)
        notif_count = create_notifications(db)
        log("✅", f"Created {notif_count} notifications")

        db.commit()
        print("\n" + "=" * 60)
        print("  ✅  SIMULATION COMPLETE!")
        print("=" * 60)
        print_summary(db)

    except Exception as e:
        db.rollback()
        print(f"\n  ❌  Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


# ─── PHASE 1: Supplier Catalogs ──────────────────────────────────

def populate_catalogs(db: Session, products: list, suppliers: list) -> int:
    """Give each supplier a varied catalog with different prices and quantities."""
    count = 0
    # Price ranges per category (base prices)
    base_prices = {}
    for p in products:
        # Generate a reasonable base price based on category
        cat = (p.category or "").lower()
        if "cpu" in p.name.lower() or "processor" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(300, 800)
        elif "ram" in p.name.lower() or "memory" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(80, 200)
        elif "ssd" in p.name.lower() or "hdd" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(60, 300)
        elif "monitor" in p.name.lower() or "display" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(200, 500)
        elif "switch" in p.name.lower() or "router" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(150, 600)
        elif "ups" in p.name.lower() or "psu" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(50, 200)
        elif "camera" in p.name.lower() or "security" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(100, 400)
        elif "server" in p.name.lower() or "chassis" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(500, 2000)
        elif "cable" in p.name.lower() or "connector" in p.name.lower():
            base_prices[str(p.id)] = random.uniform(15, 80)
        else:
            base_prices[str(p.id)] = random.uniform(30, 500)

    for supplier in suppliers:
        # Each supplier carries 40-80% of all products
        catalog_products = random.sample(products, k=random.randint(
            max(3, int(len(products) * 0.4)),
            min(len(products), int(len(products) * 0.8))
        ))

        for product in catalog_products:
            # Check if already exists
            existing = db.query(SupplierPrice).filter(
                SupplierPrice.supplier_id == supplier.id,
                SupplierPrice.product_id == product.id,
            ).first()
            if existing:
                continue

            base = base_prices.get(str(product.id), 100)
            # Each supplier has ±15% price variation from base
            price = round(base * random.uniform(0.85, 1.15), 2)
            qty = random.choice([25, 50, 75, 100, 150, 200, 500])

            sp = SupplierPrice(
                supplier_id=supplier.id,
                product_id=product.id,
                unit_price=price,
                currency="USD",
                min_order_qty=random.choice([1, 5, 10]),
                lead_time_days=random.choice([2, 3, 5, 7, 10, 14]),
                available_quantity=qty,
                is_active=True,
                valid_from=date.today() - timedelta(days=random.randint(30, 180)),
                valid_to=date.today() + timedelta(days=random.randint(90, 365)),
                source="manual",
            )
            db.add(sp)
            count += 1
            log("📦", f"{supplier.name} → {product.name}: ${price:.2f} (qty: {qty})")

    db.flush()
    return count


# ─── PHASE 2: Inventory ──────────────────────────────────────────

def setup_inventory(db: Session, products: list) -> int:
    """Create inventory records with varied stock levels — some healthy, some low, some critical."""
    count = 0
    for i, product in enumerate(products):
        existing = db.query(Inventory).filter(Inventory.product_id == product.id).first()

        # Create different stock scenarios
        if i % 5 == 0:
            # Critical: out of stock
            stock, min_s, max_s = 0, 10, 200
        elif i % 5 == 1:
            # Low stock
            stock, min_s, max_s = random.randint(2, 8), 10, 200
        elif i % 5 == 2:
            # Medium stock (near min)
            stock, min_s, max_s = random.randint(12, 20), 10, 200
        elif i % 5 == 3:
            # Healthy stock
            stock, min_s, max_s = random.randint(50, 150), 10, 200
        else:
            # Fully stocked
            stock, min_s, max_s = random.randint(150, 200), 10, 200

        if existing:
            existing.current_stock = stock
            existing.min_stock = min_s
            existing.max_stock = max_s
        else:
            inv = Inventory(
                product_id=product.id,
                current_stock=stock,
                min_stock=min_s,
                max_stock=max_s,
            )
            db.add(inv)

        status = "🔴 CRITICAL" if stock == 0 else "🟡 LOW" if stock <= min_s else "🟢 HEALTHY"
        log(status, f"{product.name}: {stock}/{max_s}")
        count += 1

    db.flush()
    return count


# ─── PHASE 3: Purchase Requisitions ──────────────────────────────

def create_requisitions(db: Session, products: list, suppliers: list) -> int:
    """Create PRs in various statuses to test the full lifecycle."""
    count = 0
    year = datetime.utcnow().year

    pr_scenarios = [
        ("Server Room Upgrade", "IT", PRPriority.high, PRStatus.draft, None),
        ("Office Network Expansion", "IT", PRPriority.medium, PRStatus.submitted, None),
        ("Security Camera Installation", "Facilities", PRPriority.high, PRStatus.approved, None),
        ("Desktop Refresh Program", "IT", PRPriority.medium, PRStatus.approved, None),
        ("Storage Expansion Q2", "IT", PRPriority.low, PRStatus.submitted, None),
        ("Emergency UPS Replacement", "Facilities", PRPriority.critical, PRStatus.approved, None),
        ("Network Cable Run", "IT", PRPriority.low, PRStatus.rejected, "Budget exceeded for Q1"),
        ("Monitor Upgrade — Design Team", "Design", PRPriority.medium, PRStatus.draft, None),
    ]

    for title, dept, priority, status, rej_reason in pr_scenarios:
        # Check if already exists
        existing_count = db.query(PurchaseRequisition).filter(
            PurchaseRequisition.title == title
        ).count()
        if existing_count > 0:
            log("⏭️ ", f"PR '{title}' already exists, skipping")
            continue

        # Get existing PR count for numbering
        pr_num_count = db.query(PurchaseRequisition).count() + count + 1
        pr_number = f"PR-SIM-{str(pr_num_count).zfill(4)}"

        pr = PurchaseRequisition(
            pr_number=pr_number,
            title=title,
            description=f"Simulated PR for testing: {title}",
            requested_by=SYSTEM_USER,
            department=dept,
            category="IT Equipment",
            priority=priority,
            status=status,
            estimated_total=0,
            needed_by=date.today() + timedelta(days=random.randint(7, 30)),
            notes="Created by simulator",
            justification=f"Required for {dept} operations",
        )

        if status in (PRStatus.submitted, PRStatus.approved, PRStatus.rejected):
            pr.submitted_at = datetime.utcnow() - timedelta(days=random.randint(1, 7))
        if status == PRStatus.approved:
            pr.approved_at = datetime.utcnow() - timedelta(days=random.randint(0, 3))
            pr.approved_by = SYSTEM_USER
        if status == PRStatus.rejected:
            pr.rejected_at = datetime.utcnow()
            pr.rejection_reason = rej_reason

        # Pick a recommended supplier
        pr.preferred_supplier_id = random.choice(suppliers).id
        pr.ai_suggested_supplier = True

        # Add 1-4 line items
        total = 0
        item_products = random.sample(products, k=random.randint(1, min(4, len(products))))
        for p in item_products:
            price = round(random.uniform(50, 1500), 2)
            qty = random.choice([5, 10, 20, 25, 50])
            li_total = price * qty
            total += li_total

            line = PRLineItem(
                product_id=p.id,
                item_name=p.name,
                quantity=qty,
                estimated_unit_price=price,
                estimated_total=li_total,
                unit=p.unit or "pcs",
            )
            pr.line_items.append(line)

        pr.estimated_total = total
        db.add(pr)
        count += 1
        log("📝", f"{pr_number}: {title} [{status.value}] — {len(item_products)} items, ${total:,.2f}")

    db.flush()
    return count


# ─── PHASE 4: Purchase Orders ────────────────────────────────────

def create_purchase_orders(db: Session, products: list, suppliers: list) -> int:
    """Create POs across every status in the lifecycle."""
    count = 0
    year = datetime.utcnow().year

    po_scenarios = [
        ("Draft — New Server Parts", POStatus.draft, None),
        ("Pending — Awaiting Manager Approval", POStatus.pending_approval, None),
        ("Approved — Ready to Send", POStatus.approved, None),
        ("Sent — Waiting for Supplier", POStatus.sent, "email sent"),
        ("Partially Received — Some Items In", POStatus.partially_received, None),
        ("Received — All Items In", POStatus.received, None),
        ("Paid — Invoice Settled", POStatus.paid, "Invoice #INV-2026-001 paid"),
        ("Cancelled — Budget Cut", POStatus.cancelled, "Project cancelled"),
    ]

    for title, status, notes_text in po_scenarios:
        # Check if already exists
        existing = db.query(PurchaseOrder).filter(
            PurchaseOrder.notes.ilike(f"%{title}%")
        ).count()
        if existing > 0:
            log("⏭️ ", f"PO '{title}' already exists, skipping")
            continue

        po_num_count = db.query(PurchaseOrder).count() + count + 1
        po_number = f"PO-SIM-{str(po_num_count).zfill(4)}"

        supplier = random.choice(suppliers)
        po = PurchaseOrder(
            po_number=po_number,
            supplier_id=supplier.id,
            created_by=SYSTEM_USER,
            status=status,
            total_amount=0,
            expected_delivery=date.today() + timedelta(days=random.randint(5, 21)),
            notes=f"{title}. {notes_text or ''}".strip(),
        )
        if status in (POStatus.sent, POStatus.partially_received, POStatus.received, POStatus.paid):
            po.sent_at = datetime.utcnow() - timedelta(days=random.randint(3, 14))

        # Add 2-5 line items
        total = 0
        item_products = random.sample(products, k=random.randint(2, min(5, len(products))))
        for p in item_products:
            # Try to use supplier catalog price
            sp = db.query(SupplierPrice).filter(
                SupplierPrice.supplier_id == supplier.id,
                SupplierPrice.product_id == p.id,
                SupplierPrice.is_active == True,
            ).first()

            price = sp.unit_price if sp else round(random.uniform(50, 1500), 2)
            qty = random.choice([5, 10, 20, 25, 50])
            li_total = price * qty
            total += li_total

            # Simulate partial/full receipt for received POs
            qty_received = 0
            if status == POStatus.partially_received:
                qty_received = random.randint(1, qty - 1)
            elif status in (POStatus.received, POStatus.paid):
                qty_received = qty

            po_line = POLineItem(
                product_id=p.id,
                quantity=qty,
                unit_price=price,
                total_price=li_total,
                quantity_received=qty_received,
            )
            po.line_items.append(po_line)

        po.total_amount = total
        db.add(po)
        count += 1
        log("🛒", f"{po_number}: [{status.value}] {supplier.name} — ${total:,.2f}")

    db.flush()
    return count


# ─── PHASE 5: Goods Receipts & Stock Movements ───────────────────

def simulate_goods_receipts(db: Session) -> int:
    """For POs marked as received/partially_received, create stock movements."""
    count = 0
    received_pos = db.query(PurchaseOrder).filter(
        PurchaseOrder.status.in_([POStatus.received, POStatus.partially_received, POStatus.paid]),
        PurchaseOrder.notes.ilike("%SIM%"),
    ).all()

    for po in received_pos:
        for li in po.line_items:
            if li.quantity_received > 0 and li.product_id:
                # Check if movement already exists for this
                existing = db.query(StockMovement).filter(
                    StockMovement.reference_id == po.id,
                    StockMovement.product_id == li.product_id,
                ).count()
                if existing > 0:
                    continue

                # Create stock movement
                inv = db.query(Inventory).filter(Inventory.product_id == li.product_id).first()
                stock_after = (inv.current_stock if inv else 0) + li.quantity_received

                if inv:
                    inv.current_stock = stock_after

                movement = StockMovement(
                    product_id=li.product_id,
                    type="GOODS_IN",
                    quantity=li.quantity_received,
                    reference_type="PURCHASE_ORDER",
                    reference_id=po.id,
                    performed_by=SYSTEM_USER,
                    notes=f"Received from {po.po_number}. Condition: GOOD.",
                    stock_after=stock_after,
                )
                db.add(movement)
                count += 1

                # Deduct from supplier's catalog
                if po.supplier_id:
                    sp = db.query(SupplierPrice).filter(
                        SupplierPrice.supplier_id == po.supplier_id,
                        SupplierPrice.product_id == li.product_id,
                        SupplierPrice.is_active == True,
                    ).first()
                    if sp and sp.available_quantity is not None:
                        sp.available_quantity = max(0, sp.available_quantity - li.quantity_received)

                log("📥", f"{po.po_number} → {li.product.name if li.product else 'Unknown'}: +{li.quantity_received} received")

    db.flush()
    return count


# ─── PHASE 6: Notifications ──────────────────────────────────────

def create_notifications(db: Session) -> int:
    """Create sample notifications for all event types."""
    count = 0
    notifications = [
        ("stock_alert", "🔴 Critical Stock Alert",
         "Intel Core i9-14900K is OUT OF STOCK. Reorder immediately.",
         "/inventory"),
        ("stock_alert", "🟡 Low Stock Warning",
         "DDR5 32GB Module is below minimum stock level (5/10).",
         "/inventory"),
        ("price_spike", "⚠️ Price Spike Detected",
         "NVMe SSD 1TB price increased 35% from TechCore Components ($95 → $128). Review pricing.",
         "/ai-insights"),
        ("approval_needed", "📋 PR Pending Approval",
         "New purchase request 'Emergency UPS Replacement' ($2,500) requires your approval.",
         "/approvals"),
        ("approval_needed", "📋 PO Pending Approval",
         "Purchase order PO-SIM-0002 ($8,450) is waiting for manager approval.",
         "/approvals"),
        ("po_sent", "✉️ PO Sent to Supplier",
         "PO-SIM-0004 has been emailed to Pacific Supply Co.",
         "/purchase-orders"),
        ("po_received", "📦 Goods Received",
         "PO-SIM-0006: All items received and inventory updated.",
         "/purchase-orders"),
        ("approval_result", "✅ PR Approved",
         "Your purchase request 'Security Camera Installation' has been approved by the manager.",
         "/requisitions"),
        ("system", "🔧 System Update",
         "AI Insights have been refreshed with latest anomaly detection results.",
         "/ai-insights"),
        ("forecast_ready", "📊 Demand Forecast Ready",
         "Q2 demand forecast has been generated for IT Equipment category.",
         "/ai-insights"),
    ]

    for ntype, title, message, link in notifications:
        existing = db.query(Notification).filter(
            Notification.title == title,
        ).count()
        if existing > 0:
            continue

        notif = Notification(
            user_id=SYSTEM_USER,
            type=ntype,
            title=title,
            message=message,
            link=link,
            is_read=random.choice([True, False, False]),  # 2/3 chance unread
        )
        db.add(notif)
        count += 1
        log("🔔", f"[{ntype}] {title}")

    db.flush()
    return count


# ─── Summary ──────────────────────────────────────────────────────

def print_summary(db: Session):
    """Print a summary of what's in the system now."""
    products = db.query(Product).count()
    suppliers = db.query(Supplier).count()
    catalog = db.query(SupplierPrice).filter(SupplierPrice.is_active == True).count()
    prs = db.query(PurchaseRequisition).count()
    pos = db.query(PurchaseOrder).count()
    inv = db.query(Inventory).count()
    movements = db.query(StockMovement).count()
    notifs = db.query(Notification).count()

    low_stock = db.query(Inventory).filter(Inventory.current_stock <= Inventory.min_stock, Inventory.current_stock > 0).count()
    critical = db.query(Inventory).filter(Inventory.current_stock == 0).count()

    approved_prs = db.query(PurchaseRequisition).filter(PurchaseRequisition.status == PRStatus.approved).count()
    pending_pos = db.query(PurchaseOrder).filter(PurchaseOrder.status == POStatus.pending_approval).count()

    print(f"""
  ┌────────────────────────────────────────────────┐
  │            SYSTEM STATUS SUMMARY               │
  ├────────────────────────────────────────────────┤
  │  📦 Products:              {products:>5}               │
  │  🏪 Suppliers:             {suppliers:>5}               │
  │  📋 Catalog Entries:       {catalog:>5}               │
  │  📝 Purchase Requisitions: {prs:>5}               │
  │  🛒 Purchase Orders:       {pos:>5}               │
  │  📦 Inventory Items:       {inv:>5}               │
  │  📊 Stock Movements:       {movements:>5}               │
  │  🔔 Notifications:         {notifs:>5}               │
  ├────────────────────────────────────────────────┤
  │  ⚠️  Low Stock Items:       {low_stock:>5}               │
  │  🔴 Critical (Out of Stock): {critical:>3}               │
  │  📋 PRs Ready to Convert:  {approved_prs:>5}               │
  │  ⏳ POs Pending Approval:  {pending_pos:>5}               │
  └────────────────────────────────────────────────┘

  🎯 WHAT TO TEST NOW:
  ──────────────────────
  1. Dashboard     → See stats, charts, activity feed
  2. Inventory     → Low/critical stock items with red/yellow badges
  3. Requests      → 8 PRs in different states (draft, submitted, approved, rejected)
  4. Approvals     → Pending PRs and POs to approve/reject
  5. Orders        → POs in every lifecycle stage
  6. AI Insights   → Anomaly detection, scoring, forecasts
  7. Analytics     → Spending charts, supplier performance
  8. Suppliers     → Catalogs with varied prices & quantities
""")


# ─── Entry Point ──────────────────────────────────────────────────
if __name__ == "__main__":
    run()
