import React, { useState } from 'react';
import { 
  Leaf, Sparkles, ShieldCheck, TrendingUp, BarChart3, 
  PieChart as PieIcon, Layers, Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie, Legend 
} from 'recharts';

interface CircularImpactGraphProps {
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

const DEFAULT_TREND_DATA = [
  { month: 'Jan', co2_saved_tons: 32.4, material_diverted_tons: 28.0, landfill_saved_m3: 98.0 },
  { month: 'Feb', co2_saved_tons: 48.6, material_diverted_tons: 42.5, landfill_saved_m3: 148.0 },
  { month: 'Mar', co2_saved_tons: 65.2, material_diverted_tons: 58.0, landfill_saved_m3: 203.0 },
  { month: 'Apr', co2_saved_tons: 84.0, material_diverted_tons: 74.2, landfill_saved_m3: 259.0 },
  { month: 'May', co2_saved_tons: 108.5, material_diverted_tons: 93.8, landfill_saved_m3: 328.0 },
  { month: 'Jun', co2_saved_tons: 135.2, material_diverted_tons: 118.0, landfill_saved_m3: 413.0 },
  { month: 'Jul', co2_saved_tons: 168.0, material_diverted_tons: 145.0, landfill_saved_m3: 507.0 },
  { month: 'Aug', co2_saved_tons: 205.4, material_diverted_tons: 178.5, landfill_saved_m3: 624.0 },
];

const DEFAULT_CATEGORY_BREAKDOWN = [
  { name: 'Cardboard & Pulp', value: 42, co2_tons: 238.2, color: '#059669', factor: '0.95 kg/kg' },
  { name: 'Polymers (HDPE/PP)', value: 28, co2_tons: 158.8, color: '#0284C7', factor: '2.45 kg/kg' },
  { name: 'Wooden Pallets', value: 18, co2_tons: 102.1, color: '#D97706', factor: '1.15 kg/kg' },
  { name: 'Metals & Drums', value: 12, co2_tons: 68.1, color: '#6366F1', factor: '1.85 kg/kg' },
];

export const CircularImpactGraph: React.FC<CircularImpactGraphProps> = ({ 
  compact = false, 
  title = "Circular Impact & Carbon Accounting Graph",
  subtitle = "Real-time Scope 3 GHG avoided virgin material emissions & landfill diversion trajectory"
}) => {
  const [activeTab, setActiveTab] = useState<'area' | 'bar' | 'pie'>('area');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px]">
              <Leaf className="w-3 h-3 text-emerald-600" /> GHG SCOPE 3 CERTIFIED
            </span>
            <span className="text-slate-400 font-mono text-[10px] uppercase">• ISO 14064 Standard</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-950 mt-0.5">{title}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('area')}
            className={`px-3 py-1.5 rounded-md font-semibold text-[11px] flex items-center gap-1 transition ${
              activeTab === 'area' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Trajectory
          </button>
          <button
            onClick={() => setActiveTab('bar')}
            className={`px-3 py-1.5 rounded-md font-semibold text-[11px] flex items-center gap-1 transition ${
              activeTab === 'bar' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Streams
          </button>
          <button
            onClick={() => setActiveTab('pie')}
            className={`px-3 py-1.5 rounded-md font-semibold text-[11px] flex items-center gap-1 transition ${
              activeTab === 'pie' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      {/* Main Graph Content */}
      {activeTab === 'area' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Y-AXIS: Avoided Carbon (Tons CO₂e)</span>
            <span className="text-emerald-700 font-bold">Cumulative Net Offset: +567.2 Tons</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEFAULT_TREND_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="impactCo2Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="materialGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    color: '#F8FAFC', 
                    fontSize: '11px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)'
                  }}
                  formatter={(val: any, name?: any) => [
                    `${val} ${String(name) === 'co2_saved_tons' ? 'Tons CO₂e' : 'Tons'}`, 
                    String(name) === 'co2_saved_tons' ? 'Avoided CO₂' : 'Material Diverted'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="co2_saved_tons" 
                  name="co2_saved_tons" 
                  stroke="#059669" 
                  strokeWidth={2.5}
                  fill="url(#impactCo2Gradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="material_diverted_tons" 
                  name="material_diverted_tons" 
                  stroke="#0284C7" 
                  strokeWidth={2}
                  fill="url(#materialGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'bar' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Avoided CO₂ Emissions by Material Stream (Tons)</span>
            <span className="text-emerald-700 font-bold">4 Verified Categories</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEFAULT_CATEGORY_BREAKDOWN} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    color: '#F8FAFC', 
                    fontSize: '11px' 
                  }}
                  formatter={(val: any) => [`${val} Tons CO₂e`, 'Avoided Carbon']}
                />
                <Bar dataKey="co2_tons" radius={[6, 6, 0, 0]}>
                  {DEFAULT_CATEGORY_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'pie' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center animate-fade-in py-2">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEFAULT_CATEGORY_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {DEFAULT_CATEGORY_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`${val}% Share`, 'Volume Percentage']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '0.5rem', color: '#FFF' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">Stream Distribution Share</h4>
            <div className="space-y-2 text-xs">
              {DEFAULT_CATEGORY_BREAKDOWN.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-slate-900">{item.value}%</span>
                    <span className="text-[10px] text-slate-400 block font-mono">({item.co2_tons} t CO₂e)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Audit Assurance Footer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Calculated using Ecoinvent 3.8 Life Cycle Emissions inventory standards.</span>
        </div>
        <span className="font-mono text-slate-400 font-bold hidden sm:inline">VERIFIED LEDGER</span>
      </div>

    </div>
  );
};

export default CircularImpactGraph;
