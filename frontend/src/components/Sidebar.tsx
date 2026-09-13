import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  History,
  Building2,
  PlusCircle,
  Package,
  FileText,
  Truck,
  TrendingUp,
  Sparkles,
  Sliders,
  ShieldCheck,
  Bell,
  Settings,
  SlidersHorizontal,
  Bot,
  X,
  Workflow
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const { user, company } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Marketplace', path: '/marketplace', icon: Store },
    { name: 'Your Listings', path: '/my-listings', icon: Package },
    { name: 'Order History', path: '/orders', icon: History },
    { name: 'Company Status', path: '/company/history', icon: Building2 },
    { name: 'Sell Product', path: '/sell', icon: PlusCircle },
    { name: 'Contract Panel', path: '/contracts', icon: FileText },
    { name: 'Urgent Needs', path: '/requirements', icon: TrendingUp },
    { name: 'Logistics Fleet', path: '/logistics', icon: Truck },
    { name: 'Circular Impact', path: '/impact', icon: Sparkles },
    { name: 'Scenario Simulator', path: '/simulator', icon: Sliders },
    { name: 'AI Copilot', path: '/assistant', icon: Bot },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
        h-screen max-h-screen overflow-y-auto no-scrollbar overscroll-contain select-none
        transition-transform duration-300 ease-in-out shrink-0
        md:sticky md:top-0 md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="min-h-full flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2.5">
                <img 
                  src="/favicon.svg" 
                  alt="LoopMarket Icon" 
                  className="h-8 w-8 rounded-lg object-contain shadow-xs shrink-0" 
                />
                <img 
                  src="/loopmarket-logo.svg" 
                  alt="LoopMarket" 
                  className="h-6 w-auto object-contain max-w-[130px]" 
                />
              </Link>

              <div className="flex items-center gap-1.5">
                <span className="b2b-badge bg-slate-100 text-slate-800 border-slate-200 text-[10px] font-mono">
                  B2B
                </span>
                {/* Close button on mobile */}
                <button 
                  onClick={onClose}
                  className="md:hidden p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition cursor-pointer"
                  title="Close Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Company Active Bar */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-bold truncate max-w-[140px]">
                  {company?.name || 'ABC Mfg'}
                </span>
                <span className="font-mono text-emerald-700 font-bold">{company?.trust_score || 96}/100</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <span>{company?.city || 'Ahmedabad'}</span>
                <span>•</span>
                <span>{company?.company_type || 'Manufacturer'}</span>
              </div>
              {user?.full_name && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span className="truncate max-w-[120px]">User: {user.full_name}</span>
                  <span className="font-mono text-slate-700 uppercase bg-slate-200/80 px-1 py-0.5 rounded font-semibold text-[9px]">{user.role || 'SELLER'}</span>
                </div>
              )}
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
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-slate-950 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer branding */}
          <div className="p-4 border-t border-slate-100 bg-white mt-auto shrink-0">
            <div className="text-[10px] text-slate-400 text-center font-mono pt-1">
              LoopMarket B2B Exchange v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
