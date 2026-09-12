import re
import json
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.schemas.schemas import Layer1ParsedListing, Layer1ParsedRequirement

CITY_COORDINATES = {
    "ahmedabad": (23.0225, 72.5714),
    "vadodara": (22.3072, 73.1812),
    "surat": (21.1702, 72.8311),
    "rajkot": (22.3039, 70.8022),
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "delhi": (28.6139, 77.2090),
    "bengaluru": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
}

class MiniMaxLayer1Service:
    def __init__(self):
        self.api_key = settings.MINIMAX_API_KEY
        self.group_id = settings.MINIMAX_GROUP_ID

    async def parse_unstructured_listing(self, text: str) -> Layer1ParsedListing:
        """
        Parses unstructured text describing surplus packaging material.
        Uses MiniMax-L6-v2 if configured, otherwise deterministic fallback.
        """
        if self.api_key and len(self.api_key) > 5:
            try:
                res = await self._call_minimax_llm(
                    prompt=f"""You are an industrial material parser for RELOOP B2B circular exchange.
Convert this surplus packaging material description into strict JSON with fields:
- material_type: (cardboard, paper, plastic, pallets, wood, crates, reusable_boxes, packaging_film, other)
- subtype: specific name e.g. corrugated_cardboard, hdpe_drums, wooden_pallets
- quantity_kg: number in kg (e.g. 5 tons = 5000, 3 tonnes = 3000)
- grade: (e.g. OCC Grade 11, HDPE Grade A, Euro Standard, Industrial)
- condition: (excellent, good, reusable, recyclable, degraded)
- contamination_level: (none, low, moderate, high)
- location: city name
- price_per_unit: estimated or extracted price in INR/kg or null
- availability: (immediate, 1_week, recurring)
- packaging_type: (Baled / Bundled, Boxed, Loose, Palletized)

Input: "{text}"
Return ONLY pure JSON with no markdown formatting.""",
                )
                data = json.loads(res)
                return Layer1ParsedListing(**data)
            except Exception as e:
                print(f"[MiniMax Layer 1] API failed or error: {e}, falling back to deterministic extraction")

        return self._deterministic_extract_listing(text)

    async def parse_unstructured_requirement(self, text: str) -> Layer1ParsedRequirement:
        """
        Parses buyer 'wanted material' natural language requirement.
        """
        if self.api_key and len(self.api_key) > 5:
            try:
                res = await self._call_minimax_llm(
                    prompt=f"""Convert this buyer material procurement requirement into strict JSON:
- material_type: (cardboard, paper, plastic, pallets, wood, crates, reusable_boxes, packaging_film, other)
- subtype: specific type or null
- quantity_kg: number in kg
- condition: (reusable, recyclable, any)
- radius_km: number in km (default 150)
- location: buyer city
- max_price: target price in INR/kg or null

Input: "{text}"
Return ONLY pure JSON.""",
                )
                data = json.loads(res)
                return Layer1ParsedRequirement(**data)
            except Exception as e:
                print(f"[MiniMax Layer 1] Requirement API error: {e}, using deterministic parser")

        return self._deterministic_extract_requirement(text)

    async def parse_search_query(self, query: str) -> Dict[str, Any]:
        """
        Converts natural language search query into structured search filters.
        e.g. "Find 2 tonnes of reusable plastic packaging within 100 km of Ahmedabad below ₹40/kg"
        """
        lower = query.lower()
        extracted = {
            "category": None,
            "condition": None,
            "max_distance_km": None,
            "city": None,
            "max_price": None,
            "min_quantity_kg": None,
            "raw_query": query
        }

        # Categories
        if "cardboard" in lower or "corrugated" in lower or "box" in lower:
            extracted["category"] = "Cardboard"
        elif "plastic" in lower or "hdpe" in lower or "pp" in lower or "drum" in lower:
            extracted["category"] = "Plastic"
        elif "pallet" in lower or "wood" in lower or "crate" in lower:
            extracted["category"] = "Pallets"
        elif "paper" in lower:
            extracted["category"] = "Paper"
        elif "film" in lower or "shrink" in lower or "wrap" in lower:
            extracted["category"] = "Packaging Film"

        # Condition
        if "reusable" in lower or "reuse" in lower:
            extracted["condition"] = "Reusable"
        elif "clean" in lower or "good" in lower:
            extracted["condition"] = "Good"
        elif "recycle" in lower or "recyclable" in lower:
            extracted["condition"] = "Recyclable"

        # Distance
        dist_match = re.search(r'(\d+)\s*(?:km|kms|kilometer|kilometres)', lower)
        if dist_match:
            extracted["max_distance_km"] = float(dist_match.group(1))

        # Price
        price_match = re.search(r'(?:below|under|max|less than|₹|rs\.?)\s*(\d+(?:\.\d+)?)', lower)
        if price_match:
            extracted["max_price"] = float(price_match.group(1))

        # Quantity
        ton_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ton|tons|tonne|tonnes)', lower)
        if ton_match:
            extracted["min_quantity_kg"] = float(ton_match.group(1)) * 1000
        else:
            kg_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilograms)', lower)
            if kg_match:
                extracted["min_quantity_kg"] = float(kg_match.group(1))

        # City
        for city in CITY_COORDINATES.keys():
            if city in lower:
                extracted["city"] = city.capitalize()
                break

        return extracted

    def _deterministic_extract_listing(self, text: str) -> Layer1ParsedListing:
        lower = text.lower()
        
        # Determine category
        cat = "Cardboard"
        subtype = "Corrugated Cardboard Boxes"
        if "plastic" in lower or "hdpe" in lower or "pet" in lower:
            cat = "Plastic"
            subtype = "HDPE Baled Polymer"
        elif "pallet" in lower or "wood" in lower:
            cat = "Pallets"
            subtype = "Heavy Duty Euro Pallets"
        elif "crate" in lower:
            cat = "Crates"
            subtype = "Returnable HDPE Crates"
        elif "paper" in lower:
            cat = "Paper"
            subtype = "Kraft Paper Surplus Rolls"
        elif "film" in lower or "shrink" in lower or "wrap" in lower:
            cat = "Packaging Film"
            subtype = "LDPE Clear Stretch Film"

        # Quantity
        quantity_kg = 5000.0
        ton_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ton|tons|tonne|tonnes)', lower)
        if ton_match:
            quantity_kg = float(ton_match.group(1)) * 1000.0
        else:
            kg_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos)', lower)
            if kg_match:
                quantity_kg = float(kg_match.group(1))

        # Condition
        condition = "Good"
        if "excellent" in lower or "clean" in lower or "like new" in lower:
            condition = "Excellent"
        elif "reusable" in lower:
            condition = "Reusable"
        elif "recyclable" in lower or "waste" in lower:
            condition = "Recyclable"

        # Contamination
        contamination = "Low"
        if "none" in lower or "uncontaminated" in lower or "virgin clean" in lower:
            contamination = "None"
        elif "moderate" in lower or "slight" in lower:
            contamination = "Moderate"
        elif "high" in lower or "dirty" in lower:
            contamination = "High"

        # City
        location = "Ahmedabad"
        for city in CITY_COORDINATES.keys():
            if city in lower:
                location = city.capitalize()
                break

        # Price
        price = 14.5
        price_match = re.search(r'(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)', lower)
        if price_match:
            price = float(price_match.group(1))

        return Layer1ParsedListing(
            material_type=cat,
            subtype=subtype,
            quantity_kg=quantity_kg,
            grade="OCC Grade 11" if cat == "Cardboard" else "Industrial Grade A",
            condition=condition,
            contamination_level=contamination,
            location=location,
            price_per_unit=price,
            availability="immediate",
            intended_use=None,
            packaging_type="Baled / Bundled"
        )

    def _deterministic_extract_requirement(self, text: str) -> Layer1ParsedRequirement:
        lower = text.lower()
        cat = "Cardboard"
        if "plastic" in lower:
            cat = "Plastic"
        elif "pallet" in lower or "wood" in lower:
            cat = "Pallets"
        elif "paper" in lower:
            cat = "Paper"

        quantity_kg = 3000.0
        ton_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ton|tons|tonne|tonnes)', lower)
        if ton_match:
            quantity_kg = float(ton_match.group(1)) * 1000.0

        location = "Ahmedabad"
        for city in CITY_COORDINATES.keys():
            if city in lower:
                location = city.capitalize()
                break

        dist = 100.0
        dist_match = re.search(r'(\d+)\s*(?:km|kms)', lower)
        if dist_match:
            dist = float(dist_match.group(1))

        return Layer1ParsedRequirement(
            material_type=cat,
            subtype=None,
            quantity_kg=quantity_kg,
            condition="reusable",
            radius_km=dist,
            location=location,
            max_price=22.0
        )

    async def _call_minimax_llm(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        url = "https://api.minimax.chat/v1/text/chatcompletion_v2"
        payload = {
            "model": "abab6.5s-chat", # MiniMax chat model
            "messages": [
                {"role": "system", "content": "You are an industrial parser. Output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            raise Exception(f"MiniMax API returned {resp.status_code}: {resp.text}")

minimax_layer1 = MiniMaxLayer1Service()
