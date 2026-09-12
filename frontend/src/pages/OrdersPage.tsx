import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, ShieldCheck, Truck, ArrowRight, CheckCircle2, 
  Clock, AlertTriangle, FileText, Sparkles, Trash2, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { fetchOrders as fetchOrdersFromSupabase, clearAllLocalData } from '../lib/supabaseData';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);

    let sbOrders: any[] = [];
    try {
      sbOrders = (await fetchOrdersFromSupabase().catch(() => [])) || [];
    } catch {
      sbOrders = [];
    }

    let apiOrders: any[] = [];
    try {
      apiOrders = (await api.getOrders().catch(() => [])) || [];
    } catch {
      apiOrders = [];
    }

    let localOrders: any[] = [];
    try {
      localOrders = JSON.parse(localStorage.getItem('loopmarket_user_orders') || '[]');
    } catch {
      localOrders = [];
    }

    const DUMMY_ORDER_NUMBERS = new Set([
      'ORD-2026-8800', 'ORD-2026-8801', 'ORD-2026-8802', 'ORD-2026-8803',
      'ORD-2026-8804', 'ORD-2026-8805', 'ORD-2026-9456', 'ORD-2026-9291',
      'ORD-2026-9343', 'ORD-2026-9012', 'ORD-2026-9172', 'ORD-2026-5592'
    ]);

    const isDummyOrder = (o: any) => {
      if (!o) return true;
      if (DUMMY_ORDER_NUMBERS.has(o.order_number)) return true;
      if (o.id && DUMMY_ORDER_NUMBERS.has(o.id)) return true;
      return false;
    };

    const map = new Map<string, any>();

    // Load local storage orders first
    localOrders.forEach(o => {
      if (isDummyOrder(o)) return;
      const key = String(o.id || o.order_id);
      map.set(key, {
        id: key,
        order_number: o.order_number || `ORD-2026-${key.slice(-4)}`,
        material_name: o.material_name || o.title || 'Circular Material Stock',
        material_category: o.material_category || o.category || 'Packaging',
        quantity: o.quantity || o.quantity_kg || 5000,
        unit: o.unit || 'kg',
        unit_price: o.unit_price || o.price_per_unit || 25.0,
        subtotal_amount: o.subtotal || o.subtotal_amount || 125000,
        logistics_cost: o.logistics_cost || 4200,
        total_delivered_amount: o.total_amount || o.total_delivered_amount || 129200,
        status: o.status || 'ORDER_CONFIRMED',
        created_at: o.created_at || new Date().toISOString(),
        seller: { name: o.seller_name || o.seller?.name || 'Verified Enterprise Supplier', city: o.seller_city || o.seller?.city || 'Ahmedabad' },
        buyer: { name: o.buyer_name || o.buyer?.name || 'GreenPack Industries Ltd', city: o.buyer_city || o.buyer?.city || 'Vadodara' },
        escrow: { status: o.status === 'COMPLETED' || o.status === 'PAYMENT_RELEASED' ? 'RELEASED' : 'ESCROWED' }
      });
    });

    // Merge Supabase orders
    sbOrders.forEach(o => {
      if (isDummyOrder(o)) return;
      const key = String(o.id || o.order_id);
      if (!map.has(key)) {
        map.set(key, o);
      } else {
        map.set(key, { ...map.get(key), ...o });
      }
    });

    // Merge API orders
    apiOrders.forEach(o => {
      if (isDummyOrder(o)) return;
      const key = String(o.id || o.order_id);
      if (!map.has(key)) {
        map.set(key, o);
      } else {
        map.set(key, { ...map.get(key), ...o });
      }
    });

    let combined = Array.from(map.values()).filter(o => !isDummyOrder(o));

    if (filterStatus !== 'All') {
      combined = combined.filter(o => o.status === filterStatus);
    }

    setOrders(combined);
    setLoading(false);
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all order and marketplace history to start fresh?')) {
      await clearAllLocalData();
      setOrders([]);
      loadOrders();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Transaction Governance</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              SUPABASE & MOCK ESCROW PROTECTED
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">Order History & Transactions</h1>
          <p className="text-slate-500 mt-0.5 text-xs">
            Track end-to-end order progress, mock escrow deposits, logistics freight, and buyer quality sign-offs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleClearAllData}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            title="Clear saved data for a fresh start"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All & Start Fresh
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="b2b-input font-semibold text-xs py-2 px-3 min-w-[150px]"
          >
            <option value="All">All Statuses</option>
            <option value="ORDER_CONFIRMED">Order Confirmed</option>
            <option value="ESCROWED">Mock Escrow Locked</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed & Released</option>
            <option value="DISPUTED">Under Dispute</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Order #</th>
                <th className="p-3.5">Material & Lot</th>
                <th className="p-3.5">Parties (Seller → Buyer)</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Escrow Status</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 space-y-2">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No transactions or orders found</p>
                    <p className="text-slate-400 text-xs">Place an order from Marketplace or Reverse Demand to view order details here.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {o.order_number}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block leading-tight">{o.material_name}</span>
                      <span className="text-[11px] text-slate-500">{Number(o.quantity).toLocaleString()} {o.unit || 'kg'}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-700">
                        <span className="font-semibold">{o.seller?.name || o.seller_name}</span> ({o.seller?.city || o.seller_city || 'Ahmedabad'})
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        → <span className="font-medium text-slate-800">{o.buyer?.name || o.buyer_name}</span> ({o.buyer?.city || o.buyer_city || 'Vadodara'})
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{Number(o.total_delivered_amount || o.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`b2b-badge ${
                        o.escrow?.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        o.escrow?.status === 'ESCROWED' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        <ShieldCheck className="w-3 h-3" /> {o.escrow?.status || 'LOCKED'}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {(() => {
                        const st = o.status || 'ORDER_CONFIRMED';
                        if (st === 'COMPLETED' || st === 'PAYMENT_RELEASED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                            </span>
                          );
                        }
                        if (st === 'IN_TRANSIT') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[11px]">
                              <Truck className="w-3.5 h-3.5 text-sky-600 animate-pulse" /> In Transit
                            </span>
                          );
                        }
                        if (st === 'DELIVERED' || st === 'INSPECTION') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> QA Inspection
                            </span>
                          );
                        }
                        if (st === 'DISPUTED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Disputed
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" /> Order Confirmed
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/orders/${o.id}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs shrink-0"
                      >
                        Track Order <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
