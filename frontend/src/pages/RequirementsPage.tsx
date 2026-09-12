import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, ShieldCheck, MapPin, 
  Sparkles, ArrowRight, X, Filter, Loader
} from 'lucide-react';
import { api } from '../lib/api';
import { addRequirement, fetchRequirements as fetchRequirementsFromSupabase } from '../lib/supabaseData';

const DEFAULT_REQUIREMENTS = [
  {
    id: 'req-demo-201',
    title: 'Seeking Monthly Baled OCC Grade 11 Boxes',
    category: 'Cardboard',
    buyer: { name: 'GreenPack Industries Ltd', trust_score: 98, city: 'Vadodara' },
    destination_city: 'Vadodara',
    required_quantity_kg: 10000,
    target_price_per_kg: 16.00,
    max_acceptable_distance_km: 150,
    grade: 'OCC Grade 11',
    desired_condition: 'Good / Clean',
    urgency: 'HIGH',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'req-demo-202',
    title: 'Post-Industrial HDPE Regrind Flakes Offtake',
    category: 'Plastic',
    buyer: { name: 'ABC Manufacturing Pvt Ltd', trust_score: 96, city: 'Ahmedabad' },
    destination_city: 'Ahmedabad',
    required_quantity_kg: 5000,
    target_price_per_kg: 44.00,
    max_acceptable_distance_km: 100,
    grade: 'Polymer Regrind Grade A',
    desired_condition: 'Excellent',
    urgency: 'IMMEDIATE',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'req-demo-203',
    title: 'Standard EPAL Wooden Euro Pallets Exchange (800 Units)',
    category: 'Pallets',
    buyer: { name: 'Surat Warehousing & Logistics', trust_score: 95, city: 'Surat' },
    destination_city: 'Surat',
    required_quantity_kg: 8000,
    target_price_per_kg: 48.00,
    max_acceptable_distance_km: 200,
    grade: 'EPAL Class A (ISPM-15)',
    desired_condition: 'Reusable',
    urgency: 'HIGH',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'req-demo-204',
    title: 'Heavy Duty Stackable Plastic Logistics Crates (600x400)',
    category: 'Crates',
    buyer: { name: 'Ahmedabad Eco-Logistics Ltd', trust_score: 98, city: 'Ahmedabad' },
    destination_city: 'Ahmedabad',
    required_quantity_kg: 3600,
    target_price_per_kg: 38.00,
    max_acceptable_distance_km: 120,
    grade: 'HDPE Grade 1 Plastic',
    desired_condition: 'Good',
    urgency: 'MEDIUM',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

export const RequirementsPage: React.FC = () => {
  const [rawRequirements, setRawRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedReqMatches, setSelectedReqMatches] = useState<any | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // New Requirement Form State
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

    let localReqs: any[] = [];
    try {
      localReqs = JSON.parse(localStorage.getItem('loopmarket_user_requirements') || '[]');
    } catch {
      localReqs = [];
    }

    let sbReqs: any[] = [];
    try {
      sbReqs = (await fetchRequirementsFromSupabase().catch(() => [])) || [];
    } catch {
      // ignore
    }

    let apiReqs: any[] = [];
    try {
      apiReqs = (await api.getRequirements().catch(() => [])) || [];
    } catch {
      // ignore
    }

    const map = new Map<string, any>();
    DEFAULT_REQUIREMENTS.forEach(r => map.set(String(r.id), r));
    apiReqs.forEach(r => map.set(String(r.id), r));
    sbReqs.forEach(r => map.set(String(r.id), { ...map.get(String(r.id)), ...r }));
    localReqs.forEach(r => map.set(String(r.id), { ...map.get(String(r.id)), ...r }));

    const combined = Array.from(map.values()).map(r => ({
      ...r,
      id: r.id || `req_${Math.random()}`,
      title: r.title || `Seeking ${r.category || 'Surplus'} Material Stock`,
      category: r.category || 'Cardboard',
      buyer: r.buyer || { name: 'Verified Enterprise Buyer', trust_score: 96, city: r.destination_city || 'Ahmedabad' },
      destination_city: r.destination_city || 'Vadodara',
      required_quantity_kg: Number(r.required_quantity_kg || r.target_quantity_kg || 5000),
      target_price_per_kg: Number(r.target_price_per_kg || r.max_price_per_kg || 16.0),
      max_acceptable_distance_km: Number(r.max_acceptable_distance_km || 150),
      grade: r.grade || 'Grade A',
      desired_condition: r.desired_condition || 'Good',
    }));

    setRawRequirements(combined);
    setLoading(false);
  };

  const filteredRequirements = useMemo(() => {
    let result = rawRequirements;

    if (selectedCategory !== 'All') {
      result = result.filter(r => r.category?.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.destination_city && r.destination_city.toLowerCase().includes(q)) ||
        (r.buyer?.name && r.buyer.name.toLowerCase().includes(q)) ||
        (r.buyer?.city && r.buyer.city.toLowerCase().includes(q)) ||
        (r.grade && r.grade.toLowerCase().includes(q))
      );
    }

    return result;
  }, [rawRequirements, selectedCategory, searchTerm]);

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = `req_${Date.now()}`;
    const newReq: any = {
      id: generatedId,
      title,
      category,
      buyer: { name: 'ABC Manufacturing Pvt Ltd', trust_score: 96, city: destinationCity },
      required_quantity_kg: Number(quantityKg),
      grade,
      desired_condition: desiredCondition,
      max_acceptable_distance_km: Number(maxDistance),
      target_price_per_kg: Number(targetPrice),
      destination_city: destinationCity,
    };

    try {
      const existing = JSON.parse(localStorage.getItem('loopmarket_user_requirements') || '[]');
      localStorage.setItem('loopmarket_user_requirements', JSON.stringify([newReq, ...existing]));
    } catch {
      // ignore
    }

    try {
      await addRequirement(newReq).catch(() => null);
    } catch {
      // ignore
    }

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
      }).catch(() => null);
    } catch {
      // ignore
    }

    setRawRequirements(prev => [newReq, ...prev]);
    setShowPostModal(false);
  };

  const handleFindMatchingSellers = async (reqId: string) => {
    setMatchingLoading(true);
    try {
      const res = await api.getRequirementMatches(reqId).catch(() => null);
      if (res && (res.matches || res.top_matches)) {
        setSelectedReqMatches(res);
      } else {
        const targetReq = rawRequirements.find(r => String(r.id) === String(reqId));
        setSelectedReqMatches({
          requirement_title: targetReq?.title || 'Material Demand',
          matches: [
            {
              material_id: 'mat-demo-101',
              material_code: 'MAT-101',
              material_name: 'Baled Industrial Corrugated Cardboard OCC Grade 11',
              seller_name: 'ABC Manufacturing Pvt Ltd',
              seller_city: 'Ahmedabad',
              scores: { match_score: 98, distance_km: 12, delivered_cost_per_kg: 14.50 }
            },
            {
              material_id: 'mat-demo-102',
              material_code: 'MAT-102',
              material_name: 'Post-Industrial HDPE Blue Drums & Carboys',
              seller_name: 'Gujarat Circular Polymers',
              seller_city: 'Vadodara',
              scores: { match_score: 94, distance_km: 84, delivered_cost_per_kg: 42.00 }
            }
          ]
        });
      }
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

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search urgent demands by material, city, buyer, or grade..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white text-xs text-slate-900"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 transition"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-mono text-[11px] uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="b2b-input w-full sm:w-40 font-semibold text-xs"
            >
              <option value="All">All Categories</option>
              <option value="Cardboard">Cardboard</option>
              <option value="Plastic">Plastic</option>
              <option value="Pallets">Pallets</option>
              <option value="Crates">Crates</option>
              <option value="Paper">Paper</option>
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1 shrink-0"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Requirements Grid (Original b2b-card Styling Preserved) */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
          <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading procurement demands...
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl space-y-3">
          <p className="font-bold text-slate-900 text-sm">No procurement demands found</p>
          <p className="text-slate-500 text-xs">
            {searchTerm || selectedCategory !== 'All' 
              ? `No requirements matching your search "${searchTerm || selectedCategory}". Try clearing your search.`
              : 'Post a new requirement to alert regional circular material suppliers.'
            }
          </p>
          {(searchTerm || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-bold text-xs inline-flex items-center gap-1 transition"
            >
              Reset Search Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequirements.map((r) => (
            <div key={r.id} className="b2b-card p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300 font-mono">
                    {r.category}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Trust {r.buyer?.trust_score || 96}/100
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
                disabled={matchingLoading}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Find Matching Supply Lots
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Matching Lots Drawer / Modal */}
      {selectedReqMatches && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400">HYBRID MATCHING ENGINE</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedReqMatches.requirement_title || 'Compatible Supply Lots Available'}</h3>
              </div>
              <button onClick={() => setSelectedReqMatches(null)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {(!selectedReqMatches.matches || selectedReqMatches.matches.length === 0) && (!selectedReqMatches.top_matches || selectedReqMatches.top_matches.length === 0) ? (
                <p className="text-slate-500 text-center py-8">No immediate supply matches found within this radius.</p>
              ) : (
                (selectedReqMatches.matches || selectedReqMatches.top_matches || []).map((m: any) => (
                  <div key={m.material_id || m.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold">{m.material_code || 'MAT-LOT'}</span>
                        <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                          {Math.round(m.scores?.match_score || m.match_score || 95)}% Match
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 mt-1">{m.material_name || m.name}</h4>
                      <p className="text-slate-500 mt-0.5">{m.seller_name} ({m.seller_city || m.location_city} • {m.scores?.distance_km || m.distance_km} km)</p>
                      <p className="text-emerald-700 font-semibold mt-1">Delivered: ₹{m.scores?.delivered_cost_per_kg || m.price_per_unit}/kg</p>
                    </div>

                    <Link
                      to={`/materials/${m.material_id || m.id}`}
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
