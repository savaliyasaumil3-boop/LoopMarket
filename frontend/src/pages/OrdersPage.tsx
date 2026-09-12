import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, ShieldCheck, Truck, ArrowRight, CheckCircle2, 
  Clock, AlertTriangle, FileText, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({ status: filterStatus !== 'All' ? filterStatus : undefined });
      setOrders(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Transaction Governance</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              MOCK ESCROW PROTECTED
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Order History & Transactions</h1>
          <p className="text-slate-500 mt-0.5">
            Track end-to-end circular transaction lifecycles, mock escrow deposits, logistics freight, and buyer quality sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="b2b-input font-medium"
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="p-4">Order #</th>
                <th className="p-4">Material & Lot</th>
                <th className="p-4">Parties (Seller → Buyer)</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Escrow Status</th>
                <th className="p-4">Lifecycle Step</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {o.order_number}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{o.material_name}</span>
                      <span className="text-[11px] text-slate-500">{Number(o.quantity).toLocaleString()} {o.unit}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700">
                        <span className="font-semibold">{o.seller?.name}</span> ({o.seller?.city})
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        → <span className="font-medium text-slate-800">{o.buyer?.name}</span> ({o.buyer?.city})
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      ₹{o.total_delivered_amount?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`b2b-badge ${
                        o.escrow?.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        o.escrow?.status === 'ESCROWED' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        <ShieldCheck className="w-3 h-3" /> {o.escrow?.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`b2b-badge ${
                        o.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        o.status === 'IN_TRANSIT' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                        o.status === 'DISPUTED' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        'bg-slate-900 text-slate-100 border-slate-700'
                      }`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/orders/${o.id}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        Inspect Lifecycle <ArrowRight className="w-3 h-3" />
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
