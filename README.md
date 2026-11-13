# ShelfPulse AI 🛒⚡
### Smart Restock & Expiry Tracker for Local Supermarkets (Hyperlocal Commerce)

> **Zero-Data-Entry Onboarding • Automated Batch Expiry Radar • Real-Time WhatsApp Supplier Auto-Restock**

---

## 🌟 Overview & Problem Solved

Kirana stores, minimarts, and neighborhood supermarkets in India and across emerging retail markets lose up to **15–20% of their monthly working capital** to two preventable operational failures:
1. **Unnoticed Expired Stock**: Dairy pouches, sliced breads, packaged snacks, and juices sit on shelves past their expiration date without structured batch tracking or timely markdown advisories.
2. **Chaotic Reactive Reordering**: Restocking is done via frantic phone calls or unstructured voice notes *after* shelves are already empty, resulting in stockouts and lost revenue.

**ShelfPulse AI** provides a unified, automated solution:
- 📸 **Zero-Entry Bill Scanner**: Point your camera at a printed wholesale distributor receipt. Gemini 2.5 Flash (`@google/genai`) extracts SKUs, quantities, unit prices, batch numbers, and expiry dates into structured JSON.
- 🎯 **Expiry Radar & Clearance Advisor**: Real-time batch shelf-life categorization (Critical 0–3d, Warning 4–14d, Safe, Expired) with Gemini AI markdown calculations and customer promotional blurbs.
- 📱 **Real-Time WhatsApp Auto-Restock Engine**: When customer sales or stock adjustments breach safe inventory levels (`min_stock_threshold`), ShelfPulse automatically drafts a structured purchase order and dispatches it directly to the supplier's WhatsApp number via Twilio (with instant `wa.me` fallback).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, React Hot Toast, Canvas Confetti |
| **Backend** | Node.js (v20+), Express.js, Multer (Memory Storage), CORS, Helmet, Express Rate Limit |
| **Database & Auth** | Supabase Cloud (PostgreSQL with RLS, UUID extension, Triggers, Auth JWTs) |
| **AI Vision & NLP** | Official Google Gen AI SDK (`@google/genai`) strictly with `gemini-2.5-flash` & JSON schemas |
| **Messaging** | Twilio REST WhatsApp API (`whatsapp:...`) + Instant `wa.me` Deep-Link Generator |
| **Validation** | Zod (End-to-End type safety and schema validation) |

---

## 📂 Project Structure

```
shelfpulse-ai/
├── README.md
├── package.json                    # Root orchestrator (concurrent dev runner)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Complete PostgreSQL schema, RLS policies, & indexes
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   ├── scripts/
│   │   └── migrate.js              # Node.js automated migration runner
│   └── src/
│       ├── index.js                # Express server entry point
│       ├── config/
│       │   ├── gemini.js           # Official @google/genai SDK configuration
│       │   ├── supabase.js         # Supabase client (service role & per-request RLS client)
│       │   └── whatsapp.js         # Twilio REST client & wa.me fallback generator
│       ├── middleware/
│       │   ├── authMiddleware.js   # Supabase JWT verification & req.user binding
│       │   └── errorHandler.js     # Centralized Zod, Multer & API error handler
│       ├── validators/
│       │   └── schemas.js          # Zod validation schemas
│       ├── services/
│       │   ├── aiVisionService.js     # Gemini 2.5 Flash multimodal receipt OCR
│       │   ├── aiClearanceService.js  # Gemini 2.5 Flash markdown & bundle advisor
│       │   └── whatsappRestockService.js # Gemini + Twilio automated PO dispatch
│       └── routes/
│           ├── billRoutes.js       # /api/bills/scan & /api/bills/commit
│           ├── inventoryRoutes.js  # /api/inventory & /api/inventory/:id/adjust-stock
│           ├── expiryRoutes.js     # /api/expiry/advisory
│           ├── restockRoutes.js    # /api/restock/trigger & /api/restock/orders
│           ├── supplierRoutes.js   # /api/suppliers
│           ├── dashboardRoutes.js  # /api/dashboard/summary
│           └── demoSeedRoutes.js   # /api/demo/seed
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx     # Supabase auth session & Stage Demo Target state
        ├── lib/
        │   ├── supabaseClient.js   # Supabase Auth client
        │   └── apiClient.js        # Axios instance with Bearer token injection
        ├── components/
        │   ├── SidebarLayout.jsx   # Shell with live badge counters & stage phone editor
        │   ├── KpiSummaryCards.jsx # 4 high-contrast operational metric cards
        │   ├── BillScannerUploader.jsx # HTML5 Camera capture & Sample Invoice generator
        │   ├── ExtractedBillReviewTable.jsx # Editable line-item verification table
        │   ├── InventoryTableWithPosSimulator.jsx # Search, health bars, -1/-5 sale buttons
        │   ├── ExpiryRadarBoard.jsx # 4 Urgency buckets & AI clearance plan
        │   ├── LiveWhatsappToastModal.jsx # Instant notification popup with wa.me link
        │   └── SupplierDirectoryModal.jsx # Distributor directory & live target selector
        └── pages/
            ├── LoginPage.jsx       # Auth portal with 1-click Demo Store login
            ├── DashboardPage.jsx   # Command Center & live feeds
            ├── ScanBillPage.jsx    # Bill scanning & verification review
            ├── InventoryPage.jsx   # Smart stock ledger with POS simulator
            ├── ExpiryRadarPage.jsx # Shelf-life horizons & markdown engine
            └── RestockOrdersPage.jsx # WhatsApp PO ledger & dispatch history
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20 or higher (verified on Node v26)
- **Supabase Cloud Account** (Free tier)
- **Google AI Studio Key** (`GEMINI_API_KEY`)

### 2. Configure Environment Variables

**Backend (`server/.env`)**:
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase Credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Direct PostgreSQL Connection for automated migration runner (optional)
DATABASE_URL=postgresql://postgres.your-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# Google Gemini API (@google/genai)
GEMINI_API_KEY=your-gemini-api-key

# WhatsApp Dispatch (Twilio)
# Note: If left blank, ShelfPulse automatically uses DEMO_SIMULATED mode with wa.me deep link
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DEFAULT_DEMO_WHATSAPP_TO=+919876543210
```

**Frontend (`client/.env`)**:
```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🗄️ Database Setup & Migration

### Option A: Direct Node Migration Runner (Recommended)
Set `DATABASE_URL` in `server/.env` and execute:
```bash
npm run migrate
```

### Option B: Supabase Cloud SQL Editor
1. Open your Supabase Dashboard: `https://app.supabase.com`
2. Navigate to **SQL Editor** -> **New Query**
3. Open `supabase/migrations/001_initial_schema.sql`
4. Paste the entire script and click **Run**
5. All 5 tables, RLS policies, performance indexes, and triggers will be created.

---

## 🚀 Running Locally

Start both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🎬 3-Minute Live Stage Demo Script

1. **Step 1: 1-Click Onboarding**
   - Open `http://localhost:5173`
   - Click the green **"Demo Login"** button. You immediately land on the Command Center.
   - If stock is empty, click **"Seed"** in the sidebar footer. 10 realistic Indian grocery batches (Amul Milk, Britannia Bread, Maggi, Atta) and 4 suppliers are populated instantly.
   - Set the judge's WhatsApp phone number in the sidebar footer (**"Stage WhatsApp Target"**).

2. **Step 2: AI Supplier Bill OCR Scan**
   - Navigate to `/scan-bill`.
   - Click **"⚡ Load Sample Wholesale Invoice (Demo)"**. A high-resolution Indian FMCG wholesale bill is rendered directly onto the canvas.
   - Click **"Scan Bill with Gemini Vision"**.
   - Watch the laser scanning animation. Within 2–3 seconds, the table populates with extracted line items, batch codes, quantities, and amber badges for estimated expiry dates.
   - Click **"Approve & Sync to Inventory"**. Confetti fires and stock is live in Supabase.

3. **Step 3: Expiry Radar & AI Clearance**
   - Navigate to `/expiry-radar`.
   - View items sorted into Critical (0–3d), Warning (4–14d), and Safe.
   - Click **"Generate AI Clearance Plan"**.
   - Gemini calculates exact markdown percentages (e.g., 30% off on milk/bread), local walk-in bundle strategies ("Pair bread with butter at checkout"), and provides copyable customer WhatsApp broadcast messages.

4. **Step 4: Live POS Sale & WhatsApp Auto-Restock Trigger**
   - Navigate to `/inventory`.
   - Locate **"Maggi 2-Minute Masala Noodles"** (current stock: 6, safety threshold: 5).
   - Click **"-5 Rush"**.
   - The stock drops to 1, breaching the safety threshold!
   - The backend immediately invokes Gemini 2.5 Flash to draft an urgent restock PO, logs it in `restock_orders`, and dispatches it via WhatsApp.
   - The **"Live WhatsApp Restock Dispatched!"** modal pops up in real time with the message body and a 1-click **"Open in WhatsApp Web / App"** button!

---

## 🔒 Security & Best Practices

- **Zero Client-Side Secret Exposure**: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TWILIO_AUTH_TOKEN` reside strictly on the server.
- **Strict Row-Level Security (RLS)**: Every query passes the user's Supabase JWT so PostgreSQL isolates each supermarket's data at the database level.
- **Strict @google/genai Compliance**: Utilizes the modern `import { GoogleGenAI, Type } from '@google/genai'` SDK with JSON schema enforcement.
- **Anti-Spam Restock Debouncing**: Automated threshold triggers check for recent restock dispatches within the last 12 hours to prevent supplier inbox spam.
