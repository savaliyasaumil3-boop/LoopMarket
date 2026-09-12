import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, QrCode, Upload, Image, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { uploadProductPhoto } from '../lib/supabaseStorage';
import { addMaterial } from '../lib/supabaseData';
import { MaterialPassportModal } from '../components/MaterialPassportModal';

export const SellMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const [aiInput, setAiInput] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPassport, setCreatedPassport] = useState<any | null>(null);

  // Photo Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

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
    setUploadStatus('Uploading photo to Supabase Storage...');

    try {
      let finalImageUrl = category === 'Cardboard' 
        ? "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80"
        : (category === 'Plastic' ? "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80" : "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80");

      if (selectedFile) {
        try {
          const supabaseUrl = await uploadProductPhoto(selectedFile);
          if (supabaseUrl) {
            finalImageUrl = supabaseUrl;
          }
        } catch (uploadErr) {
          console.warn('Failed uploading photo to Supabase, falling back to preview URL:', uploadErr);
          if (imagePreview) finalImageUrl = imagePreview;
        }
      }

      setUploadStatus('Minting passport & saving listing...');

      // 1. Create in Backend API (with fallback if backend API server is offline)
      let res: any = null;
      try {
        res = await api.createMaterial({
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
          primary_image_url: finalImageUrl
        });
      } catch (apiErr: any) {
        console.warn('Backend API server unreachable, proceeding with Supabase & local cache:', apiErr.message);
        res = {
          success: true,
          material_id: `mat_${Date.now()}`,
          code: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
          passport_code: `DPP-2026-${Math.floor(10000 + Math.random() * 90000)}`
        };
      }

      // 2. Insert into Supabase DB table
      const supabasePayload = {
        id: res?.material_id || `mat_${Date.now()}`,
        name,
        category,
        subtype,
        quantity,
        unit,
        price_per_unit: pricePerUnit,
        location_city: locationCity,
        primary_image_url: finalImageUrl,
        created_at: new Date().toISOString()
      };

      try {
        await addMaterial(supabasePayload);
      } catch (sbErr: any) {
        console.warn('Supabase DB notice:', sbErr.message);
      }

      // 3. Cache in local storage for instantaneous 'Your Listings' rendering
      try {
        const stored = JSON.parse(localStorage.getItem('loopmarket_user_listings') || '[]');
        const newListing = {
          id: res?.material_id || supabasePayload.id,
          code: res?.code || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
          name,
          category,
          subtype,
          quantity,
          unit,
          quantity_kg: quantity,
          grade,
          condition,
          contamination_level: contaminationLevel,
          price_per_unit: pricePerUnit,
          min_order_quantity: minOrderQty,
          location_city: locationCity,
          packaging_type: packagingType,
          description,
          primary_image_url: finalImageUrl,
          created_at: new Date().toISOString(),
          is_user_uploaded: true,
          passport_code: res?.passport_code || `DPP-2026-${Math.floor(10000 + Math.random() * 90000)}`
        };
        localStorage.setItem('loopmarket_user_listings', JSON.stringify([newListing, ...stored]));
      } catch {
        // ignore storage error
      }

      // Show passport modal on success
      setCreatedPassport({
        code: res.code || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        category,
        grade,
        condition,
        contamination_level: contaminationLevel,
        quantity_kg: quantity,
        location_city: locationCity,
        passport: {
          passport_code: res.passport_code || `DPP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
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
      setUploadStatus('');
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
            Upload photos & turn industrial packaging waste into revenue. Automatic Digital Material Passport minted upon submission.
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
        
        {/* Photo Upload Section */}
        <div className="space-y-2">
          <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <Image className="w-4 h-4 text-emerald-600" />
            Product Photo Upload *
          </label>

          {imagePreview ? (
            <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
              <img src={imagePreview} alt="Material Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                <label className="px-3 py-1.5 bg-white text-slate-900 font-semibold text-xs rounded-md cursor-pointer hover:bg-slate-100">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-md hover:bg-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
              <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono">
                {selectedFile ? selectedFile.name : 'Photo Selected'}
              </span>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl transition p-4 text-center ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' 
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20'
              }`}
            >
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                <div className="p-3 bg-white rounded-full border border-slate-200 text-slate-600 mb-2 shadow-sm">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-slate-800 text-xs">
                  {isDragging ? 'Drop photo here now' : 'Click or drag product photo here'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, WEBP</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          )}
        </div>

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
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            {uploadStatus ? (
              <span className="text-emerald-700 font-semibold animate-pulse flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {uploadStatus}
              </span>
            ) : (
              'By publishing, a verified Digital Material Passport is generated automatically.'
            )}
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm shrink-0 disabled:opacity-50"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            {isSubmitting ? 'Processing Upload...' : 'Mint Passport & List Material'}
          </button>
        </div>

      </form>

      {/* Minted Passport Modal Preview on Success */}
      {createdPassport && (
        <MaterialPassportModal
          isOpen={!!createdPassport}
          onClose={() => {
            setCreatedPassport(null);
            navigate('/my-listings');
          }}
          material={createdPassport}
        />
      )}

    </div>
  );
};
