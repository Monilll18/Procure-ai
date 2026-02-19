"""
ProcureAI Simulation Engine
===========================
Runs in the background to simulate a living business environment.

Acts as:
1. CUSTOMERS: Randomly buying products (draining inventory).
2. EMPLOYEES: Creating Purchase Requests (PRs) when stock is low.
3. SUPPLIERS: Receiving orders and sending invoices (updating PO status).
4. ECONOMY: Fluctuating market prices (triggering AI anomalies).

Run:
    python server/simulate.py
"""
import sys
import os
import time
import random
import logging
from datetime import datetime, timedelta

# Setup paths
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv

load_dotenv()

from app.database import SessionLocal
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.purchase_requisition import PurchaseRequisition, PRStatus, PRLineItem, PRPriority
from app.models.purchase_order import PurchaseOrder, POStatus
from app.models.supplier_price import SupplierPrice
from app.models.notification import Notification

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("Simulate")

USER_IDS = ["seed_officer", "seed_manager"]  # Users who "create" PRs

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def simulate_sales(db):
    """
    Simulate customers buying products.
    Effect: Inventory levels drop, eventually triggering low stock.
    """
    logger.info("🛒 Customers are shopping...")
    
    # Pick 3-6 random products to "sell"
    all_inventory = db.query(Inventory).join(Product).all()
    if not all_inventory:
        return

    targets = random.sample(all_inventory, k=min(len(all_inventory), random.randint(3, 6)))
    
    for inv in targets:
        if inv.current_stock > 0:
            # Sales volume depends on product category (simplified)
            qty_sold = random.randint(1, 3)
            
            # Don't sell more than we have
            qty_sold = min(qty_sold, inv.current_stock)
            
            inv.current_stock -= qty_sold
            product_name = inv.product.name
            logger.info(f"   💰 Sold {qty_sold}x {product_name} (Remaining: {inv.current_stock})")
            
            # Check if this triggered a critical low
            if inv.current_stock <= inv.product.reorder_point and inv.current_stock + qty_sold > inv.product.reorder_point:
                 logger.warning(f"   ⚠️  Low Stock Alert: {product_name} dropped below reorder point!")

    db.commit()

def simulate_employees(db):
    """
    Simulate employees checking stock and creating PRs.
    Effect: "Pending Approval" queue fills up.
    """
    logger.info("👷 Employees checking inventory...")
    
    # Check for items below reorder point that DON'T have a pending PR/PO
    low_stock_items = (
        db.query(Inventory)
        .join(Product)
        .filter(Inventory.current_stock <= Product.reorder_point)
        .all()
    )
    
    for inv in low_stock_items:
        # Check if already requested (simplified check)
        existing_pr = (
            db.query(PurchaseRequisition)
            .join(PRLineItem)
            .filter(
                PRLineItem.product_id == inv.product_id,
                PurchaseRequisition.status.in_([PRStatus.submitted, PRStatus.approved, PRStatus.created])
            )
            .first()
        )
        
        if not existing_pr:
            # Create a Restock PR
            logger.info(f"   📝 Creating PR for low stock item: {inv.product.name}")
            
            pr_number = f"PR-{datetime.utcnow().year}-{random.randint(10000, 99999)}"
            request_qty = inv.product.reorder_quantity
            
            pr = PurchaseRequisition(
                pr_number=pr_number,
                title=f"Restock: {inv.product.name}",
                description=f"Auto-generated restock request. Stock is {inv.current_stock} (Min: {inv.product.reorder_point}).",
                requested_by=random.choice(USER_IDS),
                department=inv.product.category,
                priority=PRPriority.high if inv.current_stock == 0 else PRPriority.medium,
                status=PRStatus.submitted,
                submitted_at=datetime.utcnow(),
                estimated_total=0,  # Will be calculated from lines
            )
            
            # Estimate price (avg of supplier prices)
            prices = [sp.unit_price for sp in inv.product.supplier_prices]
            est_price = sum(prices)/len(prices) if prices else 100.0
            total = est_price * request_qty
            pr.estimated_total = total
            
            line = PRLineItem(
                product_id=inv.product_id,
                item_name=inv.product.name,
                quantity=request_qty,
                estimated_unit_price=est_price,
                estimated_total=total,
                unit=inv.product.unit
            )
            pr.line_items.append(line)
            
            db.add(pr)
            
            # Notify Managers
            msg = f"New PR {pr_number} for {inv.product.name} needs approval."
            db.add(Notification(
                user_id="seed_manager",
                type="approval_needed",
                title="Approval Needed",
                message=msg,
                link=f"/requisitions/{pr.id}"
            ))
            
    db.commit()

def simulate_suppliers(db):
    """
    Simulate suppliers receiving orders and delivering goods.
    Effect: 'Sent' POs move to 'Received' or 'Invoiced'.
    """
    logger.info("🚚 Checking supplier status...")
    
    # Identify POs that are 'Sent'
    sent_pos = db.query(PurchaseOrder).filter(PurchaseOrder.status == POStatus.sent).all()
    
    for po in sent_pos:
        # Random chance to progress status
        if random.random() < 0.3: # 30% chance per tick
            new_status = random.choice([POStatus.invoiced, POStatus.received])
            po.status = new_status
            
            status_label = "Invoiced" if new_status == POStatus.invoiced else "Received"
            logger.info(f"   📬 Supplier updated {po.po_number} to status: {status_label}")
            
            # Notify Creator
            db.add(Notification(
                user_id=po.created_by,
                type="po_update",
                title=f"PO {status_label}",
                message=f"Purchase Order {po.po_number} has been marked as {status_label} by supplier.",
                link=f"/purchase-orders/{po.id}"
            ))
            
    db.commit()

def simulate_economy(db):
    """
    Simulate market price fluctuations.
    Effect: Future PRs might trigger price anomaly alerts.
    """
    # Only run this rarely (handled by main loop counter)
    logger.info("📈 Market prices fluctuating...")
    
    prices = db.query(SupplierPrice).filter(SupplierPrice.is_active == True).all()
    targets = random.sample(prices, k=min(len(prices), 5))
    
    for sp in targets:
        # +/- 5% change
        change_pct = random.uniform(0.95, 1.05)
        old_price = sp.unit_price
        new_price = round(old_price * change_pct, 2)
        sp.unit_price = new_price
        
        logger.info(f"   💲 Price Change: {sp.product.name} ({sp.supplier.name}) ${old_price} -> ${new_price}")

    db.commit()


def run_simulation():
    print("\n🚀 ProcureAI Simulation Engine Started")
    print("-------------------------------------")
    print("Press Ctrl+C to stop.\n")
    
    tick = 0
    next_economy_update = 0
    
    while True:
        db = SessionLocal()
        try:
            # 1. Sales (Inventory Drain) - Runs every tick (10s)
            simulate_sales(db)
            
            # 2. Employees (Auto PRs) - Runs every 3 ticks (30s)
            if tick % 3 == 0:
                simulate_employees(db)
                
            # 3. Suppliers (PO Updates) - Runs every 6 ticks (60s)
            if tick % 6 == 0:
                simulate_suppliers(db)
                
            # 4. Economy (Price Flux) - Runs every 30 ticks (5 mins)
            if tick % 30 == 0:
                simulate_economy(db)
                
            tick += 1
            time.sleep(10) # 10 second tick
            
        except KeyboardInterrupt:
            print("\n🛑 Simulation stopped.")
            break
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
            time.sleep(10)
        finally:
            db.close()

if __name__ == "__main__":
    run_simulation()
