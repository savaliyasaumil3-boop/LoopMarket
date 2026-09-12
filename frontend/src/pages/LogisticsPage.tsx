import React, { useState, useEffect } from 'react';
import { 
  Truck, MapPin, Sparkles, Navigation, ArrowRight, 
  Layers, ShieldCheck, CheckCircle2, TrendingDown, Clock, Leaf
} from 'lucide-react';
import { api } from '../lib/api';

export const LogisticsPage: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Instant Quote Calculator State
  const [originCity, setOriginCity] = useState('Ahmedabad');
  const [destCity, setDestCity] = useState('Vadodara');
  const [weightKg, setWeightKg] = useState<number>(5000);
  const [quoteResult, setQuoteResult] = useState<any | null>(null);

  // Consolidation Optimizer State
  const [consolidationResult, setConsolidationResult] = useState<any | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

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
      // ignore
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
      // ignore
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
      // ignore
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Green Logistics Network</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              OPTIMIZED CORRIDORS
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Logistics & Route Optimization Engine</h1>
          <p className="text-slate-500 mt-0.5">
            Real-time freight quotes, multi-stop milk run consolidation, vehicle capacity utilization, and carbon emissions tracking.
          </p>
        </div>

        <button
          onClick={runConsolidationOptimizer}
          disabled={isOptimizing}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {isOptimizing ? 'Running Solver...' : 'Run Milk-Run Route Optimizer'}
        </button>
      </div>

      {/* Instant Route Calculator & Interactive Map Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quote Input Box (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Dynamic Freight & Carbon Calculator</h3>
            <span className="text-[10px] font-mono text-slate-400">NH-48 CORRIDOR</span>
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-4">
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
          )}
        </div>

        {/* Visual Map & Waypoints Box (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 text-white border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Industrial Corridor Visualization</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">OpenStreetMap OSRM Routing</span>
            </div>

            {/* Visual Route Corridor Representation */}
            <div className="my-6 p-5 bg-slate-900 border border-slate-800 rounded-xl relative">
              <div className="flex items-center justify-between relative z-10">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold mx-auto">
                    A
                  </div>
                  <span className="font-bold text-xs mt-1.5 block">{originCity}</span>
                  <span className="text-[10px] text-slate-400 font-mono">PICKUP</span>
                </div>

                <div className="flex-1 mx-4 text-center">
                  <div className="h-0.5 w-full bg-slate-700 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-emerald-300">
                      {quoteResult?.distance_km || 82} km • {quoteResult?.estimated_travel_hours || 2.2}h
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 text-white flex items-center justify-center font-bold mx-auto">
                    B
                  </div>
                  <span className="font-bold text-xs mt-1.5 block">{destCity}</span>
                  <span className="text-[10px] text-slate-400 font-mono">DELIVERY</span>
                </div>
              </div>
            </div>

            {/* Waypoints Breakdown */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Real-time Checkpoints</span>
              <div className="space-y-1 text-xs">
                {quoteResult?.waypoints?.map((wp: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-200">{wp.name}</span>
                    <span className="font-mono text-[10px] text-emerald-400 uppercase">{wp.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800 flex justify-between">
            <span>Standard Fleet Factor: 0.125 kg CO2e / ton-km</span>
            <span className="text-emerald-400 font-mono">Electric & Bio-CNG Verified</span>
          </div>
        </div>

      </div>

      {/* OR-Tools Consolidation Optimizer Output (Prompt #18) */}
      {consolidationResult && (
        <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Consolidated Milk-Run Route Optimizer Results (OR-Tools)
              </h3>
            </div>
            <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
              {consolidationResult.savings?.cost_savings_pct}% Net Cost Savings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Unoptimized */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Before: 2 Dedicated Trucks</span>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Total Distance:</span>
                  <span className="font-bold">{consolidationResult.unoptimized?.total_distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Combined Freight:</span>
                  <span className="font-bold">₹{consolidationResult.unoptimized?.total_cost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Total Carbon:</span>
                  <span>{consolidationResult.unoptimized?.total_emissions_kg} kg CO2e</span>
                </div>
              </div>
            </div>

            {/* Optimized */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-emerald-800 uppercase block font-bold">After: 1 Consolidated Milk Run</span>
              <div className="text-xs space-y-1 font-mono text-emerald-950">
                <div className="flex justify-between">
                  <span>Optimized Distance:</span>
                  <span className="font-bold">{consolidationResult.optimized?.total_distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimized Freight:</span>
                  <span className="font-bold">₹{consolidationResult.optimized?.total_cost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Optimized Carbon:</span>
                  <span>{consolidationResult.optimized?.total_emissions_kg} kg CO2e</span>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">Net Operational Gains</span>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-300">Cost Avoided:</span>
                  <span className="text-emerald-400 font-bold">+₹{consolidationResult.savings?.cost_saved_inr?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Transit Distance Saved:</span>
                  <span className="text-white font-bold">{consolidationResult.savings?.distance_saved_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Avoided Emissions:</span>
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
