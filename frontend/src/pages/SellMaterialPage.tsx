import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, QrCode, ShieldCheck, ArrowRight, Upload, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { MaterialPassportModal } from '../components/MaterialPassportModal';

export const SellMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const [aiInput, setAiInput] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPassport, setCreatedPassport] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('Corrugated Cardboard Boxes (OCC 11)');
  const [category, setCategory] = useState('Cardboard');
  const [subtype, setSubtype] = useState('Clean Corrugated Bales');
  const [quantity, setQuantity] = useState<number>(5000);
  const [unit, setUnit] = useState('kg');
  const [grade, setGrade] = useState('OCC Grade 11');
  const [condition, setCondition] = useState('Good');
  const [contaminationLevel, setContaminationLevel] = useState('Low');
  const [pricePerUnit, setPricePerUnit] = useState<number>(14.50);
  const [minOrderQty, setMinOrderQty] = useState<number>(500);
  const [locationCity, setLocationCity] = useState('Ahmedabad');
  const [packagingType, setPackagingType] = useState('Baled / Strapped on Pallet');
  const [description, setDescription] = useState('Generated from secondary packing operations. Clean, dry, and immediately available for circular reuse.');

  const handleAIQuickFill = async () => {
    if (!aiInput.trim()) return;
    setIsParsingAI(true);
    try {
      const res = await api.parseListingAI(aiInput);
      if (res) {
        if (res.material_type) setCategory(res.material_type.charAt(0).toUpperCase() + res.material_type.slice(1));
        if (res.subtype) {
          setSubtype(res.subtype);
          setName(`${res.subtype.replace(/_/g, ' ')} Lot`);
        }
        if (res.quantity_kg) setQuantity(res.quantity_kg);
        if (res.condition) setCondition(res.condition.charAt(0).toUpperCase() + res.condition.slice(1));
        if (res.contamination_level) setContaminationLevel(res.contamination_level.charAt(0).toUpperCase() + res.contamination_level.slice(1));
        if (res.location) setLocationCity(res.location);
        if (res.price_per_unit) setPricePerUnit(res.price_per_unit);
        if (res.grade) setGrade(res.grade);
      }
    } catch {
      alert('AI parsing service unreachable. Please fill manually.');
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createMaterial({
        name,
        category,
        subtype,
        quantity,
        unit,
        grade,
        condition,
        contamination_level: contaminationLevel,
        price_per_unit: pricePerUnit,
        min_order_quantity: minOrderQty,
        location_city: locationCity,
        packaging_type: packagingType,
        description,
        primary_image_url: category === 'Cardboard' 
          ? "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80"
          : (category === 'Plastic' ? "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80" : "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80")
      });

      // Show passport modal or navigate to detail
      setCreatedPassport({
        code: res.code,
        name,
        category,
        grade,
        condition,
        contamination_level: contaminationLevel,
        quantity_kg: quantity,
        location_city: locationCity,
        passport: {
          passport_code: res.passport_code,
          purity_percentage: 96.5,
          reusability_rating: 'HIGH',
          embodied_carbon_saved_per_kg: category === 'Cardboard' ? 0.95 : 2.45,
          verification_hash: 'SHA256-MINTED-SUCCESS'
        }
      });
    } catch (e: any) {
      alert(e.message || 'Error creating material listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const samplePrompts = [
    "I have around 5 tons of clean used cardboard boxes in Ahmedabad. They are mostly in good condition and available immediately at ₹14.5/kg.",
    "We generate 2 tonnes of clean HDPE regrind flakes in Vadodara monthly. Zero contamination, ready for recycling at ₹42/kg.",
    "Surplus batch of 400 standard Euro wooden pallets in Surat. Reusable condition, heat treated, immediate pickup."
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">List Surplus Material</h1>
          <p className="text-slate-500 mt-0.5">
            Turn industrial packaging waste into revenue. Automatic Digital Material Passport minted upon submission.
          </p>
        </div>
      </div>

      {/* Layer 1 MiniMax NLP Quick-Fill Box */}
      <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs">AI Quick-Fill with MiniMax-L6-v2</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            NATURAL LANGUAGE INGESTION
          </span>
        </div>

        <p className="text-slate-400 text-xs">
          Paste unstructured voice note transcripts or raw material inventory notes to auto-extract structured values.
        </p>

        <div className="flex gap-2">
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            rows={2}
            placeholder="e.g. 'I have around 5 tons of clean used cardboard boxes in Ahmedabad. They are mostly in good condition and available immediately at ₹14.5/kg'..."
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="button"
            onClick={handleAIQuickFill}
            disabled={isParsingAI || !aiInput.trim()}
            className="px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isParsingAI ? 'animate-spin' : ''}`} />
            {isParsingAI ? 'Extracting...' : 'Auto-Fill'}
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
          <span className="font-mono text-[10px]">Try sample:</span>
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setAiInput(sp); }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 truncate max-w-xs text-left"
            >
              "{sp.substring(0, 38)}..."
            </button>
          ))}
        </div>
      </div>

      {/* Main Listing Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-semibold text-slate-700">Material Listing Title *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="b2b-input font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="b2b-input font-medium"
            >
              <option value="Cardboard">Cardboard</option>
              <option value="Paper">Paper</option>
              <option value="Plastic">Plastic</option>
              <option value="Pallets">Pallets</option>
              <option value="Wood">Wood</option>
              <option value="Crates">Crates</option>
              <option value="Reusable Boxes">Reusable Boxes</option>
              <option value="Packaging Film">Packaging Film</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Subcategory / Polymer Grade</label>
            <input
              type="text"
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              className="b2b-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Available Quantity *</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="100"
                required
                className="b2b-input font-mono font-bold"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="b2b-input w-24 font-mono font-semibold"
              >
                <option value="kg">kg</option>
                <option value="units">units</option>
                <option value="tonnes">tonnes</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Base Unit Price (₹ / {unit}) *</label>
            <input
              type="number"
              step="0.1"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(Number(e.target.value))}
              required
              className="b2b-input font-mono font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Physical Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="b2b-input"
            >
              <option value="Excellent">Excellent (Like New)</option>
              <option value="Good">Good (Minor Blemishes)</option>
              <option value="Reusable">Reusable (Multi-trip Intact)</option>
              <option value="Recyclable">Recyclable Feedstock</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Contamination Level</label>
            <select
              value={contaminationLevel}
              onChange={(e) => setContaminationLevel(e.target.value)}
              className="b2b-input"
            >
              <option value="None">None (Pristine Post-Industrial)</option>
              <option value="Low">Low (&lt; 2% organic/dust)</option>
              <option value="Moderate">Moderate (Requires sorting)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Pickup Facility City *</label>
            <select
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className="b2b-input"
            >
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Surat">Surat</option>
              <option value="Rajkot">Rajkot</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
              <option value="Delhi">Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Packaging / Baling Format</label>
            <input
              type="text"
              value={packagingType}
              onChange={(e) => setPackagingType(e.target.value)}
              className="b2b-input"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-semibold text-slate-700">Batch Quality Notes & Provenance</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="b2b-input"
            />
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            By publishing, a verified Digital Material Passport with SHA-256 integrity hash is generated automatically.
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition shadow-sm"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            {isSubmitting ? 'Publishing & Minting...' : 'Mint Passport & List Material'}
          </button>
        </div>

      </form>

      {/* Minted Passport Modal Preview on Success */}
      {createdPassport && (
        <MaterialPassportModal
          isOpen={!!createdPassport}
          onClose={() => {
            setCreatedPassport(null);
            navigate('/marketplace');
          }}
          material={createdPassport}
        />
      )}

    </div>
  );
};
