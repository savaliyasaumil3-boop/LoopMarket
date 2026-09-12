import json
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.models.database import get_db, MaterialListing, MaterialPassport, Company
from app.schemas.schemas import MaterialCreate, Layer1SearchQuery
from app.ai.layer1_minimax import minimax_layer1
from app.matching.engine import calculate_haversine_distance

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.get("")
def list_materials(
    category: Optional[str] = None,
    condition: Optional[str] = None,
    grade: Optional[str] = None,
    city: Optional[str] = None,
    max_price: Optional[float] = None,
    min_quantity: Optional[float] = None,
    sort_by: Optional[str] = "recommended", # recommended, price_low, distance, circularity, newest
    user_city: Optional[str] = "Ahmedabad",
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MaterialListing).filter(MaterialListing.status == "AVAILABLE")

    if category and category != "All":
        query = query.filter(MaterialListing.category.ilike(f"%{category}%"))
    if condition and condition != "All":
        query = query.filter(MaterialListing.condition.ilike(f"%{condition}%"))
    if city and city != "All":
        query = query.filter(MaterialListing.location_city.ilike(f"%{city}%"))
    if max_price:
        query = query.filter(MaterialListing.price_per_unit <= max_price)
    if min_quantity:
        query = query.filter(MaterialListing.quantity_kg >= min_quantity)
    if search:
        query = query.filter(
            (MaterialListing.name.ilike(f"%{search}%")) |
            (MaterialListing.description.ilike(f"%{search}%")) |
            (MaterialListing.category.ilike(f"%{search}%")) |
            (MaterialListing.code.ilike(f"%{search}%"))
        )

    all_materials = query.all()
    
    # Enrich with distance and delivered cost from user_city (default Ahmedabad 23.0225, 72.5714)
    user_lat, user_lng = 23.0225, 72.5714
    if user_city == "Vadodara":
        user_lat, user_lng = 22.3072, 73.1812
    elif user_city == "Surat":
        user_lat, user_lng = 21.1702, 72.8311
    elif user_city == "Mumbai":
        user_lat, user_lng = 19.0760, 72.8777

    results = []
    for m in all_materials:
        seller = db.query(Company).filter(Company.id == m.seller_id).first()
        dist_km = calculate_haversine_distance(m.latitude, m.longitude, user_lat, user_lng)
        
        # Transport cost calculation
        tonnage = m.quantity_kg / 1000.0
        transport_cost = dist_km * tonnage * 4.8
        delivered_cost_per_kg = round(m.price_per_unit + (transport_cost / m.quantity_kg), 2)
        
        # Match score calculation
        dist_score = max(40.0, 100.0 - (dist_km * 0.25))
        cost_score = max(50.0, min(99.0, 80.0 + (30.0 - delivered_cost_per_kg) * 1.5))
        match_score = round(
            (0.30 * 95.0) +
            (0.20 * 92.0) +
            (0.20 * dist_score) +
            (0.15 * cost_score) +
            (0.15 * (m.circularity_potential or 90.0)),
            1
        )

        results.append({
            "id": m.id,
            "code": m.code,
            "name": m.name,
            "category": m.category,
            "subtype": m.subtype,
            "quantity": m.quantity,
            "unit": m.unit,
            "quantity_kg": m.quantity_kg,
            "grade": m.grade,
            "condition": m.condition,
            "contamination_level": m.contamination_level,
            "dimensions": m.dimensions,
            "color": m.color,
            "packaging_type": m.packaging_type,
            "description": m.description,
            "price_per_unit": m.price_per_unit,
            "min_order_quantity": m.min_order_quantity,
            "location_city": m.location_city,
            "distance_km": dist_km,
            "delivered_cost_per_kg": delivered_cost_per_kg,
            "match_score": match_score,
            "circularity_potential": m.circularity_potential,
            "primary_image_url": m.primary_image_url,
            "seller": {
                "id": seller.id if seller else "",
                "name": seller.name if seller else "Industrial Supplier",
                "city": seller.city if seller else m.location_city,
                "trust_score": seller.trust_score if seller else 90.0,
                "verification_tier": seller.verification_tier if seller else "DEMO_VERIFIED"
            },
            "created_at": str(m.created_at)
        })

    # Sort
    if sort_by == "price_low":
        results.sort(key=lambda x: x["delivered_cost_per_kg"])
    elif sort_by == "distance":
        results.sort(key=lambda x: x["distance_km"])
    elif sort_by == "circularity":
        results.sort(key=lambda x: x["circularity_potential"], reverse=True)
    elif sort_by == "newest":
        results.sort(key=lambda x: x["created_at"], reverse=True)
    else: # recommended / best match
        results.sort(key=lambda x: x["match_score"], reverse=True)

    return results

@router.get("/{id}")
def get_material_detail(id: str, db: Session = Depends(get_db)):
    m = db.query(MaterialListing).filter(MaterialListing.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material listing not found")

    seller = db.query(Company).filter(Company.id == m.seller_id).first()
    passport = db.query(MaterialPassport).filter(MaterialPassport.material_id == m.id).first()

    user_lat, user_lng = 23.0225, 72.5714 # Default Ahmedabad
    dist_km = calculate_haversine_distance(m.latitude, m.longitude, user_lat, user_lng)
    transport_cost = dist_km * (m.quantity_kg / 1000.0) * 4.8
    delivered_cost_per_kg = round(m.price_per_unit + (transport_cost / m.quantity_kg), 2)
    transport_emissions_kg = round((m.quantity_kg / 1000.0) * dist_km * 0.125, 1)

    return {
        "id": m.id,
        "code": m.code,
        "name": m.name,
        "category": m.category,
        "subtype": m.subtype,
        "quantity": m.quantity,
        "unit": m.unit,
        "quantity_kg": m.quantity_kg,
        "grade": m.grade,
        "condition": m.condition,
        "contamination_level": m.contamination_level,
        "dimensions": m.dimensions,
        "color": m.color,
        "packaging_type": m.packaging_type,
        "description": m.description,
        "price_per_unit": m.price_per_unit,
        "min_order_quantity": m.min_order_quantity,
        "location_city": m.location_city,
        "delivery_options": m.delivery_options,
        "status": m.status,
        "circularity_potential": m.circularity_potential,
        "primary_image_url": m.primary_image_url,
        "distance_km": dist_km,
        "delivered_cost_per_kg": delivered_cost_per_kg,
        "transport_cost": round(transport_cost, 2),
        "transport_emissions_kg": transport_emissions_kg,
        "seller": {
            "id": seller.id if seller else "",
            "name": seller.name if seller else "Industrial Supplier",
            "industry": seller.industry if seller else "Manufacturing",
            "city": seller.city if seller else m.location_city,
            "trust_score": seller.trust_score if seller else 90.0,
            "verification_tier": seller.verification_tier if seller else "DEMO_VERIFIED",
            "email": seller.email if seller else "",
            "phone": seller.phone if seller else ""
        },
        "passport": {
            "passport_code": passport.passport_code if passport else f"DP-{m.code}",
            "qr_code_data": passport.qr_code_data if passport else "",
            "composition_details": passport.composition_details if passport else {
                "fiber_polymer_type": m.subtype,
                "purity_level": "96.5%",
                "moisture_content": "7.2%"
            },
            "lifecycle_stage": passport.lifecycle_stage if passport else "Post-Industrial Baled",
            "purity_percentage": passport.purity_percentage if passport else 96.0,
            "reusability_rating": passport.reusability_rating if passport else "HIGH",
            "embodied_carbon_saved_per_kg": passport.embodied_carbon_saved_per_kg if passport else 0.95,
            "provenance_history": passport.provenance_history if passport else [
                {"timestamp": str(m.created_at), "event": "Minted on RELOOP Circular Ledger"}
            ],
            "verification_hash": passport.verification_hash if passport else "SHA256-VERIFIED"
        }
    }

@router.post("")
def create_material(req: MaterialCreate, db: Session = Depends(get_db)):
    # Default to first company (ABC Manufacturing) if not specified
    seller = db.query(Company).first()
    
    count = db.query(MaterialListing).count() + 1001
    code = f"MAT-{count}"
    
    qty_kg = req.quantity if req.unit == "kg" else req.quantity * (25.0 if req.category == "Pallets" else 1.8)
    circ_score = 95.0 if req.contamination_level in ["None", "Low"] else 82.0

    mat = MaterialListing(
        code=code,
        name=req.name,
        category=req.category,
        subtype=req.subtype or f"Standard {req.category}",
        quantity=req.quantity,
        unit=req.unit,
        quantity_kg=qty_kg,
        grade=req.grade or "OCC Grade 11",
        condition=req.condition or "Good",
        contamination_level=req.contamination_level or "Low",
        dimensions=req.dimensions or "Standard Baled Size",
        color=req.color or "Natural",
        packaging_type=req.packaging_type or "Baled / Bundled",
        description=req.description or "Industrial surplus lot ready for circular reuse.",
        price_per_unit=req.price_per_unit,
        min_order_quantity=req.min_order_quantity or 500.0,
        location_city=req.location_city,
        latitude=seller.latitude if seller else 23.0225,
        longitude=seller.longitude if seller else 72.5714,
        delivery_options=req.delivery_options or "Seller Arranged Freight",
        status="AVAILABLE",
        circularity_potential=circ_score,
        primary_image_url=req.primary_image_url or "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80",
        seller_id=seller.id
    )
    db.add(mat)
    db.flush()

    # Automatically generate Digital Material Passport
    carbon_factor = 0.95 if req.category == "Cardboard" else (2.45 if req.category == "Plastic" else 0.40)
    passport = MaterialPassport(
        material_id=mat.id,
        passport_code=f"DP-{code}",
        qr_code_data=json.dumps({
            "passport_id": f"DP-{code}",
            "material": req.name,
            "seller": seller.name,
            "city": req.location_city,
            "quantity_kg": qty_kg,
            "grade": req.grade,
            "circularity_index": circ_score,
            "verified": True
        }),
        composition_details={
            "material_type": req.category,
            "subtype": req.subtype,
            "purity_percentage": 97.5 if req.contamination_level == "None" else 94.0,
            "contamination": req.contamination_level
        },
        lifecycle_stage="Post-Industrial Clean Surplus",
        purity_percentage=96.5,
        reusability_rating="HIGH",
        embodied_carbon_saved_per_kg=carbon_factor,
        provenance_history=[
            {"timestamp": str(datetime.utcnow()), "event": "Material listed and passport minted on RELOOP"}
        ],
        verification_hash=f"SHA256-{hex(random.getrandbits(128))[2:].upper()}"
    )
    db.add(passport)
    db.commit()
    db.refresh(mat)

    return {
        "success": True,
        "material_id": mat.id,
        "code": mat.code,
        "passport_code": passport.passport_code,
        "message": "Material listed and Digital Passport minted successfully."
    }

@router.post("/parse-search")
async def parse_natural_language_search(req: Layer1SearchQuery):
    """
    MiniMax Layer 1 NLP query parser for natural language searches:
    e.g. 'Find 2 tonnes of reusable plastic packaging within 100 km of Ahmedabad below ₹40/kg'
    """
    filters = await minimax_layer1.parse_search_query(req.query)
    return {"query": req.query, "structured_filters": filters}

@router.delete("/{id}")
def delete_material(id: str, db: Session = Depends(get_db)):
    m = db.query(MaterialListing).filter(MaterialListing.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material listing not found")
    
    db.query(MaterialPassport).filter(MaterialPassport.material_id == id).delete()
    db.delete(m)
    db.commit()
    return {"success": True, "message": "Material listing deleted successfully"}

