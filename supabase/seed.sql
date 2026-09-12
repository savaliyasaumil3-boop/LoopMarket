-- Seed Data for Initial Supabase Tables (5 rows per table)

-- Companies (5 rows)
INSERT INTO public.companies (id, name, logo_url, description) VALUES
  (gen_random_uuid(), 'Acme Corp',   'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100', 'Leading industrial materials recycler'),
  (gen_random_uuid(), 'GreenLoop',  'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100', 'Circular economy specialist'),
  (gen_random_uuid(), 'EcoTech',    'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=100', 'Clean-tech & renewable components'),
  (gen_random_uuid(), 'ReuseWorks', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100', 'Glass & packaging upcycling facility'),
  (gen_random_uuid(), 'ZeroWaste',  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100', 'Zero waste packaging solutions')
ON CONFLICT DO NOTHING;

-- Materials (5 rows)
INSERT INTO public.materials (id, company_id, name, category, description, image_url) VALUES
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'Acme Corp' LIMIT 1),    'Aluminum Sheet', 'Metal',   'High-grade recycled aluminum sheet.',   'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=400'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'GreenLoop' LIMIT 1),  'PLA Filament',   'Plastic', 'Biodegradable PLA filament for 3D printing.', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'EcoTech' LIMIT 1),    'Solar Panel Cells',    'Energy',  'Recycled silicon photovoltaic cells.', 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'ReuseWorks' LIMIT 1), 'Glass Bottles', 'Glass', 'Recovered glass bottles for reuse.', 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=400'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'ZeroWaste' LIMIT 1),  'Compostable Bags', 'Packaging', 'Industrial compostable packaging bags.', 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=400')
ON CONFLICT DO NOTHING;

-- Material Passports (5 rows)
INSERT INTO public.material_passports (id, material_id, data) VALUES
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Aluminum Sheet' LIMIT 1), '{"origin":"recycled","grade":"A","recycled_content":95}'),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'PLA Filament' LIMIT 1),   '{"origin":"bio","certified":true,"carbon_footprint":"low"}'),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Solar Panel Cells' LIMIT 1),   '{"origin":"upcycled","efficiency":21.5}'),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Glass Bottles' LIMIT 1), '{"origin":"post-consumer","color":"clear","sterilized":true}'),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Compostable Bags' LIMIT 1), '{"material":"PLA/PBAT","degrade_days":180}')
ON CONFLICT DO NOTHING;

-- Buyer Requirements (5 rows)
INSERT INTO public.buyer_requirements (id, company_id, criteria) VALUES
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'Acme Corp' LIMIT 1),   '{"material":"PLA","quantity":500}'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'GreenLoop' LIMIT 1), '{"material":"Aluminum","quantity":1000}'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'EcoTech' LIMIT 1),   '{"material":"Solar Panel","quantity":200}'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'ReuseWorks' LIMIT 1),'{"material":"Glass Bottles","quantity":1500}'),
  (gen_random_uuid(), (SELECT id FROM public.companies WHERE name = 'ZeroWaste' LIMIT 1), '{"material":"Compostable Bags","quantity":800}')
ON CONFLICT DO NOTHING;

-- Matches (5 rows)
INSERT INTO public.matches (id, material_id, requirement_id, score) VALUES
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'PLA Filament' LIMIT 1),   (SELECT id FROM public.buyer_requirements WHERE criteria::text LIKE '%"material":"PLA"%' LIMIT 1), 95),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Aluminum Sheet' LIMIT 1), (SELECT id FROM public.buyer_requirements WHERE criteria::text LIKE '%"material":"Aluminum"%' LIMIT 1), 92),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Solar Panel Cells' LIMIT 1),    (SELECT id FROM public.buyer_requirements WHERE criteria::text LIKE '%"material":"Solar Panel"%' LIMIT 1), 88),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Glass Bottles' LIMIT 1), (SELECT id FROM public.buyer_requirements WHERE criteria::text LIKE '%"material":"Glass Bottles"%' LIMIT 1), 90),
  (gen_random_uuid(), (SELECT id FROM public.materials WHERE name = 'Compostable Bags' LIMIT 1),(SELECT id FROM public.buyer_requirements WHERE criteria::text LIKE '%"material":"Compostable Bags"%' LIMIT 1), 93)
ON CONFLICT DO NOTHING;

-- Bids (5 rows)
INSERT INTO public.bids (id, match_id, bidder_company_id, amount, status) VALUES
  (gen_random_uuid(), (SELECT id FROM public.matches WHERE score = 95 LIMIT 1), (SELECT id FROM public.companies WHERE name = 'GreenLoop' LIMIT 1), 1000, 'pending'),
  (gen_random_uuid(), (SELECT id FROM public.matches WHERE score = 92 LIMIT 1), (SELECT id FROM public.companies WHERE name = 'EcoTech' LIMIT 1),   1500, 'pending'),
  (gen_random_uuid(), (SELECT id FROM public.matches WHERE score = 88 LIMIT 1), (SELECT id FROM public.companies WHERE name = 'ReuseWorks' LIMIT 1),2000, 'pending'),
  (gen_random_uuid(), (SELECT id FROM public.matches WHERE score = 90 LIMIT 1), (SELECT id FROM public.companies WHERE name = 'ZeroWaste' LIMIT 1), 1200, 'pending'),
  (gen_random_uuid(), (SELECT id FROM public.matches WHERE score = 93 LIMIT 1), (SELECT id FROM public.companies WHERE name = 'Acme Corp' LIMIT 1),   1100, 'pending')
ON CONFLICT DO NOTHING;

-- Orders (5 rows)
INSERT INTO public.orders (id, bid_id, status, total_amount) VALUES
  (gen_random_uuid(), (SELECT id FROM public.bids WHERE amount = 1000 LIMIT 1), 'created', 1000),
  (gen_random_uuid(), (SELECT id FROM public.bids WHERE amount = 1500 LIMIT 1), 'created', 1500),
  (gen_random_uuid(), (SELECT id FROM public.bids WHERE amount = 2000 LIMIT 1), 'created', 2000),
  (gen_random_uuid(), (SELECT id FROM public.bids WHERE amount = 1200 LIMIT 1), 'created', 1200),
  (gen_random_uuid(), (SELECT id FROM public.bids WHERE amount = 1100 LIMIT 1), 'created', 1100)
ON CONFLICT DO NOTHING;

-- Payments (5 rows)
INSERT INTO public.payments (id, order_id, payment_provider, payment_status, amount) VALUES
  (gen_random_uuid(), (SELECT id FROM public.orders WHERE total_amount = 1000 LIMIT 1), 'stripe', 'succeeded', 1000),
  (gen_random_uuid(), (SELECT id FROM public.orders WHERE total_amount = 1500 LIMIT 1), 'stripe', 'succeeded', 1500),
  (gen_random_uuid(), (SELECT id FROM public.orders WHERE total_amount = 2000 LIMIT 1), 'stripe', 'succeeded', 2000),
  (gen_random_uuid(), (SELECT id FROM public.orders WHERE total_amount = 1200 LIMIT 1), 'stripe', 'succeeded', 1200),
  (gen_random_uuid(), (SELECT id FROM public.orders WHERE total_amount = 1100 LIMIT 1), 'stripe', 'succeeded', 1100)
ON CONFLICT DO NOTHING;
