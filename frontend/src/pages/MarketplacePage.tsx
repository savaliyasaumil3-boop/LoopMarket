import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, Sparkles, ShieldCheck, MapPin, 
  ArrowUpDown, ExternalLink, ArrowRight, Check, X, RotateCcw
} from 'lucide-react';
import { api } from '../lib/api';
import { WhyMatchDrawer } from '../components/WhyMatchDrawer';
import { MaterialPassportModal } from '../components/MaterialPassportModal';

export const MarketplacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nlQuery, setNlQuery] = useState(initialSearch);
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [appliedNlFilters, setAppliedNlFilters] = useState<any | null>(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [sortBy, setSortBy] = useState<string>('recommended');

  // Modals
  const [selectedWhyMaterial, setSelectedWhyMaterial] = useState<any | null>(null);
  const [selectedPassportMaterial, setSelectedPassportMaterial] = useState<any | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, [selectedCategory, selectedCondition, selectedCity, maxPrice, sortBy]);

  useEffect(() => {
    if (initialSearch) {
      handleNlSearch(initialSearch);
    }
  }, [initialSearch]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await api.getMaterials({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        condition: selectedCondition !== 'All' ? selectedCondition : undefined,
        city: selectedCity !== 'All' ? selectedCity : undefined,
        max_price: maxPrice < 100 ? maxPrice : undefined,
        sort_by: sortBy,
        search: nlQuery && !appliedNlFilters ? nlQuery : undefined
      });
      setMaterials(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleNlSearch = async (textToSearch?: string) => {
    const q = textToSearch || nlQuery;
    if (!q.trim()) return;

    setIsParsingNl(true);
    try {
      const res = await api.parseSearch(q);
      const sf = res.structured_filters;
      setAppliedNlFilters(sf);

      if (sf.category) setSelectedCategory(sf.category);
      if (sf.condition) setSelectedCondition(sf.condition);
      if (sf.city) setSelectedCity(sf.city);
      if (sf.max_price) setMaxPrice(sf.max_price);

      // Fetch with extracted filters
      const data = await api.getMaterials({
        category: sf.category,
        condition: sf.condition,
        city: sf.city,
        max_price: sf.max_price,
        sort_by: 'recommended'
      });
      setMaterials(data || []);
    } catch {
      fetchMaterials();
    } finally {
      setIsParsingNl(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedCity('All');
    setMaxPrice(100);
    setNlQuery('');
    setAppliedNlFilters(null);
    setSortBy('recommended');
  };

  const categories = ['All', 'Cardboard', 'Plastic', 'Pallets', 'Paper', 'Crates', 'Packaging Film', 'Wood'];
  const conditions = ['All', 'Excellent', 'Good', 'Reusable', 'Recyclable'];
  const cities = ['All', 'Ahmedabad', 'Vadodara', 'Surat', 'Rajkot', 'Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Hyderabad'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Circular Materials Marketplace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover verified surplus packaging inventory, inspect Digital Passports, and verify real delivered costs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/requirements"
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold transition"
          >
            Switch to Wanted Demands (Reverse Marketplace)
          </Link>
          <Link
            to="/sell"
            className="px-3.5 py-2 bg-slate-950 text-white hover:bg-slate-800 rounded-md text-xs font-semibold transition"
          >
            + List Material
          </Link>
        </div>
      </div>

      {/* Layer 1 MiniMax Natural Language Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI LAYER 1 NATURAL LANGUAGE QUERY & FILTERS</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNlSearch()}
              placeholder="e.g. 'Find 2 tonnes of reusable plastic packaging within 100 km of Ahmedabad below ₹40/kg'..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>
          <button
            onClick={() => handleNlSearch()}
            disabled={isParsingNl}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isParsingNl ? 'animate-spin' : ''}`} />
            {isParsingNl ? 'Parsing...' : 'AI Search'}
          </button>
        </div>

        {/* Applied NLP Filter Chips */}
        {appliedNlFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs border-t border-slate-100">
            <span className="text-[11px] font-mono text-slate-400">MiniMax Extracted:</span>
            {appliedNlFilters.category && (
              <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300">
                Category: {appliedNlFilters.category}
              </span>
            )}
            {appliedNlFilters.condition && (
              <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300">
                Condition: {appliedNlFilters.condition}
              </span>
            )}
            {appliedNlFilters.city && (
              <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300">
                Hub: {appliedNlFilters.city}
              </span>
            )}
            {appliedNlFilters.max_price && (
              <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-300">
                Max Price: ₹{appliedNlFilters.max_price}/kg
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-[11px] text-slate-500 hover:text-slate-900 underline flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Filter & Marketplace Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Filter Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-5 bg-white border border-slate-200 rounded-xl p-5 h-fit text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Filters
            </span>
            <button onClick={resetFilters} className="text-slate-400 hover:text-slate-700 text-[11px]">
              Reset
            </button>
          </div>

          {/* Material Category */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block text-[11px] uppercase font-mono">Material Type</label>
            <div className="space-y-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition flex items-center justify-between ${
                    selectedCategory === c
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{c}</span>
                  {selectedCategory === c && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <label className="font-semibold text-slate-700 block text-[11px] uppercase font-mono">Condition</label>
            <div className="space-y-1">
              {conditions.map((cond) => (
                <button
                  key={cond}
                  onClick={() => setSelectedCondition(cond)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition flex items-center justify-between ${
                    selectedCondition === cond
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{cond}</span>
                  {selectedCondition === cond && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* City / Hub */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <label className="font-semibold text-slate-700 block text-[11px] uppercase font-mono">Location Hub</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="b2b-input"
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="font-semibold text-slate-700 uppercase">Max Unit Price</span>
              <span className="font-bold text-slate-900">₹{maxPrice}/kg</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>
        </div>

        {/* Material Cards Grid (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Sorting & Count Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs shadow-sm">
            <span className="font-medium text-slate-600">
              Showing <strong className="text-slate-900 font-mono">{materials.length}</strong> available lots
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono uppercase text-[11px]">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="recommended">Recommended (Hybrid Match)</option>
                <option value="price_low">Lowest Delivered Cost</option>
                <option value="distance">Nearest First</option>
                <option value="circularity">Highest Circularity</option>
                <option value="newest">Newest Available</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-slate-200 rounded-lg p-4 h-64 animate-pulse"></div>
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs space-y-3">
              <p>No materials found matching your current filter criteria.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m) => (
                <div key={m.id} className="b2b-card p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    {/* Image & Badge Header */}
                    <div className="relative h-36 w-full rounded-md overflow-hidden bg-slate-100 border border-slate-200 mb-3">
                      <img
                        src={m.primary_image_url || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80"}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm text-white text-[10px] font-mono rounded">
                          {m.code}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="b2b-badge bg-emerald-500 text-slate-950 font-bold border-none text-[10px]">
                          {Math.round(m.match_score)}% Match
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{m.category}</span>
                      <span className="flex items-center gap-1 font-mono text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5" /> Trust {m.seller?.trust_score}/100
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{m.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {m.seller?.name || 'Verified Supplier'} • {m.location_city} ({m.distance_km} km)
                    </p>

                    {/* Specs Table */}
                    <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available:</span>
                        <span className="font-bold text-slate-800">{Number(m.quantity_kg).toLocaleString()} {m.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivered Cost:</span>
                        <span className="font-bold text-slate-900">₹{m.delivered_cost_per_kg}/kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Grade / Condition:</span>
                        <span className="font-medium text-slate-700">{m.grade} • {m.condition}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedWhyMaterial(m)}
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition"
                      >
                        Why Match?
                      </button>
                      <button
                        onClick={() => setSelectedPassportMaterial(m)}
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition"
                      >
                        Passport
                      </button>
                    </div>

                    <Link
                      to={`/materials/${m.id}`}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      View Details & Buy <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Why Match Drawer Modal */}
      <WhyMatchDrawer
        isOpen={!!selectedWhyMaterial}
        onClose={() => setSelectedWhyMaterial(null)}
        material={selectedWhyMaterial}
        onRequestOrder={() => {
          if (selectedWhyMaterial) {
            window.location.href = `/materials/${selectedWhyMaterial.id}`;
          }
        }}
      />

      {/* Digital Passport Modal */}
      <MaterialPassportModal
        isOpen={!!selectedPassportMaterial}
        onClose={() => setSelectedPassportMaterial(null)}
        material={selectedPassportMaterial}
      />

    </div>
  );
};
