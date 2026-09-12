import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ShieldCheck, MapPin, User, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC<{ onOpenNotifications?: () => void }> = ({ onOpenNotifications }) => {
  const { company, switchDemoCompany } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search materials, grades, or natural language query..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Demo Switcher Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          <span className="text-[10px] uppercase font-mono text-slate-400">DEMO ROLE:</span>
          <select
            value={company?.name?.includes('ABC') ? 'abc@reloop.in' : (company?.name?.includes('GreenPack') ? 'buyer@greenpack.com' : 'dispatch@relooplogistics.in')}
            onChange={(e) => switchDemoCompany(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="abc@reloop.in">ABC Manufacturing (Seller)</option>
            <option value="buyer@greenpack.com">GreenPack Industries (Buyer)</option>
            <option value="dispatch@relooplogistics.in">RELOOP Logistics (Fleet)</option>
          </select>
        </div>

        {/* Location badge */}
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{company?.city || 'Ahmedabad'}, IN</span>
        </div>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
            {company?.name ? company.name.charAt(0) : 'R'}
          </div>
        </div>
      </div>
    </header>
  );
};
