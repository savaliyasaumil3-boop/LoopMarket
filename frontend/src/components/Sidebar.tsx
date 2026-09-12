import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Bot,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, company, isAuthenticated, logout } = useAuth();

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

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
        h-screen overflow-y-auto no-scrollbar flex flex-col justify-between select-none
        transition-transform duration-300 ease-in-out shrink-0
        md:sticky md:top-0 md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
            <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-base shadow-sm">
                R
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">RELOOP</span>
                <span className="text-[10px] text-slate-400 font-mono">LOOP MARKETPLACE</span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                PROTOTYPE
              </span>
              {/* Close button on mobile */}
              <button 
                onClick={onClose}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Company Active Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-semibold truncate max-w-[140px]">
                {company?.name || 'ABC Mfg'}
              </span>
              <span className="font-mono text-emerald-700 font-bold">{company?.trust_score || 96}/100</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <span>{company?.city || 'Ahmedabad'}</span>
              <span>•</span>
              <span>{company?.company_type || 'Manufacturer'}</span>
            </div>
            {user?.full_name && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="truncate max-w-[120px]">User: {user.full_name}</span>
                <span className="font-mono text-slate-600 uppercase bg-slate-200/70 px-1 rounded">{user.role || 'SELLER'}</span>
              </div>
            )}
          </div>

          {/* Navigation Menu (Independently scrollable) */}
          <nav className="p-3 space-y-0.5 text-xs font-medium flex-1">
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

        {/* Footer Controls & Log Out Button (Pinned at bottom of sidebar scroll) */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-white shrink-0">
          <Link
            to="/admin"
            onClick={handleNavClick}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              Judge Demo Console
            </span>
            <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono">1-Click</span>
          </Link>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition cursor-pointer"
              title="Sign Out of Session"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </span>
              <span className="text-[10px] text-rose-500 font-mono uppercase">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={handleNavClick}
              className="flex items-center justify-center w-full px-3 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-md transition"
            >
              Sign In
            </Link>
          )}

          <div className="text-[10px] text-slate-400 text-center font-mono pt-1">
            RELOOP B2B Exchange v1.0
          </div>
        </div>
      </aside>
    </>
  );
};


