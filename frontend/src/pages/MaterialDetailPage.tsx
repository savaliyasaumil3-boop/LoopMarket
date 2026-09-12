import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Sparkles, MapPin, Truck, Leaf, 
  CircleDollarSign, CheckCircle2, QrCode, FileText, ArrowRight, Loader,
  Database, Award, Clock, AlertTriangle, Layers, Lock, Building2, Package, RefreshCw, ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';
import { fetchMaterials as fetchMaterialsFromSupabase } from '../lib/supabaseData';
import { MaterialPassportModal } from '../components/MaterialPassportModal';
import { WhyMatchDrawer } from '../components/WhyMatchDrawer';

const DEFAULT_MARKETPLACE_MATERIALS = [
  {
    id: 'mat-demo-101',
    code: 'MAT-2026-9041',
    name: 'Baled Industrial Corrugated Cardboard OCC Grade 11',
    category: 'Cardboard',
    subtype: 'Scrap Packaging',
    condition: 'Recyclable',
    grade: 'A+',
    quantity: 5000,
    unit: 'kg',
    quantity_kg: 5000,
    price_per_unit: 14.50,
    delivered_cost_per_kg: 16.20,
    location_city: 'Ahmedabad',
    distance_km: 12,
    match_score: 98,
    primary_image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_nziRXzUSXc6T3kUuKRvzRC3S3_To35pVXtRpvLKFXA&s=10',
    seller: { name: 'ABC Manufacturing Pvt Ltd', trust_score: 96, city: 'Ahmedabad' }
  },
  {
    id: 'mat-demo-102',
    code: 'MAT-2026-8102',
    name: 'Post-Industrial HDPE Blue Drums & Carboys',
    category: 'Plastic',
    subtype: 'Rigid Drums',
    condition: 'Excellent',
    grade: 'A',
    quantity: 2500,
    unit: 'kg',
    quantity_kg: 2500,
    price_per_unit: 42.00,
    delivered_cost_per_kg: 44.80,
    location_city: 'Vadodara',
    distance_km: 84,
    match_score: 94,
    primary_image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAtNGTut0Z3K1kiK2CyyKYHJ6z8F1oxWV2P4DNMTV9FQ&s=10',
    seller: { name: 'Gujarat Circular Polymers', trust_score: 94, city: 'Vadodara' }
  },
  {
    id: 'mat-demo-103',
    code: 'MAT-2026-6710',
    name: 'EPAL Standard Heat-Treated Wooden Euro Pallets',
    category: 'Pallets',
    subtype: 'Wooden Shipping Pallets',
    condition: 'Reusable',
    grade: 'EPAL Class A',
    quantity: 800,
    unit: 'units',
    quantity_kg: 8000,
    price_per_unit: 45.00,
    delivered_cost_per_kg: 48.50,
    location_city: 'Surat',
    distance_km: 140,
    match_score: 92,
    primary_image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqxLsc-fkrLdUl1LQ8hGdaYtvyCjkFooEjc-KbOrzQaw&s=10',
    seller: { name: 'Surat Warehousing & Logistics', trust_score: 95, city: 'Surat' }
  },
  {
    id: 'mat-demo-104',
    code: 'MAT-2026-5590',
    name: 'Heavy Duty Plastic Stackable Logistic Crates (600x400)',
    category: 'Crates',
    subtype: 'Returnable Plastic Containers',
    condition: 'Excellent',
    grade: 'Grade 1',
    quantity: 1200,
    unit: 'units',
    quantity_kg: 3600,
    price_per_unit: 35.00,
    delivered_cost_per_kg: 38.00,
    location_city: 'Ahmedabad',
    distance_km: 18,
    match_score: 96,
    primary_image_url: 'https://thumbs.dreamstime.com/b/colorful-plastic-crates-background-22215640.jpg',
    seller: { name: 'Ahmedabad Eco-Logistics Ltd', trust_score: 98, city: 'Ahmedabad' }
  },
  {
    id: 'mat-demo-105',
    code: 'MAT-2026-3388',
    name: 'Unprinted Virgin Kraft Paper Rolls & Side Offcuts',
    category: 'Paper',
    subtype: 'High Burst Kraft Paper',
    condition: 'Excellent',
    grade: '180 GSM',
    quantity: 3200,
    unit: 'kg',
    quantity_kg: 3200,
    price_per_unit: 24.00,
    delivered_cost_per_kg: 26.50,
    location_city: 'Mumbai',
    distance_km: 260,
    match_score: 91,
    primary_image_url: 'https://5.imimg.com/data5/SELLER/Default/2023/2/UA/IC/MN/18884681/used-brown-paper-bag-1000x1000-500x500.jpg',
    seller: { name: 'ITC Paperboards Circular Division', trust_score: 97, city: 'Mumbai' }
  },
  {
    id: 'mat-demo-106',
    code: 'MAT-2026-7734',
    name: 'Heavy Industrial Reconditioned Steel Drums (210L Capacity)',
    category: 'Metal',
    subtype: 'Steel Drums',
    condition: 'Reusable',
    grade: 'UN Certified Class 1',
    quantity: 450,
    unit: 'units',
    quantity_kg: 6750,
    price_per_unit: 75.00,
    delivered_cost_per_kg: 82.00,
    location_city: 'Ahmedabad',
    distance_km: 22,
    match_score: 95,
    primary_image_url: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=600&q=80',
    seller: { name: 'Ahmedabad Eco-Metal Recovery Ltd', trust_score: 96, city: 'Ahmedabad' }
  }
];

export const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<any | null>(null);
  const [bestBuyers, setBestBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderQuantity, setOrderQuantity] = useState<number>(5000);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [showWhyMatch, setShowWhyMatch] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    let foundMaterial: any = null;

    // 1. Try Backend API
    try {
      foundMaterial = await api.getMaterial(id!);
    } catch {
      foundMaterial = null;
    }

    // 2. Try LocalStorage user listings
    if (!foundMaterial) {
      try {
        const cached = JSON.parse(localStorage.getItem('loopmarket_user_listings') || '[]');
        foundMaterial = cached.find((m: any) => String(m.id) === String(id));
      } catch {
        // ignore
      }
    }

    // 3. Try Supabase DB
    if (!foundMaterial) {
      try {
        const sbData = await fetchMaterialsFromSupabase().catch(() => []);
        if (sbData && Array.isArray(sbData)) {
          foundMaterial = sbData.find((m: any) => String(m.id) === String(id));
        }
      } catch {
        // ignore
      }
    }

    // 4. Try Default Demo Materials
    if (!foundMaterial) {
      foundMaterial = DEFAULT_MARKETPLACE_MATERIALS.find(m => String(m.id) === String(id));
    }

    // Format Material Details
    if (foundMaterial) {
      const formatted = {
        ...foundMaterial,
        id: foundMaterial.id || id,
        code: foundMaterial.code || `MAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        name: foundMaterial.name || 'Surplus Material Lot',
        category: foundMaterial.category || 'Packaging',
        subtype: foundMaterial.subtype || foundMaterial.category || 'Surplus Inventory',
        price_per_unit: Number(foundMaterial.price_per_unit || 25.0),
        quantity_kg: Number(foundMaterial.quantity_kg || foundMaterial.quantity || 1000),
        unit: foundMaterial.unit || 'kg',
        condition: foundMaterial.condition || 'Reusable',
        grade: foundMaterial.grade || 'Grade A+',
        moisture_pct: foundMaterial.moisture_pct || 1.5,
        contamination_pct: foundMaterial.contamination_pct || 0.2,
        location_city: foundMaterial.location_city || 'Ahmedabad',
        distance_km: foundMaterial.distance_km || 15,
        match_score: foundMaterial.match_score ? Math.round(foundMaterial.match_score) : 96,
        primary_image_url: foundMaterial.primary_image_url || foundMaterial.image_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80',
        seller: foundMaterial.seller || { name: 'Verified Enterprise Supplier', trust_score: 96, city: foundMaterial.location_city || 'Ahmedabad' }
      };

      setMaterial(formatted);
      setOrderQuantity(formatted.quantity_kg);

      try {
        const buyersData = await api.getBestBuyers(id!).catch(() => ({ top_matches: [] }));
        setBestBuyers(buyersData?.top_matches || []);
      } catch {
        setBestBuyers([]);
      }
    }

    setLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!material) return;
    setIsPlacingOrder(true);

    const generatedOrderId = `ord_${Date.now()}`;
    const newOrder = {
      order_id: generatedOrderId,
      id: generatedOrderId,
      order_number: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      material_id: material.id,
      material_name: material.name,
      material_code: material.code,
      material_category: material.category,
      primary_image_url: material.primary_image_url,
      quantity: Number(orderQuantity),
      quantity_kg: Number(orderQuantity),
      unit_price: Number(material.price_per_unit),
      logistics_cost: 4200.0,
      subtotal: Number(orderQuantity) * Number(material.price_per_unit),
      total_amount: (Number(orderQuantity) * Number(material.price_per_unit)) + 4200.0,
      seller_name: material.seller?.name || 'Seller Facility',
      seller_city: material.location_city || 'Ahmedabad',
      status: 'ORDER_CONFIRMED',
      created_at: new Date().toISOString()
    };

    try {
      const existingOrders = JSON.parse(localStorage.getItem('loopmarket_user_orders') || '[]');
      localStorage.setItem('loopmarket_user_orders', JSON.stringify([newOrder, ...existingOrders]));
    } catch {
      // ignore
    }

    try {
      const res = await api.createOrder({
        material_id: material.id,
        quantity: orderQuantity,
        unit_price: material.price_per_unit,
        logistics_cost: 4200.0
      }).catch(() => null);

      const targetOrderId = res?.order_id || generatedOrderId;
      navigate(`/orders/${targetOrderId}`);
    } catch {
      navigate(`/orders/${generatedOrderId}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-3">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="font-bold text-slate-900 text-sm">Loading Material Lot Intelligence...</span>
        <span className="text-slate-400">Fetching digital passport, carbon metrics, & seller trust verification</span>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 space-y-3 max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-900">Material Listing Not Found</h3>
        <p>The requested lot could not be loaded. Return to marketplace to select from available listings.</p>
        <Link to="/marketplace" className="px-4 py-2 bg-slate-950 text-white rounded font-bold inline-block">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const subtotal = Number(orderQuantity || 0) * Number(material.price_per_unit || 0);
  const freight = 4200.0;
  const escrowFee = 0.0;
  const total = subtotal + freight + escrowFee;

  const co2AvoidedKg = Math.round((Number(orderQuantity) || 1000) * 2.4);
  const landfillDivertedKg = Number(orderQuantity) || 1000;
  const waterSavedLiters = Math.round((Number(orderQuantity) || 1000) * 12.5);
  const energySavedKwh = Math.round((Number(orderQuantity) || 1000) * 3.8);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-xs select-none">
      
      {/* Top Navigation & Verification Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-950 font-bold transition">
          <ArrowLeft className="w-4 h-4 text-emerald-600" /> Back to Circular Marketplace
        </Link>

        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> LIVE VERIFIED LOT
          </span>
          <span className="b2b-badge bg-slate-950 text-white border-slate-950 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> MOCK ESCROW PROTECTED
          </span>
          <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300 flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" /> SCOPE 3 GHG AUDITED
          </span>
        </div>
      </div>

      {/* HERO SECTION: Image, Specs & Escrow Buy Box (Spread Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Image Gallery & Passport Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="relative h-72 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={material.primary_image_url || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80"}
                alt={material.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-3 py-1 bg-slate-950/90 backdrop-blur-md text-white font-mono rounded-md text-xs font-black shadow-md">
                {material.code}
              </span>
              <span className="absolute top-3 right-3 px-3 py-1 bg-emerald-500 text-slate-950 font-black rounded-md text-xs font-mono shadow-md">
                {material.match_score}% Match Score
              </span>
            </div>

            {/* Passport & Match Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPassport(true)}
                className="py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-sm text-xs"
              >
                <QrCode className="w-4 h-4 text-emerald-400" /> Digital Passport
              </button>

              <button
                onClick={() => setShowWhyMatch(true)}
                className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg font-bold flex items-center justify-center gap-2 transition text-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" /> Why Match?
              </button>
            </div>
          </div>

          {/* Seller Enterprise Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 uppercase font-mono text-[11px] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-500" /> Verified Seller Enterprise
              </span>
              <span className="text-emerald-700 font-mono font-bold text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Trust {material.seller?.trust_score || 96}/100
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-950">{material.seller?.name}</h4>
              <p className="text-slate-500 flex items-center gap-1 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {material.location_city} Industrial Hub • {material.distance_km} km freight distance
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-mono">On-Time Rate</span>
                <span className="font-bold text-slate-900 font-mono">98.4%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-mono">Completed</span>
                <span className="font-bold text-slate-900 font-mono">142 Lots</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-mono">Verification</span>
                <span className="font-bold text-emerald-700 font-mono">Tier-1 Platinum</span>
              </div>
            </div>
          </div>

        </div>

        {/* Middle Column: Material Overview & Specs Matrix (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="b2b-badge bg-slate-900 text-white font-mono text-[10px]">
                  {material.category}
                </span>
                <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px]">
                  {material.subtype}
                </span>
              </div>

              <h1 className="text-xl font-black text-slate-950 leading-snug">{material.name}</h1>
              <p className="text-slate-500 mt-1.5 leading-relaxed text-xs">
                Verified high-purity industrial surplus lot ready for circular manufacturing, packaging remanufacturing, or closed-loop off-take.
              </p>
            </div>

            {/* Core Specs Table */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 uppercase font-mono text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Lot Specifications Matrix
              </h4>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Total Lot Weight</span>
                  <span className="font-black text-slate-950 font-mono text-sm">{Number(material.quantity_kg).toLocaleString()} {material.unit}</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Unit Base Price</span>
                  <span className="font-black text-emerald-700 font-mono text-sm">₹{material.price_per_unit}/kg</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Condition Grade</span>
                  <span className="font-bold text-slate-900">{material.grade} • {material.condition}</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Moisture / Impurity</span>
                  <span className="font-bold text-slate-900 font-mono">Max {material.moisture_pct}%</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Storage Format</span>
                  <span className="font-medium text-slate-800">Indoor Dry Bales / Pallets</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">EPR Compliance</span>
                  <span className="font-bold text-emerald-700">CPCB Registered</span>
                </div>
              </div>
            </div>

          </div>

          {/* Environmental Carbon Savings Banner */}
          <div className="bg-emerald-950 text-white rounded-xl p-5 border border-emerald-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 uppercase font-mono text-[11px] flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-400" /> Circular Carbon & Impact Metrics
              </span>
              <span className="text-[10px] font-mono bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded">
                ISO 14064 Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-emerald-400 block text-[10px] font-mono uppercase">Avoided Scope 3 GHG</span>
                <span className="text-lg font-black text-white font-mono">{co2AvoidedKg.toLocaleString()} kg CO₂e</span>
              </div>
              <div>
                <span className="text-emerald-400 block text-[10px] font-mono uppercase">Landfill Diversion</span>
                <span className="text-lg font-black text-white font-mono">{landfillDivertedKg.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-emerald-400 block text-[10px] font-mono uppercase">Water Conserved</span>
                <span className="text-lg font-black text-white font-mono">{waterSavedLiters.toLocaleString()} L</span>
              </div>
              <div>
                <span className="text-emerald-400 block text-[10px] font-mono uppercase">Energy Saved</span>
                <span className="text-lg font-black text-white font-mono">{energySavedKwh.toLocaleString()} kWh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Escrow Buy Checkout Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-5 sticky top-6 relative overflow-hidden">
            
            {/* Top Accent Gradient Bar */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-t-2xl -mt-5 -mx-5 mb-2" />

            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold flex items-center gap-1.5 font-mono text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ESCROW PROTECTED
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Step 1 of 2</span>
              </div>
              <h3 className="text-base font-black text-slate-950 mt-2">Instant Order Checkout</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Secure funds in mock escrow; released upon buyer inspection.</p>
            </div>

            {/* Price Breakdown Matrix */}
            <div className="space-y-2.5 p-4 bg-slate-950 text-white rounded-xl border border-slate-900 shadow-md text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Material Subtotal:</span>
                <span className="font-mono font-bold text-white">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Freight Logistics:</span>
                <span className="font-mono font-bold text-white">₹{freight.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Escrow Guarantee Fee:</span>
                <span className="font-mono text-emerald-400 font-bold">₹0.00 (Free)</span>
              </div>
              <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center font-bold text-sm">
                <span className="text-white">Delivered Total:</span>
                <span className="font-mono text-emerald-400 text-lg font-black">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Order Quantity Input & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-900 font-bold uppercase font-mono block">Order Quantity (kg) *</label>
                <span className="text-[10px] text-slate-400 font-mono">Lot: {Number(material.quantity_kg).toLocaleString()} kg</span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 text-slate-950 font-black font-mono text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs font-bold">kg</span>
              </div>

              {/* Quantity Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setOrderQuantity(Math.min(1000, material.quantity_kg))}
                  className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono text-[10px] font-bold transition"
                >
                  1,000 kg
                </button>
                <button
                  type="button"
                  onClick={() => setOrderQuantity(Math.round(material.quantity_kg / 2))}
                  className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono text-[10px] font-bold transition"
                >
                  50% Lot
                </button>
                <button
                  type="button"
                  onClick={() => setOrderQuantity(material.quantity_kg)}
                  className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono text-[10px] font-bold transition"
                >
                  Full Lot
                </button>
              </div>
            </div>

            {/* Primary Buy Button */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !orderQuantity || orderQuantity <= 0}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-150 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-white" />
                  Securing Escrow Deposit...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-white group-hover:scale-110 transition-transform" /> 
                  <span>Lock Escrow & Buy Now</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Trust Bullet Guarantee Points */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Funds locked in Escrow until QA pass</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Dispatched via LoopMarket Logistics within 48h</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Includes cryptographically signed DPP Passport</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* FULL WIDTH SECTION: Detailed Specifications & Logistics Schedule */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-950 uppercase font-mono flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" /> Comprehensive Material & Quality Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">1. Material Purity & Composition</h4>
            <ul className="space-y-1.5 text-slate-600 text-xs">
              <li className="flex justify-between">
                <span>Primary Fiber / Polymer:</span>
                <strong className="text-slate-900 font-mono">100% Recyclable OCC 11</strong>
              </li>
              <li className="flex justify-between">
                <span>Moisture Content:</span>
                <strong className="text-slate-900 font-mono">1.2% (Max 2.0%)</strong>
              </li>
              <li className="flex justify-between">
                <span>Contamination Rate:</span>
                <strong className="text-slate-900 font-mono">0.15% (Clean)</strong>
              </li>
              <li className="flex justify-between">
                <span>Burst Factor (BF):</span>
                <strong className="text-slate-900 font-mono">16 - 18 BF</strong>
              </li>
            </ul>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">2. Storage & Packaging Logistics</h4>
            <ul className="space-y-1.5 text-slate-600 text-xs">
              <li className="flex justify-between">
                <span>Packaging Type:</span>
                <strong className="text-slate-900 font-mono">Steel Banded Bales</strong>
              </li>
              <li className="flex justify-between">
                <span>Bale Dimensions:</span>
                <strong className="text-slate-900 font-mono">1100 x 900 x 800 mm</strong>
              </li>
              <li className="flex justify-between">
                <span>Bale Weight:</span>
                <strong className="text-slate-900 font-mono">~350 kg / bale</strong>
              </li>
              <li className="flex justify-between">
                <span>Facility Type:</span>
                <strong className="text-slate-900 font-mono">Dry Indoor Warehouse</strong>
              </li>
            </ul>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">3. Governance & Dispute Safeguards</h4>
            <ul className="space-y-1.5 text-slate-600 text-xs">
              <li className="flex justify-between">
                <span>Inspection Window:</span>
                <strong className="text-slate-900 font-mono">48 Hours Post-Delivery</strong>
              </li>
              <li className="flex justify-between">
                <span>QA Verification:</span>
                <strong className="text-slate-900 font-mono">Moisture Sensor Attached</strong>
              </li>
              <li className="flex justify-between">
                <span>Escrow Refund:</span>
                <strong className="text-emerald-700 font-mono">100% Refund Guarantee</strong>
              </li>
              <li className="flex justify-between">
                <span>Contract Type:</span>
                <strong className="text-slate-900 font-mono">Smart Escrow Locked</strong>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Digital Passport Modal */}
      <MaterialPassportModal
        isOpen={showPassport}
        onClose={() => setShowPassport(false)}
        material={material}
      />

      {/* Why Match Drawer Modal */}
      <WhyMatchDrawer
        isOpen={showWhyMatch}
        onClose={() => setShowWhyMatch(false)}
        material={material}
        onRequestOrder={handlePlaceOrder}
      />

    </div>
  );
};
