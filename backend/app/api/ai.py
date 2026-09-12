from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models.database import get_db, MaterialListing, Company, Order, MaterialRequirement
from app.schemas.schemas import (
    Layer1ParsedListing, Layer1ParsedRequirement, AssistantChatRequest, AssistantChatResponse
)
from app.ai.layer1_minimax import minimax_layer1
from app.logistics.optimizer import logistics_optimizer
from app.matching.engine import matching_engine

router = APIRouter(prefix="/ai", tags=["AI Copilot & Services"])

@router.post("/parse", response_model=Layer1ParsedListing)
async def parse_unstructured_listing(data: Dict[str, str]):
    text = data.get("text", "")
    return await minimax_layer1.parse_unstructured_listing(text)

@router.post("/parse-requirement", response_model=Layer1ParsedRequirement)
async def parse_unstructured_requirement(data: Dict[str, str]):
    text = data.get("text", "")
    return await minimax_layer1.parse_unstructured_requirement(text)

@router.post("/chat", response_model=AssistantChatResponse)
async def conversational_assistant(req: AssistantChatRequest, db: Session = Depends(get_db)):
    msg = req.message.lower()
    intent = "GENERAL"
    reply = ""
    suggested_actions = []
    data_payload = {}

    # 1. Search intent
    if "find" in msg or "search" in msg or "need" in msg or "looking for" in msg:
        intent = "SEARCH_MATERIALS"
        extracted = await minimax_layer1.parse_search_query(req.message)
        cat = extracted.get("category")
        
        query = db.query(MaterialListing).filter(MaterialListing.status == "AVAILABLE")
        if cat:
            query = query.filter(MaterialListing.category.ilike(f"%{cat}%"))
        
        materials = query.limit(5).all()
        mat_summaries = []
        for m in materials:
            mat_summaries.append(f"• {m.name} ({int(m.quantity_kg):,} kg in {m.location_city} at ₹{m.price_per_unit}/kg)")
        
        reply = (
            f"I found {len(materials)} available lots matching your criteria ({cat or 'Packaging'}):\n" +
            "\n".join(mat_summaries) +
            "\n\nWould you like me to calculate delivered cost or open the marketplace view?"
        )
        suggested_actions = [
            {"label": "View in Marketplace", "action": "NAVIGATE", "route": "/marketplace"},
            {"label": "Post Procurement Requirement", "action": "NAVIGATE", "route": "/requirements"}
        ]
        data_payload = {"count": len(materials), "category": cat}

    # 2. Who buys / demand intent
    elif "who buys" in msg or "buyer" in msg or "sell" in msg:
        intent = "FIND_BUYERS"
        cat = "Cardboard" if "cardboard" in msg else ("Pallet" if "pallet" in msg else "Plastic")
        buyers = db.query(Company).filter(Company.company_type.in_(["Packaging Supplier", "Manufacturer", "Recycler"])).limit(3).all()
        
        buyer_list = []
        for b in buyers:
            buyer_list.append(f"• {b.name} ({b.city}) — Trust Score: {b.trust_score}/100")

        reply = (
            f"Here are verified industrial buyers actively procuring {cat} surplus in your region:\n" +
            "\n".join(buyer_list) +
            f"\n\nYou can list your {cat} inventory or use our 'Find Best Buyers' feature to rank them by net delivered price."
        )
        suggested_actions = [
            {"label": "List Surplus Material", "action": "NAVIGATE", "route": "/sell"},
            {"label": "Explore Buyer Demands", "action": "NAVIGATE", "route": "/requirements"}
        ]

    # 3. Logistics and delivery cost intent
    elif "cost" in msg or "freight" in msg or "delivery" in msg or "logistics" in msg:
        intent = "CALCULATE_FREIGHT"
        route_info = logistics_optimizer.calculate_single_route("Ahmedabad", "Vadodara", 5000.0)
        reply = (
            f"Estimated logistics breakdown for 5,000 kg from Ahmedabad to Vadodara:\n" +
            f"• Distance: {route_info['distance_km']} km (via expressway)\n" +
            f"• Estimated Travel Time: {route_info['estimated_travel_hours']} hours\n" +
            f"• Freight Cost: ₹{route_info['transport_cost']:,} (₹{route_info['transport_cost']/5000:.2f}/kg)\n" +
            f"• Carbon Footprint: {route_info['estimated_transport_emissions_kg']} kg CO2e\n" +
            "RELOOP verified CNG/Electric carrier can be booked directly on order confirmation."
        )
        suggested_actions = [
            {"label": "Open Logistics Console", "action": "NAVIGATE", "route": "/logistics"},
            {"label": "Simulate Transport Surges", "action": "NAVIGATE", "route": "/simulator"}
        ]

    # 4. Recommendations explanation intent
    elif "why" in msg or "recommend" in msg:
        intent = "EXPLAIN_MATCH"
        reply = (
            "RELOOP generates matches using a deterministic 5-factor scoring model:\n" +
            "1. Material & Grade Compatibility (30% weight)\n" +
            "2. Quantity Fit against batch sizes (20% weight)\n" +
            "3. Distance & Transit Hub proximity (20% weight)\n" +
            "4. Delivered Cost vs virgin alternative (15% weight)\n" +
            "5. Circularity & Purity Score (15% weight)\n\n" +
            "Gemini Layer 2 then personalizes the ranking based on your company's historic transactions."
        )
        suggested_actions = [
            {"label": "View Recommendations", "action": "NAVIGATE", "route": "/recommendations"}
        ]

    # 5. Default General Copilot
    else:
        intent = "GENERAL"
        reply = (
            "I am RELOOP's AI Circular Assistant. I can help you:\n" +
            "1. Search surplus packaging lots using natural language\n" +
            "2. Parse text/voice into Digital Material Passports\n" +
            "3. Rank verified buyers and compute delivered costs\n" +
            "4. Calculate freight routes and avoided CO2 emissions\n\n" +
            "How can I assist your circular supply operations today?"
        )
        suggested_actions = [
            {"label": "Explore Marketplace", "action": "NAVIGATE", "route": "/marketplace"},
            {"label": "List Your Material", "action": "NAVIGATE", "route": "/sell"},
            {"label": "What-If Simulator", "action": "NAVIGATE", "route": "/simulator"}
        ]

    return AssistantChatResponse(
        reply=reply,
        intent=intent,
        suggested_actions=suggested_actions,
        data=data_payload
    )
