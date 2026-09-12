from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    company_name: str
    company_type: str
    industry: str
    company_size: Optional[str] = "Medium (50-250)"
    location: str
    city: str
    state: Optional[str] = "Gujarat"
    phone: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    company: Dict[str, Any]

# --- AI LAYER 1 SCHEMAS ---
class Layer1ParsedListing(BaseModel):
    material_type: str = Field(description="Normalized primary category e.g. cardboard, plastic, paper, pallets, wood, crates, reusable_boxes, packaging_film")
    subtype: Optional[str] = Field(None, description="Specific subcategory e.g. corrugated_cardboard, hdpe_flake")
    quantity_kg: float = Field(description="Quantity normalized into kilograms")
    grade: Optional[str] = "Standard"
    condition: str = Field("good", description="excellent, good, reusable, recyclable, degraded")
    contamination_level: str = Field("low", description="none, low, moderate, high")
    location: str = Field(description="City or regional hub")
    price_per_unit: Optional[float] = Field(None, description="Price per kg/unit in INR")
    availability: Optional[str] = "immediate"
    intended_use: Optional[str] = None
    packaging_type: Optional[str] = "Baled / Bundled"

class Layer1ParsedRequirement(BaseModel):
    material_type: str
    subtype: Optional[str] = None
    quantity_kg: float
    condition: Optional[str] = "reusable"
    radius_km: Optional[float] = 150.0
    location: str
    max_price: Optional[float] = None
    required_by: Optional[str] = None

class Layer1SearchQuery(BaseModel):
    query: str

# --- AI LAYER 2 SCHEMAS ---
class RecommendationItem(BaseModel):
    material_id: str
    material_code: str
    material_name: str
    category: str
    seller_name: str
    seller_city: str
    quantity_kg: float
    price_per_unit: float
    distance_km: float
    estimated_delivered_cost: float
    circularity_score: float
    trust_score: float
    recommendation_score: float
    reason_codes: List[str]
    explanation: str
    primary_image_url: Optional[str] = None

class GeminiRecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]
    category_title: str = "Recommended for your company"

# --- MATCHING SCHEMAS ---
class MatchExplanation(BaseModel):
    match_score: float
    material_compatibility: float
    quantity_compatibility: float
    distance_score: float
    cost_score: float
    circularity_score: float
    distance_km: float
    delivered_cost: float
    why_points: List[str]

# --- MATERIAL LISTING SCHEMAS ---
class MaterialCreate(BaseModel):
    name: str
    category: str
    subtype: Optional[str] = None
    quantity: float
    unit: str = "kg"
    grade: Optional[str] = "Standard"
    condition: Optional[str] = "Good"
    contamination_level: Optional[str] = "Low"
    dimensions: Optional[str] = None
    color: Optional[str] = None
    packaging_type: Optional[str] = "Baled / Bundled"
    description: Optional[str] = None
    price_per_unit: float
    min_order_quantity: Optional[float] = 500.0
    location_city: str
    delivery_options: Optional[str] = "Seller Arranged or Buyer Pickup"
    primary_image_url: Optional[str] = None

# --- REQUIREMENT CREATE SCHEMAS ---
class RequirementCreate(BaseModel):
    title: str
    category: str
    subtype: Optional[str] = None
    required_quantity_kg: float
    grade: Optional[str] = "Any / Compatible"
    desired_condition: Optional[str] = "Reusable"
    max_acceptable_distance_km: Optional[float] = 150.0
    target_price_per_kg: float
    destination_city: str

# --- ORDER & ESCROW SCHEMAS ---
class OrderCreate(BaseModel):
    material_id: str
    quantity: float
    unit_price: float
    logistics_cost: Optional[float] = 0.0

class OrderStatusUpdate(BaseModel):
    status: str

# --- CONTRACT SCHEMAS ---
class ContractCreate(BaseModel):
    seller_id: str
    buyer_id: str
    material_name: str
    quantity_kg: float
    unit_price: float
    delivery_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    inspection_terms: Optional[str] = None
    dispute_terms: Optional[str] = None
    contract_duration: Optional[str] = "Single Transaction / 30 Days"

# --- INSPECTION & DISPUTE SCHEMAS ---
class InspectionCreate(BaseModel):
    order_id: str
    expected_quantity: float
    received_quantity: float
    expected_condition: str
    received_condition: str
    expected_contamination: str
    observed_contamination: str
    result: str # PASSED, FAILED, UNDER_DISPUTE
    inspection_notes: Optional[str] = None
    inspector_name: Optional[str] = "QA Officer"
    photo_urls: Optional[List[str]] = []

class DisputeCreate(BaseModel):
    inspection_id: str
    dispute_type: str
    evidence_text: str
    evidence_photos: Optional[List[str]] = []

# --- SIMULATOR SCHEMAS ---
class SimulatorRequest(BaseModel):
    material_category: str = "Cardboard"
    base_quantity_kg: float = 5000.0
    material_unit_price: float = 14.5
    transport_rate_multiplier: float = 1.0 # 1.0 = normal, 1.3 = +30%
    contamination_level: str = "Low" # None, Low, Moderate, High
    origin_city: str = "Ahmedabad"

class SimulatorResponse(BaseModel):
    original_best_buyer: Dict[str, Any]
    new_best_buyer: Dict[str, Any]
    candidate_comparison: List[Dict[str, Any]]
    key_takeaway: str

# --- AI ASSISTANT CHAT ---
class AssistantChatRequest(BaseModel):
    message: str
    company_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class AssistantChatResponse(BaseModel):
    reply: str
    intent: str
    suggested_actions: List[Dict[str, Any]] = []
    data: Optional[Dict[str, Any]] = None
