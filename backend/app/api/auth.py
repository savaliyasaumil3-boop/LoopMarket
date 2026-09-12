from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.database import get_db, User, Company, CompanyProfile
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create Company
    company = Company(
        name=req.company_name,
        company_type=req.company_type,
        industry=req.industry,
        company_size=req.company_size or "Medium (50-250)",
        location=f"{req.city}, {req.state}",
        city=req.city,
        state=req.state or "Gujarat",
        latitude=23.0225,
        longitude=72.5714,
        contact_person=req.full_name,
        email=req.email.lower(),
        phone=req.phone,
        is_verified=True,
        verification_tier="DEMO_VERIFIED",
        trust_score=92.0
    )
    db.add(company)
    db.flush()

    # Create Profile
    profile = CompanyProfile(
        company_id=company.id,
        bio=f"Verified {req.company_type} operating in {req.city}.",
        total_materials_sold_kg=0.0,
        total_materials_bought_kg=0.0,
        total_waste_diverted_kg=0.0,
        total_co2_saved_kg=0.0,
        completed_transactions_count=0
    )
    db.add(profile)

    # Create User
    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role="ADMIN" if req.company_type == "Manufacturer" else "SELLER",
        company_id=company.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(company)

    token = create_access_token({"sub": user.id, "email": user.email, "company_id": company.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role},
        "company": {"id": company.id, "name": company.name, "company_type": company.company_type, "city": company.city, "trust_score": company.trust_score}
    }

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    company = db.query(Company).filter(Company.id == user.company_id).first()
    token = create_access_token({"sub": user.id, "email": user.email, "company_id": company.id if company else None})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role},
        "company": {
            "id": company.id if company else "",
            "name": company.name if company else "RELOOP Enterprise",
            "company_type": company.company_type if company else "Manufacturer",
            "city": company.city if company else "Ahmedabad",
            "trust_score": company.trust_score if company else 95.0
        }
    }

@router.get("/me")
def get_current_user_profile(email: str = "abc@reloop.in", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = db.query(User).first()
    company = db.query(Company).filter(Company.id == user.company_id).first()
    profile = db.query(CompanyProfile).filter(CompanyProfile.company_id == company.id).first() if company else None

    return {
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role},
        "company": {
            "id": company.id if company else "",
            "name": company.name if company else "",
            "company_type": company.company_type if company else "",
            "industry": company.industry if company else "",
            "city": company.city if company else "",
            "trust_score": company.trust_score if company else 90.0,
            "verification_tier": company.verification_tier if company else "DEMO_VERIFIED",
            "stats": {
                "total_sold_kg": profile.total_materials_sold_kg if profile else 0,
                "total_bought_kg": profile.total_materials_bought_kg if profile else 0,
                "waste_diverted_kg": profile.total_waste_diverted_kg if profile else 0,
                "co2_saved_kg": profile.total_co2_saved_kg if profile else 0,
                "completed_transactions": profile.completed_transactions_count if profile else 0,
                "on_time_rate": profile.on_time_delivery_rate if profile else 96.0,
                "acceptance_rate": profile.material_acceptance_rate if profile else 95.0,
            }
        }
    }
