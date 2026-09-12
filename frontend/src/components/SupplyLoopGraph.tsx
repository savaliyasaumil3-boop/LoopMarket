import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, ShieldCheck, ExternalLink, Building2, 
  ArrowDown, ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';

interface GraphNode {
  id: string;
  type: string;
  name: string;
  role: string;
  city: string;
  material: string;
  active_contract: string;
  current_price: string;
  trust_score: number;
  flow_type?: string;
  position?: { x: number; y: number };
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  rate: string;
  status: string;
}

export const SupplyLoopGraph: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileStageFilter, setMobileStageFilter] = useState<'ALL' | 'UPSTREAM' | 'HUB' | 'OFFTAKE'>('ALL');
  
  const inspectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGraphData();
  }, [companyId]);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const res = await api.getCircularLoop(companyId || 'my-company');
      setData(res);
      if (res?.nodes?.length) {
        setSelectedNode(res.nodes[0]); // default select central hub
      }
    } catch {
      // Fallback data
      const defaultNodes: GraphNode[] = [
        {
          id: "my-company",
          type: "central_hub",
          name: "ABC Manufacturing Pvt Ltd",
          role: "My Facility (Consolidation & Sorting)",
          city: "Ahmedabad",
          material: "High-Grade Baled Cardboard (OCC 11)",
          active_contract: "CTR-2026-MAIN",
          current_price: "₹16.50/kg",
          trust_score: 96.0
        },
        {
          id: "supplier-1",
          type: "upstream_supplier",
          name: "Navrang Corrugators",
          role: "Upstream Supplier (Manufacturing)",
          city: "Ahmedabad",
          material: "Clean Surplus Corrugated Trims",
          active_contract: "CTR-2026-IN-101",
          current_price: "₹13.50/kg",
          trust_score: 91.0,
          flow_type: "INFLOW_BUY"
        },
        {
          id: "buyer-1",
          type: "downstream_buyer",
          name: "GreenPack Industries Ltd",
          role: "Downstream Buyer (Packaging)",
          city: "Vadodara",
          material: "Sorted Baled Packaging Boxes",
          active_contract: "CTR-2026-OUT-201",
          current_price: "₹18.00/kg",
          trust_score: 94.0,
          flow_type: "OUTFLOW_SELL"
        },
        {
          id: "recycler-1",
          type: "closed_loop_recycler",
          name: "Gujarat Circular Polymers & Pulp",
          role: "Closed-Loop Secondary Processor",
          city: "Surat",
          material: "Secondary Pulp & Regrind Resins",
          active_contract: "CTR-2026-REC-301",
          current_price: "₹12.00/kg",
          trust_score: 92.0,
          flow_type: "CLOSED_LOOP"
        }
      ];
      const defaultEdges: GraphEdge[] = [
        {"source": "supplier-1", "target": "my-company", "label": "BUY (5,000 kg/mo)", "rate": "₹13.50/kg", "status": "ACTIVE_FLOW"},
        {"source": "my-company", "target": "buyer-1", "label": "SELL (4,500 kg/mo)", "rate": "₹18.00/kg", "status": "ACTIVE_FLOW"},
        {"source": "my-company", "target": "recycler-1", "label": "REPROCESS (1,500 kg/mo)", "rate": "₹12.00/kg", "status": "CLOSED_LOOP"},
        {"source": "recycler-1", "target": "supplier-1", "label": "RECIRCULATE", "rate": "Feedstock", "status": "CIRCULAR_LINK"}
      ];
      setData({ nodes: defaultNodes, edges: defaultEdges });
      setSelectedNode(defaultNodes[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNode = (node: GraphNode) => {
    setSelectedNode(node);
    // Smooth scroll to inspector on mobile devices if needed
    if (window.innerWidth < 1024 && inspectorRef.current) {
      setTimeout(() => {
        inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const suppliers = data?.nodes.filter(n => n.type === 'upstream_supplier') || [];
  const centralHub = data?.nodes.find(n => n.type === 'central_hub');
  const buyers = data?.nodes.filter(n => n.type === 'downstream_buyer') || [];
  const recyclers = data?.nodes.filter(n => n.type === 'closed_loop_recycler') || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm mb-16 md:mb-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Interactive Circular Supply Loop Workflow
            </h3>
            <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              n8n Node Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Real-time material flows across Upstream Suppliers, Your Sorting Hub, Downstream Buyers, and Secondary Recyclers. Click any node to inspect live contract & material specs.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button 
            onClick={loadGraphData} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Flow</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Graph (8 cols) + Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        
        {/* ========================================================================= */}
        {/* DESKTOP CANVAS VIEW (Visible on md screens and larger)                     */}
        {/* ========================================================================= */}
        <div className="hidden md:flex lg:col-span-8 bg-slate-950 text-white rounded-xl p-6 relative overflow-hidden border border-slate-800 min-h-[440px] flex-col justify-between">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25"></div>

          {/* Top Row: Stream Header Indicators */}
          <div className="relative z-10 grid grid-cols-3 gap-4 text-center text-[11px] font-mono text-slate-400 pb-3 border-b border-slate-800/80">
            <span className="text-emerald-400 font-semibold">[1] UPSTREAM SUPPLY</span>
            <span className="text-white font-bold bg-slate-800/60 py-0.5 rounded border border-slate-700/50">[2] VALUE RETENTION HUB</span>
            <span className="text-blue-400 font-semibold">[3] OFFTAKE & RECYCLING</span>
          </div>

          {/* Middle Interactive Nodes Layout */}
          <div className="relative z-10 grid grid-cols-3 gap-6 items-center my-auto py-6">
            
            {/* Left Column: Suppliers */}
            <div className="space-y-4">
              {suppliers.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectNode(s)}
                  className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left ${
                    selectedNode?.id === s.id
                      ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-semibold">
                      SUPPLIER {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400">{s.city}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate">{s.name}</h4>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-300 font-medium">{s.current_price}</span>
                    <span className="text-emerald-400 font-mono font-semibold text-[10px]">FLOW IN →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Center Column: Central Hub (My Company) */}
            <div className="flex flex-col items-center">
              {centralHub && (
                <div
                  onClick={() => handleSelectNode(centralHub)}
                  className={`cursor-pointer p-4.5 rounded-xl border-2 transition-all w-full text-center relative ${
                    selectedNode?.id === centralHub.id
                      ? 'bg-slate-900 border-emerald-400 ring-4 ring-emerald-500/20 shadow-xl shadow-slate-950'
                      : 'bg-slate-900/90 border-emerald-500 hover:border-white'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-bold uppercase rounded-full tracking-wider shadow">
                    My Facility
                  </div>
                  <Building2 className="w-7 h-7 text-emerald-400 mx-auto mt-1 mb-2" />
                  <h4 className="text-sm font-bold text-white leading-snug">{centralHub.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{centralHub.city}</p>
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-around text-[10px] font-mono text-slate-300">
                    <div>
                      <span className="block text-slate-500">TRUST</span>
                      <span className="text-white font-bold">{centralHub.trust_score}/100</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">SORT RATE</span>
                      <span className="text-emerald-400 font-bold">96.5%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Buyers & Recyclers */}
            <div className="space-y-4">
              {buyers.map((b, idx) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectNode(b)}
                  className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left ${
                    selectedNode?.id === b.id
                      ? 'bg-slate-900 border-blue-400 ring-2 ring-blue-500/20 shadow-lg shadow-blue-950/50'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800 font-semibold">
                      BUYER {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400">{b.city}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate">{b.name}</h4>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-300 font-medium">{b.current_price}</span>
                    <span className="text-blue-400 font-mono font-semibold text-[10px]">FLOW OUT →</span>
                  </div>
                </div>
              ))}

              {recyclers.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectNode(r)}
                  className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left ${
                    selectedNode?.id === r.id
                      ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-500/20 shadow-lg shadow-amber-950/50'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800 font-semibold">
                      CLOSED LOOP RECYCLER
                    </span>
                    <span className="text-[10px] text-slate-400">{r.city}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate">{r.name}</h4>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-300 font-medium">{r.current_price}</span>
                    <span className="text-amber-400 font-mono font-semibold text-[10px]">↻ RECIRCULATE</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Desktop Canvas Ticker Footer */}
          <div className="relative z-10 flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Active Closed Loop: 17,000 kg/month diverted
            </span>
            <span className="font-mono text-emerald-400 font-medium">
              Net Avoided Carbon: 15,800 kg CO2e/mo
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE RESPONSIVE TIMELINE VIEW (Visible on mobile screens < md)          */}
        {/* ========================================================================= */}
        <div className="flex md:hidden lg:col-span-8 flex-col space-y-4">
          
          {/* Mobile Filter Stage Buttons */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-lg text-[11px] font-medium text-slate-600 overflow-x-auto gap-1 no-scrollbar">
            <button
              onClick={() => setMobileStageFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                mobileStageFilter === 'ALL' ? 'bg-slate-900 text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              All Stages
            </button>
            <button
              onClick={() => setMobileStageFilter('UPSTREAM')}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                mobileStageFilter === 'UPSTREAM' ? 'bg-emerald-700 text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              [1] Upstream
            </button>
            <button
              onClick={() => setMobileStageFilter('HUB')}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                mobileStageFilter === 'HUB' ? 'bg-slate-900 text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              [2] My Hub
            </button>
            <button
              onClick={() => setMobileStageFilter('OFFTAKE')}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                mobileStageFilter === 'OFFTAKE' ? 'bg-blue-700 text-white font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              [3] Offtake & Recycler
            </button>
          </div>

          {/* Main Mobile Flow Cards Container */}
          <div className="bg-slate-950 text-white rounded-xl p-4 border border-slate-800 space-y-4">
            
            {/* Step 1: Upstream Supply */}
            {(mobileStageFilter === 'ALL' || mobileStageFilter === 'UPSTREAM') && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pb-1 border-b border-slate-800">
                  <span className="font-bold tracking-wide">STAGE 1: UPSTREAM SUPPLY</span>
                  <span className="text-[10px] text-slate-400 font-sans">Inflow Buyers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suppliers.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectNode(s)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer active:scale-[0.99] ${
                        selectedNode?.id === s.id
                          ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/30'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-bold">
                          SUPPLIER {idx + 1}
                        </span>
                        <span className="text-slate-400 font-mono">{s.city}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5">{s.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.material}</p>
                      
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-emerald-300">{s.current_price}</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                          FLOW IN <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vertical Flow Arrow Connector 1 */}
            {mobileStageFilter === 'ALL' && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-emerald-500/40 rounded-full text-[10px] font-mono text-emerald-400">
                  <ArrowDown className="w-3 h-3 animate-bounce" />
                  <span>8,200 kg/mo Secondary Materials Inflow</span>
                </div>
              </div>
            )}

            {/* Step 2: Value Retention Central Hub */}
            {(mobileStageFilter === 'ALL' || mobileStageFilter === 'HUB') && centralHub && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-white pb-1 border-b border-slate-800">
                  <span className="font-bold tracking-wide">STAGE 2: VALUE RETENTION HUB</span>
                  <span className="text-[10px] text-emerald-400 font-sans font-medium">Consolidation Hub</span>
                </div>

                <div
                  onClick={() => handleSelectNode(centralHub)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative active:scale-[0.99] ${
                    selectedNode?.id === centralHub.id
                      ? 'bg-slate-900 border-white ring-2 ring-emerald-400/40 shadow-lg'
                      : 'bg-slate-900 border-emerald-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-950 rounded-lg border border-emerald-800 shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{centralHub.name}</h4>
                        <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                          My Facility
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{centralHub.material}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="block text-slate-500">LOCATION</span>
                      <span className="text-white font-bold">{centralHub.city}</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="block text-slate-500">TRUST SCORE</span>
                      <span className="text-emerald-400 font-bold">{centralHub.trust_score}/100</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="block text-slate-500">SORT EFFICIENCY</span>
                      <span className="text-emerald-300 font-bold">96.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vertical Flow Arrow Connector 2 */}
            {mobileStageFilter === 'ALL' && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-blue-500/40 rounded-full text-[10px] font-mono text-blue-400">
                  <ArrowDown className="w-3 h-3 animate-bounce" />
                  <span>4,500 kg Offtake | 1,500 kg Closed Loop</span>
                </div>
              </div>
            )}

            {/* Step 3: Offtake & Closed-Loop Recycling */}
            {(mobileStageFilter === 'ALL' || mobileStageFilter === 'OFFTAKE') && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-blue-400 pb-1 border-b border-slate-800">
                  <span className="font-bold tracking-wide">STAGE 3: OFFTAKE & RECYCLING</span>
                  <span className="text-[10px] text-slate-400 font-sans">Buyers & Processors</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {buyers.map((b, idx) => (
                    <div
                      key={b.id}
                      onClick={() => handleSelectNode(b)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer active:scale-[0.99] ${
                        selectedNode?.id === b.id
                          ? 'bg-slate-900 border-blue-400 ring-2 ring-blue-500/30'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono px-1.5 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800 font-bold">
                          BUYER {idx + 1}
                        </span>
                        <span className="text-slate-400 font-mono">{b.city}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5">{b.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{b.material}</p>
                      
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-blue-300">{b.current_price}</span>
                        <span className="text-[10px] font-mono font-bold text-blue-400 flex items-center gap-0.5">
                          FLOW OUT <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}

                  {recyclers.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectNode(r)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer active:scale-[0.99] ${
                        selectedNode?.id === r.id
                          ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-500/30'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono px-1.5 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800 font-bold">
                          CLOSED LOOP RECYCLER
                        </span>
                        <span className="text-slate-400 font-mono">{r.city}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5">{r.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.material}</p>
                      
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-amber-300">{r.current_price}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-0.5">
                          ↻ RECIRCULATE
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Bottom Carbon divert ticker */}
            <div className="pt-2.5 border-t border-slate-800 flex flex-col gap-1 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Closed Loop Diverted:
                </span>
                <span className="font-bold text-white">17,000 kg/mo</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Net Avoided Carbon:</span>
                <span className="font-bold">15,800 kg CO2e/mo</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* NODE INSPECTOR PANEL (4 cols) - Live Specs & Contracts                  */}
        {/* ========================================================================= */}
        <div 
          ref={inspectorRef}
          className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm scroll-mt-6"
        >
          {selectedNode ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-mono uppercase text-slate-500 tracking-wider font-semibold">
                    Node Inspector
                  </span>
                  <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> Trust {selectedNode.trust_score}/100
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
                  {selectedNode.name}
                </h4>
                <p className="text-xs text-slate-700 font-medium">{selectedNode.role}</p>
                <p className="text-xs text-slate-500 mt-0.5">Facility Location: {selectedNode.city}, Gujarat Hub</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1 font-medium">Active Supply Contract:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 inline-block text-xs">
                    {selectedNode.active_contract}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1 font-medium">Material Specification:</span>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium leading-relaxed">
                    {selectedNode.material}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Current Price</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{selectedNode.current_price}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Inspection SLA</span>
                    <span className="text-xs font-bold text-emerald-700">48-Hr Guaranteed</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button 
                  onClick={() => window.location.href = `/contracts`}
                  className="w-full min-h-[42px] py-2.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> View Active Contract Terms
                </button>
                <button 
                  onClick={() => window.location.href = `/marketplace`}
                  className="w-full min-h-[42px] py-2.5 px-3 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-100 transition active:scale-[0.98]"
                >
                  Explore Related Lots in Marketplace
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tap any company node to inspect live supply contract and pricing details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
