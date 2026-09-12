from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text, or_
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.database import get_db, Company, CompanyProfile, MaterialListing, Order, Contract, CompanyRelationship

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
    """Return a focused dashboard workflow showing only the current company in the canvas."""
    target = db.query(Company).filter(Company.id == id).first()
    if not target:
        target = db.query(Company).first()
    if not target:
        return {"company_id": id, "company_name": "Unknown", "nodes": [], "edges": [], "summary": {}}

    related = []
    for contract in db.query(Contract).filter(
        or_(Contract.seller_id == target.id, Contract.buyer_id == target.id)
    ).all():
        if contract.seller_id == target.id:
            related.append({
                "id": f"contract-{contract.id}",
                "from_company_id": target.id,
                "to_company_id": contract.buyer_id,
                "relationship_type": "buyer",
                "partner_role": "buyer",
                "status": str(contract.status or "active").lower(),
                "quantity": contract.quantity_kg,
                "unit": "kg",
                "price": contract.unit_price,
                "material_id": None,
            })
        else:
            related.append({
                "id": f"contract-{contract.id}",
                "from_company_id": contract.seller_id,
                "to_company_id": target.id,
                "relationship_type": "supplier",
                "partner_role": "supplier",
                "status": str(contract.status or "active").lower(),
                "quantity": contract.quantity_kg,
                "unit": "kg",
                "price": contract.unit_price,
                "material_id": None,
            })

    if not related:
        return {
            "company_id": target.id,
            "company_name": target.name,
            "total_circular_flow_kg_month": 0,
            "monthly_net_margin_inr": 0,
            "avoided_co2_kg_month": 0,
            "nodes": [{
                "id": "my-company",
                "type": "central_hub",
                "position": {"x": 420, "y": 220},
                "data": {
                    "label": target.name,
                    "role": "My Facility",
                    "city": target.city,
                    "company_type": target.company_type,
                    "trust_score": target.trust_score,
                    "status": "active",
                    "relationship": "center"
                }
            }],
            "edges": [],
            "summary": {
                "connected_companies": 0,
                "active_suppliers": 0,
                "active_buyers": 0,
                "pending_requests": 0,
                "active_material_flows": 0,
                "in_transit_orders": 0,
                "completed_transactions": 0,
            },
        }

    def relationship_value(item: Any, key: str, default: Any = None) -> Any:
        if isinstance(item, dict):
            return item.get(key, default)
        return getattr(item, key, default)

    def partner_role(item: Any) -> str:
        if isinstance(item, dict) and item.get("partner_role"):
            return str(item["partner_role"]).lower()
        relationship_type = str(relationship_value(item, "relationship_type", "")).lower()
        is_from_company = relationship_value(item, "from_company_id") == target.id
        if relationship_type == "supplier":
            return "buyer" if is_from_company else "supplier"
        if relationship_type == "buyer":
            return "supplier" if is_from_company else "buyer"
        return relationship_type or "partner"

    node_map: Dict[str, Dict[str, Any]] = {}
    nodes = [{
        "id": "my-company",
        "type": "central_hub",
        "position": {"x": 420, "y": 220},
        "data": {
            "label": target.name,
            "role": "My Facility",
            "city": target.city,
            "company_type": target.company_type,
            "trust_score": target.trust_score,
            "status": "active",
            "relationship": "center"
        }
    }]
    node_map["my-company"] = nodes[0]

    for item in related:
        from_company_id = relationship_value(item, "from_company_id")
        to_company_id = relationship_value(item, "to_company_id")
        other_id = to_company_id if from_company_id == target.id else from_company_id
        other_company = db.query(Company).filter(Company.id == other_id).first()
        if not other_company or other_company.id == target.id:
            continue

        node_key = f"company-{other_company.id}"
        if node_key not in node_map:
            role = partner_role(item)
            node_map[node_key] = {
                "id": node_key,
                "type": role,
                "position": {"x": 70 + (len(node_map) * 120) % 700, "y": 80 + ((len(node_map) * 150) % 420)},
                "data": {
                    "label": other_company.name,
                    "role": role.capitalize(),
                    "city": other_company.city,
                    "company_type": other_company.company_type,
                    "trust_score": other_company.trust_score,
                    "status": relationship_value(item, "status", "active"),
                    "relationship": "connected"
                }
            }
            nodes.append(node_map[node_key])
        elif str(relationship_value(item, "id", "")).startswith("contract-"):
            role = partner_role(item)
            node_map[node_key]["type"] = role
            node_map[node_key]["data"]["role"] = role.capitalize()
            node_map[node_key]["data"]["status"] = relationship_value(item, "status", "active")

    edges = []
    for item in related:
        from_company_id = relationship_value(item, "from_company_id")
        to_company_id = relationship_value(item, "to_company_id")
        other_id = to_company_id if from_company_id == target.id else from_company_id
        other_company = db.query(Company).filter(Company.id == other_id).first()
        if not other_company:
            continue
        source = "my-company" if from_company_id == target.id else f"company-{other_company.id}"
        target_id = f"company-{other_company.id}" if from_company_id == target.id else "my-company"
        direction = partner_role(item)
        color = {"supplier": "#22c55e", "buyer": "#3b82f6", "recycler": "#f59e0b", "logistics": "#a78bfa"}.get(direction, "#64748b")
        status = str(relationship_value(item, "status", "active")).lower()
        edges.append({
            "id": f"rel-{relationship_value(item, 'id', other_company.id)}",
            "source": source,
            "target": target_id,
            "label": f"{direction.upper()} • {relationship_value(item, 'quantity', 0) or 0} {relationship_value(item, 'unit', 'kg') or 'kg'}",
            "type": "smoothstep",
            "animated": status in {"active", "in_transit", "pending"},
            "style": {"stroke": color, "strokeWidth": 2.5, "strokeDasharray": "6 6" if status in {"pending", "rejected", "cancelled"} else "0"},
            "markerEnd": {"type": "arrowclosed", "color": color}
        })

    summary = {
        "connected_companies": max(len(nodes) - 1, 0),
        "active_suppliers": sum(1 for item in related if partner_role(item) in {"supplier", "recycler"}),
        "active_buyers": sum(1 for item in related if partner_role(item) == "buyer"),
        "pending_requests": sum(1 for item in related if str(relationship_value(item, "status", "")).lower() in {"pending", "requested"}),
        "active_material_flows": sum(1 for item in related if str(relationship_value(item, "status", "")).lower() in {"active", "in_transit"}),
        "in_transit_orders": 0,
        "completed_transactions": 0,
    }

    return {
        "company_id": target.id,
        "company_name": target.name,
        "total_circular_flow_kg_month": sum(float(relationship_value(item, "quantity", 0) or 0) for item in related),
        "monthly_net_margin_inr": 48500,
        "avoided_co2_kg_month": 15800,
        "nodes": nodes,
        "edges": edges,
        "summary": summary,
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
