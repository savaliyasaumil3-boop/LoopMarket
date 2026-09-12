from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.models.database import (
    get_db, QualityInspection, DisputeRecord, Order, EscrowPayment, ImpactRecord, MaterialListing, Company
)
from app.schemas.schemas import InspectionCreate, DisputeCreate

router = APIRouter(prefix="/inspections", tags=["Inspections & Disputes"])

class DisputeResolveRequest(BaseModel):
    resolution: str # RESOLVED_ACCEPTED, RESOLVED_REFUND, RESOLVED_REPLACEMENT, REJECTED
    resolution_notes: str
    refund_amount: Optional[float] = 0.0

@router.get("")
def list_inspections(db: Session = Depends(get_db)):
    inspections = db.query(QualityInspection).all()
    results = []
    for i in inspections:
        order = db.query(Order).filter(Order.id == i.order_id).first()
        dispute = db.query(DisputeRecord).filter(DisputeRecord.inspection_id == i.id).first()
        results.append({
            "id": i.id,
            "order_id": i.order_id,
            "order_number": order.order_number if order else "ORD-2026",
            "expected_quantity": i.expected_quantity,
            "received_quantity": i.received_quantity,
            "expected_condition": i.expected_condition,
            "received_condition": i.received_condition,
            "expected_contamination": i.expected_contamination,
            "observed_contamination": i.observed_contamination,
            "result": i.result,
            "inspector_name": i.inspector_name,
            "inspection_notes": i.inspection_notes,
            "inspected_at": str(i.inspected_at),
            "dispute": {
                "id": dispute.id if dispute else None,
                "type": dispute.dispute_type if dispute else None,
                "status": dispute.status if dispute else None,
                "evidence": dispute.evidence_text if dispute else None
            } if dispute else None
        })
    return results

@router.post("")
def submit_inspection(req: InspectionCreate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    inspection = QualityInspection(
        order_id=order.id,
        expected_quantity=req.expected_quantity,
        received_quantity=req.received_quantity,
        expected_condition=req.expected_condition,
        received_condition=req.received_condition,
        expected_contamination=req.expected_contamination,
        observed_contamination=req.observed_contamination,
        result=req.result,
        inspection_notes=req.inspection_notes,
        inspector_name=req.inspector_name or "QA Officer",
        photo_urls=req.photo_urls or [],
        inspected_at=datetime.utcnow()
    )
    db.add(inspection)
    db.flush()

    if req.result == "PASSED":
        order.status = "COMPLETED"
        # Release Mock Escrow
        escrow = db.query(EscrowPayment).filter(EscrowPayment.order_id == order.id).first()
        if escrow:
            escrow.status = "RELEASED"
            escrow.released_at = datetime.utcnow()

        # Record Impact
        mat = db.query(MaterialListing).filter(MaterialListing.id == order.material_id).first()
        if mat:
            carbon_factor = 0.95 if mat.category == "Cardboard" else 2.45
            gross_saved = order.quantity * carbon_factor
            impact = ImpactRecord(
                company_id=order.seller_id,
                order_id=order.id,
                material_category=mat.category,
                quantity_kg=order.quantity,
                virgin_material_avoided_kg=order.quantity,
                virgin_carbon_factor=carbon_factor,
                gross_carbon_avoided_kg=gross_saved,
                transport_emissions_kg=12.5,
                net_carbon_saved_kg=gross_saved - 12.5,
                landfill_space_saved_m3=round(order.quantity * 0.0035, 2)
            )
            db.add(impact)
    else:
        order.status = "DISPUTED"
        escrow = db.query(EscrowPayment).filter(EscrowPayment.order_id == order.id).first()
        if escrow:
            escrow.status = "DISPUTED"

    db.commit()
    db.refresh(inspection)

    return {"success": True, "inspection_id": inspection.id, "result": inspection.result, "order_status": order.status}

@router.post("/dispute")
def raise_dispute(req: DisputeCreate, db: Session = Depends(get_db)):
    insp = db.query(QualityInspection).filter(QualityInspection.id == req.inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    dispute = DisputeRecord(
        inspection_id=insp.id,
        dispute_type=req.dispute_type,
        evidence_text=req.evidence_text,
        evidence_photos=req.evidence_photos or [],
        status="UNDER_REVIEW",
        created_at=datetime.utcnow()
    )
    db.add(dispute)

    # Mark order as disputed
    order = db.query(Order).filter(Order.id == insp.order_id).first()
    if order:
        order.status = "DISPUTED"
        escrow = db.query(EscrowPayment).filter(EscrowPayment.order_id == order.id).first()
        if escrow:
            escrow.status = "DISPUTED"

    db.commit()
    db.refresh(dispute)

    return {"success": True, "dispute_id": dispute.id, "status": dispute.status}

@router.put("/dispute/{id}/resolve")
def resolve_dispute(id: str, req: DisputeResolveRequest, db: Session = Depends(get_db)):
    disp = db.query(DisputeRecord).filter(DisputeRecord.id == id).first()
    if not disp:
        raise HTTPException(status_code=404, detail="Dispute not found")

    disp.status = req.resolution
    disp.resolution_notes = req.resolution_notes
    disp.resolution_amount = req.refund_amount or 0.0
    disp.resolved_at = datetime.utcnow()

    insp = db.query(QualityInspection).filter(QualityInspection.id == disp.inspection_id).first()
    if insp:
        order = db.query(Order).filter(Order.id == insp.order_id).first()
        if order:
            order.status = "COMPLETED"
            escrow = db.query(EscrowPayment).filter(EscrowPayment.order_id == order.id).first()
            if escrow:
                escrow.status = "RELEASED"

    db.commit()
    return {"success": True, "status": disp.status, "message": "Dispute resolved and logged."}
