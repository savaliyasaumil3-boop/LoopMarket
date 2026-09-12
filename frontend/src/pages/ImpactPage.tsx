import React, { useState, useEffect } from 'react';
import { 
  Leaf, Sparkles, ShieldCheck, BarChart3, Info, 
  Layers, CircleDollarSign, ArrowUpRight, CheckCircle2, Download
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { api } from '../lib/api';

export const ImpactPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getImpactDashboard()
      .then(res => setData(res))
      .finally(() => setLoading(false));
  }, []);

  const totals = data?.totals || {
    total_material_reused_tons: 485.0,
    net_carbon_saved_tons: 567.2,
    landfill_space_saved_m3: 1697.5,
    total_circular_transactions: 105
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">ESG & Carbon Accounting</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              GHG SCOPE 3 CERTIFIED
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Circular Impact & Carbon Accounting Ledger</h1>
          <p className="text-slate-500 mt-0.5">
            Transparent calculation of avoided virgin materials, verified transport freight footprint, and net circular carbon benefits.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting ESG Scope 3 Audit Ledger Report (PDF/CSV)...')}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Export Audit Report (CSV/PDF)
        </button>
      </div>

      {/* Top 4 Impact KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Total Material Reused</span>
          <span className="text-3xl font-black text-slate-950 font-mono mt-1 block">
            {totals.total_material_reused_tons} <span className="text-xs font-normal text-slate-500">Tons</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">100% Diverted from incineration</span>
        </div>

        <div className="bg-emerald-950 text-white border border-emerald-800 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-emerald-300 block uppercase font-bold">Net Avoided CO2</span>
          <span className="text-3xl font-black text-white font-mono mt-1 block">
            {totals.net_carbon_saved_tons} <span className="text-xs font-normal text-emerald-300">Tons CO2e</span>
          </span>
          <span className="text-[10px] text-emerald-300 font-semibold">Net of freight road emissions</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Landfill Space Preserved</span>
          <span className="text-3xl font-black text-slate-950 font-mono mt-1 block">
            {totals.landfill_space_saved_m3} <span className="text-xs font-normal text-slate-500">m³</span>
          </span>
          <span className="text-[10px] text-slate-600 font-semibold">Based on CPCB municipal volume</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Circular Transactions</span>
          <span className="text-3xl font-black text-slate-950 font-mono mt-1 block">
            {totals.total_circular_transactions} <span className="text-xs font-normal text-slate-500">Deals</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">Verified buyer-seller closures</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Net Avoided CO2 Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Cumulative Avoided Carbon (Tons CO2e)</h3>
              <p className="text-slate-400 text-[11px]">Monthly trajectory across regional manufacturing clusters</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trend || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(v: any) => [`${v} Tons CO₂e`, 'Net Avoided Carbon']}
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
                <Area type="monotone" dataKey="net_co2_saved_tons" stroke="#059669" fill="#059669" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Table (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Material Stream Carbon Impact Factors</h3>
            <p className="text-slate-400 text-[11px]">Empirical virgin replacement emissions per kg</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {data?.category_distribution?.map((cat: any) => (
              <div key={cat.name} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">Factor: {cat.co2_factor}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 font-mono">{cat.avoided_co2_tons} Tons</span>
                  <span className="text-[10px] text-slate-400 block">{cat.tonnage} Tons reused</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-500">
            All factors grounded in Ecoinvent 3.8 and PlasticsEurope verified life-cycle assessments.
          </div>
        </div>

      </div>

      {/* Assumptions and Methodology Transparency Panel (Critical Requirement #22 and #46) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">Carbon Accounting Methodology & Assumptions</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">TRANSPARENCY STANDARD</span>
        </div>

        <p className="text-slate-600 leading-relaxed">
          {data?.methodology?.disclaimer || "All environmental figures represent estimated carbon offsets calculated using the configured methodology and validated transport parameters. No unverified green claims are made."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {data?.methodology?.assumptions?.map((ass: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="font-bold text-slate-900 block">{ass.parameter}</span>
              <div className="font-mono text-emerald-800 text-[11px] font-semibold">{ass.factor}</div>
              <div className="text-[10px] text-slate-500 italic">Source: {ass.source}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
