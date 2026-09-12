from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import get_db, MaterialRequirement, Company, MaterialListing
from app.schemas.schemas import RequirementCreate
from app.matching.engine import matching_engine

router = APIRouter(prefix="/requirements", tags=["Requirements"])

@router.get("")
def list_requirements(
    category: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MaterialRequirement).filter(MaterialRequirement.status == "ACTIVE")
    if category and category != "All":
        query = query.filter(MaterialRequirement.category.ilike(f"%{category}%"))
    if city and city != "All":
        query = query.filter(MaterialRequirement.destination_city.ilike(f"%{city}%"))

    items = query.all()
    results = []
    for r in items:
        buyer = db.query(Company).filter(Company.id == r.buyer_id).first()
        results.append({
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "subtype": r.subtype,
            "required_quantity_kg": r.required_quantity_kg,
            "grade": r.grade,
            "desired_condition": r.desired_condition,
            "max_acceptable_distance_km": r.max_acceptable_distance_km,
            "target_price_per_kg": r.target_price_per_kg,
            "destination_city": r.destination_city,
            "required_by_date": str(r.required_by_date) if r.required_by_date else None,
            "status": r.status,
            "buyer": {
                "id": buyer.id if buyer else "",
                "name": buyer.name if buyer else "Procurement Buyer",
                "industry": buyer.industry if buyer else "Manufacturing",
                "city": buyer.city if buyer else r.destination_city,
                "trust_score": buyer.trust_score if buyer else 90.0
            }
        })
    return results

@router.post("")
def create_requirement(req: RequirementCreate, db: Session = Depends(get_db)):
    buyer = db.query(Company).first()
    
    new_req = MaterialRequirement(
        title=req.title,
        category=req.category,
        subtype=req.subtype or f"Standard {req.category}",
        required_quantity_kg=req.required_quantity_kg,
        grade=req.grade or "Any / Compatible",
        desired_condition=req.desired_condition or "Reusable",
        max_acceptable_distance_km=req.max_acceptable_distance_km or 150.0,
        target_price_per_kg=req.target_price_per_kg,
        destination_city=req.destination_city,
        latitude=buyer.latitude if buyer else 23.0225,
        longitude=buyer.longitude if buyer else 72.5714,
        required_by_date=datetime.utcnow() + timedelta(days=21),
        status="ACTIVE",
        buyer_id=buyer.id
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return {"success": True, "id": new_req.id, "message": "Procurement requirement posted to reverse marketplace."}

@router.get("/{id}/matching-materials")
def find_matching_materials_for_requirement(id: str, db: Session = Depends(get_db)):
    req = db.query(MaterialRequirement).filter(MaterialRequirement.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    buyer = db.query(Company).filter(Company.id == req.buyer_id).first()
    candidates = db.query(MaterialListing).filter(
        MaterialListing.status == "AVAILABLE",
        MaterialListing.category.ilike(f"%{req.category}%")
    ).all()

    matches = []
    for mat in candidates:
        seller = db.query(Company).filter(Company.id == mat.seller_id).first()
        score_res = matching_engine.score_material_buyer_match(
            material=mat,
            buyer_company=buyer,
            requirement=req
        )
        if score_res["match_score"] >= 65.0:
            matches.append({
                "material_id": mat.id,
                "material_code": mat.code,
                "material_name": mat.name,
                "category": mat.category,
                "seller_name": seller.name if seller else "Industrial Supplier",
                "seller_city": mat.location_city,
                "quantity_kg": mat.quantity_kg,
                "price_per_unit": mat.price_per_unit,
                "primary_image_url": mat.primary_image_url,
                "scores": score_res
            })

    matches.sort(key=lambda x: x["scores"]["match_score"], reverse=True)
    return {"requirement_id": id, "matches": matches[:10]}
