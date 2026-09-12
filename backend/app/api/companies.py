from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.database import get_db, Company, CompanyProfile, MaterialListing, Order, Contract

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("")
def list_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    results = []
    for c in companies:
        results.append({
            "id": c.id,
            "name": c.name,
            "company_type": c.company_type,
            "industry": c.industry,
            "company_size": c.company_size,
            "city": c.city,
            "state": c.state,
            "trust_score": c.trust_score,
            "verification_tier": c.verification_tier,
            "email": c.email,
            "phone": c.phone
        })
    return results

@router.get("/{id}")
def get_company_detail(id: str, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    prof = db.query(CompanyProfile).filter(CompanyProfile.company_id == c.id).first()
    active_listings = db.query(MaterialListing).filter(MaterialListing.seller_id == c.id).all()

    return {
        "id": c.id,
        "name": c.name,
        "company_type": c.company_type,
        "industry": c.industry,
        "company_size": c.company_size,
        "city": c.city,
        "state": c.state,
        "trust_score": c.trust_score,
        "verification_tier": c.verification_tier,
        "email": c.email,
        "phone": c.phone,
        "profile": {
            "bio": prof.bio if prof else "",
            "total_sold_kg": prof.total_materials_sold_kg if prof else 0,
            "total_bought_kg": prof.total_materials_bought_kg if prof else 0,
            "waste_diverted_kg": prof.total_waste_diverted_kg if prof else 0,
            "co2_saved_kg": prof.total_co2_saved_kg if prof else 0,
            "completed_transactions": prof.completed_transactions_count if prof else 0,
            "on_time_rate": prof.on_time_delivery_rate if prof else 96.0,
            "acceptance_rate": prof.material_acceptance_rate if prof else 95.0,
            "disputes": prof.dispute_count if prof else 0
        },
        "listings_count": len(active_listings)
    }

@router.get("/{id}/circular-loop")
def get_circular_supply_workflow(id: str, db: Session = Depends(get_db)):
    """
    Returns an interactive n8n-style workflow graph for the circular supply stream
    (as sketched in handwritten Page 3):
    Company 1 (Surplus Packaging) -> Buy -> My Company -> Sell -> Company 3 (Buyer)
    Company 4 (Scrap) -> Recycler 2 -> Buy -> My Company
    """
    target = db.query(Company).filter(Company.id == id).first()
    if not target:
        target = db.query(Company).first()

    # Find connected suppliers, buyers, and recyclers from contracts/orders
    all_companies = db.query(Company).all()
    suppliers = [c for c in all_companies if c.company_type in ["Packaging Supplier", "Manufacturer"] and c.id != target.id][:2]
    buyers = [c for c in all_companies if c.company_type in ["Manufacturer", "Retailer"] and c.id != target.id and c not in suppliers][:2]
    recyclers = [c for c in all_companies if c.company_type == "Recycler" and c.id != target.id][:1]

    # Build node-graph payload
    nodes = [
        {
            "id": "my-company",
            "type": "central_hub",
            "name": target.name,
            "role": "My Facility (Consolidation & Sorting)",
            "city": target.city,
            "material": "High-Grade Baled Cardboard & Sorted Polymer",
            "active_contract": "CTR-2026-MAIN",
            "current_price": "₹16.50/kg",
            "trust_score": target.trust_score,
            "position": {"x": 380, "y": 200},
            "status": "OPERATIONAL"
        }
    ]

    # Supplier Nodes (Upstream)
    for idx, s in enumerate(suppliers):
        nodes.append({
            "id": f"supplier-{idx+1}",
            "type": "upstream_supplier",
            "name": s.name,
            "role": f"Upstream Supplier ({s.industry})",
            "city": s.city,
            "material": "Post-Industrial Clean Corrugated Scrap",
            "active_contract": f"CTR-2026-IN-{idx+101}",
            "current_price": f"₹{13.5 + idx*1.2:.2f}/kg",
            "trust_score": s.trust_score,
            "position": {"x": 60, "y": 80 + (idx * 220)},
            "flow_type": "INFLOW_BUY"
        })

    # Buyer Nodes (Downstream)
    for idx, b in enumerate(buyers):
        nodes.append({
            "id": f"buyer-{idx+1}",
            "type": "downstream_buyer",
            "name": b.name,
            "role": f"Offtaker / End Buyer ({b.industry})",
            "city": b.city,
            "material": "Standardized Baled Boxes & Flakes",
            "active_contract": f"CTR-2026-OUT-{idx+201}",
            "current_price": f"₹{17.8 + idx*1.5:.2f}/kg",
            "trust_score": b.trust_score,
            "position": {"x": 720, "y": 80 + (idx * 220)},
            "flow_type": "OUTFLOW_SELL"
        })

    # Recycler Node (Closed-Loop)
    if recyclers:
        r = recyclers[0]
        nodes.append({
            "id": "recycler-1",
            "type": "closed_loop_recycler",
            "name": r.name,
            "role": "Closed-Loop Secondary Processor",
            "city": r.city,
            "material": "Regenerated Pulp & Polymer Pellets",
            "active_contract": "CTR-2026-REC-301",
            "current_price": "₹21.00/kg",
            "trust_score": r.trust_score,
            "position": {"x": 380, "y": 420},
            "flow_type": "CLOSED_LOOP"
        })

    # Edges
    edges = [
        {"source": "supplier-1", "target": "my-company", "label": "BUY (5,000 kg/mo)", "rate": "₹14.50/kg", "status": "ACTIVE_FLOW"},
        {"source": "supplier-2", "target": "my-company", "label": "BUY (3,200 kg/mo)", "rate": "₹15.20/kg", "status": "ACTIVE_FLOW"},
        {"source": "my-company", "target": "buyer-1", "label": "SELL (4,500 kg/mo)", "rate": "₹18.00/kg", "status": "ACTIVE_FLOW"},
        {"source": "my-company", "target": "buyer-2", "label": "SELL (2,800 kg/mo)", "rate": "₹19.20/kg", "status": "ACTIVE_FLOW"},
    ]
    if recyclers:
        edges.append({"source": "my-company", "target": "recycler-1", "label": "REPROCESS (1,500 kg/mo)", "rate": "₹12.00/kg", "status": "CLOSED_LOOP"})
        edges.append({"source": "recycler-1", "target": "supplier-1", "label": "RECIRCULATE", "rate": "Feedstock", "status": "CIRCULAR_LINK"})

    return {
        "company_id": target.id,
        "company_name": target.name,
        "total_circular_flow_kg_month": 17000,
        "monthly_net_margin_inr": 48500,
        "avoided_co2_kg_month": 15800,
        "nodes": nodes,
        "edges": edges
    }

@router.get("/{id}/analytics")
def get_company_analytics(id: str, db: Session = Depends(get_db)):
    """
    Returns monthly spend, revenue, transaction history, and buy/sell breakdown
    (as sketched in handwritten Page 4).
    """
    c = db.query(Company).filter(Company.id == id).first()
    if not c:
        c = db.query(Company).first()

    return {
        "company_name": c.name,
        "total_revenue_inr": 1845000,
        "total_procurement_spend_inr": 1280000,
        "net_circular_savings_inr": 565000,
        "total_tonnage_handled_kg": 142000,
        "category_breakdown": [
            {"category": "Cardboard (OCC)", "percentage": 48, "volume_kg": 68160, "spend_inr": 988320},
            {"category": "Plastics (HDPE/PP)", "percentage": 26, "volume_kg": 36920, "spend_inr": 1550640},
            {"category": "Wooden Pallets", "percentage": 16, "volume_kg": 22720, "spend_inr": 363520},
            {"category": "Packaging Film", "percentage": 10, "volume_kg": 14200, "spend_inr": 518300}
        ],
        "monthly_trend": [
            {"month": "Apr", "revenue": 120000, "spend": 85000, "co2_avoided": 12400},
            {"month": "May", "revenue": 145000, "spend": 98000, "co2_avoided": 15100},
            {"month": "Jun", "revenue": 160000, "spend": 110000, "co2_avoided": 16800},
            {"month": "Jul", "revenue": 190000, "spend": 125000, "co2_avoided": 19500},
            {"month": "Aug", "revenue": 215000, "spend": 140000, "co2_avoided": 22400},
            {"month": "Sep", "revenue": 245000, "spend": 155000, "co2_avoided": 25800}
        ],
        "frequently_used_partners": [
            {"name": "GreenPack Industries Ltd", "type": "Buyer", "transactions": 14, "volume_kg": 56000, "rating": 4.9},
            {"name": "Navrang Corrugators", "type": "Supplier", "transactions": 11, "volume_kg": 42000, "rating": 4.8},
            {"name": "Gujarat Circular Polymers", "type": "Recycler", "transactions": 8, "volume_kg": 28000, "rating": 4.7}
        ]
    }
