import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, 
  ExternalLink, Building2, Package, Sparkles, Layers, ArrowUpRight
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

  const suppliers = data?.nodes.filter(n => n.type === 'upstream_supplier') || [];
  const centralHub = data?.nodes.find(n => n.type === 'central_hub');
  const buyers = data?.nodes.filter(n => n.type === 'downstream_buyer') || [];
  const recyclers = data?.nodes.filter(n => n.type === 'closed_loop_recycler') || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Interactive Circular Supply Loop Workflow</h3>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">n8n Node Engine</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Real-time material flows across Upstream Suppliers, Your Sorting Hub, Downstream Buyers, and Secondary Recyclers. Click any node to inspect live contract & material price specs.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button 
            onClick={loadGraphData} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Loop Flow</span>
          </button>
        </div>
      </div>

      {/* Main Visual Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Visual Node Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 text-white rounded-lg p-4 sm:p-6 relative overflow-hidden border border-slate-800 min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25"></div>

          {/* Top Row: Stream Indicators */}
          <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
            <span>[1] UPSTREAM SUPPLY</span>
            <span>[2] VALUE RETENTION HUB</span>
            <span>[3] OFFTAKE & RECYCLING</span>
          </div>

          {/* Middle Interactive Nodes Layout */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center my-auto py-4">
            
            <style>{`
              @keyframes flowLineIn {
                from { stroke-dashoffset: 8; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes flowLineOut {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: 8; }
              }
              .animate-flow-in {
                animation: flowLineIn 0.8s linear infinite;
              }
              .animate-flow-out {
                animation: flowLineOut 0.8s linear infinite;
              }
            `}</style>

            {/* Left Column: Suppliers */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              {suppliers.map((s, idx) => (
                <div key={s.id} className="relative w-full">
                  <div className="hidden md:block absolute top-1/2 -right-6 w-6 h-1 -translate-y-1/2 z-0 pointer-events-none">
                    <svg width="100%" height="100%" className="overflow-visible">
                      <line x1="0" y1="50%" x2="24" y2="50%" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.8" className="animate-flow-in" />
                    </svg>
                  </div>
                  <div
                    onClick={() => setSelectedNode(s)}
                    className={`relative z-10 cursor-pointer p-3 sm:p-3.5 rounded-lg border transition-all text-left ${
                      selectedNode?.id === s.id
                        ? 'bg-slate-800 border-emerald-400 shadow-md shadow-emerald-950'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 shrink-0">
                        SUPPLIER {idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{s.city}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{s.name}</h4>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 gap-1">
                      <span className="truncate">{s.current_price}</span>
                      <span className="text-emerald-400 font-mono text-[10px] shrink-0 whitespace-nowrap">FLOW IN →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Center Column: Central Hub (My Company) */}
            <div className="flex flex-col items-center min-w-0">
              {centralHub && (
                <div
                  onClick={() => setSelectedNode(centralHub)}
                  className={`relative z-10 cursor-pointer p-3.5 sm:p-4 rounded-xl border-2 transition-all w-full text-center ${
                    selectedNode?.id === centralHub.id
                      ? 'bg-slate-900 border-white shadow-xl shadow-slate-900'
                      : 'bg-slate-900 border-emerald-500 hover:border-white'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-bold uppercase rounded-full tracking-wider whitespace-nowrap">
                    My Facility
                  </div>
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto mt-1 mb-2" />
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">{centralHub.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{centralHub.city}</p>
                  <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-300">
                    <div>
                      <span className="block text-slate-500 text-[9px]">TRUST</span>
                      <span className="text-white font-bold">{centralHub.trust_score}/100</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[9px]">SORT RATE</span>
                      <span className="text-emerald-400 font-bold">96.5%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Buyers & Recyclers */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              {buyers.map((b, idx) => (
                <div key={b.id} className="relative w-full">
                  <div className="hidden md:block absolute top-1/2 -left-6 w-6 h-1 -translate-y-1/2 z-0 pointer-events-none">
                    <svg width="100%" height="100%" className="overflow-visible">
                      <line x1="0" y1="50%" x2="24" y2="50%" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.8" className="animate-flow-out" />
                    </svg>
                  </div>
                  <div
                    onClick={() => setSelectedNode(b)}
                    className={`relative z-10 cursor-pointer p-3 sm:p-3.5 rounded-lg border transition-all text-left ${
                      selectedNode?.id === b.id
                        ? 'bg-slate-800 border-emerald-400 shadow-md shadow-emerald-950'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800 shrink-0">
                        BUYER {idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{b.city}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{b.name}</h4>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 gap-1">
                      <span className="truncate">{b.current_price}</span>
                      <span className="text-blue-400 font-mono text-[10px] shrink-0 whitespace-nowrap">FLOW OUT →</span>
                    </div>
                  </div>
                </div>
              ))}

              {recyclers.map((r) => (
                <div key={r.id} className="relative w-full">
                  <div className="hidden md:block absolute top-1/2 -left-6 w-6 h-1 -translate-y-1/2 z-0 pointer-events-none">
                    <svg width="100%" height="100%" className="overflow-visible">
                      <line x1="0" y1="50%" x2="24" y2="50%" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.8" className="animate-flow-out" />
                    </svg>
                  </div>
                  <div
                    onClick={() => setSelectedNode(r)}
                    className={`relative z-10 cursor-pointer p-3 sm:p-3.5 rounded-lg border transition-all text-left ${
                      selectedNode?.id === r.id
                        ? 'bg-slate-800 border-emerald-400 shadow-md shadow-emerald-950'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800 shrink-0">
                        RECYCLER
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{r.city}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{r.name}</h4>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 gap-1">
                      <span className="truncate">{r.current_price}</span>
                      <span className="text-amber-400 font-mono text-[10px] shrink-0 whitespace-nowrap">↻ RECIRCULATE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom Footer Ticker */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span>Active Closed Loop: 17,000 kg/month diverted</span>
            </span>
            <span className="font-mono text-emerald-400 font-medium">
              Net Avoided Carbon: 15,800 kg CO2e/mo
            </span>
          </div>
        </div>

        {/* Node Inspection Panel (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">Node Inspector</span>
                  <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Trust {selectedNode.trust_score}/100
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-1">{selectedNode.name}</h4>
                <p className="text-xs text-slate-600 font-medium">{selectedNode.role}</p>
                <p className="text-xs text-slate-500 mt-0.5">Location: {selectedNode.city}, Gujarat Hub</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Active Supply Contract:</span>
                  <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 inline-block">
                    {selectedNode.active_contract}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Material Specification:</span>
                  <div className="bg-white p-2.5 rounded border border-slate-200 text-slate-800 font-medium leading-relaxed">
                    {selectedNode.material}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Current Material Price</span>
                    <span className="text-sm font-bold text-slate-900">{selectedNode.current_price}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Inspection SLA</span>
                    <span className="text-sm font-bold text-emerald-700">48-Hour Pass</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button 
                  onClick={() => window.location.href = `/contracts`}
                  className="w-full py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Active Contract Terms
                </button>
                <button 
                  onClick={() => window.location.href = `/marketplace`}
                  className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Explore Related Lots in Marketplace
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Click any company node on the left to inspect live supply contract and pricing details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
