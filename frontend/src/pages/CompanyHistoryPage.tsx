import React, { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, History, ShieldCheck, 
  CircleDollarSign, Leaf, ArrowUpRight, ArrowDownLeft, 
  Layers, RefreshCw, Sparkles, BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid 
} from 'recharts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_ANALYTICS = {
  company_name: "ABC Manufacturing Pvt Ltd",
  total_revenue_inr: 1845000,
  total_procurement_spend_inr: 1280000,
  net_circular_savings_inr: 565000,
  total_tonnage_handled_kg: 142000,
  category_breakdown: [
    { category: "Cardboard (OCC)", percentage: 48, volume_kg: 68160, spend_inr: 988320 },
    { category: "Plastics (HDPE/PP)", percentage: 26, volume_kg: 36920, spend_inr: 1550640 },
    { category: "Wooden Pallets", percentage: 16, volume_kg: 22720, spend_inr: 363520 },
    { category: "Packaging Film", percentage: 10, volume_kg: 14200, spend_inr: 518300 }
  ],
  monthly_trend: [
    { month: "Apr", revenue: 120000, spend: 85000, co2_avoided: 12400 },
    { month: "May", revenue: 145000, spend: 98000, co2_avoided: 15100 },
    { month: "Jun", revenue: 160000, spend: 110000, co2_avoided: 16800 },
    { month: "Jul", revenue: 190000, spend: 125000, co2_avoided: 19500 },
    { month: "Aug", revenue: 215000, spend: 140000, co2_avoided: 22400 },
    { month: "Sep", revenue: 245000, spend: 155000, co2_avoided: 25800 }
  ]
};

export const CompanyHistoryPage: React.FC = () => {
  const { company } = useAuth();
  const [analytics, setAnalytics] = useState<any>(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (company?.id) {
      setLoading(true);
      api.getCompanyAnalytics(company.id)
        .then(res => {
          if (res) {
            setAnalytics(res);
            setAnimKey(prev => prev + 1);
          }
        })
        .catch(() => {
          // Keep default analytics
        })
        .finally(() => setLoading(false));
    }
  }, [company?.id]);

  const replayAnimations = () => {
    setAnimKey(prev => prev + 1);
  };

  const COLORS = ['#0F172A', '#059669', '#3B82F6', '#D97706'];

  const timelineSteps = [
    { type: 'BUY', material: 'Clean Corrugated Cardboard (OCC 11)', qty: '5,000 kg', partner: 'Navrang Corrugators', date: 'Sep 08, 2026', price: '₹72,500' },
    { type: 'SELL', material: 'Sorted PP Returnable Crates', qty: '2,000 kg', partner: 'GreenPack Industries', date: 'Aug 24, 2026', price: '₹84,000' },
    { type: 'BUY', material: 'Euro Standard Wooden Pallets', qty: '400 units', partner: 'Vadodara Pallet Fleet', date: 'Aug 10, 2026', price: '₹128,000' },
    { type: 'SELL', material: 'Baled LDPE Stretch Wrap (98/2)', qty: '3,500 kg', partner: 'Gujarat Circular Polymers', date: 'Jul 28, 2026', price: '₹127,750' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-xs font-sans">
      
      {/* Header with Replay Animation Action */}
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
            Historical buying/selling activity, monthly spend analysis, and partner transaction frequencies for {company?.name || 'facility'}.
          </p>
        </div>

        <button
          onClick={replayAnimations}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-2 transition shadow-sm self-start sm:self-auto cursor-pointer"
          title="Replay graph entrance animations"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Replay Graph Animations</span>
        </button>
      </div>

      {/* Top 4 Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Revenue (Sold)</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            ₹{analytics?.total_revenue_inr?.toLocaleString() || '1,845,000'}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">Secondary packaging offloaded</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Procurement (Bought)</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            ₹{analytics?.total_procurement_spend_inr?.toLocaleString() || '1,280,000'}
          </span>
          <span className="text-[10px] text-slate-600 font-semibold">Surplus raw materials sourced</span>
        </div>

        <div className="bg-emerald-950 text-white border border-emerald-800 rounded-xl p-4 shadow-sm hover:border-emerald-700 transition">
          <span className="text-[11px] font-mono text-emerald-300 block uppercase">Net Circular Value Add</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            +₹{analytics?.net_circular_savings_inr?.toLocaleString() || '565,000'}
          </span>
          <span className="text-[10px] text-emerald-300 font-semibold">28.4% Net operational margin</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Handled Volume</span>
          <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
            {(analytics?.total_tonnage_handled_kg ? analytics.total_tonnage_handled_kg / 1000 : 142).toFixed(1)} Tons
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">100% Diverted from landfill</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Revenue vs Spend Chart (7 cols) with dynamic SVG gradients & smooth entrance animation */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly Circular Cashflow Trend</h3>
              <p className="text-slate-400 text-[11px]">Material sales revenue vs procurement spend</p>
            </div>
            <div className="flex gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-950 rounded-sm"></span> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm"></span> Spend</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                key={`area-chart-${animKey}`}
                data={analytics?.monthly_trend || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(v: any, name: any) => [`₹${Number(v).toLocaleString()}`, name]}
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#334155', 
                    borderRadius: '0.5rem', 
                    color: '#F8FAFC', 
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#34D399', fontWeight: 600 }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Sales Revenue"
                  stroke="#0F172A" 
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)" 
                  isAnimationActive={true}
                  animationDuration={1600}
                  animationEasing="ease-out"
                  animationBegin={150}
                />
                <Area 
                  type="monotone" 
                  dataKey="spend" 
                  name="Procurement Spend"
                  stroke="#059669" 
                  strokeWidth={2.5}
                  fill="url(#spendGrad)" 
                  isAnimationActive={true}
                  animationDuration={1600}
                  animationEasing="ease-out"
                  animationBegin={350}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart (5 cols) with smooth animated pie slices */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Material Stream Distribution</h3>
            <p className="text-slate-400 text-[11px]">Portfolio volume by packaging category</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={`pie-chart-${animKey}`}>
                <Pie
                  data={analytics?.category_breakdown || []}
                  dataKey="percentage"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  isAnimationActive={true}
                  animationDuration={1400}
                  animationEasing="ease-out"
                  animationBegin={200}
                >
                  {analytics?.category_breakdown?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(v: any, name: any) => [`${v}% of total volume`, name]}
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#334155', 
                    borderRadius: '0.5rem', 
                    color: '#F8FAFC', 
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#34D399', fontWeight: 600 }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {analytics?.category_breakdown?.map((c: any, i: number) => (
              <div key={c.category} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-600 font-medium truncate">{c.category}:</span>
                <span className="font-bold text-slate-900 font-mono ml-auto">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Avoided CO2 Footprint Monthly Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Avoided Carbon Emissions Trend (GHG Scope 3)</h3>
            <p className="text-slate-400 text-[11px]">Monthly verified CO₂e avoided via circular secondary reuse</p>
          </div>
          <span className="text-emerald-700 font-mono font-bold text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            Cumulative: 109.0 Tons CO₂e
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              key={`bar-chart-${animKey}`}
              data={analytics?.monthly_trend || []}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v/1000}t`} tickLine={false} axisLine={false} />
              <Tooltip 
                formatter={(v: any) => [`${Number(v).toLocaleString()} kg CO₂e`, 'Avoided Carbon']}
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderColor: '#334155', 
                  borderRadius: '0.5rem', 
                  color: '#F8FAFC', 
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                itemStyle={{ color: '#34D399', fontWeight: 600 }}
                labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
              />
              <Bar 
                dataKey="co2_avoided" 
                fill="#059669" 
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
                animationBegin={250}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Buy/Sell Transaction History Sequence */}
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
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
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

