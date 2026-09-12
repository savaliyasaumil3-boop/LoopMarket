from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models.database import get_db, MaterialListing, Company, MaterialRequirement, CompanyProfile
from app.matching.engine import matching_engine, calculate_haversine_distance
from app.ai.layer2_gemini import gemini_layer2

router = APIRouter(prefix="/matching", tags=["Matching & AI Recommendations"])

@router.get("/recommendations")
async def get_personalized_recommendations(
    company_id: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns Netflix-style categorized recommendations generated via Layer 2 Gemini engine
    strictly grounded on valid candidate materials in database.
    """
    company = None
    if company_id:
        company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        company = db.query(Company).first()

    profile = db.query(CompanyProfile).filter(CompanyProfile.company_id == company.id).first()
    company_ctx = {
        "id": company.id,
        "name": company.name,
        "company_type": company.company_type,
        "industry": company.industry,
        "city": company.city,
        "trust_score": company.trust_score
    }

    # Fetch available candidate materials
    all_materials = db.query(MaterialListing).filter(
        MaterialListing.status == "AVAILABLE",
        MaterialListing.seller_id != company.id
    ).all()

    candidates = []
    for m in all_materials:
        seller = db.query(Company).filter(Company.id == m.seller_id).first()
        dist_km = calculate_haversine_distance(m.latitude, m.longitude, company.latitude, company.longitude)
        
        score_data = matching_engine.score_material_buyer_match(
            material=m,
            buyer_company=company
        )

        candidates.append({
            "id": m.id,
            "code": m.code,
            "name": m.name,
            "category": m.category,
            "seller_name": seller.name if seller else "Verified Supplier",
            "seller_city": m.location_city,
            "quantity_kg": m.quantity_kg,
            "price_per_unit": m.price_per_unit,
            "distance_km": dist_km,
            "delivered_cost_per_kg": score_data["delivered_cost_per_kg"],
            "circularity_score": score_data["circularity_score"],
            "trust_score": seller.trust_score if seller else 90.0,
            "match_score": score_data["match_score"],
            "estimated_transport_emissions_kg": score_data["estimated_transport_emissions_kg"],
            "primary_image_url": m.primary_image_url
        })

    # Generate recommendation carousels
    categories_to_build = [
        "Recommended for your company",
        "Because you purchased cardboard recently",
        "Best nearby materials",
        "High circular-impact materials",
        "Best value materials"
    ]

    response_sections = []
    for cat_label in categories_to_build:
        # Pre-filter candidate subsets for theme
        if "cardboard" in cat_label.lower():
            subset = [c for c in candidates if "cardboard" in c["category"].lower() or "paper" in c["category"].lower()]
        elif "nearby" in cat_label.lower():
            subset = sorted(candidates, key=lambda x: x["distance_km"])
        elif "circular" in cat_label.lower():
            subset = sorted(candidates, key=lambda x: x["circularity_score"], reverse=True)
        elif "value" in cat_label.lower():
            subset = sorted(candidates, key=lambda x: x["delivered_cost_per_kg"])
        else:
            subset = candidates

        rec_items = await gemini_layer2.generate_personalized_recommendations(
            company_profile=company_ctx,
            candidate_materials=subset if subset else candidates,
            category_label=cat_label
        )

        response_sections.append({
            "section_title": cat_label,
            "items": [item.dict() for item in rec_items[:6]]
        })

    return {
        "company": company_ctx,
        "sections": response_sections
    }

@router.get("/{material_id}/best-buyers")
async def find_best_buyers_for_material(material_id: str, db: Session = Depends(get_db)):
    """
    Scenario Demo: Takes a material listing and identifies the highest scoring buyer companies,
    calculates 5-factor hybrid score, delivered costs, and returns point-by-point explainability.
    """
    mat = db.query(MaterialListing).filter(MaterialListing.id == material_id).first()
    if not mat:
        # Try finding by code
        mat = db.query(MaterialListing).filter(MaterialListing.code == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material listing not found")

    buyer_companies = db.query(Company).filter(
        Company.company_type.in_(["Packaging Supplier", "Manufacturer", "Recycler", "Retailer"]),
        Company.id != mat.seller_id
    ).all()

    ranked_buyers = []
    for b in buyer_companies:
        score_res = matching_engine.score_material_buyer_match(
            material=mat,
            buyer_company=b
        )
        ranked_buyers.append({
            "buyer_id": b.id,
            "buyer_name": b.name,
            "company_type": b.company_type,
            "industry": b.industry,
            "city": b.city,
            "trust_score": b.trust_score,
            "verification_tier": b.verification_tier,
            "scores": score_res
        })

    ranked_buyers.sort(key=lambda x: x["scores"]["match_score"], reverse=True)
    top_matches = ranked_buyers[:6]
    
    # Generate an overall AI summary for the top match
    ai_summary = "No matches found."
    if top_matches:
        top_buyer = top_matches[0]
        ai_summary = await gemini_layer2.generate_match_explanation(
            material_name=mat.name,
            buyer_name=top_buyer["buyer_name"],
            score_breakdown=top_buyer["scores"]
        )

    return {
        "material": {
            "id": mat.id,
            "code": mat.code,
            "name": mat.name,
            "category": mat.category,
            "quantity_kg": mat.quantity_kg,
            "price_per_unit": mat.price_per_unit,
            "location_city": mat.location_city
        },
        "top_matches": top_matches,
        "ai_insight": ai_summary
    }

@router.get("/{material_id}/why-match")
async def explain_material_match(
    material_id: str,
    buyer_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    mat = db.query(MaterialListing).filter(MaterialListing.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    buyer = db.query(Company).filter(Company.id == buyer_id).first() if buyer_id else db.query(Company).first()
    score_res = matching_engine.score_material_buyer_match(mat, buyer)

    ai_explanation = await gemini_layer2.generate_match_explanation(
        material_name=mat.name,
        buyer_name=buyer.name,
        score_breakdown=score_res
    )

    return {
        "material_name": mat.name,
        "buyer_name": buyer.name,
        "breakdown": score_res,
        "ai_explanation": ai_explanation,
        "weights": {
            "material_compatibility_pct": 30,
            "quantity_compatibility_pct": 20,
            "distance_pct": 20,
            "delivered_cost_pct": 15,
            "circularity_pct": 15
        }
    }
