import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import get_db, Contract, Company, MaterialListing
from app.schemas.schemas import ContractCreate

router = APIRouter(prefix="/contracts", tags=["Contracts System"])

@router.get("")
def list_contracts(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Contract)
    if status and status != "All":
        query = query.filter(Contract.status == status)
    if search:
        query = query.filter(
            (Contract.title.ilike(f"%{search}%")) |
            (Contract.contract_number.ilike(f"%{search}%")) |
            (Contract.material_name.ilike(f"%{search}%"))
        )

    contracts = query.order_by(Contract.created_at.desc()).all()
    results = []
    for c in contracts:
        seller = db.query(Company).filter(Company.id == c.seller_id).first()
        buyer = db.query(Company).filter(Company.id == c.buyer_id).first()
        results.append({
            "id": c.id,
            "contract_number": c.contract_number,
            "title": c.title,
            "seller": {"id": seller.id if seller else "", "name": seller.name if seller else "Seller", "city": seller.city if seller else ""},
            "buyer": {"id": buyer.id if buyer else "", "name": buyer.name if buyer else "Buyer", "city": buyer.city if buyer else ""},
            "material_name": c.material_name,
            "quantity_kg": c.quantity_kg,
            "unit_price": c.unit_price,
            "total_amount": c.total_amount,
            "contract_duration": c.contract_duration,
            "status": c.status,
            "is_ai_draft": c.is_ai_draft,
            "seller_signed": c.seller_signed,
            "buyer_signed": c.buyer_signed,
            "delivery_terms": c.delivery_terms,
            "payment_terms": c.payment_terms,
            "inspection_terms": c.inspection_terms,
            "dispute_terms": c.dispute_terms,
            "created_at": str(c.created_at)
        })
    return results

@router.get("/{id}")
def get_contract_detail(id: str, db: Session = Depends(get_db)):
    c = db.query(Contract).filter(Contract.id == id).first()
    if not c:
        c = db.query(Contract).filter(Contract.contract_number == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")

    seller = db.query(Company).filter(Company.id == c.seller_id).first()
    buyer = db.query(Company).filter(Company.id == c.buyer_id).first()

    return {
        "id": c.id,
        "contract_number": c.contract_number,
        "title": c.title,
        "seller": {"id": seller.id if seller else "", "name": seller.name if seller else "", "city": seller.city if seller else "", "trust_score": seller.trust_score if seller else 90},
        "buyer": {"id": buyer.id if buyer else "", "name": buyer.name if buyer else "", "city": buyer.city if buyer else "", "trust_score": buyer.trust_score if buyer else 90},
        "material_name": c.material_name,
        "quantity_kg": c.quantity_kg,
        "unit_price": c.unit_price,
        "total_amount": c.total_amount,
        "delivery_terms": c.delivery_terms,
        "payment_terms": c.payment_terms,
        "inspection_terms": c.inspection_terms,
        "dispute_terms": c.dispute_terms,
        "contract_duration": c.contract_duration,
        "status": c.status,
        "is_ai_draft": c.is_ai_draft,
        "seller_signed": c.seller_signed,
        "buyer_signed": c.buyer_signed,
        "created_at": str(c.created_at)
    }

@router.post("")
def create_contract(req: ContractCreate, db: Session = Depends(get_db)):
    contract_num = f"CTR-2026-{random.randint(5000, 9999)}"
    total = req.quantity_kg * req.unit_price

    contract = Contract(
        contract_number=contract_num,
        title=f"B2B Circular Packaging Agreement: {req.material_name}",
        seller_id=req.seller_id,
        buyer_id=req.buyer_id,
        material_name=req.material_name,
        quantity_kg=req.quantity_kg,
        unit_price=req.unit_price,
        total_amount=total,
        delivery_terms=req.delivery_terms or "Door-to-door freight facilitated by RELOOP GreenLogistics within 4 business days of escrow lock.",
        payment_terms=req.payment_terms or "100% Mock Escrow deposited before dispatch. Automatic release after buyer QA inspection pass.",
        inspection_terms=req.inspection_terms or "48-hour delivery inspection window. Standard moisture < 9%, contamination < 2% permissible.",
        dispute_terms=req.dispute_terms or "Automated structured evidence mediation via RELOOP resolution hub within 72 hours.",
        contract_duration=req.contract_duration or "Single Transaction / 30 Days",
        status="ACTIVE",
        is_ai_draft=True,
        seller_signed=True,
        buyer_signed=False
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    return {"success": True, "id": contract.id, "contract_number": contract.contract_number, "status": contract.status}

@router.put("/{id}/sign")
def sign_contract(id: str, db: Session = Depends(get_db)):
    c = db.query(Contract).filter(Contract.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")

    c.buyer_signed = True
    c.status = "ACTIVE"
    db.commit()
    return {"success": True, "message": "Contract signed and activated."}
