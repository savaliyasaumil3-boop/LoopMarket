from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.database import get_db, LogisticsShipment, Order, Company
from app.logistics.optimizer import logistics_optimizer

router = APIRouter(prefix="/logistics", tags=["Logistics & Fleet Optimization"])

class RouteQuoteRequest(BaseModel):
    origin_city: str = "Ahmedabad"
    destination_city: str = "Vadodara"
    weight_kg: float = 5000.0
    vehicle_type: Optional[str] = "14-ft Electric / Bio-CNG Truck"

class ConsolidationRequest(BaseModel):
    pickups: List[Dict[str, Any]]
    delivery_city: str = "Surat"
    truck_capacity_kg: Optional[float] = 7500.0

@router.get("")
def list_shipments(db: Session = Depends(get_db)):
    shipments = db.query(LogisticsShipment).all()
    results = []
    for s in shipments:
        order = db.query(Order).filter(Order.id == s.order_id).first()
        results.append({
            "id": s.id,
            "order_id": s.order_id,
            "order_number": order.order_number if order else "ORD-2026",
            "provider_name": s.provider_name,
            "vehicle_type": s.vehicle_type,
            "pickup_city": s.pickup_city,
            "delivery_city": s.delivery_city,
            "distance_km": s.distance_km,
            "estimated_travel_hours": s.estimated_travel_hours,
            "transport_cost": s.transport_cost,
            "estimated_transport_emissions_kg": s.estimated_transport_emissions_kg,
            "status": s.status,
            "tracking_step": s.tracking_step,
            "waypoints": s.waypoints or []
        })
    return results

@router.get("/{id}")
def get_shipment_detail(id: str, db: Session = Depends(get_db)):
    s = db.query(LogisticsShipment).filter(LogisticsShipment.id == id).first()
    if not s:
        s = db.query(LogisticsShipment).filter(LogisticsShipment.order_id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")

    order = db.query(Order).filter(Order.id == s.order_id).first()

    return {
        "id": s.id,
        "order_id": s.order_id,
        "order_number": order.order_number if order else "ORD-2026",
        "provider_name": s.provider_name,
        "vehicle_type": s.vehicle_type,
        "pickup_city": s.pickup_city,
        "delivery_city": s.delivery_city,
        "pickup_coords": [s.pickup_lat, s.pickup_lng],
        "delivery_coords": [s.delivery_lat, s.delivery_lng],
        "distance_km": s.distance_km,
        "estimated_travel_hours": s.estimated_travel_hours,
        "transport_cost": s.transport_cost,
        "estimated_transport_emissions_kg": s.estimated_transport_emissions_kg,
        "status": s.status,
        "tracking_step": s.tracking_step,
        "waypoints": s.waypoints or []
    }

@router.post("/quote")
def get_route_quote(req: RouteQuoteRequest):
    return logistics_optimizer.calculate_single_route(
        origin_city=req.origin_city,
        dest_city=req.destination_city,
        weight_kg=req.weight_kg,
        vehicle_type=req.vehicle_type or "14-ft Electric / Bio-CNG Truck"
    )

from app.ai.layer2_gemini import gemini_layer2

@router.post("/optimize")
async def optimize_consolidation(req: ConsolidationRequest):
    result = logistics_optimizer.optimize_consolidated_shipment(
        pickups=req.pickups,
        delivery_city=req.delivery_city,
        truck_capacity_kg=req.truck_capacity_kg or 7500.0
    )
    
    ai_insight = await gemini_layer2.generate_logistics_insight(result)
    result["ai_insight"] = ai_insight
    return result
