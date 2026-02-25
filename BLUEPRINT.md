# **COMPLETE PROJECT BLUEPRINT FOR CLAUDE OPUS 4.6 AGENTIC IDE**

This is the **master document** - copy this entire thing to your Claude Opus 4.6 IDE session.

---

## **📋 PROJECT SPECIFICATION DOCUMENT**

```markdown
# AI PROCUREMENT SAAS - COMPLETE SYSTEM SPECIFICATION

## PROJECT IDENTITY

**Project Name:** ProcureAI  
**Type:** B2B SaaS Web Application  
**Architecture:** Full-stack monorepo with separate AI microservice  
**Development Timeline:** 16 weeks (4 months)  
**Deployment:** Production-ready, scalable, 100% free tier hosting  

## EXECUTIVE SUMMARY

ProcureAI is an intelligent procurement management system that automates the entire purchasing workflow using AI. It replaces manual, spreadsheet-based procurement with a smart system that:

1. Predicts inventory needs before stockouts occur (AI forecasting)
2. Automatically finds and compares suppliers (smart vendor selection)
3. Generates professional purchase orders in seconds (automation)
4. Routes approvals to the right people automatically (workflow engine)
5. Tracks deliveries and updates inventory in real-time (end-to-end visibility)

**Target Market:** Small to medium businesses (10-200 employees) across all industries  
**Business Model:** Freemium SaaS (Free tier → Growth $99/mo → Enterprise custom)  
**Core Value:** Save 80% of procurement time, reduce costs by 25%, prevent stockouts by 90%

## SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile Web  │  │    Admin     │      │
│  │  (Next.js)   │  │  (Responsive)│  │    Panel     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/REST API
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────────────────────────────────▼─────────────┐
│                  API GATEWAY LAYER                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Load Balancer + Rate Limiter + Auth Middleware   │     │
│  │  (Clerk JWT Verification + RBAC)                   │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬───────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼─────────────┐      ┌───────────▼──────────────┐
│   MAIN BACKEND API    │      │   AI MICROSERVICE        │
│   (Node.js/Express)   │◄────►│   (Python/FastAPI)       │
│   Port: 3001          │      │   Port: 8000             │
│                       │      │                          │
│  ┌─────────────────┐ │      │  ┌──────────────────┐   │
│  │ Business Logic  │ │      │  │ Prophet Model    │   │
│  │ REST API Routes │ │      │  │ Price Analyzer   │   │
│  │ Approval Engine │ │      │  │ Supplier Scorer  │   │
│  │ Notification Svc│ │      │  │ LLM Integration  │   │
│  │ Background Jobs │ │      │  │ OCR Parser       │   │
│  └─────────────────┘ │      │  └──────────────────┘   │
└───────────┬───────────┘      └──────────────────────────┘
            │
    ┌───────┼───────┬─────────┬────────────┐
    │       │       │         │            │
┌───▼───┐ ┌─▼──┐ ┌─▼───┐  ┌──▼────┐  ┌───▼────┐
│Postgre│ │Redis│ │File │  │Email  │  │External│
│SQL DB │ │Cache│ │Store│  │Service│  │APIs    │
│(Neon) │ │(Up- │ │(Up- │  │(Resend│  │(Market │
│       │ │stash│ │load-│  │)      │  │Prices) │
│       │ │)    │ │thing│  │       │  │        │
└───────┘ └─────┘ └─────┘  └───────┘  └────────┘
```

### Technology Stack

**Frontend:**
```
Framework:        Next.js 14 (App Router)
Language:         TypeScript
Styling:          Tailwind CSS
UI Components:    shadcn/ui
State Management: Zustand
Forms:            React Hook Form + Zod
Tables:           TanStack Table v8
Charts:           Recharts
Icons:            Lucide React
Animations:       Framer Motion + GSAP
PDF Generation:   @react-pdf/renderer
Date Handling:    date-fns
```

**Backend (Main API):**
```
Runtime:          Node.js 20 LTS
Framework:        Express.js
Language:         TypeScript
ORM:              Prisma
Validation:       Zod
Auth:             Clerk (JWT)
Background Jobs:  node-cron + Bull Queue
Email:            Resend API
File Upload:      Uploadthing
PDF Generation:   Puppeteer (if needed)
Testing:          Jest + Supertest
```

**AI Microservice:**
```
Language:         Python 3.11+
Framework:        FastAPI
Forecasting:      Prophet (Meta)
ML Framework:     scikit-learn
LLM:              Groq API (free tier)
OCR:              Tesseract/pytesseract
Data Processing:  Pandas + NumPy
Testing:          pytest
```

**Database & Infrastructure:**
```
Database:         PostgreSQL 15 (Neon - 3GB free)
Cache:            Redis (Upstash - 10K commands/day)
File Storage:     Uploadthing (2GB) + Cloudflare R2 (10GB)
Auth Provider:    Clerk (10K MAU free)
Email Service:    Resend (100 emails/day free)
```

**Hosting & DevOps:**
```
Frontend:         Vercel (unlimited bandwidth)
Backend API:      Railway.app ($5 credit/month)
AI Service:       Hugging Face Spaces (free CPU)
Monitoring:       Sentry (5K errors/month free)
Analytics:        PostHog (1M events/month free)
CI/CD:            GitHub Actions
```

## DATABASE SCHEMA

### Core Tables (20 tables)

**1. Authentication & Users**
```sql
organizations
├── id (UUID, PK)
├── name (VARCHAR 255)
├── industry (VARCHAR 100)
├── subscription_tier (ENUM: free, growth, enterprise)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

users
├── id (UUID, PK)
├── organization_id (UUID, FK → organizations)
├── clerk_id (VARCHAR 255, UNIQUE) -- Clerk user ID
├── email (VARCHAR 255, UNIQUE)
├── full_name (VARCHAR 255)
├── role (ENUM: ADMIN, PROCUREMENT_MANAGER, MANAGER, 
│         FINANCE_MANAGER, WAREHOUSE_STAFF, EMPLOYEE)
├── department (VARCHAR 100)
├── approval_limit (DECIMAL 12,2)
├── is_active (BOOLEAN DEFAULT true)
└── created_at (TIMESTAMP)
```

**2. Product & Inventory**
```sql
categories
├── id (SERIAL, PK)
├── organization_id (UUID, FK)
├── name (VARCHAR 100)
├── parent_category_id (INT, FK → categories, NULLABLE)
└── created_at (TIMESTAMP)

products
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── sku (VARCHAR 100, UNIQUE per org)
├── name (VARCHAR 255)
├── description (TEXT)
├── category_id (INT, FK → categories)
├── unit_of_measure (VARCHAR 50) -- kg, ltr, pcs, box
├── min_order_quantity (INT)
├── reorder_point (INT)
├── max_stock_level (INT)
├── lead_time_days (INT DEFAULT 7)
├── unit_cost (DECIMAL 10,2)
├── is_active (BOOLEAN DEFAULT true)
└── created_at (TIMESTAMP)

inventory_levels
├── id (UUID, PK)
├── product_id (UUID, FK → products)
├── warehouse_location (VARCHAR 100)
├── quantity_on_hand (INT DEFAULT 0)
├── quantity_reserved (INT DEFAULT 0)
├── quantity_available (GENERATED: on_hand - reserved)
├── last_counted_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

stock_movements
├── id (UUID, PK)
├── product_id (UUID, FK)
├── type (ENUM: GOODS_IN, GOODS_OUT, ADJUSTMENT)
├── quantity (INT)
├── reference_type (VARCHAR 50) -- PO, ADJUSTMENT, etc
├── reference_id (UUID)
├── performed_by (UUID, FK → users)
├── storage_location (VARCHAR 100)
├── notes (TEXT)
└── created_at (TIMESTAMP)
```

**3. Supplier Management**
```sql
suppliers
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── name (VARCHAR 255)
├── email (VARCHAR 255)
├── phone (VARCHAR 50)
├── address (TEXT)
├── country (VARCHAR 100)
├── payment_terms (VARCHAR 100) -- Net 30, Net 60, COD
├── currency (VARCHAR 10 DEFAULT 'USD')
├── tax_id (VARCHAR 100)
├── performance_score (DECIMAL 3,2) -- 0.00 to 10.00
├── is_preferred (BOOLEAN DEFAULT false)
├── is_active (BOOLEAN DEFAULT true)
└── created_at (TIMESTAMP)

supplier_products
├── id (UUID, PK)
├── supplier_id (UUID, FK → suppliers)
├── product_id (UUID, FK → products)
├── supplier_sku (VARCHAR 100)
├── unit_price (DECIMAL 10,2)
├── min_order_qty (INT)
├── lead_time_days (INT)
├── effective_from (DATE)
├── effective_to (DATE, NULLABLE)
├── is_active (BOOLEAN DEFAULT true)
└── UNIQUE(supplier_id, product_id, effective_from)

price_history
├── id (UUID, PK)
├── supplier_id (UUID, FK)
├── product_id (UUID, FK)
├── price (DECIMAL 10,2)
├── recorded_at (TIMESTAMP DEFAULT NOW)
└── source (VARCHAR 50) -- manual, scraped, api
```

**4. Procurement Workflow**
```sql
purchase_requisitions
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── pr_number (VARCHAR 50, UNIQUE) -- PR-2024-0001
├── requested_by (UUID, FK → users)
├── department (VARCHAR 100)
├── purpose (TEXT)
├── status (ENUM: DRAFT, PENDING, APPROVED, REJECTED, CONVERTED)
├── urgency (ENUM: LOW, MEDIUM, HIGH, CRITICAL)
├── required_by_date (DATE)
├── total_estimated_cost (DECIMAL 12,2)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

pr_items
├── id (UUID, PK)
├── pr_id (UUID, FK → purchase_requisitions, CASCADE)
├── product_id (UUID, FK → products)
├── quantity (INT NOT NULL)
├── estimated_unit_price (DECIMAL 10,2)
├── estimated_total (GENERATED: quantity * price)
└── notes (TEXT)

approvals
├── id (UUID, PK)
├── pr_id (UUID, FK → purchase_requisitions, CASCADE)
├── approver_id (UUID, FK → users)
├── approval_level (INT) -- 1, 2, 3 (multi-level)
├── status (ENUM: PENDING, APPROVED, REJECTED)
├── comments (TEXT)
├── actioned_at (TIMESTAMP)
└── created_at (TIMESTAMP)

purchase_orders
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── po_number (VARCHAR 50, UNIQUE) -- PO-2024-0001
├── pr_id (UUID, FK → purchase_requisitions, NULLABLE)
├── supplier_id (UUID, FK → suppliers)
├── status (ENUM: DRAFT, SENT, ACKNOWLEDGED, 
│          PARTIALLY_RECEIVED, RECEIVED, CLOSED, CANCELLED)
├── order_date (DATE DEFAULT CURRENT_DATE)
├── expected_delivery_date (DATE)
├── actual_delivery_date (DATE)
├── payment_terms (VARCHAR 100)
├── shipping_address (TEXT)
├── notes (TEXT)
├── subtotal (DECIMAL 12,2)
├── tax_amount (DECIMAL 10,2)
├── shipping_cost (DECIMAL 10,2)
├── total_amount (DECIMAL 12,2)
├── pdf_url (TEXT) -- Link to generated PDF
├── created_by (UUID, FK → users)
├── created_at (TIMESTAMP)
└── sent_at (TIMESTAMP)

po_items
├── id (UUID, PK)
├── po_id (UUID, FK → purchase_orders, CASCADE)
├── product_id (UUID, FK → products)
├── quantity_ordered (INT)
├── quantity_received (INT DEFAULT 0)
├── unit_price (DECIMAL 10,2)
├── line_total (GENERATED: quantity_ordered * unit_price)
├── tax_rate (DECIMAL 5,2)
├── receipt_date (TIMESTAMP)
├── condition (ENUM: GOOD, DAMAGED, PARTIAL)
└── storage_location (VARCHAR 100)
```

**5. AI & Analytics**
```sql
demand_forecasts
├── id (UUID, PK)
├── product_id (UUID, FK → products)
├── forecast_date (DATE)
├── predicted_quantity (INT)
├── confidence_lower (INT)
├── confidence_upper (INT)
├── model_version (VARCHAR 50)
├── accuracy_score (DECIMAL 5,2) -- calculated post-actuals
├── created_at (TIMESTAMP)
└── UNIQUE(product_id, forecast_date)

ai_recommendations
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── type (ENUM: REORDER_SUGGESTION, SUPPLIER_RECOMMENDATION, 
│        PRICE_ALERT, ANOMALY_ALERT)
├── product_id (UUID, FK, NULLABLE)
├── supplier_id (UUID, FK, NULLABLE)
├── title (VARCHAR 255)
├── message (TEXT)
├── data (JSONB) -- Structured recommendation data
├── confidence_score (DECIMAL 3,2)
├── status (ENUM: ACTIVE, DISMISSED, ACTIONED)
├── actioned_at (TIMESTAMP)
└── created_at (TIMESTAMP)

spend_analytics
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── period_start (DATE)
├── period_end (DATE)
├── total_spend (DECIMAL 15,2)
├── num_orders (INT)
├── num_suppliers (INT)
├── avg_order_value (DECIMAL 12,2)
├── top_category (VARCHAR 100)
├── cost_savings (DECIMAL 12,2) -- vs previous period
└── calculated_at (TIMESTAMP)
```

**6. System**
```sql
notifications
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── type (VARCHAR 50) -- LOW_STOCK_ALERT, APPROVAL_NEEDED, etc
├── title (VARCHAR 255)
├── message (TEXT)
├── link (VARCHAR 500)
├── is_read (BOOLEAN DEFAULT false)
└── created_at (TIMESTAMP)

audit_logs
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── organization_id (UUID, FK)
├── action (VARCHAR 100) -- CREATED_PR, APPROVED_PO, etc
├── entity_type (VARCHAR 50)
├── entity_id (UUID)
├── old_values (JSONB)
├── new_values (JSONB)
├── ip_address (VARCHAR 45)
├── user_agent (TEXT)
└── created_at (TIMESTAMP)

settings
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── key (VARCHAR 100)
├── value (JSONB)
└── updated_at (TIMESTAMP)

approval_rules
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── min_amount (DECIMAL 12,2)
├── max_amount (DECIMAL 12,2)
├── approver_role (VARCHAR 50)
├── approval_level (INT)
└── is_active (BOOLEAN DEFAULT true)
```

### Database Indexes (Performance)

```sql
-- Critical indexes for query performance
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_clerk ON users(clerk_id);
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_sku ON products(organization_id, sku);
CREATE INDEX idx_inventory_product ON inventory_levels(product_id);
CREATE INDEX idx_pr_org_status ON purchase_requisitions(organization_id, status);
CREATE INDEX idx_po_org_status ON purchase_orders(organization_id, status);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id, status);
CREATE INDEX idx_forecasts_product_date ON demand_forecasts(product_id, forecast_date);
CREATE INDEX idx_price_history ON price_history(product_id, recorded_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_org_date ON audit_logs(organization_id, created_at DESC);
```

## API STRUCTURE

### REST API Endpoints (50+ endpoints)

**Base URL:** `https://api.procureai.com/v1`

**Authentication:**
- All endpoints require Clerk JWT in header: `Authorization: Bearer <token>`
- Token validated by middleware before route handler
- User info extracted from JWT payload

**Standard Response Format:**
```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### Endpoint Groups

**1. Authentication (handled by Clerk)**
```
POST   /auth/webhook          - Clerk webhook for user sync
GET    /auth/me               - Get current user info
PUT    /auth/profile          - Update user profile
```

**2. Organizations**
```
GET    /organizations         - Get org details
PUT    /organizations         - Update org settings
GET    /organizations/stats   - Get org-wide statistics
POST   /organizations/invite  - Invite team member
```

**3. Users**
```
GET    /users                 - List users (admin only)
POST   /users                 - Create user (admin only)
GET    /users/:id             - Get user details
PUT    /users/:id             - Update user
DELETE /users/:id             - Deactivate user
PUT    /users/:id/role        - Change user role
```

**4. Products**
```
GET    /products              - List products (paginated, filtered)
POST   /products              - Create product
GET    /products/:id          - Get product details
PUT    /products/:id          - Update product
DELETE /products/:id          - Delete product
POST   /products/import       - Bulk import (CSV)
GET    /products/export       - Export to CSV
GET    /products/low-stock    - Get low stock items
```

**5. Categories**
```
GET    /categories            - List categories (tree structure)
POST   /categories            - Create category
PUT    /categories/:id        - Update category
DELETE /categories/:id        - Delete category
```

**6. Inventory**
```
GET    /inventory             - List inventory levels
GET    /inventory/:productId  - Get stock for product
PUT    /inventory/:productId  - Update stock level
POST   /inventory/adjust      - Manual stock adjustment
GET    /inventory/movements   - Stock movement history
GET    /inventory/alerts      - Get low stock alerts
```

**7. Suppliers**
```
GET    /suppliers             - List suppliers
POST   /suppliers             - Create supplier
GET    /suppliers/:id         - Get supplier details
PUT    /suppliers/:id         - Update supplier
DELETE /suppliers/:id         - Delete supplier
GET    /suppliers/:id/products - Get supplier's product catalog
POST   /suppliers/:id/products - Add product to supplier
PUT    /suppliers/:id/products/:productId - Update supplier price
GET    /suppliers/:id/performance - Get supplier metrics
POST   /suppliers/:id/price-sheet - Upload price sheet
```

**8. Purchase Requisitions**
```
GET    /purchase-requisitions  - List PRs (filtered by status, user)
POST   /purchase-requisitions  - Create PR
GET    /purchase-requisitions/:id - Get PR details
PUT    /purchase-requisitions/:id - Update PR
DELETE /purchase-requisitions/:id - Delete PR (if draft)
POST   /purchase-requisitions/:id/submit - Submit for approval
POST   /purchase-requisitions/:id/cancel - Cancel PR
```

**9. Approvals**
```
GET    /approvals             - List pending approvals for user
GET    /approvals/history     - Approval history
POST   /approvals/:id/approve - Approve request
POST   /approvals/:id/reject  - Reject request
POST   /approvals/:id/request-changes - Request changes
```

**10. Purchase Orders**
```
GET    /purchase-orders       - List POs
POST   /purchase-orders       - Create PO (from PR)
GET    /purchase-orders/:id   - Get PO details
PUT    /purchase-orders/:id   - Update PO
POST   /purchase-orders/:id/send - Send to supplier
POST   /purchase-orders/:id/receive - Record goods receipt
GET    /purchase-orders/:id/pdf - Download PO PDF
POST   /purchase-orders/:id/cancel - Cancel PO
```

**11. AI & Forecasting**
```
GET    /ai/forecasts          - Get demand forecasts
GET    /ai/forecasts/:productId - Forecast for specific product
POST   /ai/forecasts/generate - Trigger forecast generation
GET    /ai/forecasts/accuracy - Get model accuracy metrics
GET    /ai/recommendations    - Get active AI recommendations
POST   /ai/recommendations/:id/dismiss - Dismiss recommendation
POST   /ai/recommendations/:id/action - Act on recommendation
POST   /ai/analyze-price      - Analyze if price is anomaly
POST   /ai/suggest-vendors    - Get vendor recommendations
POST   /ai/parse-document     - Upload & parse supplier doc (OCR)
```

**12. Analytics**
```
GET    /analytics/spending    - Spend analysis (by period, dept, category)
GET    /analytics/savings     - Cost savings report
GET    /analytics/suppliers   - Supplier performance comparison
GET    /analytics/inventory   - Inventory turnover metrics
GET    /analytics/forecast-accuracy - AI model performance
POST   /analytics/reports     - Generate custom report
GET    /analytics/dashboard   - Dashboard summary data
```

**13. Notifications**
```
GET    /notifications         - List notifications
GET    /notifications/unread  - Get unread count
PUT    /notifications/:id/read - Mark as read
PUT    /notifications/mark-all-read - Mark all as read
DELETE /notifications/:id     - Delete notification
```

**14. Settings**
```
GET    /settings              - Get org settings
PUT    /settings/approval-rules - Update approval rules
PUT    /settings/budgets      - Update department budgets
PUT    /settings/notifications - Update notification preferences
GET    /settings/integrations - List available integrations
POST   /settings/integrations/:name - Connect integration
```

**15. Audit Logs**
```
GET    /audit-logs            - List audit logs (filtered)
GET    /audit-logs/export     - Export audit trail
```

**16. Webhooks (for external integrations)**
```
POST   /webhooks/erp-sync     - ERP system webhook
POST   /webhooks/inventory    - Inventory update webhook
POST   /webhooks/supplier     - Supplier portal webhook
```

## USER ROLES & PERMISSIONS

### Role Hierarchy

```typescript
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',        // Level 100 (system-wide)
  ADMIN = 'ADMIN',                     // Level 90 (org-wide)
  PROCUREMENT_MANAGER = 'PROCUREMENT_MANAGER', // Level 80
  FINANCE_MANAGER = 'FINANCE_MANAGER', // Level 70
  MANAGER = 'MANAGER',                 // Level 60
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF', // Level 40
  EMPLOYEE = 'EMPLOYEE'                // Level 20
}
```

### Permission Matrix

| Feature | SUPER_ADMIN | ADMIN | PROCUREMENT_MGR | FINANCE_MGR | MANAGER | WAREHOUSE | EMPLOYEE |
|---------|-------------|-------|-----------------|-------------|---------|-----------|----------|
| **Products** | | | | | | | |
| View all products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create product | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit product | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete product | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Import products | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Suppliers** | | | | | | | |
| View suppliers | ✅ | ✅ | ✅ | ✅ | ⚠️ Own dept | ❌ | ❌ |
| Create supplier | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit supplier | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View supplier prices | ✅ | ✅ | ✅ | ✅ | ⚠️ Limited | ❌ | ❌ |
| **Inventory** | | | | | | | |
| View inventory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Limited |
| Update stock | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Receive goods | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Purchase Requisitions** | | | | | | | |
| Create PR | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| View own PRs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| View all PRs | ✅ | ✅ | ✅ | ✅ | ⚠️ Own dept | ❌ | ❌ |
| Edit PR | ✅ | ✅ | ✅ | ⚠️ Own only | ⚠️ Own only | ❌ | ⚠️ Own draft |
| Cancel PR | ✅ | ✅ | ✅ | ⚠️ Own only | ⚠️ Own only | ❌ | ⚠️ Own draft |
| **Approvals** | | | | | | | |
| Approve PRs | ✅ | ✅ | ⚠️ Within limit | ⚠️ Within limit | ⚠️ Within limit | ❌ | ❌ |
| View approval queue | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Purchase Orders** | | | | | | | |
| Create PO | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all POs | ✅ | ✅ | ✅ | ✅ | ⚠️ Own dept | ❌ | ❌ |
| Edit PO | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Send PO | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancel PO | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Analytics** | | | | | | | |
| View dashboard | ✅ | ✅ | ✅ | ✅ | ⚠️ Own dept | ⚠️ Limited | ⚠️ Own only |
| Spend analytics | ✅ | ✅ | ✅ | ✅ | ⚠️ Own dept | ❌ | ❌ |
| Supplier analytics | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ✅ | ⚠️ Own dept | ❌ | ❌ |
| **AI Features** | | | | | | | |
| View AI alerts | ✅ | ✅ | ✅ | ✅ | ⚠️ Relevant | ❌ | ❌ |
| Dismiss AI alerts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View forecasts | ✅ | ✅ | ✅ | ✅ | ⚠️ Own dept | ❌ | ❌ |
| Trigger forecast | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Settings** | | | | | | | |
| Org settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approval rules | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Integrations | ✅ | ✅ | ⚠️ View only | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full access
- ⚠️ Limited/conditional access
- ❌ No access

## AI INTEGRATION POINTS

### AI Microservice Architecture

```
Python FastAPI Service (Port 8000)
├── /forecast                    - Demand forecasting endpoint
├── /analyze-price               - Price anomaly detection
├── /score-supplier              - Supplier scoring
├── /parse-document              - OCR + LLM parsing
├── /generate-po-text            - LLM PO generation
└── /chat                        - AI assistant endpoint
```

### AI Features Detailed

**1. Demand Forecasting (Prophet)**
```python
Input:
- product_id: UUID
- historical_data: List[{date, quantity}]
- forecast_days: int (default 90)

Process:
1. Load historical purchase data (12+ months)
2. Preprocess: handle missing dates, outliers
3. Train Prophet model with seasonality
4. Generate predictions for next N days
5. Calculate confidence intervals
6. Store in demand_forecasts table

Output:
{
  "product_id": "uuid",
  "predictions": [
    {"date": "2024-03-01", "quantity": 45, "lower": 38, "upper": 52},
    ...
  ],
  "trend": "increasing|stable|decreasing",
  "seasonality_detected": true,
  "accuracy_score": 0.87
}

Trigger:
- Nightly cron job (runs for all products)
- On-demand via API call
- After significant data change
```

**2. Price Anomaly Detection (IsolationForest)**
```python
Input:
- product_id: UUID
- new_price: float
- supplier_id: UUID

Process:
1. Fetch 6-12 months price history for product
2. Train IsolationForest model
3. Predict if new price is anomaly
4. Calculate deviation from historical average
5. Check against market prices (if available)

Output:
{
  "is_anomaly": true,
  "confidence": 0.93,
  "historical_avg": 12.50,
  "new_price": 16.00,
  "deviation_pct": 28.0,
  "recommendation": "REJECT",
  "alternative_suppliers": [...]
}

Trigger:
- When new quote received
- When supplier updates price
- During PO creation
```

**3. Smart Vendor Recommendation**
```python
Input:
- product_id: UUID
- quantity: int
- required_by: date
- urgency: enum

Process:
1. Find all suppliers offering this product
2. For each supplier, calculate score:
   - Price competitiveness (30%)
   - On-time delivery rate (30%)
   - Quality rating (25%)
   - Response time (15%)
3. Apply constraints:
   - Lead time < required_by
   - Min order quantity <= requested quantity
4. Rank suppliers by score
5. Call LLM to generate human explanation

Output:
{
  "recommended_supplier": {
    "id": "uuid",
    "name": "Steel Corp",
    "score": 9.1,
    "price": 5.40,
    "lead_time_days": 3,
    "reasoning": "Best price-to-reliability ratio. 99% on-time record."
  },
  "alternatives": [...],
  "comparison_matrix": [...]
}

Trigger:
- During PR creation (auto-suggest)
- On-demand comparison request
```

**4. Document Parsing (OCR + LLM)**
```python
Input:
- file: UploadFile (PDF/image)
- document_type: enum (PRICE_SHEET, INVOICE, QUOTE)

Process:
1. Convert PDF to images (if PDF)
2. Run Tesseract OCR on each page
3. Extract raw text
4. Send to LLM (Groq) with prompt:
   "Extract product names, prices, SKUs from this price sheet..."
5. LLM returns structured JSON
6. Match extracted products to catalog
7. Validate and return

Output:
{
  "extracted_items": [
    {
      "description": "Steel Rods 10mm",
      "matched_product_id": "uuid",
      "price": 5.40,
      "unit": "kg",
      "confidence": 0.95
    },
    ...
  ],
  "unmatched_items": [...],
  "metadata": {
    "valid_until": "2024-03-31",
    "supplier": "Steel Corp"
  }
}

Trigger:
- User uploads supplier price sheet
- Email attachment received (webhook)
```

**5. LLM-Powered Features (Groq API)**

**a) Natural Language PR Creation**
```python
User input: "I need something to print 500 color brochures"

LLM Processing:
1. Extract intent: printing materials needed
2. Identify quantity: 500
3. Identify specifications: color
4. Search catalog for matches
5. Return structured data

Output:
{
  "identified_need": "color printing materials",
  "suggested_products": [
    {"name": "Color Ink Cartridges", "qty": 5},
    {"name": "Glossy Paper A4", "qty": 3}
  ],
  "reasoning": "500 brochures requires approx 5 ink cartridges..."
}
```

**b) PO Email Generation**
```python
Input:
- PO details (items, supplier, amounts)
- Company context
- Supplier relationship history

LLM Output:
Professional email with:
- Appropriate greeting
- Clear PO details
- Payment terms
- Delivery instructions
- Relevant context from past orders
```

**c) AI Chat Assistant (RAG pattern)**
```python
User query: "How much did IT spend last quarter?"

Process:
1. Determine what data is needed
2. Fetch from database (spend by dept, Q4)
3. Pass to LLM with context
4. LLM generates natural language answer

Output: "IT spent $18,450 in Q4 2023, which is 23% higher than Q3..."
```

### AI Training & Optimization

**Model Training Schedule:**
```
Demand Forecasting Model:
├── Initial training: On first 12 months of data
├── Retraining: Monthly (1st of each month)
├── Incremental: Add new data, retrain
└── Accuracy tracking: Compare predictions vs actuals

Price Anomaly Model:
├── Training: On-demand (when new price received)
├── Dataset: Rolling 6-month window
└── Updates: Real-time as prices change

Supplier Scoring:
├── Calculation: After each PO completion
├── Aggregation: Weighted average over 12 months
└── Decay: Older data weighted less
```

**Performance Monitoring:**
```sql
-- Track AI accuracy
INSERT INTO ai_performance_metrics (
  model_type,
  date,
  accuracy_score,
  precision,
  recall,
  samples_processed
) VALUES (
  'DEMAND_FORECAST',
  CURRENT_DATE,
  0.87,
  0.89,
  0.85,
  127
);
```

## COMPLETE FEATURE LIST

### Phase 1: MVP Core Features (Week 1-8)

**Week 1-2: Foundation**
- [ ] Project setup (monorepo, Next.js, Express, Prisma)
- [ ] Database schema creation & migration
- [ ] Clerk authentication integration
- [ ] Basic layout components (navbar, sidebar, footer)
- [ ] Role-based access control middleware
- [ ] Environment configuration

**Week 3-4: User & Product Management**
- [ ] User management CRUD
- [ ] Organization settings
- [ ] Product catalog CRUD
- [ ] Category management (tree structure)
- [ ] CSV import for products
- [ ] Product search & filtering
- [ ] Product image upload

**Week 5-6: Inventory & Suppliers**
- [ ] Inventory level tracking
- [ ] Stock movement history
- [ ] Low stock alerts
- [ ] Supplier CRUD
- [ ] Supplier product pricing
- [ ] Price sheet upload
- [ ] Supplier performance tracking

**Week 7-8: Purchase Requisitions & Approvals**
- [ ] PR creation form (multi-step)
- [ ] PR list with filters
- [ ] Approval workflow engine
- [ ] Multi-level approval routing
- [ ] Email notifications (Resend)
- [ ] Approval queue UI
- [ ] Approval history

**Week 8: Testing & Bug Fixes**
- [ ] Unit tests for critical functions
- [ ] Integration tests for API
- [ ] End-to-end testing
- [ ] Bug fixes from testing
- [ ] Performance optimization

### Phase 2: Intelligence Layer (Week 9-12)

**Week 9: AI Service Setup**
- [ ] Python FastAPI project setup
- [ ] Prophet library integration
- [ ] scikit-learn setup
- [ ] Groq API integration
- [ ] Docker configuration
- [ ] Deploy to Hugging Face Spaces

**Week 10: Demand Forecasting**
- [ ] Historical data export API
- [ ] Prophet model training
- [ ] Forecast generation endpoint
- [ ] Forecast storage in database
- [ ] Forecast visualization UI
- [ ] Reorder alert system

**Week 11: Smart Features**
- [ ] Supplier scoring algorithm
- [ ] Vendor recommendation API
- [ ] Price anomaly detection
- [ ] Price alert notifications
- [ ] AI recommendation UI

**Week 12: LLM Integration**
- [ ] Natural language PR parsing
- [ ] Document OCR (Tesseract)
- [ ] Email parsing
- [ ] PO text generation
- [ ] AI chat assistant (basic)

### Phase 3: Purchase Orders & Analytics (Week 13-16)

**Week 13: Purchase Orders**
- [ ] PO creation from approved PR
- [ ] PO PDF generation
- [ ] Email to supplier (automatic)
- [ ] PO list with filters
- [ ] PO detail view
- [ ] PO status tracking

**Week 14: Goods Receipt & Inventory Update**
- [ ] Expected deliveries view
- [ ] Goods receipt form
- [ ] Inventory auto-update
- [ ] Stock movement logging
- [ ] Delivery tracking
- [ ] 3-way matching (PO, Receipt, Invoice)

**Week 15: Analytics & Reports**
- [ ] Dashboard with KPIs
- [ ] Spend analysis (by dept, category, period)
- [ ] Supplier performance report
- [ ] Budget vs actual tracking
- [ ] Savings report
- [ ] AI accuracy metrics
- [ ] Export to CSV/PDF

**Week 16: Final Polish & Deployment**
- [ ] Advanced notifications
- [ ] Audit log viewer
- [ ] Settings configuration UI
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Production deployment
- [ ] Documentation
- [ ] Demo data seeding

### Additional Features (Post-MVP)

**Nice to Have:**
- [ ] Mobile app (React Native)
- [ ] Supplier self-service portal
- [ ] ERP integrations (QuickBooks, SAP)
- [ ] Multi-currency support
- [ ] Advanced reporting (custom queries)
- [ ] API for third-party integrations
- [ ] Barcode scanning for inventory
- [ ] Contract management
- [ ] Invoice OCR & matching
- [ ] Spend forecasting
- [ ] White-label option

## DETAILED WORKFLOW FLOWS

### Flow 1: Complete Purchase Journey

```
STEP 0: Background AI (Nightly Cron)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12:00 AM Server Time

Cron Job Runs:
1. Fetch all products for organization
2. For each product:
   - Get 12 months purchase history
   - Send to AI service /forecast endpoint
   - AI trains Prophet model
   - Generates 90-day predictions
   - Returns forecast data
3. Store forecasts in demand_forecasts table
4. Check current stock vs forecast
5. If stock < reorder_point:
   - Create AI recommendation
   - Create notification for procurement manager
   - Send email alert
6. Repeat for all products
7. Log completion

Database Changes:
- demand_forecasts: 127 products × 90 days = 11,430 records inserted/updated
- ai_recommendations: 8 new reorder suggestions created
- notifications: 8 new alerts created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Procurement Manager Reviews Alerts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9:00 AM - Mike (Procurement Manager) logs in

Frontend Request:
GET /api/dashboard
Headers: Authorization: Bearer <clerk_jwt>

Backend Process:
1. Clerk middleware validates JWT
2. Extract user info from JWT
3. Check user.role === 'PROCUREMENT_MANAGER'
4. Query database:
   - Get unread notifications
   - Get AI recommendations
   - Get pending approvals
   - Get low stock items
   - Get spend summary
5. Aggregate data
6. Return JSON response

Response:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "type": "LOW_STOCK_ALERT",
        "title": "Low Stock: Steel Rods 10mm",
        "message": "Current: 180kg, Predicted need (30d): 420kg",
        "link": "/ai/recommendations/rec_001",
        "created_at": "2024-02-18T00:15:00Z"
      },
      // ... 7 more
    ],
    "ai_recommendations": [
      {
        "id": "rec_001",
        "type": "REORDER_SUGGESTION",
        "product": {
          "id": "prod_001",
          "name": "Steel Rods 10mm",
          "current_stock": 180,
          "unit": "kg"
        },
        "suggested_quantity": 500,
        "reasoning": "30-day forecast shows 420kg needed...",
        "recommended_supplier": {
          "id": "supp_003",
          "name": "Steel Corp",
          "price": 5.40,
          "lead_time_days": 3,
          "score": 9.1
        },
        "confidence_score": 0.87
      },
      // ... 7 more
    ],
    "spend_summary": {
      "this_month": 45230,
      "budget": 60000,
      "percent_used": 75,
      "orders_count": 28
    }
  }
}

Frontend Renders:
- Dashboard with alert cards
- AI recommendation cards
- Spend widgets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2: Create Purchase Requisition
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9:15 AM - Mike clicks "Create Order" from AI alert

Frontend Request:
GET /api/ai/recommendations/rec_001

Backend:
1. Fetch recommendation from database
2. Fetch associated product details
3. Fetch recommended supplier details
4. Return complete data

Response:
{
  "success": true,
  "data": {
    "recommendation": { /* full rec data */ },
    "product": { /* full product data */ },
    "supplier": { /* full supplier data */ },
    "alternatives": [ /* other suppliers */ ]
  }
}

Frontend:
- Navigates to /purchase-requisitions/new?from_rec=rec_001
- Pre-fills form with recommendation data
- User reviews, adds purpose/notes
- Clicks "Submit for Approval"

Frontend Request:
POST /api/purchase-requisitions
Body:
{
  "items": [
    {
      "product_id": "prod_001",
      "quantity": 500,
      "estimated_unit_price": 5.40
    }
  ],
  "supplier_id": "supp_003",
  "department": "Production",
  "purpose": "Stock running low - production needs",
  "required_by": "2024-02-25",
  "urgency": "NORMAL"
}

Backend Process:
1. Validate request body (Zod schema)
2. Check user has permission to create PR
3. Generate PR number: PR-2024-0235
4. Calculate total cost: 500 × 5.40 = $2,700
5. Begin database transaction:
   
   a) Insert PR record:
   INSERT INTO purchase_requisitions (
     organization_id, pr_number, requested_by,
     department, purpose, status, urgency,
     required_by_date, total_estimated_cost
   ) VALUES (
     'org_abc', 'PR-2024-0235', 'user_mike',
     'Production', 'Stock running low...',
     'PENDING', 'NORMAL', '2024-02-25', 2700.00
   ) RETURNING id;
   
   b) Insert PR items:
   INSERT INTO pr_items (
     pr_id, product_id, quantity, estimated_unit_price
   ) VALUES (
     'pr_001', 'prod_001', 500, 5.40
   );
   
   c) Determine approvers (query approval_rules):
   SELECT approver_role, approval_level
   FROM approval_rules
   WHERE organization_id = 'org_abc'
     AND min_amount <= 2700
     AND max_amount >= 2700
     AND is_active = true
   ORDER BY approval_level;
   
   Result: FINANCE_MANAGER at level 1
   
   d) Find finance manager user:
   SELECT id FROM users
   WHERE organization_id = 'org_abc'
     AND role = 'FINANCE_MANAGER'
     AND is_active = true
   LIMIT 1;
   
   Result: user_raj
   
   e) Insert approval record:
   INSERT INTO approvals (
     pr_id, approver_id, approval_level, status
   ) VALUES (
     'pr_001', 'user_raj', 1, 'PENDING'
   );
   
   f) Create notification:
   INSERT INTO notifications (
     user_id, type, title, message, link
   ) VALUES (
     'user_raj', 'APPROVAL_NEEDED',
     'New PR needs your approval',
     'Mike Smith submitted PR-2024-0235 for $2,700',
     '/approvals/appr_001'
   );
   
   g) Create audit log:
   INSERT INTO audit_logs (
     user_id, organization_id, action,
     entity_type, entity_id, new_values
   ) VALUES (
     'user_mike', 'org_abc', 'CREATED_PR',
     'purchase_requisition', 'pr_001',
     '{"pr_number": "PR-2024-0235", ...}'::jsonb
   );

6. Commit transaction

7. Send email notification (async):
   await sendEmail({
     to: 'raj@abcmfg.com',
     from: 'noreply@procureai.com',
     subject: 'Approval Required: PR-2024-0235',
     template: 'approval-request',
     data: {
       pr_number: 'PR-2024-0235',
       requester: 'Mike Smith',
       amount: 2700,
       items: 'Steel Rods 10mm (500 kg)',
       link: 'https://app.procureai.com/approvals/appr_001'
     }
   });

8. Return success response

Response:
{
  "success": true,
  "data": {
    "pr_id": "pr_001",
    "pr_number": "PR-2024-0235",
    "status": "PENDING",
    "next_approver": "Raj Kumar (Finance Manager)"
  }
}

Frontend:
- Shows success message
- Redirects to PR detail page

Time Elapsed: 2-3 seconds
Mike sees: "✅ PR Created - Pending approval from Raj Kumar"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: Approval Process
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9:20 AM - Raj (Finance Manager) gets notification

Email arrives:
Subject: Approval Required: PR-2024-0235
Body: [Professional HTML email with CTA button]

Raj clicks "Approve Now" button in email

Email Link:
https://app.procureai.com/approvals/appr_001
  ?action=quick_approve
  &token=<one_time_secure_token>

Backend Request:
GET /approvals/appr_001?action=quick_approve&token=abc123

Backend Process:
1. Verify token:
   - Check token exists in tokens table
   - Check not expired (24 hour expiry)
   - Check not already used
   - If valid, mark as used
2. Auto-login user (create session)
3. Redirect to approval page

Frontend loads approval page

Raj sees:
- Full PR details
- Budget impact
- AI risk analysis
- Two big buttons: [Approve] [Reject]

Raj clicks "Approve"

Frontend Request:
POST /api/approvals/appr_001/approve
Body: { "comments": null }

Backend Process:
1. Validate user is the assigned approver
2. Check approval not already actioned
3. Begin transaction:
   
   a) Update approval record:
   UPDATE approvals
   SET status = 'APPROVED',
       actioned_at = NOW()
   WHERE id = 'appr_001';
   
   b) Check if more approvals needed:
   SELECT COUNT(*) FROM approvals
   WHERE pr_id = 'pr_001'
     AND status = 'PENDING';
   
   Result: 0 (this was the only approval)
   
   c) Update PR status:
   UPDATE purchase_requisitions
   SET status = 'APPROVED'
   WHERE id = 'pr_001';
   
   d) AUTO-CREATE PURCHASE ORDER:
   
   i) Generate PO number:
   SELECT COUNT(*) FROM purchase_orders
   WHERE organization_id = 'org_abc'
     AND EXTRACT(YEAR FROM created_at) = 2024;
   Result: 455
   PO Number: PO-2024-0456
   
   ii) Get supplier details:
   SELECT * FROM suppliers WHERE id = 'supp_003';
   
   iii) Calculate amounts:
   subtotal = 2700.00
   tax_rate = 0.10 (from org settings)
   tax_amount = 2700 × 0.10 = 270.00
   total = 2970.00
   
   iv) Calculate expected delivery:
   lead_time = 3 days (from supplier)
   expected_date = today + 3 = 2024-02-21
   
   v) Insert PO:
   INSERT INTO purchase_orders (
     organization_id, po_number, pr_id,
     supplier_id, status, order_date,
     expected_delivery_date, payment_terms,
     shipping_address, subtotal, tax_amount,
     shipping_cost, total_amount, created_by
   ) VALUES (
     'org_abc', 'PO-2024-0456', 'pr_001',
     'supp_003', 'DRAFT', CURRENT_DATE,
     '2024-02-21', 'Net 30',
     'ABC Manufacturing, 123 Industrial Dr...',
     2700.00, 270.00, 0, 2970.00, 'user_mike'
   ) RETURNING id;
   
   vi) Insert PO items:
   INSERT INTO po_items (
     po_id, product_id, quantity_ordered,
     unit_price, tax_rate
   ) VALUES (
     'po_001', 'prod_001', 500, 5.40, 0.10
   );
   
   vii) Reserve inventory:
   UPDATE inventory_levels
   SET quantity_reserved = quantity_reserved + 500
   WHERE product_id = 'prod_001';
   
   e) Create notifications:
   
   i) For requester (Mike):
   INSERT INTO notifications (
     user_id, type, title, message, link
   ) VALUES (
     'user_mike', 'PR_APPROVED',
     'Your request was approved!',
     'PR-2024-0235 approved. PO-2024-0456 created.',
     '/purchase-orders/po_001'
   );
   
   ii) For procurement (if different from requester):
   [Skip in this case since Mike is procurement]
   
   f) Audit logs:
   INSERT INTO audit_logs (
     user_id, action, entity_type, entity_id
   ) VALUES
   ('user_raj', 'APPROVED_PR', 'purchase_requisition', 'pr_001'),
   ('user_raj', 'CREATED_PO', 'purchase_order', 'po_001');

4. Commit transaction

5. Generate PO PDF (async background job):
   - Use @react-pdf/renderer or Puppeteer
   - Generate professional PDF with company logo
   - Include all PO details, terms, line items
   - Upload to Uploadthing
   - Update PO record with pdf_url

6. Call LLM to write email (async):
   const emailBody = await groq.chat.completions.create({
     model: "llama3-8b-8192",
     messages: [{
       role: "system",
       content: "Write professional PO email"
     }, {
       role: "user",
       content: `
         Supplier: Steel Corp
         PO: PO-2024-0456
         Items: Steel Rods 10mm, 500kg @ $5.40/kg
         Total: $2,970
         Delivery: Feb 21, 2024
       `
     }]
   });

7. Send email to supplier (async):
   await sendEmail({
     to: 'orders@steelcorp.com',
     from: 'procurement@abcmfg.com',
     subject: 'Purchase Order PO-2024-0456',
     html: emailBody,
     attachments: [{
       filename: 'PO-2024-0456.pdf',
       path: pdfUrl
     }]
   });

8. Update PO status:
   UPDATE purchase_orders
   SET status = 'SENT', sent_at = NOW()
   WHERE id = 'po_001';

9. Create delivery tracking:
   INSERT INTO delivery_tracking (
     po_id, expected_date, status
   ) VALUES (
     'po_001', '2024-02-21', 'AWAITING_CONFIRMATION'
   );

10. Return success response

Response:
{
  "success": true,
  "data": {
    "approval_id": "appr_001",
    "status": "APPROVED",
    "pr_status": "APPROVED",
    "po_created": true,
    "po_number": "PO-2024-0456",
    "po_sent": true
  }
}

Frontend:
- Shows success message
- Confetti animation 🎉
- "PR Approved & PO Sent to Supplier"

Time Elapsed: 30 seconds (from Raj's click)
All automatic after that

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 4: Supplier Confirms Order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10:00 AM - Steel Corp receives email

Supplier clicks confirmation link in email
(If supplier portal enabled)

Link: https://app.procureai.com/supplier-portal/confirm
      ?po=PO-2024-0456&token=<supplier_token>

Supplier sees simple form:
- Order details (read-only)
- Confirm delivery date: [Feb 20 ▼]
- Tracking number: [TRK123456789]
- [Confirm Order]

Supplier clicks Confirm

Frontend Request:
POST /api/supplier-portal/confirm
Body:
{
  "po_number": "PO-2024-0456",
  "confirmed_date": "2024-02-20",
  "tracking_number": "TRK123456789"
}

Backend Process:
1. Validate token
2. Find PO by number
3. Update PO status:
   UPDATE purchase_orders
   SET status = 'ACKNOWLEDGED'
   WHERE po_number = 'PO-2024-0456';
4. Update delivery tracking:
   UPDATE delivery_tracking
   SET confirmed_date = '2024-02-20',
       tracking_number = 'TRK123456789',
       status = 'CONFIRMED'
   WHERE po_id = 'po_001';
5. Notify requester:
   INSERT INTO notifications (
     user_id, type, title, message
   ) VALUES (
     'user_mike', 'PO_ACKNOWLEDGED',
     'Supplier confirmed order',
     'Steel Corp confirmed PO-2024-0456. Delivery: Feb 20'
   );
6. Send email to requester
7. Return success

Mike gets notification:
"✅ Steel Corp confirmed your order - arriving Feb 20"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 5: Goods Receipt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Feb 20, 9:00 AM - Delivery arrives

Tom (Warehouse Staff) logs in

Frontend Request:
GET /api/inventory/expected-deliveries?date=today

Backend:
SELECT po.*, s.name as supplier_name
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.expected_delivery_date = CURRENT_DATE
  AND po.status IN ('SENT', 'ACKNOWLEDGED')
  AND po.organization_id = 'org_abc';

Response:
{
  "success": true,
  "data": [
    {
      "po_id": "po_001",
      "po_number": "PO-2024-0456",
      "supplier": "Steel Corp",
      "items": [
        {
          "product_name": "Steel Rods 10mm",
          "quantity_ordered": 500,
          "unit": "kg"
        }
      ]
    }
  ]
}

Tom clicks "Receive Items" on PO-2024-0456

Form shows:
- Expected items (read from PO)
- Input fields for received quantities
- Condition dropdown
- Storage location
- Notes

Tom fills:
- Received: 500 kg ✓
- Condition: Good
- Location: Warehouse A - Bay 3
- Notes: "Delivered on time"
- Clicks "Confirm Receipt"

Frontend Request:
POST /api/purchase-orders/po_001/receive
Body:
{
  "items": [
    {
      "po_item_id": "poi_001",
      "product_id": "prod_001",
      "ordered_quantity": 500,
      "received_quantity": 500,
      "condition": "GOOD",
      "storage_location": "Warehouse A - Bay 3"
    }
  ],
  "notes": "Delivered on time",
  "received_by": "user_tom"
}

Backend Process:
1. Begin transaction:
   
   a) Update PO items:
   UPDATE po_items
   SET quantity_received = 500,
       receipt_date = NOW(),
       condition = 'GOOD',
       storage_location = 'Warehouse A - Bay 3'
   WHERE id = 'poi_001';
   
   b) Update inventory (CRITICAL):
   UPDATE inventory_levels
   SET quantity_on_hand = quantity_on_hand + 500,
       quantity_reserved = quantity_reserved - 500,
       last_counted_at = NOW()
   WHERE product_id = 'prod_001';
   
   Result: Stock goes from 180kg to 680kg
           Reserved goes from 500kg to 0kg
           Available = 680kg
   
   c) Record stock movement:
   INSERT INTO stock_movements (
     product_id, type, quantity,
     reference_type, reference_id,
     performed_by, storage_location
   ) VALUES (
     'prod_001', 'GOODS_IN', 500,
     'PURCHASE_ORDER', 'po_001',
     'user_tom', 'Warehouse A - Bay 3'
   );
   
   d) Check if PO fully received:
   SELECT 
     SUM(quantity_ordered) as total_ordered,
     SUM(quantity_received) as total_received
   FROM po_items
   WHERE po_id = 'po_001';
   
   Result: 500 ordered, 500 received → 100% complete
   
   e) Update PO status:
   UPDATE purchase_orders
   SET status = 'RECEIVED',
       actual_delivery_date = CURRENT_DATE
   WHERE id = 'po_001';
   
   f) Update delivery tracking:
   UPDATE delivery_tracking
   SET status = 'DELIVERED',
       actual_delivery_date = CURRENT_DATE,
       received_by = 'user_tom'
   WHERE po_id = 'po_001';
   
   g) Calculate supplier performance:
   - Expected: Feb 21
   - Actual: Feb 20
   - On time: YES (1 day early)
   - Quality: GOOD
   
   UPDATE suppliers
   SET performance_score = calculate_new_score(
     'supp_003', on_time=true, quality=10
   )
   WHERE id = 'supp_003';
   
   h) Notify requester:
   INSERT INTO notifications (
     user_id, type, title, message, link
   ) VALUES (
     'user_mike', 'GOODS_RECEIVED',
     'Your order arrived!',
     'PO-2024-0456: 500kg Steel Rods received',
     '/inventory?product=prod_001'
   );
   
   i) Create audit log:
   INSERT INTO audit_logs (
     user_id, action, entity_type, entity_id
   ) VALUES (
     'user_tom', 'RECEIVED_GOODS', 'purchase_order', 'po_001'
   );

2. Commit transaction

3. Update AI forecast accuracy (async):
   - Compare predicted need vs actual usage
   - Calculate error metrics
   - Retrain model if needed

4. Return success response

Tom sees:
"✅ Goods Receipt Complete
 Inventory updated: Steel Rods 10mm now at 680 kg"

Mike gets notification:
"✅ Your order PO-2024-0456 arrived and is in stock!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JOURNEY COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Timeline Summary:
- Day 0, 12:00 AM: AI predicts low stock
- Day 1, 9:00 AM: Mike sees alert, creates PR (3 min)
- Day 1, 9:20 AM: Raj approves (30 sec)
- Day 1, 9:21 AM: PO auto-created & sent (automatic)
- Day 1, 10:00 AM: Supplier confirms
- Day 3, 9:00 AM: Goods arrive, Tom receives (2 min)

Total Human Time: 5.5 minutes
Total Elapsed Time: 2 days (supplier lead time)
Without System: 5-7 days, 15+ hours human effort

Final Database State:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
products: unchanged
inventory_levels: Steel Rods 10mm = 680kg (was 180kg)
purchase_requisitions: 1 new (status: APPROVED)
pr_items: 1 new
approvals: 1 new (status: APPROVED)
purchase_orders: 1 new (status: RECEIVED)
po_items: 1 new (qty_received: 500)
stock_movements: 1 new (type: GOODS_IN, qty: +500)
notifications: 5 new
audit_logs: 6 new records
ai_recommendations: 1 updated (status: ACTIONED)
suppliers: performance_score updated for Steel Corp
```

## FILE STRUCTURE

```
ai-procurement-saas/
│
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml
│       ├── backend-deploy.yml
│       └── ai-service-deploy.yml
│
├── apps/
│   │
│   ├── web/                              # Next.js Frontend
│   │   ├── public/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   │
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── sign-in/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── sign-up/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── products/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── suppliers/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── inventory/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── receive/page.tsx
│   │   │   │   │   ├── purchase-requisitions/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── approvals/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── purchase-orders/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── analytics/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── api/            # Next.js API routes (minimal)
│   │   │   │   │   └── health/
│   │   │   │   │       └── route.ts
│   │   │   │   │
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── form.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   ├── layouts/
│   │   │   │   │   ├── Navbar.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── DashboardLayout.tsx
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── StatCard.tsx
│   │   │   │   │   ├── AIRecommendationCard.tsx
│   │   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   │   └── SpendChart.tsx
│   │   │   │   │
│   │   │   │   ├── products/
│   │   │   │   │   ├── ProductList.tsx
│   │   │   │   │   ├── ProductForm.tsx
│   │   │   │   │   ├── ProductDetail.tsx
│   │   │   │   │   └── ProductImport.tsx
│   │   │   │   │
│   │   │   │   ├── suppliers/
│   │   │   │   │   ├── SupplierList.tsx
│   │   │   │   │   ├── SupplierForm.tsx
│   │   │   │   │   ├── SupplierScorecard.tsx
│   │   │   │   │   └── PriceSheetUpload.tsx
│   │   │   │   │
│   │   │   │   ├── inventory/
│   │   │   │   │   ├── InventoryTable.tsx
│   │   │   │   │   ├── StockAlerts.tsx
│   │   │   │   │   ├── GoodsReceiptForm.tsx
│   │   │   │   │   └── StockMovementHistory.tsx
│   │   │   │   │
│   │   │   │   ├── purchase-requisitions/
│   │   │   │   │   ├── PRList.tsx
│   │   │   │   │   ├── PRForm.tsx
│   │   │   │   │   ├── PRDetail.tsx
│   │   │   │   │   └── PRStatusBadge.tsx
│   │   │   │   │
│   │   │   │   ├── approvals/
│   │   │   │   │   ├── ApprovalQueue.tsx
│   │   │   │   │   ├── ApprovalCard.tsx
│   │   │   │   │   └── ApprovalHistory.tsx
│   │   │   │   │
│   │   │   │   ├── purchase-orders/
│   │   │   │   │   ├── POList.tsx
│   │   │   │   │   ├── PODetail.tsx
│   │   │   │   │   ├── POPDFViewer.tsx
│   │   │   │   │   └── DeliveryTracking.tsx
│   │   │   │   │
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── SpendChart.tsx
│   │   │   │   │   ├── SupplierPerformance.tsx
│   │   │   │   │   ├── ForecastAccuracy.tsx
│   │   │   │   │   └── SavingsReport.tsx
│   │   │   │   │
│   │   │   │   └── shared/
│   │   │   │       ├── DataTable.tsx
│   │   │   │       ├── SearchBar.tsx
│   │   │   │       ├── FilterDropdown.tsx
│   │   │   │       ├── Pagination.tsx
│   │   │   │       ├── Loading.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       └── ErrorBoundary.tsx
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api/
│   │   │   │   │   ├── client.ts         # Axios/Fetch wrapper
│   │   │   │   │   ├── products.ts
│   │   │   │   │   ├── suppliers.ts
│   │   │   │   │   ├── purchase-requisitions.ts
│   │   │   │   │   ├── purchase-orders.ts
│   │   │   │   │   ├── approvals.ts
│   │   │   │   │   ├── inventory.ts
│   │   │   │   │   ├── analytics.ts
│   │   │   │   │   └── ai.ts
│   │   │   │   │
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   ├── useProducts.ts
│   │   │   │   │   ├── useSuppliers.ts
│   │   │   │   │   ├── usePurchaseRequisitions.ts
│   │   │   │   │   ├── useApprovals.ts
│   │   │   │   │   ├── useNotifications.ts
│   │   │   │   │   └── useDebounce.ts
│   │   │   │   │
│   │   │   │   ├── stores/              # Zustand stores
│   │   │   │   │   ├── authStore.ts
│   │   │   │   │   ├── productsStore.ts
│   │   │   │   │   ├── cartStore.ts
│   │   │   │   │   └── notificationsStore.ts
│   │   │   │   │
│   │   │   │   ├── utils/
│   │   │   │   │   ├── format.ts        # Date, currency formatting
│   │   │   │   │   ├── validation.ts
│   │   │   │   │   ├── permissions.ts
│   │   │   │   │   └── constants.ts
│   │   │   │   │
│   │   │   │   └── validations/
│   │   │   │       ├── product.ts       # Zod schemas
│   │   │   │       ├── supplier.ts
│   │   │   │       ├── purchase-requisition.ts
│   │   │   │       └── user.ts
│   │   │   │
│   │   │   └── types/
│   │   │       ├── index.ts
│   │   │       ├── product.ts
│   │   │       ├── supplier.ts
│   │   │       ├── purchase-requisition.ts
│   │   │       ├── purchase-order.ts
│   │   │       └── user.ts
│   │   │
│   │   ├── .env.local
│   │   ├── .env.example
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── api/                              # Node.js Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   │       └── ... (auto-generated)
│   │   │
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── index.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── categories.ts
│   │   │   │   ├── suppliers.ts
│   │   │   │   ├── inventory.ts
│   │   │   │   ├── purchase-requisitions.ts
│   │   │   │   ├── approvals.ts
│   │   │   │   ├── purchase-orders.ts
│   │   │   │   ├── ai.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── webhooks.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── productsController.ts
│   │   │   │   ├── suppliersController.ts
│   │   │   │   ├── prController.ts
│   │   │   │   ├── poController.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── productService.ts
│   │   │   │   ├── supplierService.ts
│   │   │   │   ├── prService.ts
│   │   │   │   ├── poService.ts
│   │   │   │   ├── approvalService.ts
│   │   │   │   ├── inventoryService.ts
│   │   │   │   ├── aiService.ts         # Calls Python AI
│   │   │   │   ├── emailService.ts
│   │   │   │   ├── pdfService.ts
│   │   │   │   └── notificationService.ts
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              # Clerk JWT verification
│   │   │   │   ├── rbac.ts              # Role-based access
│   │   │   │   ├── validate.ts          # Zod validation
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── rateLimit.ts
│   │   │   │   └── audit.ts
│   │   │   │
│   │   │   ├── jobs/
│   │   │   │   ├── cronJobs.ts          # Scheduled tasks
│   │   │   │   ├── forecastJob.ts
│   │   │   │   ├── priceUpdateJob.ts
│   │   │   │   └── dailyReportJob.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── pdf.ts
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   ├── redis.ts
│   │   │   │   ├── clerk.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts                 # Express app entry
│   │   │
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   │
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── ai-service/                       # Python AI Microservice
│       ├── app/
│       │   ├── models/
│       │   │   ├── __init__.py
│       │   │   ├── demand_forecast.py
│       │   │   ├── price_analyzer.py
│       │   │   ├── supplier_scorer.py
│       │   │   └── document_parser.py
│       │   │
│       │   ├── routes/
│       │   │   ├── __init__.py
│       │   │   ├── forecast.py
│       │   │   ├── analysis.py
│       │   │   ├── recommendations.py
│       │   │   └── chat.py
│       │   │
│       │   ├── services/
│       │   │   ├── __init__.py
│       │   │   ├── llm_service.py       # Groq integration
│       │   │   ├── ocr_service.py       # Tesseract
│       │   │   └── data_processor.py
│       │   │
│       │   ├── utils/
│       │   │   ├── __init__.py
│       │   │   ├── logger.py
│       │   │   ├── validation.py
│       │   │   └── constants.py
│       │   │
│       │   ├── config.py
│       │   └── main.py                   # FastAPI entry
│       │
│       ├── tests/
│       │   └── test_forecast.py
│       │
│       ├── requirements.txt
│       ├── Dockerfile
│       └── README.md
│
├── packages/                             # Shared packages (optional)
│   ├── types/                            # Shared TypeScript types
│   └── utils/                            # Shared utilities
│
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── database-schema.md
│   ├── deployment-guide.md
│   └── user-guide.md
│
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── seed-data.sh
│
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── README.md
└── package.json                          # Root package (monorepo)
```

## DEVELOPMENT PHASES

### PHASE 0: SETUP (Week 1-2) - 14 days

**Day 1-2: Planning & Documentation**
- [ ] Create project charter
- [ ] Define user personas
- [ ] Create feature priority matrix
- [ ] Design database ERD (dbdiagram.io)
- [ ] Create API endpoint list
- [ ] Write user stories

**Day 3-4: Development Environment**
- [ ] Install Node.js 20 LTS
- [ ] Install VS Code + extensions
- [ ] Setup Git + GitHub repository
- [ ] Create monorepo structure
- [ ] Initialize Next.js frontend
- [ ] Initialize Express backend
- [ ] Initialize Python FastAPI service

**Day 5-7: Service Setup**
- [ ] Create Neon PostgreSQL database
- [ ] Setup Clerk authentication account
- [ ] Setup Upstash Redis account
- [ ] Setup Uploadthing account
- [ ] Setup Resend email account
- [ ] Configure all environment variables
- [ ] Test all service connections

**Day 8-10: Frontend Boilerplate**
- [ ] Install shadcn/ui + configure Tailwind
- [ ] Install Zustand, Zod, React Hook Form
- [ ] Install Recharts, TanStack Table
- [ ] Create folder structure
- [ ] Setup API client (axios wrapper)
- [ ] Create layout components
- [ ] Setup Clerk in Next.js

**Day 11-14: Backend Boilerplate + Database**
- [ ] Setup Prisma ORM
- [ ] Create complete Prisma schema
- [ ] Run initial migration
- [ ] Setup Express routes structure
- [ ] Create middleware (auth, RBAC, error)
- [ ] Setup Clerk JWT verification
- [ ] Test database connection
- [ ] Setup node-cron

**Deliverables:**
- ✅ Can run frontend (`npm run dev`)
- ✅ Can run backend (`npm run dev`)
- ✅ Database created with all tables
- ✅ Auth works (sign up/sign in via Clerk)
- ✅ All services connected

---

### PHASE 1: CORE FEATURES (Week 3-8) - 42 days

**Week 3: User Management + Products**

**Day 15-17: User Management**
- [ ] Implement User CRUD APIs
- [ ] Implement RBAC middleware
- [ ] Create user settings page (frontend)
- [ ] Create organization settings page
- [ ] Add user invitation system
- [ ] Test multi-user scenarios

**Day 18-21: Product/SKU Management**
- [ ] Implement Product CRUD APIs
- [ ] Implement Category CRUD APIs
- [ ] Build product list page (TanStack Table)
- [ ] Build product create/edit form
- [ ] Add product image upload (Uploadthing)
- [ ] Add product search & filtering
- [ ] Add bulk CSV import
- [ ] Create product detail view

**Week 4: Inventory Management**

**Day 22-25: Inventory Tracking**
- [ ] Implement Inventory Level APIs
- [ ] Build inventory dashboard page
- [ ] Create stock level indicators
- [ ] Add manual stock adjustment form
- [ ] Create low-stock alerts system
- [ ] Build inventory history view
- [ ] Add stock movement tracking

**Day 26-28: Supplier Management**
- [ ] Implement Supplier CRUD APIs
- [ ] Implement Supplier Product pricing APIs
- [ ] Build supplier list page
- [ ] Build supplier create/edit form
- [ ] Add supplier contact management
- [ ] Create supplier performance tracking
- [ ] Add supplier price sheet upload

**Week 5: Purchase Requisitions**

**Day 29-32: PR Creation & Management**
- [ ] Implement Purchase Requisition APIs
- [ ] Build PR creation form (multi-step)
- [ ] Add product search/selection in PR
- [ ] Calculate estimated costs automatically
- [ ] Create PR list page with filters
- [ ] Create PR detail view
- [ ] Add PR status tracking

**Day 33-35: Approval Workflow Engine**
- [ ] Design approval rules system
- [ ] Implement Approval model APIs
- [ ] Build approval queue page
- [ ] Create approve/reject actions
- [ ] Add approval level configuration
- [ ] Implement email notifications (Resend)
- [ ] Add approval history view

**Week 6: Purchase Orders**

**Day 36-39: PO Creation & Management**
- [ ] Implement Purchase Order APIs
- [ ] Convert approved PR to PO automatically
- [ ] Build PO creation form
- [ ] Create PO list page with filters
- [ ] Create PO detail view
- [ ] Add PO status workflow
- [ ] Implement PO numbering system

**Day 40-42: PO Generation & Sending**
- [ ] Build PO PDF generation (@react-pdf/renderer)
- [ ] Create professional PO template
- [ ] Add email PO to supplier (Resend)
- [ ] Create PO PDF download endpoint
- [ ] Add PO revision tracking
- [ ] Build goods receipt recording

**Week 7: Analytics & Dashboard**

**Day 43-46: Dashboard**
- [ ] Create analytics aggregation APIs
- [ ] Build main dashboard page
- [ ] Add KPI cards
- [ ] Create spend-over-time chart (Recharts)
- [ ] Add low stock alerts widget
- [ ] Add recent activity feed
- [ ] Add top suppliers widget

**Day 47-49: Reports**
- [ ] Create report generation APIs
- [ ] Build spend analysis page
- [ ] Add category-wise spend breakdown
- [ ] Create supplier performance report
- [ ] Add budget vs actual tracking
- [ ] Implement CSV export for reports
- [ ] Add date range filtering

**Week 8: Testing & Polish**

**Day 50-53: Testing**
- [ ] Write unit tests for APIs
- [ ] Test all user workflows end-to-end
- [ ] Test RBAC
- [ ] Test approval workflows
- [ ] Test edge cases
- [ ] Fix bugs

**Day 54-56: UI/UX Polish**
- [ ] Add loading states
- [ ] Add error handling & toasts
- [ ] Improve mobile responsiveness
- [ ] Add empty states
- [ ] Improve form validation messages
- [ ] Add keyboard shortcuts
- [ ] Create onboarding flow

**Deliverables:**
- ✅ Full procurement workflow works
- ✅ User can create PR → Approve → PO → Send
- ✅ Dashboard shows analytics
- ✅ MVP is COMPLETE

---

### PHASE 2: AI FEATURES (Week 9-12) - 28 days

**Week 9: AI Service Setup**

**Day 57-59: Python AI Service**
- [ ] Initialize FastAPI project
- [ ] Setup Python environment (venv)
- [ ] Install Prophet, scikit-learn, pandas
- [ ] Create basic FastAPI endpoints
- [ ] Test local AI service
- [ ] Deploy to Hugging Face Spaces
- [ ] Test API calls from Node backend

**Day 60-63: Data Pipeline**
- [ ] Create data export API (Node → Python)
- [ ] Build training data formatter
- [ ] Create historical data seeding script
- [ ] Test data flow: Postgres → Node → Python

**Week 10: Demand Forecasting**

**Day 64-67: Prophet Model**
- [ ] Study Prophet library
- [ ] Create demand forecasting model
- [ ] Train on sample data
- [ ] Test forecast accuracy
- [ ] Create forecast API endpoint
- [ ] Store forecasts in database

**Day 68-70: Frontend Integration**
- [ ] Create forecast visualization page
- [ ] Add forecast chart (Recharts)
- [ ] Show confidence intervals
- [ ] Add forecast accuracy metrics
- [ ] Create "Trigger Forecast" button

**Week 11: Smart Reordering**

**Day 71-74: Reorder Algorithm**
- [ ] Create reorder suggestion algorithm
- [ ] Combine forecast + stock + lead time
- [ ] Calculate optimal order quantities
- [ ] Create reorder suggestion API
- [ ] Add reorder alerts system

**Day 75-77: Supplier Intelligence**
- [ ] Create supplier scoring algorithm
- [ ] Price competitiveness calculation
- [ ] Delivery reliability tracking
- [ ] Quality rating system
- [ ] Create "Best Supplier" API

**Week 12: Price Intelligence**

**Day 78-81: Price Analysis**
- [ ] Create price history tracking
- [ ] Build price trend analysis
- [ ] Implement anomaly detection
- [ ] Create price spike alerts
- [ ] Build price comparison API

**Day 82-84: AI Dashboard**
- [ ] Create AI Insights page
- [ ] Add demand forecast widget
- [ ] Add price trend alerts
- [ ] Add savings opportunity cards
- [ ] Show AI recommendation feed

**Deliverables:**
- ✅ AI forecasting works
- ✅ Smart reorder suggestions appear
- ✅ Price intelligence tracks trends
- ✅ AI FEATURES COMPLETE

---

### PHASE 3: ADVANCED FEATURES (Week 13-16) - 28 days

**Week 13: Document Processing**

**Day 85-87: OCR & Parsing**
- [ ] Integrate Tesseract.js
- [ ] Create supplier price sheet parser
- [ ] Extract product SKUs and prices
- [ ] Test with sample files

**Day 88-91: Invoice Matching**
- [ ] Create invoice upload feature
- [ ] Build 3-way matching
- [ ] Detect discrepancies
- [ ] Flag for approval if mismatch

**Week 14: Notifications & Alerts**

**Day 92-95: Notification System**
- [ ] Create notification model & APIs
- [ ] Build in-app notification center
- [ ] Add real-time notifications
- [ ] Create notification preferences
- [ ] Add notification badge count

**Day 96-98: Email Alerts**
- [ ] Create email templates
- [ ] Send approval request emails
- [ ] Send low stock alerts
- [ ] Send price spike warnings
- [ ] Add email unsubscribe option

**Week 15: Audit & Compliance**

**Day 99-102: Audit Logging**
- [ ] Enhance audit log middleware
- [ ] Log all CUD operations
- [ ] Create audit log viewer page
- [ ] Add filtering
- [ ] Export audit logs as CSV

**Day 103-105: Compliance Reports**
- [ ] Create compliance report APIs
- [ ] Build spend-by-department report
- [ ] Add budget adherence tracking
- [ ] Create unauthorized purchase alerts
- [ ] Generate quarterly report

**Week 16: Final Polish & Deployment**

**Day 106-109: Performance**
- [ ] Add database indexes
- [ ] Implement Redis caching
- [ ] Optimize large data tables
- [ ] Add API rate limiting
- [ ] Compress images

**Day 110-112: Deployment**
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Deploy AI service to HF
- [ ] Setup custom domain
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Record demo video

**Deliverables:**
- ✅ System deployed to production
- ✅ Documentation complete
- ✅ Demo ready
- ✅ PROJECT COMPLETE

---

## TESTING STRATEGY

### Unit Tests

```typescript
// Example: Product Service Test
describe('ProductService', () => {
  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const productData = {
        sku: 'TEST-001',
        name: 'Test Product',
        organizationId: 'org_test'
      };
      const result = await productService.create(productData);
      expect(result.sku).toBe('TEST-001');
    });
    
    it('should reject duplicate SKU', async () => {
      await expect(
        productService.create({ sku: 'EXISTING', ... })
      ).rejects.toThrow('SKU already exists');
    });
  });
});
```

### Integration Tests

```typescript
// Example: PR to PO Flow Test
describe('Purchase Requisition to PO Flow', () => {
  it('should create PO when PR approved', async () => {
    // 1. Create PR
    const pr = await request(app)
      .post('/api/purchase-requisitions')
      .send(prData);
    
    // 2. Approve PR
    const approval = await request(app)
      .post(`/api/approvals/${pr.body.data.approval_id}/approve`)
      .set('Authorization', `Bearer ${financeToken}`);
    
    // 3. Verify PO created
    const pos = await request(app)
      .get('/api/purchase-orders')
      .query({ pr_id: pr.body.data.id });
    
    expect(pos.body.data.length).toBe(1);
    expect(pos.body.data[0].status).toBe('SENT');
  });
});
```

### E2E Tests (Playwright)

```typescript
test('complete purchase flow', async ({ page }) => {
  // Login
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Create PR
  await page.click('text=New Request');
  await page.fill('[name="product"]', 'Paper');
  await page.click('text=A4 Paper Reams');
  await page.fill('[name="quantity"]', '50');
  await page.click('text=Submit for Approval');
  
  // Verify success
  await expect(page.locator('text=PR Created')).toBeVisible();
});
```

## DEPLOYMENT CONFIGURATION

### Vercel (Frontend)

```json
// vercel.json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk-key"
  }
}
```

### Railway (Backend)

```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "cd apps/api && npm install && npx prisma generate && npm run build"

[deploy]
startCommand = "cd apps/api && npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[healthchecks]]
path = "/api/health"
interval = 30
timeout = 10
```

### Hugging Face Spaces (AI Service)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

## MONITORING & OBSERVABILITY

### Logging

```typescript
// Backend logging (Winston)
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('PR created', { prId, userId, amount });
logger.error('Failed to send email', { error, userId });
```

### Error Tracking (Sentry)

```typescript
// Frontend
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Usage
try {
  await createPR(data);
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Analytics (PostHog)

```typescript
// Track user actions
posthog.capture('pr_created', {
  pr_id: prId,
  amount: amount,
  department: department
});

posthog.capture('ai_recommendation_accepted', {
  recommendation_id: recId,
  product_id: productId
});
```

## SECURITY CONSIDERATIONS

### Authentication
- Clerk handles all auth
- JWT tokens in HTTP-only cookies
- Token refresh automatic
- Multi-factor authentication supported

### Authorization
- Row-level security via organization_id
- Role-based access control (RBAC)
- Permission checks on every API call
- Audit logs for compliance

### Data Protection
- HTTPS everywhere (TLS 1.3)
- Data encrypted at rest (Neon default)
- Sensitive data hashed (bcrypt)
- SQL injection prevention (Prisma ORM)
- XSS protection (React escaping)
- CSRF tokens (SameSite cookies)

### Rate Limiting
```typescript
// Using express-rate-limit + Upstash Redis
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## COST TRACKING

### Monthly Cost Estimate (Free Tier)

| Service | Free Tier | Expected Usage | Status |
|---------|-----------|----------------|--------|
| Vercel | Unlimited | Frontend hosting | ✅ Free |
| Railway | $5 credit | ~300 hrs/month | ✅ Free |
| Neon | 3GB storage | ~500MB database | ✅ Free |
| Clerk | 10K MAU | <100 test users | ✅ Free |
| Upstash Redis | 10K commands/day | ~2K actual | ✅ Free |
| Uploadthing | 2GB storage | ~500MB files | ✅ Free |
| Resend | 100 emails/day | ~20 emails/day | ✅ Free |
| Hugging Face | Unlimited CPU | AI inference | ✅ Free |
| Sentry | 5K errors/month | <1K errors | ✅ Free |
| PostHog | 1M events/month | ~50K events | ✅ Free |
| **TOTAL** | | | **$0/month** |

---

## SUMMARY FOR CLAUDE OPUS 4.6

This document contains:
1. Complete system architecture
2. Database schema (20 tables, all relationships)
3. API structure (50+ endpoints)
4. User roles & permissions
5. AI integration details (5 AI features)
6. Complete feature list (50+ features)
7. Detailed workflow (7-step purchase journey)
8. File structure (500+ files)
9. Development phases (16 weeks broken down)
10. Testing strategy
11. Deployment configuration
12. Security considerations

You now have everything needed to:
- Generate code for any component
- Create database migrations
- Build API endpoints
- Implement AI features
- Design UI components
- Write tests
- Deploy to production

**Start by asking which specific component or feature you want me to generate code for first.**

Examples:
- "Generate the Prisma schema file"
- "Create the product list API endpoint"
- "Build the PR creation form component"
- "Write the demand forecasting Python code"
- "Generate the dashboard page"

What would you like to build first?
```

---

Copy this entire document to Claude Opus 4.6 and start requesting specific code generations. It has everything mapped out!