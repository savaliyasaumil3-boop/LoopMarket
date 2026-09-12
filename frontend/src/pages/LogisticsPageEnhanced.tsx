import React, { useState, useEffect } from 'react';
import {
  Truck, MapPin, Sparkles, Navigation, ArrowRight,
  Layers, ShieldCheck, CheckCircle2, TrendingDown, Clock, Leaf, Package
} from 'lucide-react';
import { api } from '../lib/api';
import { GoogleMapsView } from '../components/GoogleMapsView';
import { VehicleSelection } from '../components/VehicleSelection';
import { VehicleTracker } from '../components/VehicleTracker';

export const LogisticsPage: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'calculator' | 'tracking' | 'booking'>('calculator');

  // Instant Quote Calculator State
  const [originCity, setOriginCity] = useState('Ahmedabad');
  const [destCity, setDestCity] = useState('Vadodara');
  const [weightKg, setWeightKg] = useState<number>(5000);
  const [quoteResult, setQuoteResult] = useState<any | null>(null);

  // Consolidation Optimizer State
  const [consolidationResult, setConsolidationResult] = useState<any | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Vehicle booking state
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Mock city coordinates for map visualization
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Pune': { lat: 18.5204, lng: 73.8567 }
  };

  useEffect(() => {
    loadLogisticsData();
    calculateQuote();
  }, []);

  const loadLogisticsData = async () => {
    setLoading(true);
    try {
      const data = await api.getShipments();
      setShipments(data || []);
    } catch {
      // Mock shipment data for demo
      setShipments([
        {
          id: 'SHP-001',
          origin: 'Ahmedabad',
          destination: 'Vadodara',
          status: 'in_transit',
          driver: {
            name: 'Rajesh Kumar',
            phone: '+91 98765 43210',
            rating: 4.8,
            vehicle_number: 'GJ-01-AB-1234'
          },
          eta: '45 min'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateQuote = async () => {
    try {
      const res = await api.getRouteQuote({
        origin_city: originCity,
        destination_city: destCity,
        weight_kg: weightKg
      });
      setQuoteResult(res);
    } catch {
      // Mock quote for demo
      setQuoteResult({
        distance_km: 82,
        estimated_travel_hours: 2.2,
        transport_cost: 1640,
        estimated_transport_emissions_kg: 51
      });
    }
  };

  const runConsolidationOptimizer = async () => {
    setIsOptimizing(true);
    try {
      const res = await api.optimizeConsolidation({
        pickups: [
          { city: 'Ahmedabad', weight_kg: 3000 },
          { city: 'Vadodara', weight_kg: 2500 }
        ],
        delivery_city: 'Surat',
        truck_capacity_kg: 7500
      });
      setConsolidationResult(res);
    } catch {
      // Mock consolidation result
      setConsolidationResult({
        unoptimized: { total_distance_km: 280, total_cost: 5600, total_emissions_kg: 175 },
        optimized: { total_distance_km: 195, total_cost: 3900, total_emissions_kg: 122 },
        savings: { cost_saved_inr: 1700, distance_saved_km: 85, emissions_saved_kg_co2e: 53, cost_savings_pct: 30 }
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleBookVehicle = () => {
    setShowVehicleSelection(true);
    setActiveView('booking');
  };

  const handleVehicleSelected = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    // In production, this would create an order
    console.log('Vehicle selected:', vehicle);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Green Logistics Network</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              LIVE TRACKING ENABLED
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Smart Logistics & Vehicle Booking</h1>
          <p className="text-slate-500 mt-0.5">
            Real-time vehicle tracking, instant quotes, Porter-style booking, and route optimization with live GPS updates.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runConsolidationOptimizer}
            disabled={isOptimizing}
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {isOptimizing ? 'Running Solver...' : 'Optimize Routes'}
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex gap-2">
        <button
          onClick={() => setActiveView('calculator')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeView === 'calculator'
              ? 'bg-slate-900 text-white'
              : 'bg-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Route Calculator
        </button>
        <button
          onClick={() => setActiveView('tracking')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeView === 'tracking'
              ? 'bg-slate-900 text-white'
              : 'bg-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          Live Tracking
        </button>
        <button
          onClick={() => setActiveView('booking')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeView === 'booking'
              ? 'bg-slate-900 text-white'
              : 'bg-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          Book Vehicle
        </button>
      </div>

      {/* Calculator View */}
      {activeView === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Quote Input Box */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Dynamic Freight Calculator</h3>
              <span className="text-[10px] font-mono text-slate-400">POWERED BY AI</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Origin City</label>
                  <select
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="b2b-input"
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Surat">Surat</option>
                    <option value="Rajkot">Rajkot</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Destination City</label>
                  <select
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="b2b-input"
                  >
                    <option value="Vadodara">Vadodara</option>
                    <option value="Surat">Surat</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Rajkot">Rajkot</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Consignment Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  min="500"
                  step="500"
                  className="b2b-input font-mono font-bold"
                />
              </div>

              <button
                onClick={calculateQuote}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
              >
                Recalculate Route Metrics
              </button>
            </div>

            {quoteResult && (
              <>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Road Distance:</span>
                    <span className="font-mono text-slate-900 font-bold">{quoteResult.distance_km} km</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Transit Duration:</span>
                    <span className="font-mono text-slate-900">{quoteResult.estimated_travel_hours} Hours</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Freight Cost:</span>
                    <span className="font-mono text-slate-900 font-bold">₹{quoteResult.transport_cost?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-slate-200 text-emerald-800">
                    <span>Transport Carbon:</span>
                    <span className="font-mono font-bold">{quoteResult.estimated_transport_emissions_kg} kg CO2e</span>
                  </div>
                </div>

                <button
                  onClick={handleBookVehicle}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Package className="w-4 h-4" />
                  Book Vehicle Now
                </button>
              </>
            )}
          </div>

          {/* Interactive Map with Google Maps */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Live Route Map</h3>
              </div>
              <span className="text-xs font-mono text-emerald-600">REAL-TIME GPS</span>
            </div>

            <GoogleMapsView
              origin={{ ...cityCoordinates[originCity], name: originCity }}
              destination={{ ...cityCoordinates[destCity], name: destCity }}
              showRoute={true}
              showLiveTracking={false}
            />
          </div>

        </div>
      )}

      {/* Live Tracking View */}
      {activeView === 'tracking' && shipments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shipments.map((shipment) => (
            <VehicleTracker
              key={shipment.id}
              shipmentId={shipment.id}
              origin={{ ...cityCoordinates[shipment.origin], name: shipment.origin }}
              destination={{ ...cityCoordinates[shipment.destination], name: shipment.destination }}
              driverInfo={shipment.driver}
              estimatedArrival={shipment.eta}
            />
          ))}
        </div>
      )}

      {/* Vehicle Booking View */}
      {activeView === 'booking' && (
        <VehicleSelection
          pickupCity={originCity}
          deliveryCity={destCity}
          distance_km={quoteResult?.distance_km || 82}
          weight_kg={weightKg}
          onSelectVehicle={handleVehicleSelected}
        />
      )}

      {/* Consolidation Optimizer Results */}
      {consolidationResult && (
        <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Consolidated Milk-Run Route Optimizer Results
              </h3>
            </div>
            <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
              {consolidationResult.savings?.cost_savings_pct}% Net Savings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Unoptimized */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Before: 2 Trucks</span>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-bold">{consolidationResult.unoptimized?.total_distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-bold">₹{consolidationResult.unoptimized?.total_cost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Carbon:</span>
                  <span>{consolidationResult.unoptimized?.total_emissions_kg} kg CO2e</span>
                </div>
              </div>
            </div>

            {/* Optimized */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-emerald-800 uppercase block font-bold">After: 1 Milk Run</span>
              <div className="text-xs space-y-1 font-mono text-emerald-950">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-bold">{consolidationResult.optimized?.total_distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-bold">₹{consolidationResult.optimized?.total_cost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Carbon:</span>
                  <span>{consolidationResult.optimized?.total_emissions_kg} kg CO2e</span>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">Net Gains</span>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-300">Saved:</span>
                  <span className="text-emerald-400 font-bold">₹{consolidationResult.savings?.cost_saved_inr?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Distance:</span>
                  <span className="text-white font-bold">{consolidationResult.savings?.distance_saved_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Emissions:</span>
                  <span className="text-emerald-400 font-bold">{consolidationResult.savings?.emissions_saved_kg_co2e} kg CO2e</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
