from typing import Dict, Any, List
from app.models.database import Company
from app.matching.engine import calculate_haversine_distance

MOCK_BUYER_CANDIDATES = [
    {
        "id": "comp-buyer-1",
        "name": "GreenPack Kraft Mills Ltd",
        "city": "Vadodara",
        "lat": 22.3072,
        "lng": 73.1812,
        "target_price": 18.5,
        "demand_capacity_kg": 20000,
        "trust_score": 96.0,
        "acceptable_contamination": ["None", "Low"]
    },
    {
        "id": "comp-buyer-2",
        "name": "Navrangpura Corrugators & Packaging",
        "city": "Ahmedabad",
        "lat": 23.0338,
        "lng": 72.5568,
        "target_price": 16.0,
        "demand_capacity_kg": 6000,
        "trust_score": 92.0,
        "acceptable_contamination": ["None", "Low", "Moderate"]
    },
    {
        "id": "comp-buyer-3",
        "name": "Surat Circular Polymer & Paper Hub",
        "city": "Surat",
        "lat": 21.1702,
        "lng": 72.8311,
        "target_price": 21.0,
        "demand_capacity_kg": 35000,
        "trust_score": 94.0,
        "acceptable_contamination": ["None", "Low"]
    },
    {
        "id": "comp-buyer-4",
        "name": "Saurashtra Pulp & Reclaiming Co",
        "city": "Rajkot",
        "lat": 22.3039,
        "lng": 70.8022,
        "target_price": 17.5,
        "demand_capacity_kg": 15000,
        "trust_score": 88.0,
        "acceptable_contamination": ["None", "Low", "Moderate", "High"]
    }
]

class ScenarioSimulator:
    def simulate(
        self,
        material_category: str,
        base_quantity_kg: float,
        material_unit_price: float,
        transport_rate_multiplier: float,
        contamination_level: str,
        origin_city: str
    ) -> Dict[str, Any]:
        origin_coords = (23.0225, 72.5714) # Default Ahmedabad

        # Baseline calculation (transport_rate_multiplier = 1.0)
        baseline_results = self._evaluate_candidates(
            base_quantity_kg, material_unit_price, 1.0, contamination_level, origin_coords
        )
        
        # Scenario calculation with user multiplier
        scenario_results = self._evaluate_candidates(
            base_quantity_kg, material_unit_price, transport_rate_multiplier, contamination_level, origin_coords
        )

        original_best = baseline_results[0]
        new_best = scenario_results[0]

        # Formulate human-grounded insight explanation
        if original_best["id"] != new_best["id"]:
            takeaway = (
                f"With transport rates adjusted by {int((transport_rate_multiplier - 1.0) * 100):+}%, "
                f"{new_best['name']} ({new_best['city']}) becomes the optimal partner over {original_best['name']} "
                f"because they are located closer ({new_best['distance_km']} km vs {original_best['distance_km']} km), "
                f"yielding a lower net delivered cost (₹{new_best['delivered_cost_per_kg']}/kg) and higher composite match score ({new_best['match_score']}%)."
            )
        else:
            takeaway = (
                f"{new_best['name']} remains the top buyer with a {new_best['match_score']}% match. "
                f"Delivered cost adjusted from ₹{original_best['delivered_cost_per_kg']}/kg to ₹{new_best['delivered_cost_per_kg']}/kg."
            )

        return {
            "original_best_buyer": original_best,
            "new_best_buyer": new_best,
            "candidate_comparison": scenario_results,
            "key_takeaway": takeaway
        }

    def _evaluate_candidates(
        self,
        qty_kg: float,
        unit_price: float,
        trans_mult: float,
        contamination: str,
        origin_coords: tuple
    ) -> List[Dict[str, Any]]:
        tonnage = qty_kg / 1000.0
        results = []

        for b in MOCK_BUYER_CANDIDATES:
            dist = calculate_haversine_distance(origin_coords[0], origin_coords[1], b["lat"], b["lng"])
            
            # Transport cost calculation
            base_rate_per_ton_km = 4.8 * trans_mult
            transport_cost = dist * tonnage * base_rate_per_ton_km
            delivered_cost_per_kg = round(unit_price + (transport_cost / qty_kg), 2)
            
            # Contamination penalty
            contam_penalty = 0.0
            if contamination not in b["acceptable_contamination"]:
                contam_penalty = 25.0
            elif contamination == "Moderate":
                contam_penalty = 8.0
            elif contamination == "High":
                contam_penalty = 18.0

            # Distance score
            dist_score = max(30.0, 100.0 - (dist * 0.25))
            
            # Delivered cost score compared to buyer target
            price_diff = b["target_price"] - delivered_cost_per_kg
            cost_score = max(40.0, min(99.0, 75.0 + (price_diff * 4.0)))

            # Circularity score
            circ_score = max(30.0, 94.0 - contam_penalty)

            # Match Score
            match_score = round(
                (0.30 * 95.0) +
                (0.20 * 90.0) +
                (0.20 * dist_score) +
                (0.15 * cost_score) +
                (0.15 * circ_score),
                1
            )

            results.append({
                "id": b["id"],
                "name": b["name"],
                "city": b["city"],
                "distance_km": dist,
                "delivered_cost_per_kg": delivered_cost_per_kg,
                "transport_cost_total": round(transport_cost, 2),
                "transport_emissions_kg": round(tonnage * dist * 0.125, 1),
                "match_score": match_score,
                "trust_score": b["trust_score"]
            })

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results

simulator_engine = ScenarioSimulator()
