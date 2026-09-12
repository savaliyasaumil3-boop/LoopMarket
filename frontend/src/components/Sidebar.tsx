import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  History,
  Building2,
  PlusCircle,
  FileText,
  Truck,
  TrendingUp,
  Sparkles,
  Sliders,
  ShieldCheck,
  Bell,
  Settings,
  User,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { company, switchDemoCompany } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Marketplace', path: '/marketplace', icon: Store },
    { name: 'Order History', path: '/orders', icon: History },
    { name: 'Company Status', path: '/company/history', icon: Building2 },
    { name: 'Sell Product', path: '/sell', icon: PlusCircle },
    { name: 'Contract Panel', path: '/contracts', icon: FileText },
    { name: 'Reverse Demands', path: '/requirements', icon: TrendingUp },
    { name: 'Logistics Fleet', path: '/logistics', icon: Truck },
    { name: 'Circular Impact', path: '/impact', icon: Sparkles },
    { name: 'Scenario Simulator', path: '/simulator', icon: Sliders },
    { name: 'AI Copilot', path: '/assistant', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-base shadow-sm">
              R
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">RELOOP</span>
              <span className="text-[10px] text-slate-400 font-mono">LOOP MARKETPLACE</span>
            </div>
          </Link>
          <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-200">
            PROTOTYPE
          </span>
        </div>

        {/* Company Active Bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium truncate max-w-[140px]">{company?.name || 'ABC Mfg'}</span>
            <span className="font-mono text-emerald-700 font-bold">{company?.trust_score || 96}/100</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <span>{company?.city || 'Ahmedabad'}</span>
            <span>•</span>
            <span>{company?.company_type || 'Manufacturer'}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-0.5 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Demo Switcher & Admin */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <Link
          to="/admin"
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            Judge Demo Console
          </span>
          <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono">1-Click</span>
        </Link>
        <div className="text-[10px] text-slate-400 text-center font-mono">
          RELOOP B2B Exchange v1.0
        </div>
      </div>
    </aside>
  );
};
