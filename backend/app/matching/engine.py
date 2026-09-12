import math
from typing import Dict, Any, List, Tuple
from app.core.config import settings
from app.models.database import MaterialListing, Company, MaterialRequirement

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers between two lat/lng pairs."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class HybridMatchingEngine:
    def __init__(self):
        self.w_mat = settings.WEIGHT_MATERIAL_COMPATIBILITY
        self.w_qty = settings.WEIGHT_QUANTITY_COMPATIBILITY
        self.w_dist = settings.WEIGHT_DISTANCE
        self.w_cost = settings.WEIGHT_DELIVERED_COST
        self.w_circ = settings.WEIGHT_CIRCULARITY

    def score_material_buyer_match(
        self,
        material: MaterialListing,
        buyer_company: Company,
        requirement: MaterialRequirement = None,
        custom_buyer_coords: Tuple[float, float] = None
    ) -> Dict[str, Any]:
        """
        Computes 5-dimension deterministic match score between a material listing and a buyer.
        """
        # 1. Material Compatibility (0-100)
        # Category match, grade, condition
        mat_score = 95.0
        if requirement:
            if requirement.category.lower() != material.category.lower():
                mat_score = 30.0 # mismatch category
            else:
                if requirement.desired_condition and material.condition:
                    if requirement.desired_condition.lower() == material.condition.lower():
                        mat_score = 98.0
                    elif material.condition.lower() in ["excellent", "good", "reusable"]:
                        mat_score = 92.0
                    else:
                        mat_score = 80.0
        else:
            # Baseline company type heuristic
            if buyer_company.company_type == "Recycler":
                mat_score = 90.0 if material.condition in ["Recyclable", "Degraded", "Good"] else 85.0
            elif buyer_company.company_type in ["Manufacturer", "Packaging Supplier"]:
                mat_score = 96.0 if material.condition in ["Excellent", "Good", "Reusable"] else 75.0

        # 2. Quantity Compatibility (0-100)
        req_qty = requirement.required_quantity_kg if requirement else 5000.0
        avail_qty = material.quantity_kg
        ratio = min(avail_qty, req_qty) / max(avail_qty, req_qty) if max(avail_qty, req_qty) > 0 else 1.0
        qty_score = round(max(50.0, ratio * 100.0), 1)

        # 3. Distance (0-100)
        buyer_lat = custom_buyer_coords[0] if custom_buyer_coords else buyer_company.latitude
        buyer_lng = custom_buyer_coords[1] if custom_buyer_coords else buyer_company.longitude
        distance_km = calculate_haversine_distance(material.latitude, material.longitude, buyer_lat, buyer_lng)
        
        # Max reasonable radius = 350 km
        if distance_km <= 30.0:
            dist_score = 99.0
        elif distance_km <= 100.0:
            dist_score = max(80.0, 100.0 - (distance_km * 0.2))
        elif distance_km <= 250.0:
            dist_score = max(60.0, 90.0 - (distance_km * 0.15))
        else:
            dist_score = max(40.0, 80.0 - (distance_km * 0.1))
        dist_score = round(dist_score, 1)

        # 4. Delivered Cost Score (0-100)
        # Transport cost = distance * (tonnage) * ₹4.5/ton-km
        tonnage = material.quantity_kg / 1000.0
        transport_rate_per_ton_km = 4.8 # INR
        transport_cost = distance_km * tonnage * transport_rate_per_ton_km
        delivered_cost_per_kg = material.price_per_unit + (transport_cost / material.quantity_kg)
        
        # Benchmark comparison: typical virgin packaging cost = ₹28 - ₹45/kg
        benchmark_cost = 25.0
        cost_savings_pct = (benchmark_cost - delivered_cost_per_kg) / benchmark_cost if benchmark_cost > 0 else 0.1
        cost_score = round(min(99.0, max(50.0, 75.0 + (cost_savings_pct * 40.0))), 1)

        # 5. Circularity Score (0-100)
        # Factors: material circularity potential, contamination level
        circ_base = material.circularity_potential or 90.0
        if material.contamination_level == "None":
            circ_score = min(99.0, circ_base + 5.0)
        elif material.contamination_level == "Low":
            circ_score = circ_base
        elif material.contamination_level == "Moderate":
            circ_score = max(60.0, circ_base - 15.0)
        else:
            circ_score = max(40.0, circ_base - 30.0)
        circ_score = round(circ_score, 1)

        # Compute Final Weighted Composite Match Score
        final_score = (
            (mat_score * self.w_mat) +
            (qty_score * self.w_qty) +
            (dist_score * self.w_dist) +
            (cost_score * self.w_cost) +
            (circ_score * self.w_circ)
        )
        final_score = round(final_score, 1)

        # Transport Emissions
        emissions_kg = round(tonnage * distance_km * settings.ROAD_FREIGHT_EMISSION_FACTOR, 1)

        # Build Explainable Reasons
        why_points = []
        if mat_score >= 85:
            why_points.append("✓ Material grade compatible")
        if qty_score >= 80:
            why_points.append(f"✓ Required quantity available ({int(material.quantity_kg):,} kg)")
        if distance_km <= 150:
            why_points.append(f"✓ {distance_km} km from your facility")
        else:
            why_points.append(f"• Regional transport distance ({distance_km} km)")
        if cost_score >= 80:
            why_points.append(f"✓ Competitive delivered cost (₹{delivered_cost_per_kg:.2f}/kg)")
        if circ_score >= 85:
            why_points.append("✓ High reuse & circularity potential")

        return {
            "match_score": final_score,
            "material_compatibility": mat_score,
            "quantity_compatibility": qty_score,
            "distance_score": dist_score,
            "cost_score": cost_score,
            "circularity_score": circ_score,
            "distance_km": distance_km,
            "delivered_cost_per_kg": round(delivered_cost_per_kg, 2),
            "transport_cost": round(transport_cost, 2),
            "estimated_transport_emissions_kg": emissions_kg,
            "why_points": why_points
        }

matching_engine = HybridMatchingEngine()
