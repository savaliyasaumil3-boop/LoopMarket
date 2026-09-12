-- Supabase Migration: Initial Schema and RLS Policies

-- Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Material Passports
CREATE TABLE IF NOT EXISTS public.material_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Buyer Requirements
CREATE TABLE IF NOT EXISTS public.buyer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  criteria jsonb,
  created_at timestamptz DEFAULT now()
);

-- Matches
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES public.buyer_requirements(id) ON DELETE CASCADE,
  score numeric,
  created_at timestamptz DEFAULT now()
);

-- Bids
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  bidder_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  amount numeric,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid REFERENCES public.bids(id) ON DELETE CASCADE,
  status text,
  total_amount numeric,
  created_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_provider text,
  payment_status text,
  amount numeric,
  processed_at timestamptz DEFAULT now()
);

-- Enable Row-Level Security (RLS) for tables with company_id
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_owner" ON public.companies FOR ALL USING (auth.uid() = id);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_owner" ON public.materials FOR ALL USING (auth.uid() = company_id);

ALTER TABLE public.buyer_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyer_requirements_owner" ON public.buyer_requirements FOR ALL USING (auth.uid() = company_id);

-- Enable RLS for other tables (no owner restriction)
ALTER TABLE public.material_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Basic SELECT policy for authenticated users
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations' LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'');', tbl, tbl);
  END LOOP;
END $$;
