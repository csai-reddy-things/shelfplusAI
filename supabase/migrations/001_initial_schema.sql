-- ShelfPulse AI - Supabase PostgreSQL Schema Migration
-- Migration: 001_initial_schema.sql
-- Enables UUID extension, creates core tables, indexes, RLS policies, and triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.store_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL DEFAULT 'Apna Supermart',
    owner_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    auto_whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    contact_person TEXT DEFAULT 'Sales Desk',
    whatsapp_number TEXT NOT NULL, -- E.164 format e.g. +919876543210
    primary_category TEXT NOT NULL CHECK (primary_category IN (
        'DAIRY_AND_CHILLED',
        'BAKERY_AND_BREADS',
        'SNACKS_AND_BISCUITS',
        'BEVERAGES_AND_JUICES',
        'STAPLES_AND_GRAINS',
        'INSTANT_AND_PACKAGED_FOOD',
        'PERSONAL_AND_HOME_CARE',
        'FRESH_PRODUCE'
    )),
    lead_time_hours INTEGER NOT NULL DEFAULT 24,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SUPPLIER BILLS (SCANNED INVOICES) TABLE
CREATE TABLE IF NOT EXISTS public.supplier_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    raw_extracted_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    scan_confidence_score NUMERIC(4, 2) DEFAULT 0.95,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INVENTORY ITEMS & BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    source_bill_id UUID REFERENCES public.supplier_bills(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    sku_code TEXT DEFAULT '',
    category TEXT NOT NULL CHECK (category IN (
        'DAIRY_AND_CHILLED',
        'BAKERY_AND_BREADS',
        'SNACKS_AND_BISCUITS',
        'BEVERAGES_AND_JUICES',
        'STAPLES_AND_GRAINS',
        'INSTANT_AND_PACKAGED_FOOD',
        'PERSONAL_AND_HOME_CARE',
        'FRESH_PRODUCE'
    )),
    batch_number TEXT NOT NULL DEFAULT 'BATCH-STD',
    current_quantity INTEGER NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'pcs' CHECK (unit IN ('pcs', 'packets', 'kg', 'liters', 'boxes', 'cartons')),
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_stock_threshold INTEGER NOT NULL DEFAULT 5,
    recommended_reorder_qty INTEGER NOT NULL DEFAULT 25,
    expiry_date DATE NOT NULL,
    is_expiry_estimated BOOLEAN NOT NULL DEFAULT FALSE,
    ai_clearance_advice JSONB DEFAULT NULL,
    last_restock_triggered_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RESTOCK ORDERS & WHATSAPP DISPATCH LOGS TABLE
CREATE TABLE IF NOT EXISTS public.restock_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    item_name_snapshot TEXT NOT NULL,
    current_stock_at_trigger INTEGER NOT NULL,
    ordered_quantity INTEGER NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    recipient_whatsapp TEXT NOT NULL,
    whatsapp_message_body TEXT NOT NULL,
    dispatch_status TEXT NOT NULL CHECK (dispatch_status IN ('PENDING', 'SENT_LIVE', 'DEMO_SIMULATED', 'FAILED')),
    provider_message_sid TEXT,
    trigger_source TEXT NOT NULL CHECK (trigger_source IN ('AUTO_LOW_STOCK', 'MANUAL_ONE_CLICK')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_user_expiry ON public.inventory_items(user_id, expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_inventory_user_stock ON public.inventory_items(user_id, current_quantity ASC);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_restock_orders_user_created ON public.restock_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON public.supplier_bills(user_id, created_at DESC);

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for store_profiles
DROP TRIGGER IF EXISTS set_store_profiles_timestamp ON public.store_profiles;
CREATE TRIGGER set_store_profiles_timestamp
BEFORE UPDATE ON public.store_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for inventory_items
DROP TRIGGER IF EXISTS set_inventory_items_timestamp ON public.inventory_items;
CREATE TRIGGER set_inventory_items_timestamp
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.store_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_orders ENABLE ROW LEVEL SECURITY;

-- 1. store_profiles RLS Policies
DROP POLICY IF EXISTS "Users can view own store profile" ON public.store_profiles;
CREATE POLICY "Users can view own store profile"
    ON public.store_profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own store profile" ON public.store_profiles;
CREATE POLICY "Users can insert own store profile"
    ON public.store_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own store profile" ON public.store_profiles;
CREATE POLICY "Users can update own store profile"
    ON public.store_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. suppliers RLS Policies
DROP POLICY IF EXISTS "Users manage own suppliers" ON public.suppliers;
CREATE POLICY "Users manage own suppliers"
    ON public.suppliers FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. supplier_bills RLS Policies
DROP POLICY IF EXISTS "Users manage own supplier bills" ON public.supplier_bills;
CREATE POLICY "Users manage own supplier bills"
    ON public.supplier_bills FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. inventory_items RLS Policies
DROP POLICY IF EXISTS "Users manage own inventory items" ON public.inventory_items;
CREATE POLICY "Users manage own inventory items"
    ON public.inventory_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. restock_orders RLS Policies
DROP POLICY IF EXISTS "Users manage own restock orders" ON public.restock_orders;
CREATE POLICY "Users manage own restock orders"
    ON public.restock_orders FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
