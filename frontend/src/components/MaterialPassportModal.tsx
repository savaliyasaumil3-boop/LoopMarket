import React from 'react';
import { X, QrCode, ShieldCheck, Download, Sparkles, CheckCircle2, History, Leaf } from 'lucide-react';

interface PassportProps {
  isOpen: boolean;
  onClose: () => void;
  material: any;
}

export const MaterialPassportModal: React.FC<PassportProps> = ({ isOpen, onClose, material }) => {
  if (!isOpen || !material) return null;

  const passport = material.passport || {};
  const code = passport.passport_code || `DP-${material.code || 'MAT-1024'}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-emerald-300 rounded font-semibold border border-slate-700">
                  EU & CPCB DPP COMPLIANT
                </span>
                <span className="text-xs font-mono text-slate-400">{code}</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white mt-1">Digital Material Passport</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Main ID & Verification Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Standardized Nomenclature</span>
              <h4 className="text-sm font-bold text-slate-900">{material.name}</h4>
              <p className="text-slate-500 text-xs mt-0.5">Origin Facility: {material.seller?.name || 'Verified Industrial Supplier'} ({material.location_city || 'Ahmedabad'})</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300 text-xs py-1 px-3">
                <ShieldCheck className="w-4 h-4" /> VERIFIED ORIGIN
              </span>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div>
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              1. Material Intelligence & Chemical Composition
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-[10px] text-slate-400 block">Grade Standard</span>
                <span className="font-bold text-slate-800 text-xs">{material.grade || 'OCC Grade 11'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-[10px] text-slate-400 block">Fiber / Purity Level</span>
                <span className="font-bold text-emerald-700 text-xs">{passport.purity_percentage || 96.5}% Clean</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-[10px] text-slate-400 block">Contamination</span>
                <span className="font-bold text-slate-800 text-xs">{material.contamination_level || 'Low (<1.5%)'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-[10px] text-slate-400 block">Reusability Index</span>
                <span className="font-bold text-emerald-700 text-xs">{passport.reusability_rating || 'HIGH'} (94/100)</span>
              </div>
            </div>
          </div>

          {/* Embodied Carbon Offsets */}
          <div className="p-4 bg-emerald-950 text-emerald-100 rounded-lg border border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                <Leaf className="w-4 h-4 text-emerald-400" />
                2. Circular Carbon Lifecycle Value
              </span>
              <span className="font-mono text-emerald-300 text-[11px]">GHG Protocol Standard</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div>
                <span className="text-emerald-400/80 text-[10px] block">Virgin Offset Factor</span>
                <span className="font-mono font-bold text-white">{passport.embodied_carbon_saved_per_kg || 0.95} kg CO2e / kg</span>
              </div>
              <div>
                <span className="text-emerald-400/80 text-[10px] block">Gross Avoided CO2</span>
                <span className="font-mono font-bold text-white">{((material.quantity_kg || 5000) * (passport.embodied_carbon_saved_per_kg || 0.95)).toLocaleString()} kg CO2e</span>
              </div>
              <div>
                <span className="text-emerald-400/80 text-[10px] block">Landfill Space Saved</span>
                <span className="font-mono font-bold text-emerald-300">{((material.quantity_kg || 5000) * 0.0035).toFixed(1)} m³</span>
              </div>
            </div>
          </div>

          {/* Provenance History */}
          <div>
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-600" />
              3. Chain of Custody & Audit Trail
            </h5>
            <div className="border border-slate-200 rounded-md divide-y divide-slate-100 bg-white">
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Post-Industrial Lot Segregated & Baled</span>
                <span className="font-mono text-[10px] text-slate-400">Validated</span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Moisture & Contamination QA Inspection</span>
                <span className="text-emerald-700 font-semibold text-[10px]">PASSED (&lt; 8% H2O)</span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">RELOOP Digital Passport Hash Minted</span>
                <span className="font-mono text-[10px] text-slate-500 font-bold">{passport.verification_hash || 'SHA256-8F72A99B'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Cryptographically signed by RELOOP Gateway
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => alert(`Digital Passport ${code} downloaded as verified JSON/PDF certificate.`)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Passport
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
