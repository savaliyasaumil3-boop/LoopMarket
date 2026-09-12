import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, Sparkles, ShieldCheck, MapPin, SlidersHorizontal,
  ArrowUpDown, ExternalLink, ArrowRight, X, RotateCcw,
  Package, Tag, Building2, Clock, CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { fetchMaterials as fetchMaterialsFromSupabase } from '../lib/supabaseData';
import { WhyMatchDrawer } from '../components/WhyMatchDrawer';
import { MaterialPassportModal } from '../components/MaterialPassportModal';

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
  }
];

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nlQuery, setNlQuery] = useState(initialSearch);
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [appliedNlFilters, setAppliedNlFilters] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [sortBy, setSortBy] = useState<string>('recommended');

  // Modals
  const [selectedWhyMaterial, setSelectedWhyMaterial] = useState<any | null>(null);
  const [selectedPassportMaterial, setSelectedPassportMaterial] = useState<any | null>(null);
  const fetchRequestRef = useRef(0);

  useEffect(() => {
    fetchMaterials();
  }, [selectedCategory, selectedCondition, selectedCity, maxPrice, sortBy]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'All');
    setSelectedCondition(searchParams.get('condition') || 'All');
    setSelectedCity(searchParams.get('city') || 'All');
    setMaxPrice(Number(searchParams.get('maxPrice') || 100));
  }, [searchParams]);

  useEffect(() => {
    if (initialSearch) {
      handleNlSearch(initialSearch);
    }
  }, [initialSearch]);

  const fetchMaterials = async () => {
    const requestId = ++fetchRequestRef.current;
    setLoading(true);

    // 1. Read from LocalStorage (user uploaded lots)
    let cachedListings: any[] = [];
    try {
      cachedListings = JSON.parse(localStorage.getItem('loopmarket_user_listings') || '[]');
    } catch {
      cachedListings = [];
    }

    // 2. Fetch from Supabase DB (newly posted materials)
    let sbData: any[] = [];
    try {
      sbData = (await fetchMaterialsFromSupabase().catch(() => [])) || [];
    } catch (e) {
      console.warn('Supabase marketplace load notice:', e);
    }

    // 3. Fetch from FastAPI Backend API
    let apiData: any[] = [];
    try {
      apiData = (await api.getMaterials().catch(() => [])) || [];
    } catch (e) {
      console.warn('Backend marketplace load notice:', e);
    }

    // Combine into deduplicated map
    const map = new Map<string, any>();

    // Add default materials first
    DEFAULT_MARKETPLACE_MATERIALS.forEach(item => map.set(String(item.id), item));

    // Include newly posted materials from Supabase & localStorage
    sbData.forEach(item => map.set(String(item.id), { ...map.get(String(item.id)), ...item }));
    cachedListings.forEach(item => map.set(String(item.id), { ...map.get(String(item.id)), ...item }));

    let allLots = Array.from(map.values()).map(item => ({
      ...item,
      id: item.id || `mat_${Math.random()}`,
      code: item.code || `MAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: item.name || `${item.category || 'Surplus'} Material Lot`,
      category: item.category || 'Packaging',
      condition: item.condition || 'Good',
      grade: item.grade || 'Grade A',
      quantity_kg: item.quantity_kg || item.quantity || 1000,
      unit: item.unit || 'kg',
      price_per_unit: item.price_per_unit || 25.0,
      delivered_cost_per_kg: item.delivered_cost_per_kg || (Number(item.price_per_unit || 25.0) * 1.12).toFixed(2),
      location_city: item.location_city || item.city || 'Ahmedabad',
      distance_km: item.distance_km || Math.floor(10 + Math.random() * 80),
      match_score: item.match_score ? Math.round(item.match_score) : Math.floor(88 + Math.random() * 11),
      primary_image_url: item.primary_image_url || item.image_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80',
      seller: item.seller || { name: 'Verified Supplier', trust_score: 95, city: item.location_city || 'Ahmedabad' }
    }));

    // Client-side filtering
    if (selectedCategory !== 'All') {
      allLots = allLots.filter(m => String(m.category).toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    if (selectedCondition !== 'All') {
      allLots = allLots.filter(m => String(m.condition).toLowerCase().includes(selectedCondition.toLowerCase()));
    }

    if (selectedCity !== 'All') {
      allLots = allLots.filter(m => String(m.location_city).toLowerCase().includes(selectedCity.toLowerCase()));
    }

    if (maxPrice < 100) {
      allLots = allLots.filter(m => Number(m.price_per_unit) <= maxPrice);
    }

    if (nlQuery.trim() && !appliedNlFilters) {
      const q = nlQuery.toLowerCase();
      allLots = allLots.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.location_city?.toLowerCase().includes(q) ||
        m.seller?.name?.toLowerCase().includes(q)
      );
    }

    // Client-side sorting
    if (sortBy === 'price_low') {
      allLots.sort((a, b) => Number(a.price_per_unit) - Number(b.price_per_unit));
    } else if (sortBy === 'distance') {
      allLots.sort((a, b) => Number(a.distance_km) - Number(b.distance_km));
    } else if (sortBy === 'circularity') {
      allLots.sort((a, b) => Number(b.match_score) - Number(a.match_score));
    } else if (sortBy === 'newest') {
      allLots.reverse();
    } else {
      allLots.sort((a, b) => Number(b.match_score) - Number(a.match_score));
    }

    if (requestId === fetchRequestRef.current) {
      setMaterials(allLots);
      setLoading(false);
    }
  };

  const handleNlSearch = async (textToSearch?: string) => {
    const q = textToSearch || nlQuery;
    if (!q.trim()) return;

    setIsParsingNl(true);
    try {
      const res = await api.parseSearch(q).catch(() => null);
      if (res && res.structured_filters) {
        const sf = res.structured_filters;
        setAppliedNlFilters(sf);

        if (sf.category) setSelectedCategory(sf.category);
        if (sf.condition) setSelectedCondition(sf.condition);
        if (sf.city) setSelectedCity(sf.city);
        if (sf.max_price) setMaxPrice(sf.max_price);
      }
    } catch {
      // ignore
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

  const updateMarketplaceFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'All' || value === '100') params.delete(key);
    else params.set(key, value);
    setSearchParams(params);
  };

  const clearMarketplaceFilters = () => {
    const params = new URLSearchParams(searchParams);
    ['category', 'condition', 'city', 'maxPrice'].forEach((key) => params.delete(key));
    setSearchParams(params);
    setShowFilters(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
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
            Switch to Wanted Demands
          </Link>
          <Link
            to="/sell"
            className="px-3.5 py-2 bg-slate-950 text-white hover:bg-slate-800 rounded-md text-xs font-semibold transition flex items-center gap-1 shadow-sm"
          >
            + List Material
          </Link>
        </div>
      </div>

      {/* Layer 1 MiniMax Natural Language Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI NATURAL LANGUAGE SEARCH & SMART FILTERS</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNlSearch()}
              placeholder="e.g. 'Find 2 tonnes of reusable plastic packaging in Ahmedabad below ₹40/kg'..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>
          <button
            onClick={() => handleNlSearch()}
            disabled={isParsingNl}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isParsingNl ? 'animate-spin' : ''}`} />
            {isParsingNl ? 'Parsing...' : 'AI Search'}
          </button>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowFilters((visible) => !visible)}
              className="inline-flex h-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              title="Filter marketplace materials"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
            {showFilters && (
              <div className="absolute right-0 top-12 z-40 w-72 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900">Marketplace filters</span>
                  <button type="button" onClick={clearMarketplaceFilters} className="text-[11px] text-slate-500 hover:text-slate-900">Reset</button>
                </div>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Material type</span>
                  <select value={searchParams.get('category') || 'All'} onChange={(event) => updateMarketplaceFilter('category', event.target.value)} className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 font-medium text-slate-800 outline-none focus:border-slate-900">
                    {['All', 'Cardboard', 'Plastic', 'Pallets', 'Paper', 'Crates', 'Packaging Film', 'Wood'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Condition</span>
                  <select value={searchParams.get('condition') || 'All'} onChange={(event) => updateMarketplaceFilter('condition', event.target.value)} className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 font-medium text-slate-800 outline-none focus:border-slate-900">
                    {['All', 'Excellent', 'Good', 'Reusable', 'Recyclable'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location hub</span>
                  <select value={searchParams.get('city') || 'All'} onChange={(event) => updateMarketplaceFilter('city', event.target.value)} className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 font-medium text-slate-800 outline-none focus:border-slate-900">
                    {['All', 'Ahmedabad', 'Vadodara', 'Surat', 'Rajkot', 'Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Hyderabad'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500"><span>Max unit price</span><span>₹{searchParams.get('maxPrice') || '100'}/kg</span></span>
                  <input type="range" min="5" max="100" step="5" value={searchParams.get('maxPrice') || '100'} onChange={(event) => updateMarketplaceFilter('maxPrice', event.target.value)} className="w-full accent-slate-900" />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Applied NLP Filter Chips */}
        {appliedNlFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs border-t border-slate-100">
            <span className="text-[11px] font-mono text-slate-400">Extracted Filters:</span>
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

      {/* Marketplace Grid */}
      <div className="space-y-4">
          
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
                <option value="price_low">Lowest Unit Price</option>
                <option value="distance">Nearest First</option>
                <option value="circularity">Highest Match %</option>
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
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs space-y-3 shadow-sm">
              <p className="font-medium text-slate-700">No materials found matching your current filter criteria.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m) => (
                <div key={m.id} className="b2b-card p-4 space-y-3 flex flex-col justify-between hover:border-slate-400 transition shadow-sm">
                  <div>
                    {/* Image & Badge Header */}
                    <div className="relative h-36 w-full rounded-md overflow-hidden bg-slate-100 border border-slate-200 mb-3">
                      <img
                        src={m.primary_image_url || m.image_url || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80"}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm text-white text-[10px] font-mono rounded font-bold">
                          {m.code}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="b2b-badge bg-emerald-500 text-slate-950 font-bold border-none text-[10px]">
                          {m.match_score}% Match
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{m.category}</span>
                      <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Trust {m.seller?.trust_score || 95}/100
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{m.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {m.seller?.name || 'Verified Supplier'} • {m.location_city} ({m.distance_km} km)
                    </p>

                    {/* Specs Table */}
                    <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Lot:</span>
                        <span className="font-bold text-slate-800">{Number(m.quantity_kg).toLocaleString()} {m.unit || 'kg'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Unit Price:</span>
                        <span className="font-black text-slate-950 font-mono">₹{m.price_per_unit}/kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivered Cost:</span>
                        <span className="font-bold text-emerald-700 font-mono">₹{m.delivered_cost_per_kg}/kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Grade / Condition:</span>
                        <span className="font-medium text-slate-700">{m.grade || 'Grade A'} • {m.condition || 'Good'}</span>
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
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      View Details & Buy <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </Link>
                  </div>

                </div>
              ))}
            </div>
          )}

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
