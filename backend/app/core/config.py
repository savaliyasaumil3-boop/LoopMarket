import os
from pydantic_settings import BaseSettings
from typing import Dict

class Settings(BaseSettings):
    PROJECT_NAME: str = "RELOOP - AI-Powered Circular Packaging Exchange"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./reloop.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "reloop-super-secure-production-key-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # AI Layer 1: MiniMax L6-v2
    MINIMAX_API_KEY: str = os.getenv("MINIMAX_API_KEY", "")
    MINIMAX_GROUP_ID: str = os.getenv("MINIMAX_GROUP_ID", "")
    
    # AI Layer 2: Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Matching Engine Weights
    WEIGHT_MATERIAL_COMPATIBILITY: float = 0.30
    WEIGHT_QUANTITY_COMPATIBILITY: float = 0.20
    WEIGHT_DISTANCE: float = 0.20
    WEIGHT_DELIVERED_COST: float = 0.15
    WEIGHT_CIRCULARITY: float = 0.15
    
    # Carbon emissions factors (kg CO2e per ton-km)
    ROAD_FREIGHT_EMISSION_FACTOR: float = 0.125
    
    # Virgin material carbon intensity (kg CO2e per kg virgin material)
    VIRGIN_CARBON_FACTORS: Dict[str, float] = {
        "cardboard": 0.95,
        "paper": 0.85,
        "plastic": 2.45,
        "pallets": 0.40,
        "wood": 0.35,
        "crates": 1.80,
        "reusable_boxes": 1.20,
        "packaging_film": 2.80,
        "other": 1.00
    }

    class Config:
        case_sensitive = True

settings = Settings()
