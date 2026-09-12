from typing import Dict, Any, List
from app.models.database import Company
from app.matching.engine import calculate_haversine_distance
from app.utils.price_fetcher import get_market_price

# MOCK_BUYER_CANDIDATES removed in favor of real database query

class ScenarioSimulator:
    def simulate(
        self,
        db: Any,
        material_category: str,
        base_quantity_kg: float,
        material_unit_price: float,
        transport_rate_multiplier: float,
        contamination_level: str,
        origin_city: str
    ) -> Dict[str, Any]:
        origin_coords = (23.0225, 72.5714) # Default Ahmedabad

        # Fetch real buyers from DB
        buyers = db.query(Company).filter(
            Company.company_type.in_(["Manufacturer", "Recycler", "Packaging Supplier"])
        ).all()
        
        candidates = []
        for b in buyers:
            candidates.append({
                "id": b.id,
                "name": b.name,
                "city": b.city,
                "lat": b.latitude,
                "lng": b.longitude,
                "target_price": get_market_price(material_category),  # Real‑time market price
                "demand_capacity_kg": 25000,
                "trust_score": b.trust_score,
                "acceptable_contamination": ["None", "Low", "Moderate"] if b.company_type == "Recycler" else ["None", "Low"]
            })
            
        if not candidates:
            return {"error": "No buyers found"}

        # Baseline calculation (transport_rate_multiplier = 1.0)
        baseline_results = self._evaluate_candidates(
            candidates, base_quantity_kg, material_unit_price, 1.0, contamination_level, origin_coords
        )
        
        # Scenario calculation with user multiplier
        scenario_results = self._evaluate_candidates(
            candidates, base_quantity_kg, material_unit_price, transport_rate_multiplier, contamination_level, origin_coords
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
        candidates: List[Dict[str, Any]],
        qty_kg: float,
        unit_price: float,
        trans_mult: float,
        contamination: str,
        origin_coords: tuple
    ) -> List[Dict[str, Any]]:
        tonnage = qty_kg / 1000.0
        results = []

        for b in candidates:
            dist = calculate_haversine_distance(origin_coords[0], origin_coords[1], b["lat"], b["lng"])

            # Realistic Indian road freight: ~15 INR/ton-km (includes fuel, driver, toll, overheads)
            # Minimum shipment cost: ₹1500 (loading, unloading, paperwork) regardless of distance
            BASE_RATE_PER_TON_KM = 15.0
            MIN_SHIPMENT_COST_INR = 1500.0

            variable_cost = dist * tonnage * BASE_RATE_PER_TON_KM * trans_mult
            transport_cost = max(MIN_SHIPMENT_COST_INR * trans_mult, variable_cost)
            delivered_cost_per_kg = round(unit_price + (transport_cost / qty_kg), 3)

            # Contamination penalty
            contam_penalty = 0.0
            if contamination not in b["acceptable_contamination"]:
                contam_penalty = 25.0
            elif contamination == "Moderate":
                contam_penalty = 8.0
            elif contamination == "High":
                contam_penalty = 18.0

            # Distance score (closer = better)
            dist_score = max(30.0, 100.0 - (dist * 0.25))

            # Delivered cost score vs buyer's target price
            price_diff = b["target_price"] - delivered_cost_per_kg
            cost_score = max(0.0, min(99.0, 75.0 + (price_diff * 6.0)))

            # Circularity score
            circ_score = max(30.0, 94.0 - contam_penalty)

            # Transport surge penalty: distant buyers are penalised more during a surge.
            # At +30% surge (mult=1.3) a buyer 200km away loses ~12 match points.
            surge_ratio = max(0.0, trans_mult - 1.0)
            transport_surge_penalty = surge_ratio * 40.0 * (dist / 200.0)

            match_score = round(
                (0.30 * 95.0) +
                (0.20 * 90.0) +
                (0.20 * dist_score) +
                (0.15 * cost_score) +
                (0.15 * circ_score) -
                transport_surge_penalty,
                1
            )

            results.append({
                "id": b["id"],
                "name": b["name"],
                "city": b["city"],
                "distance_km": round(dist, 1),
                "delivered_cost_per_kg": delivered_cost_per_kg,
                "transport_cost_total": round(transport_cost, 2),
                "transport_emissions_kg": round(tonnage * dist * 0.125, 1),
                "match_score": match_score,
                "trust_score": b["trust_score"]
            })

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results

simulator_engine = ScenarioSimulator()
