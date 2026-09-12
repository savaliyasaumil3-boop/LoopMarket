-- Seed Data for Initial Supabase Tables

INSERT INTO public.companies (id, name, logo_url, description) VALUES
  (gen_random_uuid(), 'Acme Corp',   'https://example.com/logo1.svg', 'Leading recycler'),
  (gen_random_uuid(), 'GreenLoop',  'https://example.com/logo2.svg', 'Circular economy specialist');

INSERT INTO public.materials (id, company_id, name, category, description, image_url) VALUES
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'Acme Corp'),   'Aluminum Sheet', 'Metal',   'High‑grade recycled aluminum sheet.',   'https://example.com/aluminum.svg'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'GreenLoop'), 'PLA Filament',   'Plastic', 'Biodegradable PLA filament for 3D printing.', 'https://example.com/pla.svg');

INSERT INTO public.buyer_requirements (id, company_id, criteria) VALUES
  (gen_random_uuid(),
   (SELECT id FROM public.companies WHERE name = 'GreenLoop'),
   '{"material":"Aluminum","quantity":1000}');
