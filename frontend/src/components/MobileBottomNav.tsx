import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, PlusCircle, History, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
  onOpenSidebar,
  isSidebarOpen = false
}) => {
  const location = useLocation();

  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Market', path: '/marketplace', icon: Store },
    { label: 'Sell', path: '/sell', icon: PlusCircle },
    { label: 'Orders', path: '/orders', icon: History },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold select-none shadow-lg"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isActive 
                ? 'text-slate-950 font-bold' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Drawer Toggle Button */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          isSidebarOpen ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-950'
        }`}
        title="Open Full Navigation Menu"
      >
        <Menu className={`w-4 h-4 ${isSidebarOpen ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
        <span>Menu</span>
      </button>
    </nav>
  );
};
