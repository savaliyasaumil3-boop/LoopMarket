import React from 'react';
import { X, Bell, CheckCircle2, ShieldCheck, Truck, FileText, Sparkles } from 'lucide-react';

interface NotifProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotifProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifs = [
    {
      id: "1",
      title: "New 94% Match Found",
      msg: "GreenPack Industries posted a procurement requirement matching your 5,000 kg Corrugated Cardboard inventory.",
      time: "10 mins ago",
      type: "MATCH",
      icon: Sparkles
    },
    {
      id: "2",
      title: "Mock Escrow Payment Locked",
      msg: "₹77,000 for Order #ORD-2026-8803 has been deposited into secure mock escrow.",
      time: "1 hour ago",
      type: "ESCROW",
      icon: ShieldCheck
    },
    {
      id: "3",
      title: "Logistics Vehicle In-Transit",
      msg: "Fleet carrier EV-TRUCK-08 has picked up shipment from Ahmedabad and crossed Nadiad Junction.",
      time: "3 hours ago",
      type: "TRUCK",
      icon: Truck
    },
    {
      id: "4",
      title: "Quality Inspection Passed",
      msg: "Buyer completed physical inspection on Order #ORD-2026-8800. Payment released to ABC Manufacturing.",
      time: "Yesterday",
      type: "INSPECTION",
      icon: CheckCircle2
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-slate-200">
        
        <div>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-950 text-white">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm">Notifications</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto max-h-[80vh]">
            {notifs.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 hover:bg-slate-100 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-emerald-600" />
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{n.msg}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <button onClick={onClose} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
            Mark all as read
          </button>
        </div>

      </div>
    </div>
  );
};
