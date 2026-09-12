import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import (
    get_db, Order, EscrowPayment, LogisticsShipment, QualityInspection,
    MaterialListing, Company, Contract, ImpactRecord, Notification
)
from app.schemas.schemas import OrderCreate, OrderStatusUpdate
from app.matching.engine import calculate_haversine_distance

router = APIRouter(prefix="/orders", tags=["Orders & Escrow Lifecycle"])

LIFECYCLE_STEPS = [
    "ORDER_CONFIRMED",
    "ESCROWED",
    "LOGISTICS_ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "INSPECTION",
    "ACCEPTED",
    "PAYMENT_RELEASED",
    "COMPLETED"
]

@router.get("")
def list_orders(
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status and status != "All":
        query = query.filter(Order.status == status)

    orders = query.order_by(Order.created_at.desc()).all()
    results = []
    for o in orders:
        mat = db.query(MaterialListing).filter(MaterialListing.id == o.material_id).first()
        seller = db.query(Company).filter(Company.id == o.seller_id).first()
        buyer = db.query(Company).filter(Company.id == o.buyer_id).first()
        escrow = db.query(EscrowPayment).filter(EscrowPayment.order_id == o.id).first()
        logistics = db.query(LogisticsShipment).filter(LogisticsShipment.order_id == o.id).first()

        results.append({
            "id": o.id,
            "order_number": o.order_number,
            "material_name": mat.name if mat else "Packaging Material",
            "material_category": mat.category if mat else "Packaging",
            "quantity": o.quantity,
            "unit": o.unit,
            "unit_price": o.unit_price,
            "subtotal_amount": o.subtotal_amount,
            "logistics_cost": o.logistics_cost,
            "total_delivered_amount": o.total_delivered_amount,
            "status": o.status,
            "created_at": str(o.created_at),
            "seller": {"id": seller.id if seller else "", "name": seller.name if seller else "Seller", "city": seller.city if seller else ""},
            "buyer": {"id": buyer.id if buyer else "", "name": buyer.name if buyer else "Buyer", "city": buyer.city if buyer else ""},
            "escrow": {
                "status": escrow.status if escrow else "PENDING",
                "amount": escrow.amount if escrow else o.total_delivered_amount,
                "tx_hash": escrow.escrow_transaction_hash if escrow else ""
            },
            "logistics": {
                "status": logistics.status if logistics else "PENDING",
                "provider": logistics.provider_name if logistics else "RELOOP Freight",
                "distance_km": logistics.distance_km if logistics else 82.0
            }
        })
    return results

@router.get("/{id}")
def get_order_detail(id: str, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == id).first()
    if not o:
        # Try finding by order number
        o = db.query(Order).filter(Order.order_number == id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    mat = db.query(MaterialListing).filter(MaterialListing.id == o.material_id).first()
    seller = db.query(Company).filter(Company.id == o.seller_id).first()
    buyer = db.query(Company).filter(Company.id == o.buyer_id).first()
    escrow = db.query(EscrowPayment).filter(EscrowPayment.order_id == o.id).first()
    logistics = db.query(LogisticsShipment).filter(LogisticsShipment.order_id == o.id).first()
    inspection = db.query(QualityInspection).filter(QualityInspection.order_id == o.id).first()

    return {
        "id": o.id,
        "order_number": o.order_number,
        "material": {
            "id": mat.id if mat else "",
            "code": mat.code if mat else "",
            "name": mat.name if mat else "Circular Packaging",
            "category": mat.category if mat else "Cardboard",
            "grade": mat.grade if mat else "Standard",
            "primary_image_url": mat.primary_image_url if mat else None
        },
        "quantity": o.quantity,
        "unit": o.unit,
        "unit_price": o.unit_price,
        "subtotal_amount": o.subtotal_amount,
        "logistics_cost": o.logistics_cost,
        "total_delivered_amount": o.total_delivered_amount,
        "status": o.status,
        "created_at": str(o.created_at),
        "updated_at": str(o.updated_at),
        "seller": {
            "id": seller.id if seller else "",
            "name": seller.name if seller else "Seller",
            "city": seller.city if seller else "",
            "trust_score": seller.trust_score if seller else 90.0,
            "phone": seller.phone if seller else ""
        },
        "buyer": {
            "id": buyer.id if buyer else "",
            "name": buyer.name if buyer else "Buyer",
            "city": buyer.city if buyer else "",
            "trust_score": buyer.trust_score if buyer else 90.0,
            "phone": buyer.phone if buyer else ""
        },
        "escrow": {
            "status": escrow.status if escrow else "PENDING",
            "amount": escrow.amount if escrow else o.total_delivered_amount,
            "escrow_transaction_hash": escrow.escrow_transaction_hash if escrow else "SIM-ESCROW",
            "escrowed_at": str(escrow.escrowed_at) if escrow and escrow.escrowed_at else None,
            "released_at": str(escrow.released_at) if escrow and escrow.released_at else None
        },
        "logistics": {
            "provider_name": logistics.provider_name if logistics else "RELOOP Logistics",
            "vehicle_type": logistics.vehicle_type if logistics else "14-ft CNG Truck",
            "pickup_city": logistics.pickup_city if logistics else "Ahmedabad",
            "delivery_city": logistics.delivery_city if logistics else "Vadodara",
            "distance_km": logistics.distance_km if logistics else 82.0,
            "estimated_travel_hours": logistics.estimated_travel_hours if logistics else 2.2,
            "estimated_transport_emissions_kg": logistics.estimated_transport_emissions_kg if logistics else 10.2,
            "status": logistics.status if logistics else "SCHEDULED",
            "tracking_step": logistics.tracking_step if logistics else 1,
            "waypoints": logistics.waypoints if logistics else []
        },
        "inspection": {
            "result": inspection.result if inspection else None,
            "expected_quantity": inspection.expected_quantity if inspection else o.quantity,
            "received_quantity": inspection.received_quantity if inspection else o.quantity,
            "notes": inspection.inspection_notes if inspection else None,
            "inspector_name": inspection.inspector_name if inspection else None,
            "inspected_at": str(inspection.inspected_at) if inspection else None
        }
    }

@router.post("")
def create_order(req: OrderCreate, db: Session = Depends(get_db)):
    mat = db.query(MaterialListing).filter(MaterialListing.id == req.material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material listing not found")

    seller = db.query(Company).filter(Company.id == mat.seller_id).first()
    buyer = db.query(Company).filter(Company.name.ilike("%GreenPack%")).first() or db.query(Company).all()[1]
    
    order_num = f"ORD-2026-{random.randint(9000, 9999)}"
    subtotal = req.quantity * req.unit_price
    logistics_cost = req.logistics_cost or 4200.0
    total = subtotal + logistics_cost

    # 1. Create Order
    order = Order(
        order_number=order_num,
        material_id=mat.id,
        seller_id=seller.id,
        buyer_id=buyer.id,
        quantity=req.quantity,
        unit=mat.unit,
        unit_price=req.unit_price,
        subtotal_amount=subtotal,
        logistics_cost=logistics_cost,
        total_delivered_amount=total,
        status="ESCROWED"
    )
    db.add(order)
    db.flush()

    # 2. Create Mock Escrow Payment
    escrow = EscrowPayment(
        order_id=order.id,
        amount=total,
        currency="INR",
        status="ESCROWED",
        escrow_transaction_hash=f"SIM-ESCROW-{hex(random.getrandbits(64))[2:].upper()}",
        escrowed_at=datetime.utcnow()
    )
    db.add(escrow)

    # 3. Create Logistics Shipment
    dist = calculate_haversine_distance(seller.latitude, seller.longitude, buyer.latitude, buyer.longitude)
    logistics = LogisticsShipment(
        order_id=order.id,
        provider_name="RELOOP GreenLogistics Hub",
        vehicle_type="14-ft Electric / Bio-CNG Truck",
        vehicle_capacity_kg=7500.0,
        pickup_city=seller.city,
        delivery_city=buyer.city,
        pickup_lat=seller.latitude,
        pickup_lng=seller.longitude,
        delivery_lat=buyer.latitude,
        delivery_lng=buyer.longitude,
        distance_km=dist,
        estimated_travel_hours=round(0.75 + (dist / 45.0), 1),
        transport_cost=logistics_cost,
        estimated_transport_emissions_kg=round(dist * (req.quantity / 1000.0) * 0.125, 1),
        status="SCHEDULED",
        tracking_step=1,
        waypoints=[
            {"name": f"Pickup: {seller.name} ({seller.city})", "lat": seller.latitude, "lng": seller.longitude, "status": "COMPLETED"},
            {"name": "Midway Logistics Hub", "lat": (seller.latitude + buyer.latitude) / 2, "lng": (seller.longitude + buyer.longitude) / 2, "status": "PENDING"},
            {"name": f"Delivery: {buyer.name} ({buyer.city})", "lat": buyer.latitude, "lng": buyer.longitude, "status": "PENDING"}
        ]
    )
    db.add(logistics)

    # 4. Notification
    db.add(Notification(
        company_id=seller.id,
        title=f"New Order Confirmed #{order_num}",
        message=f"{buyer.name} placed order for {int(req.quantity):,} kg of {mat.name}. Escrow secured.",
        type="ORDER"
    ))

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "order_id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "escrow_tx": escrow.escrow_transaction_hash,
        "message": "Order created, mock escrow deposited, and logistics dispatched."
    }

@router.put("/{id}/status")
def update_order_status(id: str, req: OrderStatusUpdate, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    o.status = req.status
    o.updated_at = datetime.utcnow()

    # If status is COMPLETED or PAYMENT_RELEASED, release escrow and record impact
    if req.status in ["PAYMENT_RELEASED", "COMPLETED"]:
        escrow = db.query(EscrowPayment).filter(EscrowPayment.order_id == o.id).first()
        if escrow:
            escrow.status = "RELEASED"
            escrow.released_at = datetime.utcnow()

        mat = db.query(MaterialListing).filter(MaterialListing.id == o.material_id).first()
        logistics = db.query(LogisticsShipment).filter(LogisticsShipment.order_id == o.id).first()
        
        # Check if impact already recorded
        existing_impact = db.query(ImpactRecord).filter(ImpactRecord.order_id == o.id).first()
        if not existing_impact and mat:
            carbon_factor = 0.95 if mat.category == "Cardboard" else 2.45
            gross_saved = o.quantity * carbon_factor
            trans_emiss = logistics.estimated_transport_emissions_kg if logistics else 12.0
            net_saved = gross_saved - trans_emiss

            impact = ImpactRecord(
                company_id=o.seller_id,
                order_id=o.id,
                material_category=mat.category,
                quantity_kg=o.quantity,
                virgin_material_avoided_kg=o.quantity,
                virgin_carbon_factor=carbon_factor,
                gross_carbon_avoided_kg=gross_saved,
                transport_emissions_kg=trans_emiss,
                net_carbon_saved_kg=net_saved,
                landfill_space_saved_m3=round(o.quantity * 0.0035, 2)
            )
            db.add(impact)

    db.commit()
    db.refresh(o)

    return {"success": True, "order_id": o.id, "status": o.status}
