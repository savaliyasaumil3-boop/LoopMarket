-- Store every contract with the company that owns the dashboard record.
-- The app currently authenticates through the FastAPI backend, so Supabase
-- receives the company id as data and uses app-level company filtering.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS owner_company_id TEXT;

UPDATE public.contracts
SET owner_company_id = seller_id
WHERE owner_company_id IS NULL AND seller_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS contracts_owner_company_idx
  ON public.contracts (owner_company_id);

CREATE INDEX IF NOT EXISTS contracts_seller_buyer_idx
  ON public.contracts (seller_id, buyer_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company contract records are readable" ON public.contracts;
CREATE POLICY "Company contract records are readable"
  ON public.contracts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Company contract records are insertable" ON public.contracts;
CREATE POLICY "Company contract records are insertable"
  ON public.contracts
  FOR INSERT
  WITH CHECK (owner_company_id IS NOT NULL);

DROP POLICY IF EXISTS "Company contract records are updateable" ON public.contracts;
CREATE POLICY "Company contract records are updateable"
  ON public.contracts
  FOR UPDATE
  USING (true)
  WITH CHECK (owner_company_id IS NOT NULL);