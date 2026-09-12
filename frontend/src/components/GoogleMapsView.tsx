import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Truck, MapPin, Layers } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface GoogleMapsViewProps {
  origin: Location;
  destination: Location;
  vehicleLocation?: { lat: number; lng: number };
  showRoute?: boolean;
  showLiveTracking?: boolean;
}

export const GoogleMapsView: React.FC<GoogleMapsViewProps> = ({
  origin,
  destination,
  vehicleLocation,
  showRoute = true,
  showLiveTracking = false
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize Leaflet map (Open source alternative to Google Maps)
    const map = L.map(mapContainerRef.current).setView(
      [origin.lat, origin.lng],
      10
    );

    // Add tile layer - Using OpenStreetMap (free alternative to Google Maps)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    // Custom marker icons
    const originIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: #10b981;
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          font-weight: bold;
          color: white;
          font-size: 14px;
        ">A</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const destinationIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          font-weight: bold;
          color: white;
          font-size: 14px;
        ">B</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Add origin marker
    L.marker([origin.lat, origin.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`<b>Pickup</b><br/>${origin.name}`);

    // Add destination marker
    L.marker([destination.lat, destination.lng], { icon: destinationIcon })
      .addTo(map)
      .bindPopup(`<b>Delivery</b><br/>${destination.name}`);

    // Draw route line
    if (showRoute) {
      const routeCoordinates: [number, number][] = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      ];

      L.polyline(routeCoordinates, {
        color: '#10b981',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(map);
    }

    // Fit bounds to show all markers
    const bounds = L.latLngBounds([
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [origin, destination, showRoute]);

  // Update vehicle location in real-time
  useEffect(() => {
    if (!mapRef.current || !vehicleLocation || !showLiveTracking) return;

    const truckIcon = L.divIcon({
      className: 'vehicle-marker',
      html: `
        <div style="
          background: #0f172a;
          border: 3px solid #10b981;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
            50% { box-shadow: 0 4px 20px rgba(16, 185, 129, 0.6); }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (vehicleMarkerRef.current) {
      // Animate marker movement
      vehicleMarkerRef.current.setLatLng([vehicleLocation.lat, vehicleLocation.lng]);
    } else {
      vehicleMarkerRef.current = L.marker([vehicleLocation.lat, vehicleLocation.lng], {
        icon: truckIcon
      })
        .addTo(mapRef.current)
        .bindPopup('<b>Live Vehicle Location</b><br/>Tracking in real-time');
    }
  }, [vehicleLocation, showLiveTracking]);

  const toggleMapType = () => {
    setMapType(prev => prev === 'street' ? 'satellite' : 'street');
    // Note: For satellite view, you'd need a different tile provider
    // This is a placeholder - real implementation would switch tile layers
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-200">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]"></div>

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleMapType}
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-lg transition"
          title="Toggle map type"
        >
          <Layers className="w-5 h-5 text-slate-700" />
        </button>

        <button
          onClick={() => {
            if (mapRef.current && origin && destination) {
              const bounds = L.latLngBounds([
                [origin.lat, origin.lng],
                [destination.lat, destination.lng]
              ]);
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
          }}
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-lg transition"
          title="Fit to route"
        >
          <Navigation className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Live Tracking Indicator */}
      {showLiveTracking && vehicleLocation && (
        <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-xs font-bold">Live Tracking Active</span>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-lg text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="font-semibold text-slate-700">Pickup Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="font-semibold text-slate-700">Delivery Location</span>
        </div>
        {showLiveTracking && (
          <div className="flex items-center gap-2">
            <Truck className="w-3 h-3 text-slate-700" />
            <span className="font-semibold text-slate-700">Vehicle Position</span>
          </div>
        )}
      </div>
    </div>
  );
};
