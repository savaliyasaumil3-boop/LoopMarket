import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Bell, ShieldCheck, MapPin, User, LogOut,
  ChevronDown, Building2, ExternalLink, Sparkles, Menu, Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC<{ 
  onOpenNotifications?: () => void;
  onToggleSidebar?: () => void;
}> = ({ onOpenNotifications, onToggleSidebar }) => {
  const { user, company, isAuthenticated, logout, switchDemoCompany } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Search Bar & Mobile Menu Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Brand Logo */}
        <Link to="/dashboard" className="md:hidden shrink-0 flex items-center gap-2 mr-1">
          <img 
            src="/favicon.svg" 
            alt="LoopMarket Icon" 
            className="h-6 w-6 rounded-md object-contain shrink-0" 
          />
          <img 
            src="/loopmarket-logo.svg" 
            alt="LoopMarket" 
            className="h-5 w-auto object-contain max-w-[100px]" 
          />
        </Link>

        <form onSubmit={handleSearch} className="relative w-full max-w-xs sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search materials, grades..."
            className="w-full pl-9 pr-3 sm:pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Demo Switcher Dropdown */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">DEMO ROLE:</span>
          <select
            value={company?.name?.includes('ABC') ? 'abc@reloop.in' : (company?.name?.includes('GreenPack') ? 'buyer@greenpack.com' : (company?.name?.includes('Polymers') ? 'contact@gujaratpolymers.in' : 'dispatch@relooplogistics.in'))}
            onChange={(e) => switchDemoCompany(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="abc@reloop.in">ABC Mfg (Seller - FMCG)</option>
            <option value="buyer@greenpack.com">GreenPack (Buyer - Packaging)</option>
            <option value="dispatch@relooplogistics.in">LoopMarket Logistics (Fleet)</option>
            <option value="contact@gujaratpolymers.in">Gujarat Polymers (Recycler)</option>
          </select>
        </div>

        {/* Location badge */}
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{company?.city || 'Ahmedabad'}, IN</span>
        </div>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        {isAuthenticated && user ? (
          <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200" ref={profileMenuRef}>
            {/* Direct Logout Button in Navbar */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition cursor-pointer shadow-sm"
              title="Sign Out from Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

            {/* Profile Avatar / Trigger */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-sm">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : (company?.name?.charAt(0) || 'R')}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[110px]">
                  {user.full_name || 'Enterprise User'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block leading-tight">
                  {user.role || 'VERIFIED'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="border-b border-slate-100 pb-2.5">
                  <span className="font-bold text-slate-900 text-sm block">{user.full_name}</span>
                  <span className="text-slate-500 font-mono text-[11px] block">{user.email}</span>
                  <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-medium truncate max-w-[140px]">{company?.name || 'Company Facility'}</span>
                    <span className="text-emerald-700 font-mono font-bold">{company?.trust_score || 95}/100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    to="/my-listings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition font-medium"
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Your Listings & Supabase</span>
                  </Link>

                  <Link
                    to="/company/history"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Company Status & Profile</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left rounded-md text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Public / Logged-out state */
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

