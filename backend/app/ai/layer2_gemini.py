import json
import httpx
from typing import List, Dict, Any
from app.core.config import settings
from app.schemas.schemas import RecommendationItem, GeminiRecommendationResponse

class GeminiLayer2Service:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    async def generate_personalized_recommendations(
        self,
        company_profile: Dict[str, Any],
        candidate_materials: List[Dict[str, Any]],
        category_label: str = "Recommended for your company"
    ) -> List[RecommendationItem]:
        """
        Ranks and generates explainable narratives for candidate materials.
        Strictly grounds recommendations in provided candidate objects.
        """
        if not candidate_materials:
            return []

        # If Gemini API key is configured, call Gemini Flash API
        if self.api_key and len(self.api_key) > 5:
            try:
                ranked = await self._call_gemini_api(company_profile, candidate_materials, category_label)
                if ranked:
                    return ranked
            except Exception as e:
                print(f"[Gemini Layer 2] API call failed: {e}, using grounded deterministic recommender")

        return self._deterministic_rerank_and_explain(company_profile, candidate_materials, category_label)

    async def generate_copilot_response(self, user_message: str, system_prompt: str = "") -> str:
        if not self.api_key or len(self.api_key) < 5:
            return "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment."
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={self.api_key.strip()}"
        
        prompt = f"{system_prompt}\n\nUser: {user_message}" if system_prompt else user_message
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        headers = {"Content-Type": "application/json"}
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                return f"Gemini API returned error: {resp.status_code}"
        except Exception as e:
            print(f"[Gemini Layer 2] Copilot chat error: {e}")
            return "I am currently unable to reach the Gemini service."

    def _deterministic_rerank_and_explain(
        self,
        company: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        category_label: str
    ) -> List[RecommendationItem]:
        """
        Grounded deterministic fallback ranking and explanation builder.
        """
        # Sort candidates primarily by match score and circularity
        sorted_candidates = sorted(
            candidates,
            key=lambda c: (c.get("match_score", 0) * 0.7 + c.get("trust_score", 0) * 0.3),
            reverse=True
        )

        results: List[RecommendationItem] = []
        for c in sorted_candidates[:12]:
            dist = c.get("distance_km", 50.0)
            score = c.get("match_score", 90.0)
            cat = c.get("category", "Packaging")
            qty = c.get("quantity_kg", 5000)
            company_type = company.get("company_type", "Manufacturer")
            
            # Generate grounded reason codes
            reason_codes = ["material_match"]
            if dist <= 100:
                reason_codes.append("nearby")
            if c.get("price_per_unit", 20) <= 25:
                reason_codes.append("good_price")
            if score >= 90:
                reason_codes.append("quantity_match")
            if c.get("circularity_score", 90) >= 90:
                reason_codes.append("high_circularity")

            # Grounded narrative explanation
            if category_label == "Because you purchased cardboard recently":
                explanation = f"Matches your facility's recurring {cat.lower()} requirement with {int(qty):,} kg available {dist} km away at ₹{c.get('price_per_unit', 0)}/kg."
            elif category_label == "Best nearby materials":
                explanation = f"Located just {dist} km away in {c.get('seller_city', 'nearby hub')}, cutting transport emissions to {c.get('estimated_transport_emissions_kg', 12)} kg CO2e."
            elif category_label == "High circular-impact materials":
                explanation = f"High purity post-industrial grade with {c.get('circularity_score', 95)}% circularity potential, avoiding virgin feedstock."
            else:
                explanation = f"This {cat.lower()} matches your required grade and quantity ({int(qty):,} kg) and is located {dist} km away."

            results.append(
                RecommendationItem(
                    material_id=c["id"],
                    material_code=c.get("code", "MAT-1000"),
                    material_name=c.get("name", "Surplus Packaging"),
                    category=cat,
                    seller_name=c.get("seller_name", "Verified Supplier"),
                    seller_city=c.get("seller_city", "Ahmedabad"),
                    quantity_kg=float(qty),
                    price_per_unit=float(c.get("price_per_unit", 15.0)),
                    distance_km=float(dist),
                    estimated_delivered_cost=float(c.get("delivered_cost_per_kg", c.get("price_per_unit", 15.0))),
                    circularity_score=float(c.get("circularity_score", 92.0)),
                    trust_score=float(c.get("trust_score", 90.0)),
                    recommendation_score=float(score),
                    reason_codes=reason_codes,
                    explanation=explanation,
                    primary_image_url=c.get("primary_image_url")
                )
            )

        return results

    async def _call_gemini_api(
        self,
        company: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        category_label: str
    ) -> List[RecommendationItem]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={self.api_key}"
        
        prompt = f"""You are the Layer 2 Recommendation Engine for RELOOP circular B2B exchange.
Given buyer company context and candidate packaging materials, score and write a concise, strictly factual 1-sentence explanation for each material.
Company Profile: {json.dumps(company)}
Category Context: "{category_label}"
Candidate Materials: {json.dumps(candidates[:8])}

Return ONLY valid JSON matching this schema:
{{
  "recommendations": [
    {{
      "material_id": "string",
      "recommendation_score": number (0-100),
      "reason_codes": ["material_match", "nearby", "good_price", "quantity_match", "high_circularity"],
      "explanation": "concise grounded 1-sentence explanation"
    }}
  ]
}}"""
        
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_text)
                
                # Map back to full Candidate Items
                cand_map = {c["id"]: c for c in candidates}
                items: List[RecommendationItem] = []
                for rec in parsed.get("recommendations", []):
                    mat_id = rec.get("material_id")
                    if mat_id in cand_map:
                        c = cand_map[mat_id]
                        items.append(
                            RecommendationItem(
                                material_id=c["id"],
                                material_code=c.get("code", "MAT-1000"),
                                material_name=c.get("name", "Surplus Packaging"),
                                category=c.get("category", "Packaging"),
                                seller_name=c.get("seller_name", "Verified Supplier"),
                                seller_city=c.get("seller_city", "Ahmedabad"),
                                quantity_kg=float(c.get("quantity_kg", 5000)),
                                price_per_unit=float(c.get("price_per_unit", 15.0)),
                                distance_km=float(c.get("distance_km", 50.0)),
                                estimated_delivered_cost=float(c.get("delivered_cost_per_kg", 18.0)),
                                circularity_score=float(c.get("circularity_score", 92.0)),
                                trust_score=float(c.get("trust_score", 90.0)),
                                recommendation_score=float(rec.get("recommendation_score", c.get("match_score", 90.0))),
                                reason_codes=rec.get("reason_codes", ["material_match"]),
                                explanation=rec.get("explanation", "Grounded match for your manufacturing requirements."),
                                primary_image_url=c.get("primary_image_url")
                            )
                        )
                return items
            return []

    async def generate_simulator_insight(self, original_best: Dict[str, Any], new_best: Dict[str, Any], multiplier: float) -> str:
        if not self.api_key or len(self.api_key) < 5:
            return f"With a transport multiplier of {multiplier}, the new best match is {new_best.get('name', 'Unknown')}."
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={self.api_key.strip()}"
        prompt = f"""You are an AI analyst for a supply chain platform. Compare these two simulation results.
Original Best Partner: {json.dumps(original_best)}
New Best Partner (with transport multiplier {multiplier}): {json.dumps(new_best)}

Write a concise 1-2 sentence business insight explaining why the new partner is better under the new transport rates."""
        
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"[Gemini Layer 2] Simulator insight error: {e}")
        return f"With a transport multiplier of {multiplier}, the new best match is {new_best.get('name', 'Unknown')}."

    async def generate_logistics_insight(self, consolidation_data: Dict[str, Any]) -> str:
        if not self.api_key or len(self.api_key) < 5:
            return "Consolidated milk-runs reduce distance and overall freight costs."
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={self.api_key.strip()}"
        prompt = f"""You are a logistics AI assistant. Analyze this milk-run consolidation scenario:
Data: {json.dumps(consolidation_data)}

Write a concise 1-2 sentence insight about the cost and emissions savings from consolidating these shipments instead of running separate trucks."""
        
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"[Gemini Layer 2] Logistics insight error: {e}")
        return "Consolidated milk-runs reduce distance and overall freight costs."

    async def generate_match_explanation(self, material_name: str, buyer_name: str, score_breakdown: Dict[str, Any]) -> str:
        if not self.api_key or len(self.api_key) < 5:
            return f"Good match based on deterministic factors."
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={self.api_key.strip()}"
        prompt = f"""You are an AI matchmaking assistant in a B2B circular economy platform.
Material: {material_name}
Buyer: {buyer_name}
Match Scores (0-100): {json.dumps(score_breakdown)}

Write a concise, persuasive 2-sentence paragraph explaining why this buyer is a strong match for this material, focusing on the highest scoring categories."""
        
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"[Gemini Layer 2] Match explanation error: {e}")
        return f"Good match based on deterministic factors."

gemini_layer2 = GeminiLayer2Service()
