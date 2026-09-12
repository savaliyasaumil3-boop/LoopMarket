import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Navigation, Clock, Phone, Star, AlertCircle } from 'lucide-react';

interface VehicleLocation {
  lat: number;
  lng: number;
  timestamp: string;
  speed_kmh: number;
}

interface DriverInfo {
  name: string;
  phone: string;
  rating: number;
  vehicle_number: string;
  photo_url?: string;
}

interface VehicleTrackerProps {
  shipmentId: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  driverInfo: DriverInfo;
  estimatedArrival: string;
}

export const VehicleTracker: React.FC<VehicleTrackerProps> = ({
  shipmentId,
  origin,
  destination,
  driverInfo,
  estimatedArrival
}) => {
  const [currentLocation, setCurrentLocation] = useState<VehicleLocation | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [isLive, setIsLive] = useState(true);

  // Simulate live vehicle updates (like Rapido/Uber)
  useEffect(() => {
    const simulateMovement = () => {
      // Simulate vehicle moving from origin to destination
      const progress = Math.random() * 0.5 + 0.3; // 30-80% progress
      const lat = origin.lat + (destination.lat - origin.lat) * progress;
      const lng = origin.lng + (destination.lng - origin.lng) * progress;

      setCurrentLocation({
        lat,
        lng,
        timestamp: new Date().toISOString(),
        speed_kmh: Math.floor(Math.random() * 30) + 40 // 40-70 km/h
      });

      // Calculate remaining distance (mock)
      setDistanceRemaining(Math.floor(Math.random() * 50) + 10);
    };

    simulateMovement();
    const interval = setInterval(simulateMovement, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [origin, destination]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
      {/* Live Status Bar */}
      <div className="bg-emerald-500 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-bold text-sm">Vehicle En Route</span>
        </div>
        <span className="text-xs font-mono">ETA: {estimatedArrival}</span>
      </div>

      {/* Map Container - We'll use Leaflet */}
      <div className="relative bg-slate-100 h-80">
        <div id={`map-${shipmentId}`} className="w-full h-full">
          {/* Map will be rendered here */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
            <div className="text-center space-y-2">
              <Navigation className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
              <p className="text-sm font-bold">Live Tracking Active</p>
              <p className="text-xs text-slate-400">Map will load here</p>
            </div>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute top-4 left-4 right-4 flex gap-2">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-bold shadow-lg">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>{currentLocation?.speed_kmh || 0} km/h</span>
          </div>
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-bold shadow-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{distanceRemaining} km away</span>
          </div>
        </div>
      </div>

      {/* Driver Info Card */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-4">
          {/* Driver Avatar */}
          <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
            {driverInfo.photo_url ? (
              <img src={driverInfo.photo_url} alt={driverInfo.name} className="w-full h-full object-cover" />
            ) : (
              <Truck className="w-6 h-6 text-slate-500" />
            )}
          </div>

          {/* Driver Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900">{driverInfo.name}</h4>
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">{driverInfo.rating}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-mono">{driverInfo.vehicle_number}</p>
          </div>

          {/* Contact Button */}
          <button className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition">
            <Phone className="w-5 h-5" />
          </button>
        </div>

        {/* Journey Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Journey Progress</span>
            <span className="font-bold text-slate-900">65%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
          </div>
        </div>

        {/* Pickup & Delivery Info */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Pickup
            </div>
            <p className="text-xs text-slate-600 pl-3.5">{origin.name}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Delivery
            </div>
            <p className="text-xs text-slate-600 pl-3.5">{destination.name}</p>
          </div>
        </div>
      </div>

      {/* Live Updates Timeline */}
      <div className="px-4 pb-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          <h5 className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Live Updates
          </h5>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
              <div className="flex-1">
                <p className="text-slate-600">Vehicle crossed Vadodara toll plaza</p>
                <span className="text-[10px] text-slate-400 font-mono">2 min ago</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"></div>
              <div className="flex-1">
                <p className="text-slate-600">Vehicle loaded and departed from Ahmedabad</p>
                <span className="text-[10px] text-slate-400 font-mono">45 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
