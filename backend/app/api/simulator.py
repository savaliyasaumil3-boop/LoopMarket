from fastapi import APIRouter
from app.schemas.schemas import SimulatorRequest, SimulatorResponse
from app.simulator.engine import simulator_engine

router = APIRouter(prefix="/simulator", tags=["Scenario Simulator"])

@router.post("/run", response_model=SimulatorResponse)
def run_scenario_simulation(req: SimulatorRequest):
    return simulator_engine.simulate(
        material_category=req.material_category,
        base_quantity_kg=req.base_quantity_kg,
        material_unit_price=req.material_unit_price,
        transport_rate_multiplier=req.transport_rate_multiplier,
        contamination_level=req.contamination_level,
        origin_city=req.origin_city
    )
