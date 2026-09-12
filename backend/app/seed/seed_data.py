import random
import json
from datetime import datetime, timedelta
from app.models.database import (
    Base, engine, SessionLocal, User, Company, CompanyProfile,
    MaterialListing, MaterialPassport, MaterialRequirement,
    Order, EscrowPayment, LogisticsShipment, QualityInspection,
    Contract, ImpactRecord, Notification
)
from app.core.security import get_password_hash

CITIES = [
    {"city": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lng": 72.5714},
    {"city": "Vadodara", "state": "Gujarat", "lat": 22.3072, "lng": 73.1812},
    {"city": "Surat", "state": "Gujarat", "lat": 21.1702, "lng": 72.8311},
    {"city": "Rajkot", "state": "Gujarat", "lat": 22.3039, "lng": 70.8022},
    {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777},
    {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
    {"city": "Delhi", "state": "Delhi", "lat": 28.6139, "lng": 77.2090},
    {"city": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946},
    {"city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867},
]

COMPANY_DATA = [
    # Demo Company 1 (Seller)
    {"name": "ABC Manufacturing Pvt Ltd", "type": "Manufacturer", "industry": "FMCG", "city": "Ahmedabad", "trust": 96.0, "email": "abc@reloop.in"},
    # Demo Company 2 (Buyer)
    {"name": "GreenPack Industries Ltd", "type": "Packaging Supplier", "industry": "Manufacturing", "city": "Vadodara", "trust": 94.0, "email": "buyer@greenpack.com"},
    # Demo Company 3 (Recycler)
    {"name": "Gujarat Circular Polymers & Pulp", "type": "Recycler", "industry": "Manufacturing", "city": "Surat", "trust": 92.0, "email": "contact@gujaratpolymers.in"},
    # Demo Logistics Provider
    {"name": "RELOOP GreenLogistics Fleet", "type": "Logistics Provider", "industry": "Automotive", "city": "Ahmedabad", "trust": 98.0, "email": "dispatch@relooplogistics.in"},
    
    # 26 other industrial enterprises
    {"name": "Navrang Corrugators & Paper Works", "type": "Packaging Supplier", "industry": "Manufacturing", "city": "Ahmedabad", "trust": 91.0, "email": "navrang@corrugators.in"},
    {"name": "Maruti Precision Auto Components", "type": "Manufacturer", "industry": "Automotive", "city": "Ahmedabad", "trust": 95.0, "email": "procurement@marutiauto.in"},
    {"name": "Zydus Packaging Secondary Ops", "type": "Manufacturer", "industry": "Pharmaceuticals", "city": "Ahmedabad", "trust": 97.0, "email": "materials@zyduspack.in"},
    {"name": "Amul Cold Chain & Secondary Pack", "type": "Manufacturer", "industry": "Food & Beverage", "city": "Vadodara", "trust": 98.0, "email": "circulareco@amuldairy.in"},
    {"name": "Vadodara Heavy Pallet Logistics", "type": "Packaging Supplier", "industry": "E-commerce", "city": "Vadodara", "trust": 89.0, "email": "ops@vadodarapallets.in"},
    {"name": "Reliance Polymer Secondary Exchange", "type": "Recycler", "industry": "Manufacturing", "city": "Surat", "trust": 96.0, "email": "sec.resins@rilcircular.in"},
    {"name": "Surat Textile Packaging Consortium", "type": "Retailer", "industry": "Retail", "city": "Surat", "trust": 90.0, "email": "textilepack@suratcon.in"},
    {"name": "Saurashtra Agro Boxes & Crates", "type": "Manufacturer", "industry": "Food & Beverage", "city": "Rajkot", "trust": 93.0, "email": "supply@saurashtraagro.in"},
    {"name": "Rajkot Foundry Pallet Reclaimers", "type": "Recycler", "industry": "Manufacturing", "city": "Rajkot", "trust": 88.0, "email": "info@rajkotfoundryreclaim.in"},
    {"name": "Tata Consumer Logistics Hub", "type": "Retailer", "industry": "FMCG", "city": "Mumbai", "trust": 97.0, "email": "sustainability@tataconsumer.in"},
    {"name": "Bhiwandi E-Commerce Packaging Warehouse", "type": "Retailer", "industry": "E-commerce", "city": "Mumbai", "trust": 91.0, "email": "dock@bhiwandilogix.in"},
    {"name": "Godrej Agrovet Recycled Pack", "type": "Manufacturer", "industry": "Food & Beverage", "city": "Mumbai", "trust": 95.0, "email": "eco@godrejagrovet.in"},
    {"name": "Mahindra Industrial Packaging Division", "type": "Manufacturer", "industry": "Automotive", "city": "Pune", "trust": 96.0, "email": "circulareconomy@mahindra.in"},
    {"name": "Chakan Auto-Crate & Pallet Exchange", "type": "Packaging Supplier", "industry": "Automotive", "city": "Pune", "trust": 93.0, "email": "admin@chakancrates.in"},
    {"name": "Pune Green Poly Solutions", "type": "Recycler", "industry": "Manufacturing", "city": "Pune", "trust": 90.0, "email": "pune@greenpoly.in"},
    {"name": "ITC Paperboards Circular Division", "type": "Manufacturer", "industry": "FMCG", "city": "Delhi", "trust": 98.0, "email": "sourcing@itcpaper.in"},
    {"name": "Delhi NCR E-commerce Surplus Hub", "type": "Retailer", "industry": "E-commerce", "city": "Delhi", "trust": 92.0, "email": "delhincr@packexchange.in"},
    {"name": "Okhla Industrial Recyclers Co", "type": "Recycler", "industry": "Manufacturing", "city": "Delhi", "trust": 89.0, "email": "okhla@recyclers.org"},
    {"name": "Flipkart Sustainable Fulfilment Hub", "type": "Retailer", "industry": "E-commerce", "city": "Bengaluru", "trust": 97.0, "email": "packrecycle@flipkart.in"},
    {"name": "Peenya Plastic Reclaimers Association", "type": "Recycler", "industry": "Manufacturing", "city": "Bengaluru", "trust": 91.0, "email": "peenya@plasticreclaim.in"},
    {"name": "Biocon Pharma Secondary Packaging", "type": "Manufacturer", "industry": "Pharmaceuticals", "city": "Bengaluru", "trust": 96.0, "email": "biopack@biocon.in"},
    {"name": "Dr. Reddy's Clean Packaging Stream", "type": "Manufacturer", "industry": "Pharmaceuticals", "city": "Hyderabad", "trust": 97.0, "email": "circulardoc@drreddys.in"},
    {"name": "Hyderabad Corrugated Board Mill", "type": "Packaging Supplier", "industry": "Manufacturing", "city": "Hyderabad", "trust": 93.0, "email": "hyderabad@corrugated.in"},
    {"name": "Deccan Eco-Polymer Recyclers", "type": "Recycler", "industry": "Manufacturing", "city": "Hyderabad", "trust": 90.0, "email": "deccan@ecopolymer.in"},
    {"name": "Gujarat Bulk Bag & FIBC Reconditioners", "type": "Packaging Supplier", "industry": "Manufacturing", "city": "Ahmedabad", "trust": 94.0, "email": "fibc@gujaratbag.in"},
    {"name": "Western India Paper Recycling Syndicate", "type": "Recycler", "industry": "Manufacturing", "city": "Vadodara", "trust": 95.0, "email": "westindia@papersyndicate.in"}
]

MATERIAL_TEMPLATES = [
    # Cardboard
    {"name": "Clean Corrugated Cardboard Boxes (OCC 11)", "cat": "Cardboard", "sub": "Corrugated Boxes", "price": 14.5, "unit": "kg", "grade": "OCC Grade 11", "cond": "Good", "contam": "Low", "img": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"},
    {"name": "Baled Double-Wall Shipping Cartons", "cat": "Cardboard", "sub": "Heavy Corrugated Cartons", "price": 16.0, "unit": "kg", "grade": "Heavy Duty 5-Ply", "cond": "Excellent", "contam": "None", "img": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80"},
    {"name": "Post-Retail Flat Folded Cartons", "cat": "Cardboard", "sub": "Single Wall Boxes", "price": 12.0, "unit": "kg", "grade": "OCC Grade 8", "cond": "Reusable", "contam": "Low", "img": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&q=80"},
    
    # Plastic
    {"name": "Clean Baled HDPE Industrial Drums & Carboys", "cat": "Plastic", "sub": "Rigid HDPE Polymer", "price": 42.0, "unit": "kg", "grade": "Polymer Regrind Grade A", "cond": "Excellent", "contam": "None", "img": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=80"},
    {"name": "PP Returnable Folding Crates (50L)", "cat": "Crates", "sub": "Polypropylene Crates", "price": 180.0, "unit": "units", "grade": "Virgin-Equivalent PP", "cond": "Reusable", "contam": "None", "img": "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80"},
    {"name": "Post-Industrial LDPE Stretch Wrap (98/2)", "cat": "Packaging Film", "sub": "LDPE Film Bales", "price": 36.5, "unit": "kg", "grade": "Film Grade 98/2", "cond": "Good", "contam": "Low", "img": "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&q=80"},
    
    # Pallets & Wood
    {"name": "Standard Euro Wooden Pallets (1200x800mm)", "cat": "Pallets", "sub": "EUR-EPAL Wooden Pallets", "price": 320.0, "unit": "units", "grade": "EPAL Certified Reusable", "cond": "Good", "contam": "None", "img": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80"},
    {"name": "Heavy Duty 4-Way Pine Pallets (1200x1000mm)", "cat": "Pallets", "sub": "4-Way Entry Pallets", "price": 380.0, "unit": "units", "grade": "Heat Treated ISPM-15", "cond": "Excellent", "contam": "None", "img": "https://images.unsplash.com/photo-1586528116493-da00570b20cf?w=800&q=80"},
    {"name": "Disassembled Wood Slat Packaging Timber", "cat": "Wood", "sub": "Packaging Timber", "price": 9.5, "unit": "kg", "grade": "Seasoned Pine Wood", "cond": "Reusable", "contam": "Low", "img": "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=800&q=80"},
    
    # Paper
    {"name": "Unprinted Kraft Paper Side-Rolls & Offcuts", "cat": "Paper", "sub": "Virgin Kraft Offcuts", "price": 24.0, "unit": "kg", "grade": "180 GSM High Burst", "cond": "Excellent", "contam": "None", "img": "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80"},
    {"name": "Shredded Protective Cushioning Paper", "cat": "Paper", "sub": "Protective Packing Fill", "price": 11.5, "unit": "kg", "grade": "Clean Kraft Shred", "cond": "Reusable", "contam": "None", "img": "https://images.unsplash.com/photo-1603484477859-abe6a73f9366?w=800&q=80"},
    
    # Reusable Boxes
    {"name": "Heavy Duty PP Fluted Sleeve Packs", "cat": "Reusable Boxes", "sub": "Collapsible Bulk Sleeves", "price": 650.0, "unit": "units", "grade": "Multi-trip Industrial", "cond": "Excellent", "contam": "None", "img": "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80"}
]

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("[SEED] Seeding RELOOP database with realistic industrial datasets...")

    city_lookup = {c["city"]: c for c in CITIES}
    companies = []
    
    # 1. Create Companies & Users
    for idx, cdata in enumerate(COMPANY_DATA):
        city_info = city_lookup.get(cdata["city"], CITIES[0])
        comp = Company(
            name=cdata["name"],
            company_type=cdata["type"],
            industry=cdata["industry"],
            company_size="Enterprise (1000+)" if idx < 5 else "Medium (50-250)",
            location=f"{city_info['city']}, {city_info['state']}",
            city=city_info["city"],
            state=city_info["state"],
            latitude=city_info["lat"] + random.uniform(-0.04, 0.04),
            longitude=city_info["lng"] + random.uniform(-0.04, 0.04),
            contact_person=f"Manager {cdata['name'].split()[0]}",
            email=cdata["email"],
            phone=f"+91 9825{random.randint(100000, 999999)}",
            is_verified=True,
            verification_tier="DEMO_VERIFIED",
            trust_score=cdata["trust"]
        )
        db.add(comp)
        db.flush()

        # Company Profile Stats
        prof = CompanyProfile(
            company_id=comp.id,
            bio=f"Leading certified {cdata['industry']} facility committed to circular zero-waste packaging operations in {city_info['city']}.",
            total_materials_sold_kg=float(random.randint(15000, 120000)),
            total_materials_bought_kg=float(random.randint(20000, 180000)),
            total_waste_diverted_kg=float(random.randint(35000, 300000)),
            total_co2_saved_kg=float(random.randint(28000, 260000)),
            completed_transactions_count=random.randint(12, 48),
            on_time_delivery_rate=float(random.randint(94, 99)),
            material_acceptance_rate=float(random.randint(93, 99)),
            dispute_count=random.randint(0, 2)
        )
        db.add(prof)

        # User Account
        user = User(
            email=cdata["email"],
            hashed_password=get_password_hash("password123"),
            full_name=f"{cdata['name'].split()[0]} Executive",
            role="ADMIN" if idx == 0 else ("LOGISTICS" if "Logistics" in cdata["type"] else "SELLER"),
            company_id=comp.id
        )
        db.add(user)
        companies.append(comp)

    db.flush()
    print(f"[OK] Created {len(companies)} verified industrial companies and user accounts.")

    # 2. Create 100+ Material Listings & Passports
    materials = []
    mat_code_counter = 1001
    
    for i in range(105):
        seller = random.choice(companies)
        tmpl = random.choice(MATERIAL_TEMPLATES)
        city_info = city_lookup.get(seller.city, CITIES[0])
        
        qty = float(random.choice([1500, 3000, 5000, 8000, 12000, 25000]))
        unit = tmpl["unit"]
        qty_kg = qty if unit == "kg" else qty * (25.0 if tmpl["cat"] == "Pallets" else 1.8)
        
        code = f"MAT-{mat_code_counter}"
        mat_code_counter += 1

        circ_potential = float(random.randint(86, 98))

        mat = MaterialListing(
            code=code,
            name=f"{tmpl['name']} - Lot #{random.randint(100, 999)}",
            category=tmpl["cat"],
            subtype=tmpl["sub"],
            quantity=qty,
            unit=unit,
            quantity_kg=qty_kg,
            grade=tmpl["grade"],
            condition=tmpl["cond"],
            contamination_level=tmpl["contam"],
            dimensions="1200 x 800 mm standard" if "Pallet" in tmpl["name"] else "Variable bailing size",
            color="Natural Brown" if "Cardboard" in tmpl["cat"] or "Kraft" in tmpl["name"] else "Industrial Neutral",
            packaging_type="Baled / Strapped on Pallet",
            description=f"Batch generated from dry indoor distribution operations at {seller.name}. Fully inspected, free from hazardous contaminants, stored in dry warehouse.",
            price_per_unit=tmpl["price"],
            min_order_quantity=min(500.0, qty),
            available_from=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
            location_city=seller.city,
            latitude=seller.latitude + random.uniform(-0.02, 0.02),
            longitude=seller.longitude + random.uniform(-0.02, 0.02),
            delivery_options="Seller arranged freight or Buyer ex-works pickup",
            status="AVAILABLE",
            circularity_potential=circ_potential,
            primary_image_url=tmpl["img"],
            seller_id=seller.id
        )
        db.add(mat)
        db.flush()

        # Digital Material Passport
        carbon_factor = 0.95 if tmpl["cat"] == "Cardboard" else (2.45 if tmpl["cat"] == "Plastic" else 0.40)
        passport = MaterialPassport(
            material_id=mat.id,
            passport_code=f"DP-{code}",
            qr_code_data=json.dumps({
                "passport_id": f"DP-{code}",
                "material": tmpl["name"],
                "seller": seller.name,
                "city": seller.city,
                "grade": tmpl["grade"],
                "purity": f"{random.randint(94, 99)}%",
                "circularity_index": circ_potential,
                "verified": True
            }),
            composition_details={
                "primary_fiber_or_resin": tmpl["sub"],
                "purity_percentage": random.randint(94, 99),
                "moisture_content_pct": random.uniform(5.0, 9.5),
                "recycled_content_history": f"{random.randint(2, 6)} previous closed-loop cycles"
            },
            lifecycle_stage="Post-Industrial Clean Packaging Surplus",
            purity_percentage=float(random.randint(94, 99)),
            reusability_rating="HIGH" if circ_potential > 88 else "MEDIUM",
            embodied_carbon_saved_per_kg=carbon_factor,
            provenance_history=[
                {"timestamp": str(datetime.utcnow() - timedelta(days=12)), "event": "Batch generated at manufacturing line"},
                {"timestamp": str(datetime.utcnow() - timedelta(days=2)), "event": "Quality QA inspection & baling certified"},
                {"timestamp": str(datetime.utcnow()), "event": "RELOOP Digital Passport minted"}
            ],
            verification_hash=f"SHA256-{hex(random.getrandbits(128))[2:].upper()}"
        )
        db.add(passport)
        materials.append(mat)

    db.flush()
    print(f"[OK] Created {len(materials)} material listings with Digital Material Passports.")

    # 3. Create 50+ Buyer Requirements (Reverse Marketplace)
    requirements = []
    for i in range(55):
        buyer = random.choice(companies)
        tmpl = random.choice(MATERIAL_TEMPLATES)
        req_qty = float(random.choice([2000, 4000, 7500, 10000, 20000]))
        target_price = round(tmpl["price"] * random.uniform(0.95, 1.15), 1)

        req = MaterialRequirement(
            title=f"Seeking {tmpl['name']} for regular procurement",
            category=tmpl["cat"],
            subtype=tmpl["sub"],
            required_quantity_kg=req_qty,
            grade=tmpl["grade"],
            desired_condition=tmpl["cond"],
            max_acceptable_distance_km=float(random.choice([100, 150, 250, 400])),
            target_price_per_kg=target_price,
            destination_city=buyer.city,
            latitude=buyer.latitude,
            longitude=buyer.longitude,
            required_by_date=datetime.utcnow() + timedelta(days=random.randint(7, 30)),
            status="ACTIVE",
            buyer_id=buyer.id
        )
        db.add(req)
        requirements.append(req)

    db.flush()
    print(f"[OK] Created {len(requirements)} buyer procurement requirements.")

    # 4. Create Historical Contracts, Orders, Simulated Escrow, Logistics, and Inspections
    demo_seller = companies[0] # ABC Manufacturing
    demo_buyer = companies[1]  # GreenPack Industries
    demo_logistics = companies[3]

    order_statuses = [
        "COMPLETED", "COMPLETED", "COMPLETED", "IN_TRANSIT", "ESCROWED", "ORDER_CONFIRMED"
    ]

    for idx, status in enumerate(order_statuses):
        mat = materials[idx]
        qty = 5000.0
        price = mat.price_per_unit
        subtotal = qty * price
        logistics_cost = 4500.0
        total = subtotal + logistics_cost

        contract_num = f"CTR-2026-{1000 + idx}"
        contract = Contract(
            contract_number=contract_num,
            title=f"Circular Supply Agreement: {mat.name}",
            seller_id=demo_seller.id,
            buyer_id=demo_buyer.id,
            material_name=mat.name,
            quantity_kg=qty,
            unit_price=price,
            total_amount=total,
            delivery_terms="Door-to-door delivery via RELOOP GreenLogistics with 48-hr inspection SLA",
            payment_terms="100% Mock Escrow deposited on order confirmation; released upon buyer inspection QA sign-off",
            inspection_terms="Quality verified against OCC Grade specifications. Permissible moisture < 10%, max contamination < 2%",
            dispute_terms="Rapid automated mediation via RELOOP resolution hub within 3 business days",
            contract_duration="30 Days Transactional",
            status="ACTIVE" if status != "COMPLETED" else "COMPLETED",
            is_ai_draft=False,
            seller_signed=True,
            buyer_signed=True,
            created_at=datetime.utcnow() - timedelta(days=30 - idx*5)
        )
        db.add(contract)
        db.flush()

        order_num = f"ORD-2026-{8800 + idx}"
        order = Order(
            order_number=order_num,
            material_id=mat.id,
            seller_id=demo_seller.id,
            buyer_id=demo_buyer.id,
            contract_id=contract.id,
            quantity=qty,
            unit="kg",
            unit_price=price,
            subtotal_amount=subtotal,
            logistics_cost=logistics_cost,
            total_delivered_amount=total,
            status=status,
            created_at=datetime.utcnow() - timedelta(days=30 - idx*5)
        )
        db.add(order)
        db.flush()

        # Simulated Escrow
        escrow = EscrowPayment(
            order_id=order.id,
            amount=total,
            currency="INR",
            status="RELEASED" if status == "COMPLETED" else "ESCROWED",
            escrow_transaction_hash=f"SIM-ESCROW-{hex(random.getrandbits(64))[2:].upper()}",
            escrowed_at=order.created_at,
            released_at=datetime.utcnow() if status == "COMPLETED" else None
        )
        db.add(escrow)

        # Logistics Shipment
        dist_km = 82.0
        logistics = LogisticsShipment(
            order_id=order.id,
            provider_name=demo_logistics.name,
            vehicle_type="14-ft Electric / Bio-CNG Truck",
            vehicle_capacity_kg=7500.0,
            pickup_city="Ahmedabad",
            delivery_city="Vadodara",
            pickup_lat=23.0225,
            pickup_lng=72.5714,
            delivery_lat=22.3072,
            delivery_lng=73.1812,
            distance_km=dist_km,
            estimated_travel_hours=2.2,
            transport_cost=logistics_cost,
            estimated_transport_emissions_kg=round(dist_km * (qty/1000.0) * 0.125, 1),
            status="DELIVERED" if status == "COMPLETED" else ("IN_TRANSIT" if status == "IN_TRANSIT" else "SCHEDULED"),
            tracking_step=4 if status == "COMPLETED" else (3 if status == "IN_TRANSIT" else 1),
            waypoints=[
                {"name": "Ahmedabad Facility (ABC Mfg)", "lat": 23.0225, "lng": 72.5714, "status": "COMPLETED"},
                {"name": "Nadiad Expressway Junction", "lat": 22.6916, "lng": 72.8634, "status": "COMPLETED" if status in ["COMPLETED", "IN_TRANSIT"] else "PENDING"},
                {"name": "Vadodara Plant (GreenPack)", "lat": 22.3072, "lng": 73.1812, "status": "COMPLETED" if status == "COMPLETED" else "PENDING"}
            ]
        )
        db.add(logistics)

        # Inspection & Impact if Completed
        if status == "COMPLETED":
            insp = QualityInspection(
                order_id=order.id,
                expected_quantity=qty,
                received_quantity=qty,
                expected_condition=mat.condition,
                received_condition=mat.condition,
                expected_contamination=mat.contamination_level,
                observed_contamination=mat.contamination_level,
                result="PASSED",
                inspection_notes="Material verified: high fiber integrity, clean bales conforming to OCC Grade 11 specs. Payment release authorized.",
                inspector_name="R. Mehta (Senior QA Manager)"
            )
            db.add(insp)

            carbon_factor = 0.95 if mat.category == "Cardboard" else 2.45
            gross_saved = qty * carbon_factor
            net_saved = gross_saved - logistics.estimated_transport_emissions_kg

            impact = ImpactRecord(
                company_id=demo_seller.id,
                order_id=order.id,
                material_category=mat.category,
                quantity_kg=qty,
                virgin_material_avoided_kg=qty,
                virgin_carbon_factor=carbon_factor,
                gross_carbon_avoided_kg=gross_saved,
                transport_emissions_kg=logistics.estimated_transport_emissions_kg,
                net_carbon_saved_kg=net_saved,
                landfill_space_saved_m3=round(qty * 0.0035, 2)
            )
            db.add(impact)

    # 5. Create realistic Notifications
    notifs = [
        {"title": "New 94% Match Found", "msg": "GreenPack Industries posted a requirement matching your 5,000 kg Corrugated Cardboard lot.", "type": "MATCH"},
        {"title": "Escrow Payment Confirmed", "msg": "Mock Escrow of ₹77,000 for Order #ORD-2026-8803 is secured.", "type": "ESCROW"},
        {"title": "Truck In-Transit", "msg": "Shipment #LOG-8803 has crossed Nadiad Junction on route to Vadodara.", "type": "SHIPMENT"},
        {"title": "Inspection Approved", "msg": "Buyer passed QA inspection for Order #ORD-2026-8800. ₹77,000 released.", "type": "INSPECTION"}
    ]
    for n in notifs:
        db.add(Notification(
            company_id=demo_seller.id,
            title=n["title"],
            message=n["msg"],
            type=n["type"],
            is_read=False
        ))

    db.commit()
    db.close()
    print("[SUCCESS] Successfully seeded database with all verified companies, materials, passports, and lifecycle transactions!")

if __name__ == "__main__":
    seed_database()
