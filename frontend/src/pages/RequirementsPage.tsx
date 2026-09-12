import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, TrendingUp, ShieldCheck, MapPin, 
  Sparkles, CheckCircle2, ArrowRight, X
} from 'lucide-react';
import { api } from '../lib/api';

export const RequirementsPage: React.FC = () => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedReqMatches, setSelectedReqMatches] = useState<any | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // New Requirement Form
  const [title, setTitle] = useState('Seeking Monthly Baled OCC Grade 11 Boxes');
  const [category, setCategory] = useState('Cardboard');
  const [quantityKg, setQuantityKg] = useState<number>(5000);
  const [grade, setGrade] = useState('OCC Grade 11');
  const [desiredCondition, setDesiredCondition] = useState('Good');
  const [maxDistance, setMaxDistance] = useState<number>(150);
  const [targetPrice, setTargetPrice] = useState<number>(16.0);
  const [destinationCity, setDestinationCity] = useState('Vadodara');

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const data = await api.getRequirements();
      setRequirements(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRequirement({
        title,
        category,
        required_quantity_kg: quantityKg,
        grade,
        desired_condition: desiredCondition,
        max_acceptable_distance_km: maxDistance,
        target_price_per_kg: targetPrice,
        destination_city: destinationCity
      });
      setShowPostModal(false);
      fetchRequirements();
    } catch (e: any) {
      alert(e.message || 'Failed to post requirement');
    }
  };

  const handleFindMatchingSellers = async (reqId: string) => {
    setMatchingLoading(true);
    try {
      const res = await api.getRequirementMatches(reqId);
      setSelectedReqMatches(res);
    } catch {
      alert('Could not retrieve matches for this requirement.');
    } finally {
      setMatchingLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Reverse Marketplace</span>
            <span className="b2b-badge bg-blue-50 text-blue-700 border-blue-200">
              DEMAND → SUPPLY
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Wanted Materials & Procurement Demands</h1>
          <p className="text-slate-500 mt-0.5">
            Post specific circular packaging requirements. Our matching engine automatically links compatible regional sellers.
          </p>
        </div>

        <button
          onClick={() => setShowPostModal(true)}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" /> Post Wanted Requirement
        </button>
      </div>

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requirements.map((r) => (
          <div key={r.id} className="b2b-card p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300 font-mono">
                  {r.category}
                </span>
                <span className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Trust {r.buyer?.trust_score}/100
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 leading-snug">{r.title}</h3>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {r.buyer?.name} • {r.destination_city}
              </p>

              <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Demand:</span>
                  <span className="font-bold text-slate-900 font-mono">{Number(r.required_quantity_kg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Price Cap:</span>
                  <span className="font-bold text-emerald-700 font-mono">₹{r.target_price_per_kg}/kg delivered</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Radius:</span>
                  <span className="font-semibold text-slate-800">{r.max_acceptable_distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required Grade:</span>
                  <span className="font-medium text-slate-700">{r.grade}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleFindMatchingSellers(r.id)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Find Matching Supply Lots
            </button>
          </div>
        ))}
      </div>

      {/* Matching Lots Drawer / Modal */}
      {selectedReqMatches && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400">HYBRID MATCHING ENGINE</span>
                <h3 className="text-base font-bold text-white mt-0.5">Compatible Supply Lots Available</h3>
              </div>
              <button onClick={() => setSelectedReqMatches(null)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {selectedReqMatches.matches?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No immediate supply matches found within this radius.</p>
              ) : (
                selectedReqMatches.matches?.map((m: any) => (
                  <div key={m.material_id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold">{m.material_code}</span>
                        <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                          {Math.round(m.scores?.match_score)}% Match
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 mt-1">{m.material_name}</h4>
                      <p className="text-slate-500 mt-0.5">{m.seller_name} ({m.seller_city} • {m.scores?.distance_km} km)</p>
                      <p className="text-emerald-700 font-semibold mt-1">Delivered: ₹{m.scores?.delivered_cost_per_kg}/kg</p>
                    </div>

                    <Link
                      to={`/materials/${m.material_id}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shrink-0"
                    >
                      View & Transact
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedReqMatches(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded font-semibold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Post Wanted Material Requirement</h3>
              <button onClick={() => setShowPostModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Requirement Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="b2b-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="b2b-input"
                  >
                    <option value="Cardboard">Cardboard</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Pallets">Pallets</option>
                    <option value="Paper">Paper</option>
                    <option value="Crates">Crates</option>
                    <option value="Packaging Film">Packaging Film</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Demand Volume (kg) *</label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    min="500"
                    required
                    className="b2b-input font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Max Delivered Price (₹/kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    required
                    className="b2b-input font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Max Sourcing Radius (km)</label>
                  <input
                    type="number"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="b2b-input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Destination Delivery Hub *</label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
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

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold transition"
                >
                  Publish Wanted Request
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
