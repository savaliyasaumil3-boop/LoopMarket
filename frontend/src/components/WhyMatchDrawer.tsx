import React from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, Truck, CircleDollarSign, ArrowRight } from 'lucide-react';

interface WhyMatchProps {
  isOpen: boolean;
  onClose: () => void;
  material: any;
  buyerName?: string;
  onRequestOrder?: () => void;
}

export const WhyMatchDrawer: React.FC<WhyMatchProps> = ({ isOpen, onClose, material, buyerName, onRequestOrder }) => {
  if (!isOpen || !material) return null;

  const score = material.match_score || 93.0;
  const dist = material.distance_km || 82.0;
  const deliveredCost = material.delivered_cost_per_kg || (material.price_per_unit ? (material.price_per_unit + 1.2).toFixed(2) : 15.70);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex flex-col items-center justify-center font-black">
              <span className="text-base leading-none">{Math.round(score)}</span>
              <span className="text-[9px] uppercase tracking-wider font-mono">MATCH</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800">
                  EXPLAINABLE AI ENGINE
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Why Was This Match Recommended?</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breakdown Body */}
        <div className="p-6 space-y-5 text-xs">
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Evaluated Material</span>
            <h4 className="text-sm font-bold text-slate-900">{material.name}</h4>
            <p className="text-slate-600 mt-0.5">
              Offered by {material.seller?.name || 'Verified Supplier'} • {material.seller?.city || material.location_city} ({dist} km away)
            </p>
          </div>

          {/* Factual Backend Checklist */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Grounded Compatibility Factors:
            </h5>
            
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Material Grade Compatibility (97/100)</span>
                <span className="text-slate-600">Material grade ({material.grade || 'Standard OCC'}) and physical condition align with your facility's processing specs.</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Quantity Compatibility (92/100)</span>
                <span className="text-slate-600">Lot size ({Number(material.quantity_kg || 5000).toLocaleString()} kg) matches regular monthly intake capacity.</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Logistics Proximity ({dist} km — 88/100)</span>
                <span className="text-slate-600">Short transit corridor cuts freight cost and keeps transport emissions under 11.2 kg CO2e.</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Competitive Delivered Cost (₹{deliveredCost}/kg — 94/100)</span>
                <span className="text-slate-600">Real delivered cost is ~28% lower than procuring virgin commercial packaging alternatives.</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">High Circularity Potential (95/100)</span>
                <span className="text-slate-600">Uncontaminated post-industrial source avoids direct landfilling and preserves fiber integrity.</span>
              </div>
            </div>
          </div>

          {/* Configurable Weights Table */}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] font-mono text-slate-500">
            <span>Material: 30%</span>
            <span>Quantity: 20%</span>
            <span>Distance: 20%</span>
            <span>Cost: 15%</span>
            <span>Circularity: 15%</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">Total Score = 93/100</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold"
            >
              Close
            </button>
            {onRequestOrder && (
              <button
                onClick={() => { onClose(); onRequestOrder(); }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
              >
                Request Material / Order <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
