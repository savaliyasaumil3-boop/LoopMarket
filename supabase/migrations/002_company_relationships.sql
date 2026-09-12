-- Live company-to-company workflow relationships
CREATE TABLE IF NOT EXISTS public.company_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  to_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  initiated_by uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  relationship_type text NOT NULL CHECK (relationship_type IN ('supplier', 'buyer', 'recycler', 'logistics')),
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'active', 'paused', 'completed', 'cancelled')),
  quantity numeric,
  unit text,
  price numeric,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_relationships_distinct_companies CHECK (from_company_id <> to_company_id)
);

CREATE INDEX IF NOT EXISTS company_relationships_from_company_idx
  ON public.company_relationships (from_company_id);

CREATE INDEX IF NOT EXISTS company_relationships_to_company_idx
  ON public.company_relationships (to_company_id);

CREATE INDEX IF NOT EXISTS company_relationships_status_idx
  ON public.company_relationships (status);

ALTER TABLE public.company_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_relationships_participant_select" ON public.company_relationships;
CREATE POLICY "company_relationships_participant_select"
  ON public.company_relationships
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      auth.uid() = from_company_id
      OR auth.uid() = to_company_id
      OR auth.uid() = initiated_by
    )
  );

DROP POLICY IF EXISTS "company_relationships_participant_insert" ON public.company_relationships;
CREATE POLICY "company_relationships_participant_insert"
  ON public.company_relationships
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = initiated_by
    AND (auth.uid() = from_company_id OR auth.uid() = to_company_id)
  );

DROP POLICY IF EXISTS "company_relationships_participant_update" ON public.company_relationships;
CREATE POLICY "company_relationships_participant_update"
  ON public.company_relationships
  FOR UPDATE
  USING (auth.uid() = from_company_id OR auth.uid() = to_company_id)
  WITH CHECK (auth.uid() = from_company_id OR auth.uid() = to_company_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'company_relationships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.company_relationships;
  END IF;
END $$;
