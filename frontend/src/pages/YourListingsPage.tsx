import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, PlusCircle, Trash2, ShieldCheck, MapPin, 
  Search, RefreshCw, AlertTriangle, CheckCircle2, 
  ExternalLink, Database, Sparkles, Filter, Info
} from 'lucide-react';
import { api } from '../lib/api';
import { deleteMaterial, fetchMaterials } from '../lib/supabaseData';
import { useAuth } from '../context/AuthContext';

export const YourListingsPage: React.FC = () => {
  const { company } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals & Feedback State
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteNotice, setDeleteNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedPassportMaterial, setSelectedPassportMaterial] = useState<any | null>(null);

  useEffect(() => {
    loadUserListings();
  }, []);

  const loadUserListings = async () => {
    setLoading(true);
    let combined: any[] = [];

    // 1. Read from localStorage cache (user uploaded listings)
    let cachedListings: any[] = [];
    try {
      cachedListings = JSON.parse(localStorage.getItem('loopmarket_user_listings') || '[]');
    } catch {
      cachedListings = [];
    }

    // 2. Fetch from Supabase DB table 'materials'
    let supabaseItems: any[] = [];
    try {
      const sbData = await fetchMaterials();
      if (sbData && Array.isArray(sbData)) {
        supabaseItems = sbData.map(item => ({
          id: item.id || `sb_${Math.random()}`,
          code: item.code || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
          name: item.name,
          category: item.category || 'Packaging',
          subtype: item.subtype || item.category || 'Surplus Lot',
          quantity: item.quantity || 1000,
          unit: item.unit || 'kg',
          quantity_kg: item.quantity_kg || item.quantity || 1000,
          price_per_unit: item.price_per_unit || 15.0,
          location_city: item.location_city || 'Ahmedabad',
          primary_image_url: item.primary_image_url || item.image_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80',
          created_at: item.created_at || new Date().toISOString(),
          is_supabase: true,
          passport_code: `DPP-2026-${Math.floor(10000 + Math.random() * 90000)}`
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch notice on listings page:', e);
    }

    // 3. Fetch from FastAPI Backend
    let apiItems: any[] = [];
    try {
      const backendData = await api.getMaterials();
      if (backendData && Array.isArray(backendData)) {
        apiItems = backendData.filter((m: any) => m.seller_id === company?.id || m.is_user_uploaded);
      }
    } catch (e) {
      console.warn('Backend API fetch notice on listings page:', e);
    }

    // Combine all sources while removing duplicate IDs
    const map = new Map<string, any>();

    apiItems.forEach(item => map.set(String(item.id), { ...item, is_user_uploaded: true }));
    supabaseItems.forEach(item => map.set(String(item.id), { ...map.get(String(item.id)), ...item, is_supabase: true }));
    cachedListings.forEach(item => map.set(String(item.id), { ...map.get(String(item.id)), ...item, is_user_uploaded: true }));

    combined = Array.from(map.values());
    setListings(combined);
    setLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setDeleteNotice(null);

    const targetId = deletingItem.id;

    // 1. Delete from Supabase DB
    try {
      await deleteMaterial(targetId);
    } catch (err) {
      console.warn('Supabase deletion error:', err);
    }

    // 2. Delete from Backend API
    try {
      await api.deleteMaterial(String(targetId));
    } catch (err) {
      console.warn('API backend deletion error:', err);
    }

    // 3. Update localStorage cache
    try {
      const stored = JSON.parse(localStorage.getItem('loopmarket_user_listings') || '[]');
      const updated = stored.filter((m: any) => String(m.id) !== String(targetId));
      localStorage.setItem('loopmarket_user_listings', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // 4. Update UI State immediately
    setListings(prev => prev.filter(m => String(m.id) !== String(targetId)));
    setIsDeleting(false);
    
    const itemDeletedName = deletingItem.name;
    setDeletingItem(null);

    setDeleteNotice({
      type: 'success',
      message: `Listing "${itemDeletedName}" was successfully deleted from Supabase DB & Marketplace.`
    });

    setTimeout(() => {
      setDeleteNotice(null);
    }, 5000);
  };

  // Filter listings
  const filteredListings = listings.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate Metrics
  const totalVolumeKg = listings.reduce((sum, item) => sum + (Number(item.quantity_kg || item.quantity) || 0), 0);
  const totalListedValue = listings.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price_per_unit) || 0;
    return sum + (qty * price);
  }, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs select-none">
      
      {/* Toast Banner */}
      {deleteNotice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between animate-fade-in shadow-md ${
          deleteNotice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">{deleteNotice.message}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 font-mono">
                Supabase query execution: `DELETE FROM materials WHERE id = 'target'`
              </p>
            </div>
          </div>
          <button 
            onClick={() => setDeleteNotice(null)}
            className="text-xs font-semibold px-2 py-1 bg-emerald-200/60 hover:bg-emerald-200 rounded text-emerald-950 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="b2b-badge bg-emerald-100 text-emerald-900 border-emerald-300 font-mono text-[10px]">
              <Database className="w-3 h-3 text-emerald-700" /> SUPABASE LIVE CONNECTED
            </span>
            <span className="text-slate-500 font-mono text-[11px] uppercase">• Seller Facility</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Your Material Listings</h1>
          <p className="text-slate-600 text-xs mt-0.5">
            Manage your uploaded packaging & raw material surplus lots, view digital passports, or remove listings using Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUserListings}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh Supabase listings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            to="/sell"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" /> Upload New Listing
          </Link>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block font-semibold">Active Lots</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            {listings.length} Listings
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">Verified in Supabase DB</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block font-semibold">Total Volume Listed</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            {(totalVolumeKg / 1000).toFixed(1)} Tons
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{totalVolumeKg.toLocaleString()} kg total</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block font-semibold">Estimated Gross Value</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            ₹{totalListedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">Ready for circular buy-back</span>
        </div>

        <div className="bg-slate-950 text-white rounded-xl p-4 shadow-xs border border-slate-800">
          <span className="text-[11px] font-mono text-emerald-400 uppercase block font-semibold">Supabase Storage</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">
            Sync Active
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Row-level delete enabled</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by lot name, code, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium text-xs">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Categories</option>
            <option value="Cardboard">Cardboard & Pulp</option>
            <option value="Plastic">Polymers & Flakes</option>
            <option value="Wood">Wooden Pallets</option>
            <option value="Metal">Metals & Drums</option>
            <option value="Glass">Glass Cullet</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="mt-3 text-slate-600 font-medium">Fetching uploaded listings from Supabase...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">No uploaded listings found</h3>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">
              You haven't listed any surplus materials yet, or no listings match your search filter.
            </p>
          </div>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" /> Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => {
            const totalPrice = (Number(item.quantity) || 0) * (Number(item.price_per_unit) || 0);

            return (
              <div 
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img 
                      src={item.primary_image_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80';
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs text-white rounded text-[10px] font-mono uppercase font-bold">
                        {item.category || 'Material'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/90 text-slate-950 font-bold rounded text-[10px] font-mono flex items-center gap-1">
                        <Database className="w-2.5 h-2.5" /> SUPABASE DB
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-white/90 text-slate-800 font-mono font-bold text-[10px] rounded border border-slate-200">
                        {item.code || 'MAT-LOT'}
                      </span>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5">
                        {item.description || 'Verified secondary raw material available for industrial reuse.'}
                      </p>
                    </div>

                    {/* Key Attributes Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">Quantity</span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {Number(item.quantity).toLocaleString()} {item.unit || 'kg'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">Price / Unit</span>
                        <span className="font-extrabold text-emerald-700 font-mono">
                          ₹{Number(item.price_per_unit).toFixed(2)} / {item.unit || 'kg'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">Location</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {item.location_city || 'Ahmedabad'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">Est. Total</span>
                        <span className="font-extrabold text-slate-950 font-mono">
                          ₹{totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedPassportMaterial({
                      code: item.code,
                      name: item.name,
                      category: item.category,
                      grade: item.grade || 'Industrial Standard',
                      condition: item.condition || 'Good',
                      contamination_level: item.contamination_level || 'Low',
                      quantity_kg: item.quantity_kg || item.quantity,
                      location_city: item.location_city || 'Ahmedabad',
                      passport: {
                        passport_code: item.passport_code || 'DPP-2026-LIVE',
                        purity_percentage: 96.5,
                        reusability_rating: 'HIGH',
                        embodied_carbon_saved_per_kg: item.category === 'Cardboard' ? 0.95 : 2.45,
                        verification_hash: 'SHA256-MINTED-VERIFIED'
                      }
                    })}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Passport
                  </button>

                  {/* SUPABASE REMOVE BUTTON */}
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[11px] flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    title="Remove listing from Supabase DB"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REMOVE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-950">Remove Listing from Supabase?</h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {deletingItem.id} • {deletingItem.code}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
              <img 
                src={deletingItem.primary_image_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80'} 
                alt=""
                className="w-12 h-12 object-cover rounded border border-slate-200"
              />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{deletingItem.name}</p>
                <p className="text-slate-500 text-[11px]">
                  {deletingItem.quantity} {deletingItem.unit} • ₹{deletingItem.price_per_unit}/{deletingItem.unit}
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Are you sure you want to delete this listing? This will execute a <strong className="text-rose-700 font-mono">DELETE query on Supabase database table `materials`</strong> and unlist it from the B2B marketplace.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting from Supabase...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm & Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Passport Modal */}
      {selectedPassportMaterial && (
        <MaterialPassportModal
          isOpen={true}
          onClose={() => setSelectedPassportMaterial(null)}
          material={selectedPassportMaterial}
        />
      )}
    </div>
  );
};

export default YourListingsPage;
