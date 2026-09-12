import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="SELLER") # SELLER, BUYER, RECYCLER, LOGISTICS, ADMIN
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="users")

class Company(Base):
    __tablename__ = "companies"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), index=True, nullable=False)
    company_type = Column(String(50), nullable=False) # Manufacturer, Retailer, Recycler, Logistics Provider, Packaging Supplier, Other
    industry = Column(String(100), nullable=False) # FMCG, Manufacturing, Retail, E-commerce, Food & Beverage, Automotive, Pharmaceuticals, Other
    company_size = Column(String(50), default="Medium (50-250)") # Small (1-50), Medium (50-250), Large (250-1000), Enterprise (1000+)
    location = Column(String(255), nullable=False) # e.g. Ahmedabad, Gujarat
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), default="Gujarat")
    latitude = Column(Float, nullable=False, default=23.0225)
    longitude = Column(Float, nullable=False, default=72.5714)
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    is_verified = Column(Boolean, default=True)
    verification_tier = Column(String(50), default="DEMO_VERIFIED") # UNVERIFIED, DEMO_VERIFIED, AUDITED
    trust_score = Column(Float, default=90.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="company")
    profile = relationship("CompanyProfile", uselist=False, back_populates="company")
    materials = relationship("MaterialListing", back_populates="seller")
    requirements = relationship("MaterialRequirement", back_populates="buyer")
    orders_as_buyer = relationship("Order", foreign_keys="[Order.buyer_id]", back_populates="buyer")
    orders_as_seller = relationship("Order", foreign_keys="[Order.seller_id]", back_populates="seller")
    relationships_out = relationship("CompanyRelationship", foreign_keys="[CompanyRelationship.from_company_id]", back_populates="from_company")
    relationships_in = relationship("CompanyRelationship", foreign_keys="[CompanyRelationship.to_company_id]", back_populates="to_company")
    initiative_relations = relationship("CompanyRelationship", foreign_keys="[CompanyRelationship.initiated_by]", back_populates="initiator")

class CompanyProfile(Base):
    __tablename__ = "company_profiles"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    total_materials_sold_kg = Column(Float, default=0.0)
    total_materials_bought_kg = Column(Float, default=0.0)
    total_waste_diverted_kg = Column(Float, default=0.0)
    total_co2_saved_kg = Column(Float, default=0.0)
    completed_transactions_count = Column(Integer, default=0)
    on_time_delivery_rate = Column(Float, default=96.0) # Percentage
    material_acceptance_rate = Column(Float, default=95.0) # Percentage
    dispute_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="profile")

class CompanyRelationship(Base):
    __tablename__ = "company_relationships"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    from_company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    to_company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    initiated_by = Column(String(36), ForeignKey("companies.id"), nullable=True)
    relationship_type = Column(String(50), nullable=False)  # supplier, buyer, recycler, logistics
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=True)
    status = Column(String(50), default="pending")  # pending, accepted, rejected, active, paused, completed, cancelled
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    price = Column(Float, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    from_company = relationship("Company", foreign_keys=[from_company_id], back_populates="relationships_out")
    to_company = relationship("Company", foreign_keys=[to_company_id], back_populates="relationships_in")
    initiator = relationship("Company", foreign_keys=[initiated_by], back_populates="initiative_relations")

class MaterialListing(Base):
    __tablename__ = "materials"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True) # e.g. MAT-1024
    name = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False) # Cardboard, Paper, Plastic, Pallets, Wood, Crates, Reusable Boxes, Packaging Film, Other
    subtype = Column(String(100), nullable=True) # Corrugated boxes, HDPE flake, Wooden Euro-pallets
    quantity = Column(Float, nullable=False) # e.g. 5000
    unit = Column(String(50), default="kg") # kg, units, tonnes
    quantity_kg = Column(Float, nullable=False) # normalized to kg
    grade = Column(String(100), default="Standard") # OCC Grade 11, HDPE Grade A, Euro Standard
    condition = Column(String(50), default="Good") # Excellent, Good, Reusable, Recyclable, Degraded
    contamination_level = Column(String(50), default="Low") # None, Low, Moderate, High
    dimensions = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    packaging_type = Column(String(100), default="Baled / Bundled")
    description = Column(Text, nullable=True)
    price_per_unit = Column(Float, nullable=False) # INR
    min_order_quantity = Column(Float, default=500.0)
    available_from = Column(DateTime, default=datetime.utcnow)
    available_until = Column(DateTime, nullable=True)
    location_city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    delivery_options = Column(String(100), default="Seller Arranged or Buyer Pickup")
    status = Column(String(50), default="AVAILABLE") # AVAILABLE, RESERVED, SOLD, DELISTED
    circularity_potential = Column(Float, default=90.0) # 0-100 score
    primary_image_url = Column(String(500), nullable=True)
    seller_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller = relationship("Company", back_populates="materials")
    passport = relationship("MaterialPassport", uselist=False, back_populates="material")
    images = relationship("MaterialImage", back_populates="material")

class MaterialImage(Base):
    __tablename__ = "material_images"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("MaterialListing", back_populates="images")

class MaterialPassport(Base):
    __tablename__ = "material_passports"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("materials.id"), unique=True, nullable=False)
    passport_code = Column(String(100), unique=True, index=True) # DP-MAT-1024
    qr_code_data = Column(Text, nullable=False)
    composition_details = Column(JSON, nullable=True)
    lifecycle_stage = Column(String(100), default="Post-Industrial Packaging")
    purity_percentage = Column(Float, default=95.0)
    reusability_rating = Column(String(50), default="HIGH") # HIGH, MEDIUM, LOW
    embodied_carbon_saved_per_kg = Column(Float, default=0.95)
    provenance_history = Column(JSON, nullable=True)
    verification_hash = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("MaterialListing", back_populates="passport")

class MaterialRequirement(Base):
    __tablename__ = "material_requirements"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    subtype = Column(String(100), nullable=True)
    required_quantity_kg = Column(Float, nullable=False)
    grade = Column(String(100), default="Any / Compatible")
    desired_condition = Column(String(50), default="Reusable")
    max_acceptable_distance_km = Column(Float, default=200.0)
    target_price_per_kg = Column(Float, nullable=False)
    destination_city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    required_by_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="ACTIVE") # ACTIVE, FULFILLED, EXPIRED
    buyer_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("Company", back_populates="requirements")

class MatchRecord(Base):
    __tablename__ = "matches"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    buyer_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    requirement_id = Column(String(36), ForeignKey("material_requirements.id"), nullable=True)
    match_score = Column(Float, nullable=False) # 0-100
    material_compatibility_score = Column(Float, nullable=False)
    quantity_compatibility_score = Column(Float, nullable=False)
    distance_score = Column(Float, nullable=False)
    delivered_cost_score = Column(Float, nullable=False)
    circularity_score = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    estimated_delivered_cost = Column(Float, nullable=False)
    estimated_transport_emissions = Column(Float, nullable=False)
    why_points = Column(JSON, nullable=False) # List of explanations
    created_at = Column(DateTime, default=datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    category_label = Column(String(100), default="Recommended for your company")
    recommendation_score = Column(Float, nullable=False)
    reason_codes = Column(JSON, nullable=False)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class BidNegotiation(Base):
    __tablename__ = "bids"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    buyer_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    offered_price_per_unit = Column(Float, nullable=False)
    offered_quantity = Column(Float, nullable=False)
    proposed_pickup_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, COUNTERED, ACCEPTED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    contract_number = Column(String(100), unique=True, index=True)
    title = Column(String(255), nullable=False)
    seller_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    buyer_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    material_name = Column(String(255), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    delivery_terms = Column(Text, nullable=False)
    payment_terms = Column(Text, nullable=False)
    inspection_terms = Column(Text, nullable=False)
    dispute_terms = Column(Text, nullable=False)
    contract_duration = Column(String(100), default="Single Transaction / 30 Days")
    status = Column(String(50), default="DRAFT") # DRAFT, PENDING_ACCEPTANCE, ACTIVE, COMPLETED, REJECTED
    is_ai_draft = Column(Boolean, default=True)
    seller_signed = Column(Boolean, default=False)
    buyer_signed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(100), unique=True, index=True)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    seller_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    buyer_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    contract_id = Column(String(36), ForeignKey("contracts.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="kg")
    unit_price = Column(Float, nullable=False)
    subtotal_amount = Column(Float, nullable=False)
    logistics_cost = Column(Float, default=0.0)
    total_delivered_amount = Column(Float, nullable=False)
    status = Column(String(50), default="ORDER_CONFIRMED") 
    # LISTED, MATCHED, REQUESTED, NEGOTIATION, ORDER_CONFIRMED, PAYMENT_PENDING, ESCROWED, 
    # LOGISTICS_ASSIGNED, PICKUP_SCHEDULED, PICKED_UP, IN_TRANSIT, DELIVERED, 
    # INSPECTION, ACCEPTED, DISPUTED, PAYMENT_RELEASED, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    buyer = relationship("Company", foreign_keys=[buyer_id], back_populates="orders_as_buyer")
    seller = relationship("Company", foreign_keys=[seller_id], back_populates="orders_as_seller")
    escrow = relationship("EscrowPayment", uselist=False, back_populates="order")
    logistics = relationship("LogisticsShipment", uselist=False, back_populates="order")
    inspection = relationship("QualityInspection", uselist=False, back_populates="order")

class EscrowPayment(Base):
    __tablename__ = "payments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="ESCROWED") # PENDING, ESCROWED, RELEASED, REFUNDED, DISPUTED
    escrow_transaction_hash = Column(String(100), default="SIM-TX-89234A")
    escrowed_at = Column(DateTime, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="escrow")

class LogisticsShipment(Base):
    __tablename__ = "logistics"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True, nullable=False)
    provider_name = Column(String(255), default="RELOOP GreenLogistics Hub")
    vehicle_type = Column(String(100), default="14-ft Electric / Bio-CNG Truck")
    vehicle_capacity_kg = Column(Float, default=7500.0)
    pickup_city = Column(String(100), nullable=False)
    delivery_city = Column(String(100), nullable=False)
    pickup_lat = Column(Float, default=23.0225)
    pickup_lng = Column(Float, default=72.5714)
    delivery_lat = Column(Float, default=22.3072)
    delivery_lng = Column(Float, default=73.1812)
    distance_km = Column(Float, nullable=False)
    estimated_travel_hours = Column(Float, default=2.5)
    transport_cost = Column(Float, nullable=False)
    estimated_transport_emissions_kg = Column(Float, nullable=False)
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, PICKED_UP, IN_TRANSIT, DELIVERED
    tracking_step = Column(Integer, default=1) # 1: Scheduled, 2: Picked Up, 3: In Transit, 4: Delivered
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    waypoints = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="logistics")

class QualityInspection(Base):
    __tablename__ = "inspections"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True, nullable=False)
    expected_quantity = Column(Float, nullable=False)
    received_quantity = Column(Float, nullable=False)
    expected_condition = Column(String(50), nullable=False)
    received_condition = Column(String(50), nullable=False)
    expected_contamination = Column(String(50), nullable=False)
    observed_contamination = Column(String(50), nullable=False)
    result = Column(String(50), default="PASSED") # PASSED, FAILED, UNDER_DISPUTE
    inspection_notes = Column(Text, nullable=True)
    inspector_name = Column(String(255), default="QA Manager")
    photo_urls = Column(JSON, nullable=True)
    inspected_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="inspection")
    dispute = relationship("DisputeRecord", uselist=False, back_populates="inspection")

class DisputeRecord(Base):
    __tablename__ = "disputes"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    inspection_id = Column(String(36), ForeignKey("inspections.id"), unique=True, nullable=False)
    dispute_type = Column(String(100), nullable=False) # Quantity mismatch, Quality mismatch, Damage, Contamination, Late delivery, Wrong material
    evidence_text = Column(Text, nullable=False)
    evidence_photos = Column(JSON, nullable=True)
    status = Column(String(50), default="UNDER_REVIEW") # UNDER_REVIEW, RESOLVED_ACCEPTED, RESOLVED_REFUND, RESOLVED_REPLACEMENT, REJECTED
    resolution_notes = Column(Text, nullable=True)
    resolution_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    inspection = relationship("QualityInspection", back_populates="dispute")

class ImpactRecord(Base):
    __tablename__ = "impact_records"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True)
    material_category = Column(String(100), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    virgin_material_avoided_kg = Column(Float, nullable=False)
    virgin_carbon_factor = Column(Float, default=0.95)
    gross_carbon_avoided_kg = Column(Float, nullable=False)
    transport_emissions_kg = Column(Float, default=0.0)
    net_carbon_saved_kg = Column(Float, nullable=False)
    landfill_space_saved_m3 = Column(Float, default=0.0)
    methodology_version = Column(String(50), default="GHG-Protocol-CircularPackaging-v2")
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="MATCH") # MATCH, BID, ORDER, ESCROW, SHIPMENT, INSPECTION, DISPUTE, CONTRACT
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIInteraction(Base):
    __tablename__ = "ai_interactions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    prompt = Column(Text, nullable=False)
    layer = Column(String(50), default="LAYER_1_MINIMAX") # LAYER_1_MINIMAX, LAYER_2_GEMINI, ASSISTANT
    response_json = Column(JSON, nullable=False)
    model_used = Column(String(100), default="MiniMax-L6-v2")
    created_at = Column(DateTime, default=datetime.utcnow)

# Engine and Session initialization
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
