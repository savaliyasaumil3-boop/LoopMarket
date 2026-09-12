import math
from typing import List, Dict, Any, Tuple
from app.core.config import settings

CITY_LAT_LNG = {
    "Ahmedabad": (23.0225, 72.5714),
    "Vadodara": (22.3072, 73.1812),
    "Surat": (21.1702, 72.8311),
    "Rajkot": (22.3039, 70.8022),
    "Mumbai": (19.0760, 72.8777),
    "Pune": (18.5204, 73.8567),
    "Delhi": (28.6139, 77.2090),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
}

def haversine(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    R = 6371.0
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class LogisticsOptimizer:
    def calculate_single_route(
        self,
        origin_city: str,
        dest_city: str,
        weight_kg: float,
        vehicle_type: str = "14-ft CNG Carrier"
    ) -> Dict[str, Any]:
        c1 = CITY_LAT_LNG.get(origin_city, (23.0225, 72.5714))
        c2 = CITY_LAT_LNG.get(dest_city, (22.3072, 73.1812))
        
        # Road factor ~ 1.25x haversine
        road_distance_km = round(haversine(c1, c2) * 1.22, 1)
        if road_distance_km < 10.0:
            road_distance_km = 15.0

        tonnage = weight_kg / 1000.0
        rate_per_ton_km = 4.8
        base_fee = 1200.0
        transport_cost = round(base_fee + (road_distance_km * tonnage * rate_per_ton_km), 2)
        
        # Emission: kg CO2e
        emissions_kg = round(tonnage * road_distance_km * settings.ROAD_FREIGHT_EMISSION_FACTOR, 1)
        
        # Travel time: average speed 45 km/h + 45m handling
        est_hours = round(0.75 + (road_distance_km / 45.0), 1)

        waypoints = [
            {"name": f"Origin: {origin_city}", "lat": c1[0], "lng": c1[1], "type": "pickup"},
            {"name": f"Midway Hub", "lat": (c1[0] + c2[0]) / 2, "lng": (c1[1] + c2[1]) / 2, "type": "checkpoint"},
            {"name": f"Destination: {dest_city}", "lat": c2[0], "lng": c2[1], "type": "delivery"}
        ]

        return {
            "origin_city": origin_city,
            "destination_city": dest_city,
            "origin_coords": c1,
            "destination_coords": c2,
            "distance_km": road_distance_km,
            "weight_kg": weight_kg,
            "vehicle_type": vehicle_type,
            "estimated_travel_hours": est_hours,
            "transport_cost": transport_cost,
            "estimated_transport_emissions_kg": emissions_kg,
            "waypoints": waypoints
        }

    def optimize_consolidated_shipment(
        self,
        pickups: List[Dict[str, Any]], # [{"city": "Ahmedabad", "weight_kg": 3000}, {"city": "Vadodara", "weight_kg": 2000}]
        delivery_city: str = "Surat",
        truck_capacity_kg: float = 7500.0
    ) -> Dict[str, Any]:
        """
        Consolidation route optimizer comparing individual dedicated trips vs multi-stop consolidated milk run.
        """
        dest_coords = CITY_LAT_LNG.get(delivery_city, (21.1702, 72.8311))
        
        # 1. Unoptimized baseline (separate dedicated truck for each pickup)
        unopt_distance = 0.0
        unopt_cost = 0.0
        unopt_emissions = 0.0

        for p in pickups:
            route = self.calculate_single_route(p["city"], delivery_city, p["weight_kg"])
            unopt_distance += route["distance_km"]
            unopt_cost += route["transport_cost"]
            unopt_emissions += route["estimated_transport_emissions_kg"]

        # 2. Consolidated Milk-Run Route
        # Sequence: Pickup 1 -> Pickup 2 -> Delivery
        total_weight = sum(p["weight_kg"] for p in pickups)
        can_consolidate = total_weight <= truck_capacity_kg

        if len(pickups) >= 2:
            p1_coords = CITY_LAT_LNG.get(pickups[0]["city"], (23.0225, 72.5714))
            p2_coords = CITY_LAT_LNG.get(pickups[1]["city"], (22.3072, 73.1812))
            
            leg1 = haversine(p1_coords, p2_coords) * 1.2
            leg2 = haversine(p2_coords, dest_coords) * 1.2
            opt_distance = round(leg1 + leg2, 1)
        else:
            opt_distance = unopt_distance

        opt_tonnage = total_weight / 1000.0
        opt_cost = round(1800.0 + (opt_distance * opt_tonnage * 3.8), 2)
        opt_emissions = round(opt_tonnage * opt_distance * settings.ROAD_FREIGHT_EMISSION_FACTOR * 0.85, 1)

        cost_saved = round(max(0.0, unopt_cost - opt_cost), 2)
        dist_saved = round(max(0.0, unopt_distance - opt_distance), 1)
        emissions_saved = round(max(0.0, unopt_emissions - opt_emissions), 1)

        return {
            "is_feasible": can_consolidate,
            "total_weight_kg": total_weight,
            "truck_capacity_kg": truck_capacity_kg,
            "capacity_utilization_pct": round((total_weight / truck_capacity_kg) * 100, 1),
            "unoptimized": {
                "total_distance_km": round(unopt_distance, 1),
                "total_cost": round(unopt_cost, 2),
                "total_emissions_kg": round(unopt_emissions, 1)
            },
            "optimized": {
                "total_distance_km": round(opt_distance, 1),
                "total_cost": round(opt_cost, 2),
                "total_emissions_kg": round(opt_emissions, 1)
            },
            "savings": {
                "cost_saved_inr": cost_saved,
                "cost_savings_pct": round((cost_saved / unopt_cost) * 100, 1) if unopt_cost > 0 else 0,
                "distance_saved_km": dist_saved,
                "emissions_saved_kg_co2e": emissions_saved
            }
        }

logistics_optimizer = LogisticsOptimizer()
