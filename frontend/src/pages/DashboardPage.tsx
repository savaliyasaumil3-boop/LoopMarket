import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, TrendingUp, Package, Truck, ShieldCheck, 
  Leaf, Layers, CircleDollarSign, CheckCircle2, Info, ArrowUpRight, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SupplyLoopGraph } from '../components/SupplyLoopGraph';
import { WhyMatchDrawer } from '../components/WhyMatchDrawer';
import { MaterialPassportModal } from '../components/MaterialPassportModal';
import { CircularImpactGraph } from '../components/CircularImpactGraph';

export const DashboardPage: React.FC = () => {
  const { company } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [selectedMaterialForWhy, setSelectedMaterialForWhy] = useState<any | null>(null);
  const [selectedMaterialForPassport, setSelectedMaterialForPassport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [company?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const activeCompanyId = company?.id || 'ce3ff009-ee02-4229-b53c-4709c0c35bc0';
      const [recData, ordersData] = await Promise.all([
        api.getRecommendations(activeCompanyId),
        api.getOrders()
      ]);
      setRecommendations(recData?.sections || []);
      setRecentOrders(ordersData?.slice(0, 5) || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const stats = company?.stats || {
    total_sold_kg: 85000,
    total_bought_kg: 120000,
    waste_diverted_kg: 205000,
    co2_saved_kg: 184500,
    completed_transactions: 34,
    on_time_rate: 97.2,
    acceptance_rate: 96.5
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">B2B Facility Portal</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              <ShieldCheck className="w-3 h-3" /> DEMO VERIFIED
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Welcome, {company?.name || 'ABC Manufacturing Pvt Ltd'}</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {company?.city || 'Ahmedabad'} Hub • {company?.industry || 'FMCG Manufacturing'} • Trust Score: <strong className="text-emerald-700 font-mono">{company?.trust_score || 96}/100</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/sell"
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> List Surplus Lot
          </Link>
          <Link
            to="/requirements"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-md text-xs font-semibold flex items-center gap-1.5 transition"
          >
            Post Procurement Demand
          </Link>
        </div>
      </div>

      {/* 6 Key Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 block uppercase">Available Materials</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">105 Lots</span>
          <span className="text-[10px] text-emerald-700 font-medium">9 regional cities</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 block uppercase">Active Orders</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">3 Shipments</span>
          <span className="text-[10px] text-blue-700 font-medium">In Transit / Escrowed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 block uppercase">Pending Demands</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">55 Requests</span>
          <span className="text-[10px] text-slate-600 font-medium">Wanted materials</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 block uppercase">Completed Deals</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">{stats.completed_transactions} Orders</span>
          <span className="text-[10px] text-emerald-700 font-medium">100% Escrow Released</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 block uppercase">Waste Diverted</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">{(stats.waste_diverted_kg / 1000).toFixed(1)} Tons</span>
          <span className="text-[10px] text-emerald-700 font-medium">100% Closed Loop</span>
        </div>

        <div className="bg-emerald-950 border border-emerald-800 rounded-lg p-4 text-white shadow-sm">
          <span className="text-[11px] font-mono text-emerald-300 block uppercase">Net Avoided CO2</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">{(stats.co2_saved_kg / 1000).toFixed(1)} Tons</span>
          <span className="text-[10px] text-emerald-300 font-medium">Scope 3 Certified</span>
        </div>
      </div>

      {/* SIGNATURE: Interactive Circular Supply Loop Workflow (Handwritten Page 3) */}
      <SupplyLoopGraph companyId={company?.id || 'ce3ff009-ee02-4229-b53c-4709c0c35bc0'} />

      {/* Circular Impact & Avoided Carbon Graph */}
      <CircularImpactGraph 
        title="Facility Circular Carbon Trajectory"
        subtitle="Real-time Scope 3 GHG avoided virgin material emissions based on your traded packaging lots"
      />

      {/* Netflix-Style AI Recommendations Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">AI Recommendations For Your Facility</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized candidate rankings generated from validated database lots by Gemini Layer 2.
            </p>
          </div>
          <Link to="/marketplace" className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1">
            Browse All 105 Lots <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendations.slice(0, 3).map((sec, secIdx) => (
          <div key={secIdx} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>{sec.section_title}</span>
              <span className="text-[10px] text-slate-400 font-normal">{sec.items?.length || 0} candidates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sec.items?.map((item: any) => (
                <div key={item.material_id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-400 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-slate-400 font-medium">{item.material_code}</span>
                      <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                        {Math.round(item.recommendation_score)}% Match
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.material_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Seller: {item.seller_name} ({item.seller_city} • {item.distance_km} km)
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-100 rounded text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Lot:</span>
                        <span className="font-bold text-slate-800">{Number(item.quantity_kg).toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivered Cost:</span>
                        <span className="font-bold text-slate-900">₹{item.estimated_delivered_cost}/kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Circularity Potential:</span>
                        <span className="font-bold text-emerald-700">{item.circularity_score}%</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-2.5 italic leading-relaxed">
                      "{item.explanation}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => setSelectedMaterialForWhy(item)}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition"
                    >
                      Why Recommended?
                    </button>
                    <Link
                      to={`/materials/${item.material_id}`}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                    >
                      View Lot <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders & Demand Insight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Transactions & Shipments</h3>
            <Link to="/orders" className="text-xs text-slate-500 hover:text-slate-900 font-medium">
              View All Orders →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentOrders.map((o) => (
              <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{o.order_number}</span>
                    <span className={`b2b-badge ${
                      o.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      o.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{o.material_name} ({Number(o.quantity).toLocaleString()} kg)</p>
                  <p className="text-[11px] text-slate-400">Buyer: {o.buyer?.name} ({o.buyer?.city})</p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 block font-mono">₹{o.total_delivered_amount?.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Mock Escrow: {o.escrow?.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demand & Market AI Insights (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold">Regional Circular Demand Intelligence</h3>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">Trend Signal</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed">
                  Corrugated Cardboard (OCC 11) procurement demand in the Ahmedabad-Vadodara cluster has increased <strong>14.2%</strong> this month.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-blue-400 block uppercase font-bold">Logistics Optimization</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed">
                  Consolidated 2-stop freight routes along NH-48 are currently saving an average of <strong>28.5 kg CO2e</strong> per haul.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-amber-400 block uppercase font-bold">Material Value Alert</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed">
                  High-density polyethylene (HDPE) regrind prices are trending at <strong>₹42/kg</strong>, offering a 32% margin over virgin resin.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/simulator"
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition mt-4"
          >
            Launch What-If Scenario Simulator <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Explainable Match Modal */}
      <WhyMatchDrawer
        isOpen={!!selectedMaterialForWhy}
        onClose={() => setSelectedMaterialForWhy(null)}
        material={selectedMaterialForWhy}
        onRequestOrder={() => {
          if (selectedMaterialForWhy) {
            window.location.href = `/materials/${selectedMaterialForWhy.material_id || selectedMaterialForWhy.id}`;
          }
        }}
      />

    </div>
  );
};
