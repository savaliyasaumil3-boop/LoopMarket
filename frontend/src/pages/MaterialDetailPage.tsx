import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Sparkles, MapPin, Truck, Leaf, 
  CircleDollarSign, CheckCircle2, QrCode, FileText, ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import { MaterialPassportModal } from '../components/MaterialPassportModal';
import { WhyMatchDrawer } from '../components/WhyMatchDrawer';

export const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<any | null>(null);
  const [bestBuyers, setBestBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderQuantity, setOrderQuantity] = useState<number>(5000);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [selectedWhyBuyer, setSelectedWhyBuyer] = useState<any | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matData, buyersData] = await Promise.all([
        api.getMaterial(id!),
        api.getBestBuyers(id!).catch(() => ({ top_matches: [] }))
      ]);
      setMaterial(matData);
      setBestBuyers(buyersData?.top_matches || []);
      if (matData?.quantity_kg) setOrderQuantity(matData.quantity_kg);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!material) return;
    setIsPlacingOrder(true);
    try {
      const res = await api.createOrder({
        material_id: material.id,
        quantity: orderQuantity,
        unit_price: material.price_per_unit,
        logistics_cost: 4200.0
      });
      navigate(`/orders/${res.order_id}`);
    } catch (e: any) {
      alert(e.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading lot intelligence...</div>;
  }

  if (!material) {
    return <div className="p-12 text-center text-xs text-slate-500">Material listing not found.</div>;
  }

  const subtotal = orderQuantity * material.price_per_unit;
  const freight = 4200.0;
  const total = subtotal + freight;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-xs">
      
      {/* Back button */}
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Main Material Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Image & Passport Trigger (4 cols) */}
        <div className="md:col-span-4 space-y-3">
          <div className="relative h-56 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={material.primary_image_url || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80"}
              alt={material.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2 left-2 px-2.5 py-1 bg-slate-950/80 backdrop-blur-sm text-white font-mono rounded text-[11px] font-bold">
              {material.code}
            </span>
          </div>

          <button
            onClick={() => setShowPassport(true)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            View Digital Material Passport
          </button>
        </div>

        {/* Center: Technical Specifications (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300 font-mono">
                {material.category}
              </span>
              <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Trust {material.seller?.trust_score}/100
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-950 leading-snug">{material.name}</h1>
            <p className="text-slate-500 mt-1">
              Offered by <strong>{material.seller?.name}</strong> • {material.location_city} ({material.distance_km} km away)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-400 block text-[10px]">Grade Standard</span>
              <span className="font-bold text-slate-800">{material.grade}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-400 block text-[10px]">Physical Condition</span>
              <span className="font-bold text-slate-800">{material.condition}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-400 block text-[10px]">Contamination Level</span>
              <span className="font-bold text-emerald-700">{material.contamination_level}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-400 block text-[10px]">Packaging Type</span>
              <span className="font-bold text-slate-800">{material.packaging_type}</span>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
            {material.description}
          </p>
        </div>

        {/* Right: Delivered Cost & 1-Click Mock Escrow Order (3 cols) */}
        <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Delivered Cost Summary</span>
            <div className="text-2xl font-black text-slate-950 font-mono mt-1">
              ₹{material.price_per_unit}<span className="text-xs font-normal text-slate-500">/kg base</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 block">
              + ₹{(freight / orderQuantity).toFixed(2)}/kg freight (₹{material.delivered_cost_per_kg}/kg total)
            </span>

            <div className="mt-4 space-y-2 pt-3 border-t border-slate-200">
              <label className="font-semibold text-slate-700 block text-[11px]">Procurement Quantity (kg)</label>
              <input
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                min="500"
                max={material.quantity_kg}
                step="500"
                className="b2b-input font-mono font-bold"
              />

              <div className="space-y-1 pt-2 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logistics Quote:</span>
                  <span>₹{freight.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-xs">
                  <span>Total Delivered:</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            {isPlacingOrder ? 'Securing Escrow...' : 'Order & Deposit Mock Escrow'}
          </button>
        </div>

      </div>

      {/* DEMO SCENARIO SECTION: Find Best Buyers for this Lot */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-950">
                Hybrid AI Matching: Top Recommended Buyers for this Lot
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Ranked dynamically by the 5-factor deterministic matching engine ($30\%$ Material, $20\%$ Quantity, $20\%$ Distance, $15\%$ Cost, $15\%$ Circularity).
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold self-start">
            Scenario Demo #33
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bestBuyers.map((b, idx) => (
            <div key={b.buyer_id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-white rounded font-bold">
                    RANK #{idx + 1}
                  </span>
                  <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                    {Math.round(b.scores?.match_score || 90)}% Match
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2">{b.buyer_name}</h3>
                <p className="text-slate-500 text-xs">{b.company_type} • {b.city} ({b.scores?.distance_km} km)</p>

                <div className="mt-3 space-y-1 text-xs">
                  {b.scores?.why_points?.slice(0, 4).map((pt: string, i: number) => (
                    <div key={i} className="text-slate-700 font-medium">{pt}</div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => setSelectedWhyBuyer({ ...material, match_score: b.scores?.match_score, distance_km: b.scores?.distance_km, delivered_cost_per_kg: b.scores?.delivered_cost_per_kg, seller: { name: b.buyer_name, city: b.city } })}
                  className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded font-semibold text-xs transition"
                >
                  View Full Score Breakdown
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <MaterialPassportModal
        isOpen={showPassport}
        onClose={() => setShowPassport(false)}
        material={material}
      />

      <WhyMatchDrawer
        isOpen={!!selectedWhyBuyer}
        onClose={() => setSelectedWhyBuyer(null)}
        material={selectedWhyBuyer}
      />

    </div>
  );
};
