import React, { useState, useEffect } from 'react';
import { 
  Sliders, Sparkles, RefreshCw, ArrowRight, ShieldCheck, 
  TrendingUp, Truck, CircleDollarSign, CheckCircle2, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

export const SimulatorPage: React.FC = () => {
  const [category, setCategory] = useState('Cardboard');
  const [quantityKg, setQuantityKg] = useState<number>(5000);
  const [unitPrice, setUnitPrice] = useState<number>(14.5);
  const [transMultiplier, setTransMultiplier] = useState<number>(1.3); // +30% surge default
  const [contamination, setContamination] = useState('Low');
  const [originCity, setOriginCity] = useState('Ahmedabad');

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // The simulation now runs only when the user clicks the Submit button.
  // Previously, it auto‑ran on every parameter change via useEffect.


  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation({
        material_category: category,
        base_quantity_kg: quantityKg,
        material_unit_price: unitPrice,
        transport_rate_multiplier: transMultiplier,
        contamination_level: contamination,
        origin_city: originCity
      });
      console.log('Simulation response:', res);
      setResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
      alert('Failed to run simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Sensitivity Analysis</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              REAL-TIME RE-SOLVER
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Circular What-If Scenario Simulator</h1>
          <p className="text-slate-500 mt-0.5">
            Dynamically model freight surges, contamination variance, and price shifts to simulate optimal buyer re-ranking and delivered economics.
          </p>
        </div>

        <button
          onClick={runSimulation}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Submit
        </button>
      </div>

      {/* Simulator Interactive Control Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-700" /> Scenario Parameters
            </h3>
            <span className="text-[10px] font-mono text-slate-400">DYNAMIC INPUTS</span>
          </div>

          <div className="space-y-3.5">
            {/* Transport Surge Slider */}
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="font-semibold text-slate-700">Transport Rate Variance</span>
                <span className={`font-bold ${transMultiplier > 1 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {transMultiplier > 1 ? `+${Math.round((transMultiplier - 1) * 100)}% Surge` : `${Math.round((transMultiplier - 1) * 100)}% Discount`}
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="2.0"
                step="0.1"
                value={transMultiplier}
                onChange={(e) => setTransMultiplier(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>-30%</span>
                <span>Normal (1.0x)</span>
                <span>+100% Surge</span>
              </div>
            </div>

            {/* Material Category */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Material Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="b2b-input"
              >
                <option value="Cardboard">Cardboard</option>
                <option value="Plastic">Plastic</option>
                <option value="Pallets">Pallets</option>
                <option value="Paper">Paper</option>
              </select>
            </div>

            {/* Base Quantity */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="font-semibold text-slate-700">Lot Volume (kg)</span>
                <span className="font-bold text-slate-900">{quantityKg.toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="1000"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            {/* Base Unit Price */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="font-semibold text-slate-700">Base Selling Price</span>
                <span className="font-bold text-slate-900">₹{unitPrice}/kg</span>
              </div>
              <input
                type="range"
                min="8"
                max="50"
                step="0.5"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            {/* Contamination Level */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Contamination Quality</label>
              <select
                value={contamination}
                onChange={(e) => setContamination(e.target.value)}
                className="b2b-input"
              >
                <option value="None">None (Pristine Post-Industrial)</option>
                <option value="Low">Low (&lt; 2%)</option>
                <option value="Moderate">Moderate (5-10%)</option>
                <option value="High">High (&gt; 10% Mixed Waste)</option>
              </select>
            </div>

            {/* Origin City */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Origin Supply Facility</label>
              <select
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="b2b-input"
              >
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Surat">Surat</option>
                <option value="Rajkot">Rajkot</option>
              </select>
            </div>

          </div>
        </div>

        {/* Results & Re-ranking Comparison (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* AI Key Sensitivity Takeaway Banner (Prompt #23 Example) */}
          <div className="p-5 bg-slate-950 text-white rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs">Dynamic Sensitivity Takeaway</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              {result?.key_takeaway || "Adjust the parameters on the left to evaluate sensitivity changes."}
            </p>
          </div>

          {/* Side-by-side Buyer Shift Comparison */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Baseline Best Buyer */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Baseline Top Partner (1.0x Freight)</span>
                <h4 className="text-base font-bold text-slate-900">{result.original_best_buyer?.name}</h4>
                <p className="text-slate-500 text-xs">
                  {result.original_best_buyer?.city} • {result.original_best_buyer?.distance_km} km away
                </p>
                <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Match Score:</span>
                    <span className="font-bold text-slate-900">{result.original_best_buyer?.match_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Delivered Cost:</span>
                    <span className="font-bold text-slate-900">₹{result.original_best_buyer?.delivered_cost_per_kg}/kg</span>
                  </div>
                </div>
              </div>

              {/* Scenario Best Buyer */}
              <div className="p-5 bg-emerald-950 text-white border border-emerald-800 rounded-xl shadow-sm space-y-3">
                <span className="text-[10px] font-mono text-emerald-300 uppercase block font-bold">Scenario Top Partner ({transMultiplier}x Freight)</span>
                <h4 className="text-base font-bold text-white">{result.new_best_buyer?.name}</h4>
                <p className="text-emerald-200 text-xs">
                  {result.new_best_buyer?.city} • {result.new_best_buyer?.distance_km} km away
                </p>
                <div className="p-3 bg-slate-900 rounded border border-emerald-800 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Match Score:</span>
                    <span className="font-bold text-emerald-400">{result.new_best_buyer?.match_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Delivered Cost:</span>
                    <span className="font-bold text-white">₹{result.new_best_buyer?.delivered_cost_per_kg}/kg</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Full Ranked Candidate Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">All Evaluated Regional Buyers under Current Scenario</h4>
            
            <div className="divide-y divide-slate-100 text-xs">
              {result?.candidate_comparison?.length ? (
                result.candidate_comparison.map((cand: any, idx: number) => (
                  <div key={cand.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                        <span className="font-bold text-slate-900">{cand.name}</span>
                        <span className="text-slate-400">({cand.city} • {cand.distance_km} km)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                        Freight: ₹{cand.transport_cost_total?.toLocaleString()} • Transport CO2: {cand.transport_emissions_kg} kg
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900 block">₹{cand.delivered_cost_per_kg}/kg</span>
                      <span className="text-emerald-700 font-semibold text-[11px]">{cand.match_score}% Match</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500">No candidate data available.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
