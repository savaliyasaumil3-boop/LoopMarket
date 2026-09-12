import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowRight, Building2, CheckCircle2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { fetchCompanyContracts } from '../lib/supabaseData';
import { supabase } from '../lib/supabaseClient';

type CompanyWorkflowNodeData = {
  label: string;
  role: string;
  city: string;
  company_type: string;
  trust_score: number;
  status: string;
  relationship: string;
};

type WorkflowGraphResponse = {
  company_id?: string;
  company_name?: string;
  nodes?: any[];
  edges?: any[];
  summary?: {
    connected_companies?: number;
    active_suppliers?: number;
    active_buyers?: number;
    pending_requests?: number;
    active_material_flows?: number;
    in_transit_orders?: number;
    completed_transactions?: number;
  };
};

const statusColors: Record<string, string> = {
  active: '#22c55e',
  pending: '#f59e0b',
  accepted: '#3b82f6',
  completed: '#8b5cf6',
  rejected: '#ef4444',
  cancelled: '#64748b',
};

const CompanyWorkflowNode = (props: any) => {
  const workflowData = (props?.data ?? {}) as CompanyWorkflowNodeData;
  const tone = statusColors[String(workflowData.status || 'active').toLowerCase()] || '#22c55e';

  return (
    <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-lg">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-slate-900" />
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-slate-100 px-3 py-2" style={{ backgroundColor: `${tone}18` }}>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
          <Building2 className="h-3.5 w-3.5" style={{ color: tone }} />
          {workflowData.role}
        </div>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
      </div>

      <div className="space-y-2 p-3">
        <div className="text-sm font-bold text-slate-900">{workflowData.label}</div>
        <div className="text-[11px] text-slate-500">{workflowData.city}</div>
        <div className="text-[10px] font-mono text-slate-500">{workflowData.company_type}</div>
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600">
          <span>Trust</span>
          <span className="font-bold text-emerald-700">{workflowData.trust_score}/100</span>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600">
          {String(workflowData.status || 'ACTIVE').toUpperCase()} · {workflowData.relationship}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-slate-900" />
    </div>
  );
};

const nodeTypes: any = {
  centerNode: CompanyWorkflowNode,
  supplierNode: CompanyWorkflowNode,
  buyerNode: CompanyWorkflowNode,
  recyclerNode: CompanyWorkflowNode,
  logisticsNode: CompanyWorkflowNode,
};

export const SupplyLoopGraph: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [data, setData] = useState<WorkflowGraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveCompanyId = useCallback(async () => {
    if (companyId) return companyId;

    try {
      const companies = await api.getCompanies();
      const fallbackCompany = (companies || []).find((entry: any) => entry?.name === 'ABC Manufacturing Pvt Ltd') || (companies || [])[0];
      return fallbackCompany?.id || null;
    } catch {
      return null;
    }
  }, [companyId]);

  const loadGraphData = useCallback(async () => {
    const activeCompanyId = companyId || await resolveCompanyId();
    if (!activeCompanyId) {
      setData({
        company_id: 'demo-company',
        company_name: 'ABC Manufacturing Pvt Ltd',
        nodes: [{
          id: 'my-company',
          type: 'central_hub',
          position: { x: 420, y: 220 },
          data: {
            label: 'ABC Manufacturing Pvt Ltd',
            role: 'My Facility',
            city: 'Ahmedabad',
            company_type: 'Manufacturer',
            trust_score: 96,
            status: 'active',
            relationship: 'center',
          }
        }],
        edges: [],
        summary: {
          connected_companies: 0,
          active_suppliers: 0,
          active_buyers: 0,
          pending_requests: 0,
          active_material_flows: 0,
          in_transit_orders: 0,
          completed_transactions: 0,
        },
      });
      setSelectedNode({
        id: 'my-company',
        data: {
          label: 'ABC Manufacturing Pvt Ltd',
          role: 'My Facility',
          city: 'Ahmedabad',
          company_type: 'Manufacturer',
          trust_score: 96,
          status: 'active',
          relationship: 'center',
        },
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [res, companies, supabaseContractRows, backendContractRows] = await Promise.all([
        api.getCircularLoop(activeCompanyId),
        api.getCompanies().catch(() => []),
        fetchCompanyContracts(activeCompanyId).catch(() => []),
        api.getContracts().catch(() => [])
      ]);

      const normalizedBackendContracts = (backendContractRows || []).map((contract: any) => ({
        ...contract,
        seller_id: contract.seller_id || contract.seller?.id,
        seller_name: contract.seller_name || contract.seller?.name,
        seller_city: contract.seller_city || contract.seller?.city,
        buyer_id: contract.buyer_id || contract.buyer?.id,
        buyer_name: contract.buyer_name || contract.buyer?.name,
        buyer_city: contract.buyer_city || contract.buyer?.city,
      }));
      const contractRows = [...normalizedBackendContracts, ...(supabaseContractRows || [])];
      const uniqueContracts = Array.from(new Map(contractRows.map((contract: any) => [String(contract.id || contract.contract_number), contract])).values());
      const contractMatches = uniqueContracts.filter((contract: any) => {
        const sellerId = contract?.seller_id;
        const buyerId = contract?.buyer_id;
        return String(sellerId) === String(activeCompanyId) || String(buyerId) === String(activeCompanyId);
      });

      const companyMap = new Map((companies || []).map((company: any) => [company.id, company]));
      const centerNode = (res?.nodes || []).find((node: any) => node.id === 'my-company') || {
        id: 'my-company',
        type: 'central_hub',
        position: { x: 420, y: 220 },
        data: { label: res?.company_name || 'My Company', role: 'My Facility', relationship: 'center' },
      };
      const mergedNodes = [centerNode];
      const mergedEdges: any[] = [];

      for (const contract of contractMatches) {
        const isCurrentCompanySeller = String(contract.seller_id) === String(activeCompanyId);
        const partnerId = isCurrentCompanySeller ? contract.buyer_id : contract.seller_id;
        if (!partnerId) continue;

        const partnerCompany = (companyMap.get(partnerId) || {
          id: partnerId,
          name: isCurrentCompanySeller ? contract.buyer_name : contract.seller_name,
          city: isCurrentCompanySeller ? contract.buyer_city : contract.seller_city,
          company_type: 'Business Partner',
          trust_score: 90,
        }) as Record<string, any>;

        const partnerRole = isCurrentCompanySeller ? 'Buyer' : 'Seller';
        const partnerNodeId = `company-${partnerId}-${partnerRole.toLowerCase()}`;
        const partnerExists = mergedNodes.some((node: any) => node.id === partnerNodeId);
        if (!partnerExists) {
          mergedNodes.push({
            id: partnerNodeId,
            type: isCurrentCompanySeller ? 'buyerNode' : 'supplierNode',
            position: { x: 200, y: 160 },
            data: {
              label: String(partnerCompany.name ?? 'Partner Company'),
              role: partnerRole,
              workflowSide: isCurrentCompanySeller ? 'left' : 'right',
              city: String(partnerCompany.city ?? 'N/A'),
              company_type: String(partnerCompany.company_type ?? 'Business Partner'),
              trust_score: Number(partnerCompany.trust_score ?? 90),
              status: 'active',
              relationship: 'contract-linked',
            },
          });
        }

        const edgeId = `contract-edge-${contract.id}`;
        const edgeExists = mergedEdges.some((edge: any) => edge.id === edgeId);
        if (!edgeExists) {
          mergedEdges.push({
            id: edgeId,
            source: isCurrentCompanySeller ? 'my-company' : partnerNodeId,
            target: isCurrentCompanySeller ? partnerNodeId : 'my-company',
            label: `CONTRACT • ${Number(contract.quantity_kg || 0).toLocaleString()} kg`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#22c55e', strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
            labelStyle: { fill: '#1f2937', fontSize: 11, fontWeight: 700 },
          });
        }
      }

      const finalData = {
        ...(res || {}),
        nodes: mergedNodes,
        edges: mergedEdges,
        summary: {
          ...(res?.summary || {}),
          connected_companies: Math.max(mergedNodes.filter((node: any) => node.id !== 'my-company').length, 0),
          active_suppliers: mergedNodes.filter((node: any) => String(node.data?.role || '').toLowerCase() === 'seller').length,
          active_buyers: mergedNodes.filter((node: any) => String(node.data?.role || '').toLowerCase() === 'buyer').length,
        },
      };

      setData(finalData);
      if (finalData?.nodes?.length) {
        const fallbackNode = finalData.nodes.find((node: any) => node.id === 'my-company') || finalData.nodes[0];
        setSelectedNode(fallbackNode);
      }
    } catch (requestError) {
      setData(null);
      setSelectedNode(null);
      setError(requestError instanceof Error ? requestError.message : 'Unable to load live company relationships.');
    } finally {
      setLoading(false);
    }
  }, [companyId, resolveCompanyId]);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  useEffect(() => {
    if (!companyId) return;

    const handleContractCreated = (event: Event) => {
      const contract = (event as CustomEvent).detail;
      if (!contract || contract.seller_id === companyId || contract.buyer_id === companyId) {
        loadGraphData();
      }
    };

    window.addEventListener('contract-created', handleContractCreated);

    if (!supabase) {
      return () => window.removeEventListener('contract-created', handleContractCreated);
    }

    const channel = supabase.channel(`workflow-${companyId}`);
    const refresh = () => loadGraphData();

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'company_relationships', filter: `from_company_id=eq.${companyId}` },
      refresh
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'company_relationships', filter: `to_company_id=eq.${companyId}` },
      refresh
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contracts', filter: `seller_id=eq.${companyId}` },
      refresh
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contracts', filter: `buyer_id=eq.${companyId}` },
      refresh
    );

    channel.subscribe();

    return () => {
      window.removeEventListener('contract-created', handleContractCreated);
      channel.unsubscribe();
    };
  }, [companyId, loadGraphData]);

  const nodes = useMemo<Node[]>(() => {
    const rawNodes = (data?.nodes || []).map((node: any) => {
      const type =
        node.type === 'central_hub'
          ? 'centerNode'
          : node.type === 'upstream_supplier' || node.type === 'supplier'
            ? 'supplierNode'
            : node.type === 'downstream_buyer' || node.type === 'buyer'
              ? 'buyerNode'
              : node.type === 'closed_loop_recycler'
                ? 'recyclerNode'
                : node.type === 'logistics'
                  ? 'logisticsNode'
                  : 'supplierNode';

      return {
        id: node.id,
        type,
        position: { x: 0, y: 0 },
        data: {
          label: node.data?.label || node.name || 'Company',
          role: type === 'supplierNode' ? 'Seller' : type === 'buyerNode' ? 'Buyer' : node.data?.role || node.role || 'Connected Company',
          city: node.data?.city || node.city || 'Location',
          company_type: node.data?.company_type || node.company_type || 'Business Partner',
          trust_score: node.data?.trust_score ?? node.trust_score ?? 90,
          status: (node.data?.status || node.status || 'active').toLowerCase(),
          relationship: node.data?.relationship || node.flow_type || 'connected',
          workflowSide: node.data?.workflowSide || node.data?.workflow_side,
        },
      };
    });

    const sellers = rawNodes.filter((node) => node.data.workflowSide === 'right' || node.data.role === 'Seller');
    const buyers = rawNodes.filter((node) => node.data.workflowSide === 'left' || node.data.role === 'Buyer');
    const recyclers = rawNodes.filter((node) => node.type === 'recyclerNode' || node.type === 'logisticsNode');

    return rawNodes.map((node) => {
      if (node.type === 'centerNode') {
        return { ...node, position: { x: 450, y: 240 } };
      }

      if (node.data.workflowSide === 'right' || node.data.role === 'Seller') {
        return { ...node, position: { x: 820, y: 70 + sellers.indexOf(node) * 150 } };
      }

      if (node.data.workflowSide === 'left' || node.data.role === 'Buyer') {
        return { ...node, position: { x: 40, y: 70 + buyers.indexOf(node) * 150 } };
      }

      return {
        ...node,
        position: { x: 300 + recyclers.indexOf(node) * 220, y: 500 },
      };
    });
  }, [data]);

  const graphHeight = Math.max(
    560,
    Math.max(
      nodes.filter((node) => node.data.workflowSide === 'right' || node.data.role === 'Seller').length,
      nodes.filter((node) => node.data.workflowSide === 'left' || node.data.role === 'Buyer').length,
    ) * 150 + 120,
  );

  const edges = useMemo<Edge[]>(() => {
    return (data?.edges || []).map((edge: any) => ({
      id: edge.id || `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label || edge.rate || 'Relationship',
      animated: Boolean(edge.animated ?? true),
      type: 'smoothstep',
      style: edge.style || { stroke: '#22c55e', strokeWidth: 2.5 },
      markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed, color: '#22c55e' },
      labelStyle: { fill: '#1f2937', fontSize: 11, fontWeight: 700 },
    }));
  }, [data]);

  const summary = data?.summary || {
    connected_companies: Math.max((data?.nodes?.length || 1) - 1, 0),
    active_suppliers: 1,
    active_buyers: 1,
    pending_requests: 0,
    active_material_flows: 1,
    in_transit_orders: 0,
    completed_transactions: 0,
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Live circular workflow
          </div>
          <h3 className="mt-2 text-lg font-black text-slate-900">Dynamic Company Relationship Network</h3>
        </div>

        <button
          onClick={loadGraphData}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh workflow
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Connected</div>
          <div className="mt-1 text-lg font-black text-slate-900">{summary.connected_companies ?? 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Suppliers</div>
          <div className="mt-1 text-lg font-black text-emerald-700">{summary.active_suppliers ?? 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Buyers</div>
          <div className="mt-1 text-lg font-black text-blue-700">{summary.active_buyers ?? 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Pending</div>
          <div className="mt-1 text-lg font-black text-amber-700">{summary.pending_requests ?? 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Active flows</div>
          <div className="mt-1 text-lg font-black text-emerald-700">{summary.active_material_flows ?? 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">In transit</div>
          <div className="mt-1 text-lg font-black text-violet-700">{summary.in_transit_orders ?? 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Completed</div>
          <div className="mt-1 text-lg font-black text-slate-900">{summary.completed_transactions ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50" style={{ height: `${graphHeight}px` }}>
          {error ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">{error}</div>
          ) : (
            <>
              <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-md bg-blue-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-800">
                Buyers
              </div>
              <div className="pointer-events-none absolute right-4 top-3 z-10 rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                Sellers
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
                nodesDraggable={false}
                zoomOnScroll
                panOnScroll
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_, node) => setSelectedNode(node)}
              >
                <Background color="#cbd5e1" gap={16} />
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) => {
                    const statusMap: Record<string, string> = {
                      active: '#22c55e',
                      pending: '#f59e0b',
                      accepted: '#3b82f6',
                      completed: '#8b5cf6',
                      rejected: '#ef4444',
                    };
                    return statusMap[String((node.data as any)?.status || '').toLowerCase()] || '#64748b';
                  }}
                />
                <Controls />
              </ReactFlow>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <div className="text-sm font-bold text-slate-900">Selected company</div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>

          {selectedNode ? (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Company</div>
                <div className="mt-1 text-base font-black text-slate-900">{selectedNode.data?.label || selectedNode.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Role</div>
                  <div className="mt-1 text-xs font-bold text-slate-800">{selectedNode.data?.role || 'Connected partner'}</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Trust</div>
                  <div className="mt-1 text-xs font-bold text-emerald-700">{selectedNode.data?.trust_score ?? 90}/100</div>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Location</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{selectedNode.data?.city || 'Current region'}</div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Flow</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  {selectedNode.data?.relationship || 'Business relationship active'}
                </div>
              </div>

              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <div className="font-bold">Business status</div>
                <div className="mt-1">{String(selectedNode.data?.status || 'active').toUpperCase()}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-500">Select a node to inspect the relationship status.</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
        Workflow is derived from real company relationships and active order data.
      </div>
    </div>
  );
};
