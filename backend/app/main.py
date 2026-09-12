from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import (
    auth, companies, materials, requirements, matching,
    orders, contracts, logistics, inspections, impact,
    simulator, ai, admin
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade API for RELOOP - AI-Powered Circular Packaging & Materials Exchange",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(materials.router, prefix="/api/v1")
app.include_router(requirements.router, prefix="/api/v1")
app.include_router(matching.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(contracts.router, prefix="/api/v1")
app.include_router(logistics.router, prefix="/api/v1")
app.include_router(inspections.router, prefix="/api/v1")
app.include_router(impact.router, prefix="/api/v1")
app.include_router(simulator.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "theme": "Circular Carbon Ecosystem"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "RELOOP-Core"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
