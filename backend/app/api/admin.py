from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, Company, MaterialListing, Order, EscrowPayment, LogisticsShipment, QualityInspection, ImpactRecord
from app.seed.seed_data import seed_database

router = APIRouter(prefix="/admin", tags=["Admin & Hackathon Demo Controls"])

@router.post("/reset-demo-data")
def reset_demo():
    """Resets the entire database to standard seeded demo state."""
    seed_database()
    return {"success": True, "message": "Demo database successfully re-seeded."}

@router.post("/run-full-demo-flow")
def execute_end_to_end_demo_scenario(db: Session = Depends(get_db)):
    """
    Executes the complete hackathon end-to-end demonstration workflow:
    ABC Manufacturing (Ahmedabad) -> 5,000 kg Cardboard -> GreenPack Industries Match (94%)
    -> Order -> Mock Escrow -> Logistics In-Transit -> Delivery -> Inspection -> Payment Release -> Impact.
    """
    seller = db.query(Company).filter(Company.email == "abc@reloop.in").first()
    buyer = db.query(Company).filter(Company.email == "buyer@greenpack.com").first()
    mat = db.query(MaterialListing).filter(MaterialListing.category == "Cardboard").first()

    if not seller or not buyer or not mat:
        raise HTTPException(status_code=400, detail="Seed data missing. Please reset demo data first.")

    # Create active demo order
    order_num = f"ORD-DEMO-{datetime.utcnow().strftime('%M%S')}"
    qty = 5000.0
    price = 14.50
    subtotal = qty * price
    logistics_cost = 4200.0
    total = subtotal + logistics_cost

    order = Order(
        order_number=order_num,
        material_id=mat.id,
        seller_id=seller.id,
        buyer_id=buyer.id,
        quantity=qty,
        unit="kg",
        unit_price=price,
        subtotal_amount=subtotal,
        logistics_cost=logistics_cost,
        total_delivered_amount=total,
        status="COMPLETED"
    )
    db.add(order)
    db.flush()

    # Escrow
    escrow = EscrowPayment(
        order_id=order.id,
        amount=total,
        currency="INR",
        status="RELEASED",
        escrow_transaction_hash=f"SIM-ESCROW-DEMO-{datetime.utcnow().strftime('%M%S')}",
        escrowed_at=datetime.utcnow(),
        released_at=datetime.utcnow()
    )
    db.add(escrow)

    # Logistics
    logistics = LogisticsShipment(
        order_id=order.id,
        provider_name="RELOOP GreenLogistics Hub",
        vehicle_type="14-ft Electric / Bio-CNG Truck",
        vehicle_capacity_kg=7500.0,
        pickup_city="Ahmedabad",
        delivery_city="Vadodara",
        pickup_lat=23.0225,
        pickup_lng=72.5714,
        delivery_lat=22.3072,
        delivery_lng=73.1812,
        distance_km=82.0,
        estimated_travel_hours=2.2,
        transport_cost=logistics_cost,
        estimated_transport_emissions_kg=10.25,
        status="DELIVERED",
        tracking_step=4,
        waypoints=[
            {"name": "Ahmedabad Facility (ABC Mfg)", "lat": 23.0225, "lng": 72.5714, "status": "COMPLETED"},
            {"name": "Nadiad Expressway Junction", "lat": 22.6916, "lng": 72.8634, "status": "COMPLETED"},
            {"name": "Vadodara Plant (GreenPack)", "lat": 22.3072, "lng": 73.1812, "status": "COMPLETED"}
        ]
    )
    db.add(logistics)

    # Inspection
    inspection = QualityInspection(
        order_id=order.id,
        expected_quantity=qty,
        received_quantity=qty,
        expected_condition="Good",
        received_condition="Good",
        expected_contamination="Low",
        observed_contamination="Low",
        result="PASSED",
        inspection_notes="Passed 100%: Clean dry corrugated OCC 11 bales received. Fiber integrity certified.",
        inspector_name="Judge Verification Officer"
    )
    db.add(inspection)

    # Impact
    gross_saved = qty * 0.95
    impact = ImpactRecord(
        company_id=seller.id,
        order_id=order.id,
        material_category="Cardboard",
        quantity_kg=qty,
        virgin_material_avoided_kg=qty,
        virgin_carbon_factor=0.95,
        gross_carbon_avoided_kg=gross_saved,
        transport_emissions_kg=10.25,
        net_carbon_saved_kg=gross_saved - 10.25,
        landfill_space_saved_m3=17.5
    )
    db.add(impact)

    db.commit()

    return {
        "success": True,
        "order_number": order_num,
        "material": mat.name,
        "quantity_kg": qty,
        "match_score": "94%",
        "escrow_released_inr": total,
        "net_co2_saved_kg": gross_saved - 10.25,
        "message": "Full end-to-end circular transaction simulated and recorded."
    }
from datetime import datetime
