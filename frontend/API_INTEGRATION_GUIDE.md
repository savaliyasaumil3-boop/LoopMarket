# 🔌 Real API Integration Guide

## Quick Start - Connect to Real Logistics APIs

### 1. Porter API Integration (Recommended)

Porter is India's largest intra-city logistics platform with real-time tracking.

#### Setup:
```bash
# Install Porter SDK (if available) or use REST API
npm install axios
```

#### Configuration:
```typescript
// frontend/src/lib/porter.ts
const PORTER_API_KEY = import.meta.env.VITE_PORTER_API_KEY;
const PORTER_API_URL = 'https://api.porter.in/v1';

export const porterAPI = {
  // Get available vehicles
  async getVehicles(pickup: string, drop: string, weight_kg: number) {
    const response = await fetch(`${PORTER_API_URL}/get_quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': PORTER_API_KEY
      },
      body: JSON.stringify({
        pickup_details: { address: pickup },
        drop_details: { address: drop },
        customer: { name: 'Customer', mobile: { country_code: '+91', number: '9999999999' } }
      })
    });
    return response.json();
  },

  // Create order
  async bookVehicle(orderData: any) {
    const response = await fetch(`${PORTER_API_URL}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': PORTER_API_KEY
      },
      body: JSON.stringify(orderData)
    });
    return response.json();
  },

  // Track order
  async trackOrder(orderId: string) {
    const response = await fetch(`${PORTER_API_URL}/orders/${orderId}`, {
      headers: { 'X-API-KEY': PORTER_API_KEY }
    });
    return response.json();
  }
};
```

#### Update VehicleSelection Component:
```typescript
// In VehicleSelection.tsx
useEffect(() => {
  const fetchRealVehicles = async () => {
    try {
      const data = await porterAPI.getVehicles(
        pickupCity,
        deliveryCity,
        weight_kg
      );
      
      // Map Porter response to our vehicle format
      const mappedVehicles = data.fare_breakup.map((vehicle: any) => ({
        id: vehicle.vehicle_type,
        name: vehicle.vehicle_type,
        capacity_kg: vehicle.max_load_kg,
        base_price: vehicle.base_fare,
        price_per_km: vehicle.per_km_rate,
        available_count: vehicle.available_vehicles || 0,
        rating: 4.7,
        features: vehicle.features || []
      }));
      
      setVehicles(mappedVehicles);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      // Fallback to mock data
    }
  };
  
  fetchRealVehicles();
}, [pickupCity, deliveryCity, weight_kg]);
```

### 2. Google Maps API (Optional Upgrade)

Replace Leaflet with Google Maps for production quality.

#### Setup:
```bash
npm install @googlemaps/js-api-loader
```

#### Get API Key:
1. Go to: https://console.cloud.google.com/google/maps-apis
2. Create project
3. Enable Maps JavaScript API, Directions API, Geocoding API
4. Create API Key
5. Add to `.env`: `VITE_GOOGLE_MAPS_API_KEY=your_key_here`

#### Update GoogleMapsView Component:
```typescript
// In GoogleMapsView.tsx
import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry']
});

useEffect(() => {
  loader.load().then((google) => {
    const map = new google.maps.Map(mapContainerRef.current!, {
      center: { lat: origin.lat, lng: origin.lng },
      zoom: 10,
      mapTypeId: 'roadmap'
    });

    // Add origin marker
    new google.maps.Marker({
      position: { lat: origin.lat, lng: origin.lng },
      map: map,
      label: 'A',
      title: origin.name
    });

    // Add destination marker
    new google.maps.Marker({
      position: { lat: destination.lat, lng: destination.lng },
      map: map,
      label: 'B',
      title: destination.name
    });

    // Draw route
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false
    });

    directionsService.route({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
      }
    });
  });
}, [origin, destination]);
```

### 3. Real-time Tracking with WebSockets

#### Backend Setup (Node.js example):
```typescript
// backend/websocket/trackingServer.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Subscribe to vehicle tracking
  ws.on('message', (message) => {
    const { orderId } = JSON.parse(message.toString());
    
    // Poll Porter API or GPS device
    const interval = setInterval(async () => {
      const location = await porterAPI.trackOrder(orderId);
      
      ws.send(JSON.stringify({
        orderId,
        lat: location.current_lat,
        lng: location.current_lng,
        speed_kmh: location.speed,
        timestamp: new Date().toISOString()
      }));
    }, 5000); // Update every 5 seconds

    ws.on('close', () => {
      clearInterval(interval);
    });
  });
});
```

#### Frontend Update:
```typescript
// In VehicleTracker.tsx
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ orderId: shipmentId }));
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setCurrentLocation({
      lat: data.lat,
      lng: data.lng,
      timestamp: data.timestamp,
      speed_kmh: data.speed_kmh
    });
  };
  
  return () => ws.close();
}, [shipmentId]);
```

### 4. Environment Variables Setup

Create `.env` file in frontend directory:
```env
# Porter API
VITE_PORTER_API_KEY=your_porter_api_key
VITE_PORTER_API_URL=https://api.porter.in/v1

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Shadowfax (alternative)
VITE_SHADOWFAX_API_KEY=your_shadowfax_key
VITE_SHADOWFAX_API_URL=https://api.shadowfax.in/v2

# Backend WebSocket
VITE_WS_URL=ws://localhost:8080
```

### 5. Backend API Endpoints

Add these to your backend (`backend/app/api/logistics.py`):

```python
from fastapi import APIRouter, HTTPException
import httpx
from app.core.config import settings

router = APIRouter(prefix="/logistics", tags=["Logistics"])

@router.post("/quote")
async def get_porter_quote(data: dict):
    """Get real-time vehicle quote from Porter"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.PORTER_API_URL}/get_quote",
            headers={"X-API-KEY": settings.PORTER_API_KEY},
            json=data
        )
        return response.json()

@router.post("/book")
async def book_porter_vehicle(data: dict):
    """Book vehicle through Porter API"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.PORTER_API_URL}/orders/create",
            headers={"X-API-KEY": settings.PORTER_API_KEY},
            json=data
        )
        return response.json()

@router.get("/track/{order_id}")
async def track_shipment(order_id: str):
    """Get real-time tracking data"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.PORTER_API_URL}/orders/{order_id}",
            headers={"X-API-KEY": settings.PORTER_API_KEY}
        )
        return response.json()
```

Update `backend/app/core/config.py`:
```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Porter API
    PORTER_API_KEY: str = os.getenv("PORTER_API_KEY", "")
    PORTER_API_URL: str = "https://api.porter.in/v1"
    
    # Google Maps
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
```

### 6. Testing Integration

```typescript
// Test Porter API connection
async function testPorterIntegration() {
  try {
    const quote = await porterAPI.getVehicles(
      'Ahmedabad, Gujarat',
      'Vadodara, Gujarat',
      5000
    );
    console.log('✅ Porter API working:', quote);
  } catch (error) {
    console.error('❌ Porter API failed:', error);
  }
}

// Run test
testPorterIntegration();
```

## 📋 Checklist for Going Live

- [ ] Get Porter API key from https://porter.in/developers
- [ ] Get Google Maps API key (optional)
- [ ] Add API keys to `.env` files (frontend + backend)
- [ ] Update VehicleSelection to use real API
- [ ] Set up WebSocket server for live tracking
- [ ] Test with small orders first
- [ ] Add error handling and fallbacks
- [ ] Monitor API usage and costs
- [ ] Set up logging for debugging
- [ ] Add rate limiting to prevent API abuse

## 🚨 Important Notes

1. **Never commit API keys** - Use `.gitignore` for `.env` files
2. **Use backend proxy** - Don't expose API keys in frontend
3. **Handle failures gracefully** - Always have mock data fallback
4. **Monitor costs** - Set up billing alerts
5. **Test in sandbox** - Porter provides test environment

## 💡 Alternative: Dunzo / Shadowfax

If Porter is not available, these alternatives work similarly:

**Dunzo API**: https://dunzo.in/business
**Shadowfax API**: https://www.shadowfax.in/developer-api
**Delhivery API**: https://www.delhivery.com/app/api

All follow similar REST patterns and provide tracking capabilities.

---

**Estimated Integration Time**: 4-6 hours with API access
**Difficulty Level**: Medium (Good API documentation available)
