-- Complete Supabase Setup Script for LoopMarket
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  company_type TEXT DEFAULT 'Manufacturer',
  industry TEXT DEFAULT 'Packaging',
  city TEXT DEFAULT 'Ahmedabad',
  state TEXT DEFAULT 'Gujarat',
  trust_score NUMERIC DEFAULT 95,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Packaging',
  subtype TEXT DEFAULT 'Surplus Lot',
  quantity NUMERIC DEFAULT 1000,
  unit TEXT DEFAULT 'kg',
  quantity_kg NUMERIC DEFAULT 1000,
  price_per_unit NUMERIC DEFAULT 15.0,
  location_city TEXT DEFAULT 'Ahmedabad',
  primary_image_url TEXT,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_number TEXT,
  title TEXT,
  seller_id TEXT,
  seller_name TEXT,
  buyer_id TEXT,
  buyer_name TEXT,
  buyer_city TEXT,
  material_name TEXT,
  quantity_kg NUMERIC,
  unit_price NUMERIC,
  total_amount NUMERIC,
  contract_duration TEXT,
  status TEXT DEFAULT 'ACTIVE',
  seller_signed BOOLEAN DEFAULT true,
  buyer_signed BOOLEAN DEFAULT false,
  delivery_terms TEXT,
  payment_terms TEXT,
  inspection_terms TEXT,
  owner_company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS public.requirements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  category TEXT DEFAULT 'Packaging',
  material_type TEXT,
  target_quantity_kg NUMERIC,
  max_price_per_kg NUMERIC,
  delivery_city TEXT DEFAULT 'Ahmedabad',
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_number TEXT,
  material_id TEXT,
  material_name TEXT,
  material_category TEXT,
  quantity NUMERIC,
  unit TEXT DEFAULT 'kg',
  unit_price NUMERIC,
  subtotal_amount NUMERIC,
  logistics_cost NUMERIC,
  total_delivered_amount NUMERIC,
  status TEXT DEFAULT 'ORDER_CONFIRMED',
  seller_name TEXT,
  seller_city TEXT,
  buyer_name TEXT,
  buyer_city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SYSTEM STATE TABLE (For cross-teammate sync like clear operations)
CREATE TABLE IF NOT EXISTS public.system_state (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ENABLE ROW LEVEL SECURITY & ADD PUBLIC POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS contracts_owner_company_idx ON public.contracts (owner_company_id);
CREATE INDEX IF NOT EXISTS contracts_seller_buyer_idx ON public.contracts (seller_id, buyer_id);
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;

-- Allow Public (anon) Read, Insert, Update & Delete Access
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
CREATE POLICY "Public read companies" ON public.companies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert companies" ON public.companies;
CREATE POLICY "Public insert companies" ON public.companies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read materials" ON public.materials;
CREATE POLICY "Public read materials" ON public.materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert materials" ON public.materials;
CREATE POLICY "Public insert materials" ON public.materials FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete materials" ON public.materials;
CREATE POLICY "Public delete materials" ON public.materials FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read contracts" ON public.contracts;
CREATE POLICY "Public read contracts" ON public.contracts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert contracts" ON public.contracts;
CREATE POLICY "Public insert contracts" ON public.contracts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update contracts" ON public.contracts;
CREATE POLICY "Public update contracts" ON public.contracts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read requirements" ON public.requirements;
CREATE POLICY "Public read requirements" ON public.requirements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert requirements" ON public.requirements;
CREATE POLICY "Public insert requirements" ON public.requirements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read system_state" ON public.system_state;
CREATE POLICY "Public read system_state" ON public.system_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert system_state" ON public.system_state;
CREATE POLICY "Public insert system_state" ON public.system_state FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update system_state" ON public.system_state;
CREATE POLICY "Public update system_state" ON public.system_state FOR UPDATE USING (true);

-- 6. SEED DEMO DATA

-- Companies
INSERT INTO public.companies (id, name, company_type, industry, city, state, trust_score) VALUES
  ('comp-demo-1', 'ABC Manufacturing Pvt Ltd', 'Manufacturer', 'Industrial Goods', 'Ahmedabad', 'Gujarat', 96),
  ('comp-demo-2', 'GreenPack Industries Ltd', 'Converter', 'Corrugated Packaging', 'Vadodara', 'Gujarat', 98),
  ('comp-demo-3', 'Gujarat Circular Polymers & Pulp', 'Recycler', 'Polymers & Resin', 'Surat', 'Gujarat', 92),
  ('comp-demo-4', 'Surat Warehousing & Logistics Hub', 'Logistics Provider', 'Supply Chain', 'Surat', 'Gujarat', 95)
ON CONFLICT (id) DO NOTHING;

-- Materials
INSERT INTO public.materials (id, company_id, name, category, subtype, quantity, unit, quantity_kg, price_per_unit, location_city, primary_image_url) VALUES
  ('mat_sb_001', 'comp-demo-1', 'HDPE Blue Plastic Drums Grade A', 'Plastics', 'Rigid Drums', 1500, 'kg', 1500, 38.50, 'Ahmedabad', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80'),
  ('mat_sb_002', 'comp-demo-2', 'Baled Industrial OCC Cardboard Grade 11', 'Paper', 'Corrugated Scrap', 5000, 'kg', 5000, 14.50, 'Vadodara', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80'),
  ('mat_sb_003', 'comp-demo-3', 'Post-Industrial HDPE Flakes (Clean Granules)', 'Plastics', 'Regrind Flakes', 2500, 'kg', 2500, 42.00, 'Surat', 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&q=80')
ON CONFLICT (id) DO NOTHING;

-- Contracts
INSERT INTO public.contracts (id, contract_number, title, seller_id, seller_name, buyer_id, buyer_name, buyer_city, material_name, quantity_kg, unit_price, total_amount, status, seller_signed, buyer_signed) VALUES
  ('ctr_demo_201', 'CTR-2026-9041', 'Baled OCC Cardboard Monthly Offtake Agreement', 'comp-demo-1', 'ABC Manufacturing Pvt Ltd', 'comp-demo-2', 'GreenPack Industries Ltd', 'Vadodara', 'Corrugated Cardboard OCC Grade 11', 5000, 14.50, 72500, 'ACTIVE', true, true),
  ('ctr_demo_202', 'CTR-2026-8102', 'HDPE Regrind Flakes Closed-Loop Supply Contract', 'comp-demo-3', 'Gujarat Circular Polymers & Pulp', 'comp-demo-1', 'ABC Manufacturing Pvt Ltd', 'Ahmedabad', 'Post-Industrial HDPE Flakes (Clean)', 2500, 42.00, 105000, 'ACTIVE', true, true)
ON CONFLICT (id) DO NOTHING;

-- Requirements
INSERT INTO public.requirements (id, company_id, category, material_type, target_quantity_kg, max_price_per_kg, delivery_city) VALUES
  ('req_demo_301', 'comp-demo-2', 'Paper', 'Corrugated Cardboard OCC 11', 10000, 16.00, 'Vadodara'),
  ('req_demo_302', 'comp-demo-1', 'Plastics', 'HDPE Regrind Flakes', 3000, 45.00, 'Ahmedabad')
ON CONFLICT (id) DO NOTHING;
