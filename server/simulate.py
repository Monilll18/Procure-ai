"""
ProcureAI Live Simulation Engine  v2.0
========================================
Runs 4 autonomous background agents that simulate real business activity.

  🛒  Sales Agent     — drains inventory every tick
  🙋  Employee Agent  — creates PRs when stock is low or ad-hoc
  🚚  Supplier Agent  — advances PO statuses through full lifecycle
  📊  Economy Agent   — fluctuates supplier prices, fires price-spike alerts

Usage:
    cd server
    source venv/bin/activate

    python simulate.py                 # Normal speed (10s tick)
    python simulate.py --speed=fast    # Fast demo mode (2s tick)
    python simulate.py --once          # Run all agents once and exit

Press Ctrl+C to stop.
"""

import argparse
import logging
import random
import sys
import time
import uuid
from datetime import date, datetime, timedelta

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.models.inventory            import Inventory
from app.models.notification         import Notification, NotificationType
from app.models.product              import Product
from app.models.purchase_order       import PurchaseOrder, POLineItem, POStatus
from app.models.purchase_requisition import PurchaseRequisition, PRLineItem, PRPriority, PRStatus
from app.models.supplier             import Supplier
from app.models.supplier_price       import SupplierPrice
from app.models.budget               import Budget

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("Simulate")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# Clerk IDs — replace with real ones from your DB if desired
CLERK_IDS = {
    "admin":    "user_clerk_admin_001",
    "manager":  "user_clerk_manager_001",
    "officer":  "user_clerk_officer_001",
    "approver": "user_clerk_approver_001",
}
ALL_USERS = list(CLERK_IDS.values())

# Tick intervals in seconds
TICK_NORMAL = 10   # each tick = 10 seconds
TICK_FAST   = 2    # each tick = 2 seconds

# Which tick multiple each agent runs on
AGENT_TICKS = {
    "sales":    1,   # every tick
    "employee": 3,   # every 3 ticks
    "supplier": 6,   # every 6 ticks
    "economy":  18,  # every 18 ticks
}

# Shared counters — initialized from DB on startup to avoid duplicate keys
_counters = {"pr": 9000, "po": 8000}


def _init_counters():
    """Read max existing SIM numbers from DB so restarts never cause duplicates."""
    from app.models.purchase_requisition import PurchaseRequisition
    from app.models.purchase_order import PurchaseOrder
    import re
    db = SessionLocal()
    try:
        pr_nums = db.query(PurchaseRequisition.pr_number).filter(
            PurchaseRequisition.pr_number.like("PR-SIM-%")).all()
        if pr_nums:
            nums = [int(n[0].replace("PR-SIM-", "")) for n in pr_nums if n[0].replace("PR-SIM-", "").isdigit()]
            if nums:
                _counters["pr"] = max(nums)

        po_nums = db.query(PurchaseOrder.po_number).filter(
            PurchaseOrder.po_number.like("PO-SIM-%")).all()
        if po_nums:
            nums = [int(n[0].replace("PO-SIM-", "")) for n in po_nums if n[0].replace("PO-SIM-", "").isdigit()]
            if nums:
                _counters["po"] = max(nums)

        logger.info(f"Counters initialized → PR-SIM starts at {_counters['pr']+1}, PO-SIM at {_counters['po']+1}")
    finally:
        db.close()


def _pr_num() -> str:
    _counters["pr"] += 1
    return f"PR-SIM-{_counters['pr']}"


def _po_num() -> str:
    _counters["po"] += 1
    return f"PO-SIM-{_counters['po']}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def db_session():
    return SessionLocal()


def broadcast(db, ntype: str, title: str, message: str, link: str = None):
    for uid in ALL_USERS:
        db.add(Notification(
            user_id=uid, type=ntype,
            title=title, message=message,
            link=link, is_read=False,
        ))


def log(icon: str, agent: str, msg: str):
    logger.info(f"{icon}  [{agent}] {msg}")


# ---------------------------------------------------------------------------
# 🛒  Agent 1: Sales — drains inventory
# ---------------------------------------------------------------------------

def run_sales(db):
    all_inv = db.query(Inventory).join(Product).all()
    if not all_inv:
        log("🛒", "SALES", "No inventory — run seed_data.py first.")
        return

    targets = random.sample(all_inv, min(random.randint(2, 5), len(all_inv)))
    sold = []

    for inv in targets:
        if inv.current_stock <= 0:
            continue
        drain = random.randint(1, max(1, inv.current_stock // 6))
        inv.current_stock = max(0, inv.current_stock - drain)

        product = db.query(Product).get(inv.product_id)
        pname   = product.name if product else "?"
        sold.append(f"{pname}(-{drain}→{inv.current_stock})")

        # Low-stock alert
        if inv.current_stock <= inv.min_stock:
            log("⚠", "SALES", f"LOW STOCK: {pname} = {inv.current_stock} units left")
            broadcast(db, NotificationType.stock_alert,
                      f"⚠ Low Stock: {pname}",
                      f"Stock dropped to {inv.current_stock} (min {inv.min_stock}). Reorder now.",
                      link="/inventory")

    db.commit()
    if sold:
        log("🛒", "SALES", "  " + "  ".join(sold))


# ---------------------------------------------------------------------------
# 🙋  Agent 2: Employee — creates requisitions
# ---------------------------------------------------------------------------

AD_HOC_TEMPLATES = [
    ("Replacement laptops for new joiners",     "IT Hardware",    "Engineering", PRPriority.high,      8800.0),
    ("Whiteboard markers bulk restock",         "Office Supplies","Admin",       PRPriority.low,        360.0),
    ("Ergonomic chairs for remote staff",       "Furniture",      "HR",          PRPriority.medium,    3200.0),
    ("First-aid kit quarterly restock",         "Medical",        "Facilities",  PRPriority.high,      1300.0),
    ("Printer cartridges bulk (HQ)",            "Printing",       "Admin",       PRPriority.low,        900.0),
    ("USB-C docking stations for Dev team",     "Electronics",    "IT",          PRPriority.medium,    2250.0),
    ("Monitor arms for standing desks",         "IT Hardware",    "Design",      PRPriority.low,       1100.0),
    ("Safety vests & helmets",                  "Medical",        "Facilities",  PRPriority.high,       750.0),
    ("Coffee machine — break room replacement", "Office Supplies","Admin",       PRPriority.low,        480.0),
    ("Annual software license renewal",         "IT Hardware",    "IT",          PRPriority.critical, 12000.0),
]


def run_employee(db):
    created = 0

    # --- Reactive: low-stock restock PRs ---
    low = (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.current_stock <= Product.reorder_point)
        .all()
    )
    for inv, product in low:
        # Skip if open PR already exists for same category
        has_open = (
            db.query(PurchaseRequisition)
            .filter(
                PurchaseRequisition.category == product.category,
                PurchaseRequisition.status.in_([
                    PRStatus.draft, PRStatus.submitted, PRStatus.under_review
                ])
            ).first()
        )
        if has_open:
            continue

        qty    = product.reorder_quantity
        sp     = (db.query(SupplierPrice)
                  .filter(SupplierPrice.product_id == product.id,
                          SupplierPrice.is_active == True)
                  .order_by(SupplierPrice.unit_price).first())
        price  = sp.unit_price if sp else 50.0
        total  = qty * price
        pr_num = _pr_num()

        pr = PurchaseRequisition(
            pr_number=pr_num,
            title=f"[AUTO] Restock: {product.name}",
            description=(f"Auto-generated. Stock={inv.current_stock}, "
                         f"reorder point={product.reorder_point}."),
            requested_by=CLERK_IDS["officer"],
            department="Procurement",
            category=product.category,
            priority=PRPriority.high,
            status=PRStatus.submitted,
            estimated_total=total,
            budget_code=f"AUTO-{date.today().year}",
            needed_by=date.today() + timedelta(days=7),
            submitted_at=datetime.utcnow(),
            justification="Auto restock — stock below reorder point.",
            ai_suggested_supplier=True,
            ai_suggested_quantity=True,
        )
        pr.line_items.append(PRLineItem(
            item_name=product.name, quantity=qty,
            estimated_unit_price=price, estimated_total=total,
            unit=product.unit, product_id=product.id,
        ))
        db.add(pr)
        created += 1
        log("🙋", "EMPLOYEE", f"Restock PR: {pr_num} — {product.name} ×{qty} = ${total:.0f}")
        broadcast(db, NotificationType.approval_needed,
                  f"New Restock PR: {pr_num}",
                  f"Auto-restock for {product.name} awaiting approval.",
                  link=f"/requisitions/{pr_num}")

    # --- Ad-hoc PR: 35% chance ---
    if random.random() < 0.35:
        title, cat, dept, priority, total = random.choice(AD_HOC_TEMPLATES)
        pr_num = _pr_num()
        pr = PurchaseRequisition(
            pr_number=pr_num,
            title=f"[AUTO] {title}",
            description=f"Simulated ad-hoc request from {dept}.",
            requested_by=CLERK_IDS["officer"],
            department=dept, category=cat, priority=priority,
            status=PRStatus.submitted, estimated_total=total,
            budget_code=f"BUD-{dept[:3].upper()}-{date.today().year}",
            needed_by=date.today() + timedelta(days=random.randint(5, 21)),
            submitted_at=datetime.utcnow(),
            justification="Simulated operational requirement.",
            ai_suggested_quantity=random.choice([True, False]),
        )
        db.add(pr)
        created += 1
        log("🙋", "EMPLOYEE", f"Ad-hoc PR: {pr_num} — {title[:55]}")
        broadcast(db, NotificationType.approval_needed,
                  f"New PR: {pr_num}", f"'{title}' awaiting approval.",
                  link=f"/requisitions/{pr_num}")

    db.commit()
    if not created:
        log("🙋", "EMPLOYEE", "No new PRs needed this cycle.")


# ---------------------------------------------------------------------------
# 🚚  Agent 3: Supplier — advances PO lifecycle
# ---------------------------------------------------------------------------

PO_TRANSITIONS = {
    POStatus.pending_approval:   POStatus.approved,
    POStatus.approved:           POStatus.sent,
    POStatus.sent:               POStatus.partially_received,
    POStatus.partially_received: POStatus.received,
    POStatus.received:           POStatus.invoiced,
    POStatus.invoiced:           POStatus.paid,
}


def run_supplier(db):
    open_pos = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.status.in_(list(PO_TRANSITIONS.keys())))
        .order_by(PurchaseOrder.updated_at)
        .all()
    )
    if not open_pos:
        log("🚚", "SUPPLIER", "No open POs to advance.")
        return

    to_advance = random.sample(open_pos, min(random.randint(1, 3), len(open_pos)))

    for po in to_advance:
        new_status = PO_TRANSITIONS.get(po.status)
        if not new_status:
            continue

        old_label  = po.status.value
        po.status  = new_status
        po.updated_at = datetime.utcnow()
        sname = po.supplier.name if po.supplier else "Supplier"
        log("🚚", "SUPPLIER", f"PO {po.po_number}: {old_label} → {new_status.value}  ({sname})")

        if new_status == POStatus.sent:
            broadcast(db, NotificationType.po_sent,
                      f"PO Sent: {po.po_number}",
                      f"PO {po.po_number} was sent to {sname}.",
                      link=f"/purchase-orders/{po.id}")

        elif new_status in (POStatus.received, POStatus.partially_received):
            # Update inventory
            for li in po.line_items:
                inv = db.query(Inventory).filter(Inventory.product_id == li.product_id).first()
                if inv:
                    recv = li.quantity if new_status == POStatus.received else max(1, li.quantity // 2)
                    li.quantity_received = recv
                    inv.current_stock   += recv
                    log("🚚", "SUPPLIER", f"   ↳ +{recv} units restocked for product {li.product_id}")

            broadcast(db, NotificationType.po_received,
                      f"PO {'Partially ' if new_status == POStatus.partially_received else ''}Delivered: {po.po_number}",
                      f"{sname} delivered PO {po.po_number}.",
                      link=f"/purchase-orders/{po.id}")

    db.commit()


# ---------------------------------------------------------------------------
# 📊  Agent 4: Economy — fluctuates supplier prices
# ---------------------------------------------------------------------------

def run_economy(db):
    prices = db.query(SupplierPrice).filter(SupplierPrice.is_active == True).all()
    if not prices:
        log("📊", "ECONOMY", "No supplier prices found.")
        return

    targets = random.sample(prices, min(random.randint(2, 4), len(prices)))

    for sp in targets:
        old   = sp.unit_price
        spike = random.random() < 0.20   # 20% chance of a spike

        if spike:
            pct = random.uniform(0.15, 0.28)
        else:
            pct = random.uniform(-0.04, 0.04)

        new   = round(max(1.0, old * (1 + pct)), 2)
        sp.unit_price = new

        product  = db.query(Product).get(sp.product_id)
        supplier = db.query(Supplier).get(sp.supplier_id)
        pname    = product.name  if product  else "Product"
        sname    = supplier.name if supplier else "Supplier"

        if spike:
            log("📊", "ECONOMY",
                f"🔴 PRICE SPIKE: {pname} @ {sname}: ${old:.2f}→${new:.2f} (+{pct*100:.0f}%)")
            broadcast(db, NotificationType.price_spike,
                      f"⚠ Price Spike: {pname}",
                      f"{sname} raised {pname} price by +{pct*100:.0f}%: ${old:.2f}→${new:.2f}",
                      link="/suppliers")
        else:
            arrow = "↑" if pct > 0 else "↓"
            log("📊", "ECONOMY",
                f"{arrow} Drift: {pname} @ {sname}: ${old:.2f}→${new:.2f}")

        # Nudge budget spent to reflect market reality
        if product and product.category:
            bgt = (db.query(Budget)
                   .filter(Budget.category == product.category,
                           Budget.period_year  == date.today().year,
                           Budget.period_month == date.today().month)
                   .first())
            if bgt:
                bgt.spent_amount = min(
                    bgt.allocated_amount,
                    bgt.spent_amount + abs(new - old) * 3
                )

    db.commit()


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def run_all_once():
    db = SessionLocal()
    try:
        run_sales(db)
        run_employee(db)
        run_supplier(db)
        run_economy(db)
    finally:
        db.close()


def run_loop(tick_sec: int):
    print()
    print("╔═══════════════════════════════════════════════════╗")
    print("║   ProcureAI Live Simulation Engine  v2.0          ║")
    print("╠═══════════════════════════════════════════════════╣")
    print(f"║   Tick: {tick_sec}s  |  Press Ctrl+C to stop.             ║")
    print("╠═══════════════════════════════════════════════════╣")
    print("║   🛒 Sales   — every tick                         ║")
    print(f"║   🙋 Employee— every {AGENT_TICKS['employee']} ticks ({AGENT_TICKS['employee']*tick_sec}s)                 ║")
    print(f"║   🚚 Supplier— every {AGENT_TICKS['supplier']} ticks ({AGENT_TICKS['supplier']*tick_sec}s)                 ║")
    print(f"║   📊 Economy — every {AGENT_TICKS['economy']} ticks ({AGENT_TICKS['economy']*tick_sec}s)                ║")
    print("╚═══════════════════════════════════════════════════╝\n")

    tick = 0
    while True:
        db = SessionLocal()
        try:
            if tick % AGENT_TICKS["sales"]    == 0: run_sales(db)
            if tick % AGENT_TICKS["employee"] == 0: run_employee(db)
            if tick % AGENT_TICKS["supplier"] == 0: run_supplier(db)
            if tick % AGENT_TICKS["economy"]  == 0: run_economy(db)
        except Exception as e:
            logger.error(f"Loop error: {e}")
        finally:
            db.close()

        tick += 1
        time.sleep(tick_sec)


def main():
    parser = argparse.ArgumentParser(description="ProcureAI Live Simulation Engine")
    parser.add_argument("--speed", choices=["normal", "fast"], default="normal",
                        help="normal=10s tick, fast=2s tick (demo mode)")
    parser.add_argument("--once", action="store_true",
                        help="Run all agents once and exit")
    args = parser.parse_args()

    tick = TICK_FAST if args.speed == "fast" else TICK_NORMAL

    # Always init counters from DB before starting
    _init_counters()

    try:
        if args.once:
            print("\n🚀 Running single simulation batch...\n")
            run_all_once()
            print("\n✅  Done.\n")
        else:
            run_loop(tick)
    except KeyboardInterrupt:
        print("\n\n  🛑 Simulation stopped. Goodbye!\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
