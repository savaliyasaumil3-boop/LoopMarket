from fastapi import APIRouter, Depends
from app.schemas.schemas import SimulatorRequest, SimulatorResponse
from app.simulator.engine import simulator_engine
from app.ai.layer2_gemini import gemini_layer2
from sqlalchemy.orm import Session
from app.models.database import get_db
router = APIRouter(prefix="/simulator", tags=["Scenario Simulator"])

@router.post("/run")
async def run_scenario_simulation(req: SimulatorRequest, db: Session = Depends(get_db)):
    result = simulator_engine.simulate(
        db,
        material_category=req.material_category,
        base_quantity_kg=req.base_quantity_kg,
        material_unit_price=req.material_unit_price,
        transport_rate_multiplier=req.transport_rate_multiplier,
        contamination_level=req.contamination_level,
        origin_city=req.origin_city
    )
    
    ai_insight = await gemini_layer2.generate_simulator_insight(
        original_best=result["original_best_buyer"],
        new_best=result["new_best_buyer"],
        multiplier=req.transport_rate_multiplier
    )
    
    result["key_takeaway"] = ai_insight
    return result
