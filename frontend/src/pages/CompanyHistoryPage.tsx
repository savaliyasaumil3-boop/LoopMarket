import React, { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, History, ShieldCheck, 
  CircleDollarSign, Leaf, ArrowUpRight, ArrowDownLeft, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const CompanyHistoryPage: React.FC = () => {
  const { company } = useAuth();
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company?.id) {
      api.getCompanyAnalytics(company.id)
        .then(res => setAnalytics(res))
        .finally(() => setLoading(false));
    }
  }, [company?.id]);

  const COLORS = ['#0F172A', '#059669', '#3B82F6', '#D97706'];

  const timelineSteps = [
    { type: 'BUY', material: 'Clean Corrugated Cardboard (OCC 11)', qty: '5,000 kg', partner: 'Navrang Corrugators', date: 'Sep 08, 2026', price: '₹72,500' },
    { type: 'SELL', material: 'Sorted PP Returnable Crates', qty: '2,000 kg', partner: 'GreenPack Industries', date: 'Aug 24, 2026', price: '₹84,000' },
    { type: 'BUY', material: 'Euro Standard Wooden Pallets', qty: '400 units', partner: 'Vadodara Pallet Fleet', date: 'Aug 10, 2026', price: '₹128,000' },
    { type: 'SELL', material: 'Baled LDPE Stretch Wrap (98/2)', qty: '3,500 kg', partner: 'Gujarat Circular Polymers', date: 'Jul 28, 2026', price: '₹127,750' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header - Handwritten Sketch Page 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Financial & Material Ledger</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              AUDITED PROVENANCE
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Company Status & Circular History</h1>
          <p className="text-slate-500 mt-0.5">
            Historical buying/selling activity, monthly spend analysis, and partner transaction frequencies.
          </p>
        </div>
      </div>

      {/* Top 4 Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Revenue (Sold)</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            ₹{analytics?.total_revenue_inr?.toLocaleString() || '1,845,000'}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">Secondary packaging offloaded</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Procurement (Bought)</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            ₹{analytics?.total_procurement_spend_inr?.toLocaleString() || '1,280,000'}
          </span>
          <span className="text-[10px] text-slate-600 font-semibold">Surplus raw materials sourced</span>
        </div>

        <div className="bg-emerald-950 text-white border border-emerald-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-emerald-300 block uppercase">Net Circular Value Add</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            +₹{analytics?.net_circular_savings_inr?.toLocaleString() || '565,000'}
          </span>
          <span className="text-[10px] text-emerald-300 font-semibold">28.4% Net operational margin</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Handled Volume</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            {(analytics?.total_tonnage_handled_kg ? analytics.total_tonnage_handled_kg / 1000 : 142).toFixed(1)} Tons
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">100% Diverted from landfill</span>
        </div>
      </div>

      {/* Analytics Charts Grid (Handwritten Sketch Page 4: Sell & Buy Analysis & Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Revenue vs Spend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly Circular Cashflow Trend</h3>
              <p className="text-slate-400 text-[11px]">Material sales revenue vs procurement spend</p>
            </div>
            <div className="flex gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-900 rounded-sm"></span> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Spend</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthly_trend || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke="#0F172A" fill="#0F172A" fillOpacity={0.15} />
                <Area type="monotone" dataKey="spend" stroke="#059669" fill="#059669" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Material Stream Distribution</h3>
            <p className="text-slate-400 text-[11px]">Portfolio volume by packaging category</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.category_breakdown || []}
                  dataKey="percentage"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {analytics?.category_breakdown?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}% of volume`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {analytics?.category_breakdown?.map((c: any, i: number) => (
              <div key={c.category} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-600 truncate">{c.category}:</span>
                <span className="font-bold text-slate-900 font-mono">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Buy/Sell Transaction History Sequence (Handwritten Sketch Page 4 Example) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Historical Buy / Sell Sequence</h3>
            <p className="text-slate-400 text-[11px]">Chronological stream of secondary transactions</p>
          </div>
          <span className="text-xs font-mono text-slate-400">FEEDS RECOMMENDATION ENGINE</span>
        </div>

        <div className="space-y-3">
          {timelineSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg font-bold text-xs ${
                  step.type === 'SELL' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {step.type === 'SELL' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{step.type}: {step.material}</span>
                    <span className="text-[10px] font-mono text-slate-400">{step.date}</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Counterparty: <strong>{step.partner}</strong> • Volume: {step.qty}
                  </p>
                </div>
              </div>

              <div className="text-right self-start sm:self-center">
                <span className="font-bold font-mono text-slate-900 text-sm block">{step.price}</span>
                <span className="text-emerald-700 font-semibold text-[10px]">Verified Closed-Loop</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
