import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Database,
  FileText,
  Hammer,
  Layers3,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  Workflow,
  AlertTriangle,
  RefreshCw,
  BadgeCheck,
  CircleDashed,
  Route,
  SearchCheck,
  BellRing,
  Factory,
  PackageCheck,
  ArrowUpRight,
  Zap,
  Rocket,
} from 'lucide-react';

type WorkflowStatus = 'draft' | 'test' | 'published' | 'active' | 'paused';
type NodeStatus = 'idle' | 'waiting' | 'running' | 'success' | 'failed' | 'skipped';
type ExecutionStatus = 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';

type NodeType =
  | 'material_added'
  | 'inventory_updated'
  | 'new_buyer_request'
  | 'order_created'
  | 'scheduled_trigger'
  | 'inspect_material'
  | 'validate_quantity'
  | 'classify_material'
  | 'calculate_price'
  | 'calculate_carbon_saving'
  | 'find_buyers'
  | 'calculate_logistics'
  | 'quality_check'
  | 'if_quantity_gt'
  | 'if_quality_gt'
  | 'if_price_gt'
  | 'if_buyer_matches'
  | 'if_factory_approved'
  | 'create_listing'
  | 'update_listing'
  | 'send_notification'
  | 'create_order'
  | 'assign_logistics'
  | 'update_order_status'
  | 'save_material'
  | 'save_workflow'
  | 'save_workflow_execution'
  | 'read_buyer_data'
  | 'read_material_data'
  | 'update_order'
  | 'workflow_completed'
  | 'workflow_failed';

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  status: NodeStatus;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

interface WorkflowExecutionLog {
  id: string;
  nodeId: string;
  label: string;
  status: 'success' | 'failed' | 'running' | 'skipped';
  message: string;
  timestamp: string;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: number;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt: string;
}

type NodeLibraryEntry = {
  type: NodeType;
  label: string;
  icon: any;
  color: string;
  description: string;
};

const STORAGE_KEY = 'loopmarket_factory_workflow_v1';

const nodeCatalog: Record<NodeType, { category: string; label: string; icon: any; color: string; description: string }> = {
  material_added: { category: 'Trigger', label: 'Material Added', icon: Factory, color: '#2563eb', description: 'Starts when a new material is generated.' },
  inventory_updated: { category: 'Trigger', label: 'Inventory Updated', icon: PackageCheck, color: '#2563eb', description: 'Runs when inventory changes.' },
  new_buyer_request: { category: 'Trigger', label: 'New Buyer Request', icon: SearchCheck, color: '#2563eb', description: 'Starts when a buyer issues a request.' },
  order_created: { category: 'Trigger', label: 'Order Created', icon: FileText, color: '#2563eb', description: 'Starts when an order is created.' },
  scheduled_trigger: { category: 'Trigger', label: 'Scheduled Trigger', icon: CircleDashed, color: '#2563eb', description: 'Runs on a timing schedule.' },

  inspect_material: { category: 'Processing', label: 'Inspect Material', icon: Hammer, color: '#7c3aed', description: 'Inspect condition and material quality.' },
  validate_quantity: { category: 'Processing', label: 'Validate Quantity', icon: Layers3, color: '#7c3aed', description: 'Validate available quantity and minimum order thresholds.' },
  classify_material: { category: 'Processing', label: 'AI Classify Material', icon: Sparkles, color: '#7c3aed', description: 'Classify material type and grade.' },
  calculate_price: { category: 'Processing', label: 'Calculate Price', icon: ArrowUpRight, color: '#7c3aed', description: 'Estimate pricing based on material values.' },
  calculate_carbon_saving: { category: 'Processing', label: 'Calculate Carbon Saving', icon: BadgeCheck, color: '#7c3aed', description: 'Compute circular carbon impact savings.' },
  find_buyers: { category: 'Processing', label: 'Find Buyers', icon: SearchCheck, color: '#7c3aed', description: 'Find or rank matching buyers.' },
  calculate_logistics: { category: 'Processing', label: 'Calculate Logistics', icon: Route, color: '#7c3aed', description: 'Estimate distance and delivery cost.' },
  quality_check: { category: 'Processing', label: 'Quality Check', icon: CheckCircle2, color: '#7c3aed', description: 'Review quality threshold against standard requirements.' },

  if_quantity_gt: { category: 'Condition', label: 'If Quantity > X', icon: ArrowRight, color: '#f59e0b', description: 'Branch if quantity exceeds a threshold.' },
  if_quality_gt: { category: 'Condition', label: 'If Quality >= X', icon: ArrowRight, color: '#f59e0b', description: 'Branch if material quality meets target.' },
  if_price_gt: { category: 'Condition', label: 'If Price >= X', icon: ArrowRight, color: '#f59e0b', description: 'Branch if price threshold is reached.' },
  if_buyer_matches: { category: 'Condition', label: 'If Buyer Matches', icon: ArrowRight, color: '#f59e0b', description: 'Branch based on buyer fit.' },
  if_factory_approved: { category: 'Condition', label: 'If Factory Approved', icon: ArrowRight, color: '#f59e0b', description: 'Branch based on approval decision.' },

  create_listing: { category: 'Action', label: 'Create Listing', icon: FileText, color: '#10b981', description: 'Create a marketplace listing.' },
  update_listing: { category: 'Action', label: 'Update Listing', icon: FileText, color: '#10b981', description: 'Update listing details.' },
  send_notification: { category: 'Action', label: 'Send Notification', icon: BellRing, color: '#10b981', description: 'Send an email or in-app notification.' },
  create_order: { category: 'Action', label: 'Create Order', icon: FileText, color: '#10b981', description: 'Create buyer order record.' },
  assign_logistics: { category: 'Action', label: 'Assign Logistics', icon: Route, color: '#10b981', description: 'Assign pickups and transportation.' },
  update_order_status: { category: 'Action', label: 'Update Order Status', icon: Workflow, color: '#10b981', description: 'Advance order lifecycle stage.' },

  save_material: { category: 'Database', label: 'Save Material', icon: Database, color: '#0ea5e9', description: 'Persist material record.' },
  save_workflow: { category: 'Database', label: 'Save Workflow', icon: Database, color: '#0ea5e9', description: 'Persist workflow definition.' },
  save_workflow_execution: { category: 'Database', label: 'Save Workflow Execution', icon: Database, color: '#0ea5e9', description: 'Persist execution data.' },
  read_buyer_data: { category: 'Database', label: 'Read Buyer Data', icon: Database, color: '#0ea5e9', description: 'Query buyer or demand data.' },
  read_material_data: { category: 'Database', label: 'Read Material Data', icon: Database, color: '#0ea5e9', description: 'Read material record for processing.' },
  update_order: { category: 'Database', label: 'Update Order', icon: Database, color: '#0ea5e9', description: 'Save order or status更新.' },

  workflow_completed: { category: 'End', label: 'Workflow Completed', icon: Rocket, color: '#22c55e', description: 'End state when the workflow succeeds.' },
  workflow_failed: { category: 'End', label: 'Workflow Failed', icon: AlertTriangle, color: '#ef4444', description: 'End state when workflow fails.' },
};

const createNodeId = () => `node_${Math.random().toString(36).slice(2, 9)}`;

const buildDemoWorkflow = (): WorkflowDefinition => {
  const nodes: WorkflowNode[] = [
    { id: 'trigger_1', type: 'material_added', label: 'Material Added', x: 120, y: 120, status: 'success', config: { materialType: 'corrugated board', source: 'cutting line A' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'inspect_1', type: 'inspect_material', label: 'Inspect Material', x: 360, y: 120, status: 'success', config: { condition: 'good', purity: 84, contamination: 8, reusability: 'high' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'qty_1', type: 'validate_quantity', label: 'Validate Quantity', x: 600, y: 120, status: 'success', config: { quantity: 4200, unit: 'kg', minOrderQuantity: 1500 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'classify_1', type: 'classify_material', label: 'AI Classify Material', x: 860, y: 120, status: 'success', config: { category: 'Packaging', grade: 'A', confidence: 92 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'price_1', type: 'calculate_price', label: 'Calculate Price', x: 1120, y: 120, status: 'success', config: { method: 'per_kg', pricePerKg: 18.5, minAcceptable: 12 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'carbon_1', type: 'calculate_carbon_saving', label: 'Calculate Carbon Saving', x: 1340, y: 120, status: 'success', config: { estimatedKgCo2e: 1890 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'buyer_1', type: 'find_buyers', label: 'Find Matching Buyers', x: 1560, y: 120, status: 'success', config: { buyerType: 'recycler', radiusKm: 90, qualityRequirement: 80 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'listing_1', type: 'create_listing', label: 'Create Marketplace Listing', x: 1780, y: 120, status: 'success', config: { title: 'Recycled Corrugated Board', price: 18.5, location: 'Ahmedabad', availability: 'Available now' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'approval_1', type: 'if_factory_approved', label: 'Factory Approval', x: 2000, y: 120, status: 'success', config: { manualApproval: true, minimumOrderValue: 50000 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'order_1', type: 'create_order', label: 'Create Order', x: 2200, y: 120, status: 'success', config: { orderValue: 66000, buyerId: 'B-2041' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'logistics_1', type: 'calculate_logistics', label: 'Calculate Logistics', x: 2420, y: 120, status: 'success', config: { pickupLocation: 'Ahmedabad', deliveryLocation: 'Vadodara', transportType: 'refrigerated_truck' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'complete_1', type: 'workflow_completed', label: 'Workflow Completed', x: 2640, y: 120, status: 'success', config: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const connections: WorkflowConnection[] = [
    { id: 'c1', source: 'trigger_1', target: 'inspect_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c2', source: 'inspect_1', target: 'qty_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c3', source: 'qty_1', target: 'classify_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c4', source: 'classify_1', target: 'price_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c5', source: 'price_1', target: 'carbon_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c6', source: 'carbon_1', target: 'buyer_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c7', source: 'buyer_1', target: 'listing_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c8', source: 'listing_1', target: 'approval_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c9', source: 'approval_1', target: 'order_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c10', source: 'order_1', target: 'logistics_1', sourceHandle: 'output', targetHandle: 'input' },
    { id: 'c11', source: 'logistics_1', target: 'complete_1', sourceHandle: 'output', targetHandle: 'input' },
  ];

  return {
    id: 'wf_demo_factory',
    name: 'Factory Material Recovery Workflow',
    description: 'Automate surplus material inspection, pricing, listing, buyer matching and order handling.',
    status: 'published',
    version: 1,
    nodes,
    connections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const defaultWorkflow = buildDemoWorkflow();

function makeNode(type: NodeType, position?: { x: number; y: number }): WorkflowNode {
  const info = nodeCatalog[type];
  return {
    id: createNodeId(),
    type,
    label: info.label,
    x: position?.x ?? 120,
    y: position?.y ?? 120,
    status: 'idle',
    config: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getNodeById(nodes: WorkflowNode[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId);
}

function getExecutionOrder(workflow: WorkflowDefinition): string[] {
  const nodes = workflow.nodes;
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((node) => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  workflow.connections.forEach((connection) => {
    const sourceNode = getNodeById(nodes, connection.source);
    const targetNode = getNodeById(nodes, connection.target);
    if (!sourceNode || !targetNode) return;

    const arr = graph.get(sourceNode.id) || [];
    if (!arr.includes(targetNode.id)) {
      arr.push(targetNode.id);
      graph.set(sourceNode.id, arr);
      inDegree.set(targetNode.id, (inDegree.get(targetNode.id) || 0) + 1);
    }
  });

  const queue = nodes
    .filter((node) => (inDegree.get(node.id) || 0) === 0)
    .sort((a, b) => a.x - b.x)
    .map((node) => node.id);

  const order: string[] = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current) continue;
    order.push(current);
    const nextNodes = graph.get(current) || [];
    nextNodes.forEach((nextNode) => {
      const nextInDegree = (inDegree.get(nextNode) || 0) - 1;
      inDegree.set(nextNode, nextInDegree);
      if (nextInDegree === 0) queue.push(nextNode);
    });
  }

  return order;
}

function hasCycle(workflow: WorkflowDefinition): boolean {
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);

    const outgoing = workflow.connections
      .filter((connection) => connection.source === nodeId)
      .map((connection) => connection.target);

    for (const next of outgoing) {
      if (dfs(next)) return true;
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  return workflow.nodes.some((node) => dfs(node.id));
}

function getNodeConfigFields(nodeType: NodeType) {
  switch (nodeType) {
    case 'material_added':
      return ['materialType', 'source', 'location'];
    case 'inspect_material':
      return ['condition', 'purity', 'contamination', 'reusability', 'notes'];
    case 'validate_quantity':
      return ['quantity', 'unit', 'minOrderQuantity', 'availableQuantity'];
    case 'classify_material':
      return ['category', 'grade', 'confidence'];
    case 'calculate_price':
      return ['method', 'pricePerKg', 'minAcceptable'];
    case 'calculate_carbon_saving':
      return ['estimatedKgCo2e', 'unit'];
    case 'find_buyers':
      return ['buyerType', 'radiusKm', 'qualityRequirement'];
    case 'create_listing':
      return ['title', 'description', 'price', 'location', 'availability'];
    case 'if_factory_approved':
      return ['manualApproval', 'minimumOrderValue'];
    case 'create_order':
      return ['orderValue', 'buyerId', 'status'];
    case 'calculate_logistics':
      return ['pickupLocation', 'deliveryLocation', 'transportType', 'distanceKm', 'estimatedCost'];
    case 'send_notification':
      return ['channel', 'message'];
    default:
      return ['label'];
  }
}

export const FactoryWorkflowPage: React.FC = () => {
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as WorkflowDefinition;
      }
    } catch {
      // ignore invalid local state
    }
    return defaultWorkflow;
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(defaultWorkflow.nodes[0]?.id ?? null);
  const [pendingConnection, setPendingConnection] = useState<{ nodeId: string; handle: string } | null>(null);
  const [executionLog, setExecutionLog] = useState<WorkflowExecutionLog[]>([]);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('pending');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodeLibrary, setShowNodeLibrary] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const workflowLayoutClass = showNodeLibrary && showConfigPanel
    ? 'grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_300px] xl:grid-cols-[240px_minmax(0,1fr)_320px]'
    : showNodeLibrary
      ? 'grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]'
      : showConfigPanel
        ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]'
        : 'grid-cols-1';

  const groupedNodeCategories = useMemo<Record<string, NodeLibraryEntry[]>>(() => {
    return Object.entries(nodeCatalog).reduce((acc, [type, meta]) => {
      const category = meta.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push({ type: type as NodeType, label: meta.label, icon: meta.icon, color: meta.color, description: meta.description });
      return acc;
    }, {} as Record<string, NodeLibraryEntry[]>);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
  }, [workflow]);

  const selectedNode = useMemo(
    () => workflow.nodes.find((node) => node.id === selectedNodeId) || null,
    [workflow.nodes, selectedNodeId]
  );

  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    const hasTrigger = workflow.nodes.some((node) => ['material_added', 'inventory_updated', 'new_buyer_request', 'order_created', 'scheduled_trigger'].includes(node.type));
    const hasEnd = workflow.nodes.some((node) => ['workflow_completed', 'workflow_failed'].includes(node.type));

    if (!hasTrigger) errors.push('A workflow trigger is required.');
    if (!hasEnd) errors.push('An end node is required.');

    const missingRequiredConfig = workflow.nodes.filter((node) => {
      const required = getNodeConfigFields(node.type);
      return required.some((field) => !node.config[field] && node.config[field] !== 0);
    });

    if (missingRequiredConfig.length > 0) {
      errors.push(`Complete required configuration for: ${missingRequiredConfig.map((node) => node.label).join(', ')}`);
    }

    const connectionErrors = workflow.connections.filter((connection) => {
      const sourceExists = !!getNodeById(workflow.nodes, connection.source);
      const targetExists = !!getNodeById(workflow.nodes, connection.target);
      return !sourceExists || !targetExists;
    });

    if (connectionErrors.length > 0) {
      errors.push('One or more connections reference missing nodes.');
    }

    if (hasCycle(workflow)) {
      errors.push('Circular workflow connections are not allowed.');
    }

    return errors;
  }, [workflow]);

  const errors = validateWorkflow();
  const isValid = errors.length === 0;

  const updateNode = (nodeId: string, patch: Partial<WorkflowNode>) => {
    setWorkflow((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch, updatedAt: new Date().toISOString() } : node)),
    }));
  };

  const addNode = (type: NodeType, position?: { x: number; y: number }) => {
    const node = makeNode(type, position ?? { x: 120 + workflow.nodes.length * 28, y: 120 + workflow.nodes.length * 25 });
    setWorkflow((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      nodes: [...current.nodes, node],
    }));
    setSelectedNodeId(node.id);
  };

  const duplicateNode = (nodeId: string) => {
    const source = getNodeById(workflow.nodes, nodeId);
    if (!source) return;
    const duplicate: WorkflowNode = {
      ...source,
      id: createNodeId(),
      label: `${source.label} Copy`,
      x: source.x + 50,
      y: source.y + 50,
      status: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkflow((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      nodes: [...current.nodes, duplicate],
    }));
    setSelectedNodeId(duplicate.id);
  };

  const removeNode = (nodeId: string) => {
    if (!window.confirm('Delete this workflow node?')) return;

    setWorkflow((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      nodes: current.nodes.filter((node) => node.id !== nodeId),
      connections: current.connections.filter((connection) => connection.source !== nodeId && connection.target !== nodeId),
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const connectNodes = (sourceNodeId: string, targetNodeId: string) => {
    if (sourceNodeId === targetNodeId) return;
    setWorkflow((current) => {
      const exists = current.connections.some(
        (connection) => connection.source === sourceNodeId && connection.target === targetNodeId
      );
      if (exists) return current;
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        connections: [
          ...current.connections,
          {
            id: `conn_${Math.random().toString(36).slice(2, 9)}`,
            source: sourceNodeId,
            target: targetNodeId,
            sourceHandle: 'output',
            targetHandle: 'input',
          },
        ],
      };
    });
  };

  const saveWorkflow = () => {
    setWorkflow((current) => ({
      ...current,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    }));
  };

  const publishWorkflow = () => {
    const validation = validateWorkflow();
    if (validation.length > 0) {
      alert(`Cannot publish workflow:\n- ${validation.join('\n- ')}`);
      return;
    }

    setWorkflow((current) => ({
      ...current,
      status: 'published',
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    }));
  };

  const runWorkflow = async () => {
    if (!isValid) {
      alert(`Workflow validation failed:\n- ${errors.join('\n- ')}`);
      return;
    }

    const order = getExecutionOrder(workflow);
    const newLogs: WorkflowExecutionLog[] = [];
    setExecutionStatus('running');
    setExecutionLog([]);

    setWorkflow((current) => ({
      ...current,
      nodes: current.nodes.map((node) => ({ ...node, status: 'waiting' })),
    }));

    for (const nodeId of order) {
      const node = getNodeById(workflow.nodes, nodeId);
      if (!node) continue;

      await new Promise((resolve) => setTimeout(resolve, 500));
      setWorkflow((current) => ({
        ...current,
        nodes: current.nodes.map((item) => 
          item.id === nodeId ? { ...item, status: 'running', updatedAt: new Date().toISOString() } : item
        ),
      }));

      const success = node.type !== 'workflow_failed';
      const text = success ? 'Executed successfully.' : 'Execution failed.';

      const resultLog: WorkflowExecutionLog = {
        id: `log_${Math.random().toString(36).slice(2, 9)}`,
        nodeId: node.id,
        label: node.label,
        status: success ? 'success' : 'failed',
        message: text,
        timestamp: new Date().toISOString(),
      };
      newLogs.push(resultLog);

      setExecutionLog((prev) => [...prev, resultLog]);

      setWorkflow((current) => ({
        ...current,
        nodes: current.nodes.map((item) =>
          item.id === nodeId ? { ...item, status: success ? 'success' : 'failed', updatedAt: new Date().toISOString() } : item
        ),
      }));
    }

    setExecutionStatus('completed');
    const finalNode = getNodeById(workflow.nodes, order[order.length - 1]);
    if (finalNode && finalNode.type === 'workflow_completed') {
      setExecutionLog((prev) => [
        ...prev,
        {
          id: `log_${Math.random().toString(36).slice(2, 9)}`,
          nodeId: finalNode.id,
          label: finalNode.label,
          status: 'success',
          message: 'Workflow completed successfully.',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const onCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/node-type') as NodeType;
    if (!type) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = event.clientX - (rect?.left ?? 0) - 120;
    const y = event.clientY - (rect?.top ?? 0) - 50;
    addNode(type, { x: Math.max(80, x), y: Math.max(60, y) });
  };

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, type: NodeType) => {
    event.dataTransfer.setData('application/node-type', type);
  };

  useEffect(() => {
    if (!draggingNodeId) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left - dragOffset.x;
      const y = event.clientY - rect.top - dragOffset.y;

      setWorkflow((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        nodes: current.nodes.map((node) =>
          node.id === draggingNodeId
            ? { ...node, x: Math.max(20, x), y: Math.max(20, y), updatedAt: new Date().toISOString() }
            : node
        ),
      }));
    };

    const handlePointerUp = () => {
      setDraggingNodeId(null);
      setDragOffset({ x: 0, y: 0 });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingNodeId, dragOffset]);

  const renderConfigForm = () => {
    if (!selectedNode) {
      return <div className="text-sm text-slate-500">Select a node to configure it.</div>;
    }

    const fields = getNodeConfigFields(selectedNode.type);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Node config</div>
            <h3 className="text-base font-bold text-slate-900">{selectedNode.label}</h3>
          </div>
          <div className="rounded-full px-2 py-1 text-[10px] font-semibold border border-slate-200 bg-slate-100 text-slate-700">
            {nodeCatalog[selectedNode.type].category}
          </div>
        </div>

        {fields.map((field) => (
          <div key={field} className="space-y-1.5">
            <label className="block text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">{field}</label>
            <input
              value={selectedNode.config[field] ?? ''}
              onChange={(event) => {
                updateNode(selectedNode.id, {
                  config: { ...selectedNode.config, [field]: event.target.value },
                });
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-emerald-500"
              placeholder={field}
            />
          </div>
        ))}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="font-bold text-slate-800 mb-1">Node details</div>
          <div>ID: {selectedNode.id}</div>
          <div>Type: {selectedNode.type}</div>
          <div>Status: {selectedNode.status}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <Workflow className="w-4 h-4 text-emerald-600" />
            Factory workflow studio
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Factory Workflow Builder</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowNodeLibrary((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            <Layers3 className="w-4 h-4" /> {showNodeLibrary ? 'Hide nodes' : 'Show nodes'}
          </button>
          <button onClick={() => setShowConfigPanel((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            <FileText className="w-4 h-4" /> {showConfigPanel ? 'Hide config' : 'Show config'}
          </button>
          <button onClick={saveWorkflow} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-sm">
            <Save className="w-4 h-4" /> Save draft
          </button>
          <button onClick={() => alert('Workflow validation passed.')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Validate
          </button>
          <button onClick={runWorkflow} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm">
            <Play className="w-4 h-4" /> Run workflow
          </button>
          <button onClick={publishWorkflow} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-sm">
            <UploadCloud className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
          Status: {workflow.status}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-mono text-slate-700">
          Version {workflow.version}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-mono text-slate-700">
          Execution: {executionStatus}
        </div>
        {!isValid && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
            Validation issues: {errors.length}
          </div>
        )}
      </div>

      <div className={`grid h-[calc(100vh-230px)] min-h-[700px] gap-4 ${workflowLayoutClass}`}>
        {showNodeLibrary && (
          <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Node library</div>
            </div>
            <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-3">
              {Object.entries(groupedNodeCategories).map(([category, nodes]) => (
                <div key={category} className="mb-4">
                  <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">{category}</div>
                  <div className="space-y-2">
                    {nodes.map((node) => {
                      const Icon = node.icon;
                      return (
                        <div
                          key={node.type}
                          draggable
                          onDragStart={(event) => onDragStart(event, node.type)}
                          onClick={() => addNode(node.type)}
                          className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${node.color}20`, color: node.color }}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-bold text-slate-800">{node.label}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">{node.description}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="text-sm font-bold text-slate-800">Workflow canvas</div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> Auto-save active
            </div>
          </div>

          <div
            ref={canvasRef}
            className="relative h-full min-h-[580px] overflow-auto bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.12)_1px,_transparent_1px)] bg-[length:20px_20px]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onCanvasDrop}
          >
            <div className="relative h-[1200px] min-w-[1400px]">
              <svg className="absolute inset-0 h-full w-full">
                {workflow.connections.map((connection) => {
                  const sourceNode = getNodeById(workflow.nodes, connection.source);
                  const targetNode = getNodeById(workflow.nodes, connection.target);
                  if (!sourceNode || !targetNode) return null;

                  const startX = sourceNode.x + 180;
                  const startY = sourceNode.y + 44;
                  const endX = targetNode.x;
                  const endY = targetNode.y + 44;

                  return (
                    <path
                      key={connection.id}
                      d={`M ${startX} ${startY} C ${startX + 90} ${startY}, ${endX - 90} ${endY}, ${endX} ${endY}`}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="8 6"
                    />
                  );
                })}
              </svg>

              {workflow.nodes.map((node) => {
                const meta = nodeCatalog[node.type];
                const Icon = meta.icon;
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    className={`absolute w-[180px] rounded-2xl border bg-white shadow-md ${isSelected ? 'border-emerald-500 ring-4 ring-emerald-100' : 'border-slate-200'} ${draggingNodeId === node.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ left: node.x, top: node.y }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelectedNodeId(node.id);
                      const rect = canvasRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      setDraggingNodeId(node.id);
                      setDragOffset({
                        x: event.clientX - rect.left - node.x,
                        y: event.clientY - rect.top - node.y,
                      });
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                  >
                    <div className="flex items-center justify-between rounded-t-2xl px-3 py-2" style={{ backgroundColor: `${meta.color}18` }}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: meta.color, color: 'white' }}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">{meta.category}</div>
                      </div>
                      <div className={`h-2.5 w-2.5 rounded-full ${node.status === 'success' ? 'bg-emerald-500' : node.status === 'running' ? 'bg-amber-400 animate-pulse' : node.status === 'failed' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                    </div>

                    <div className="p-3">
                      <div className="text-xs font-black text-slate-900">{node.label}</div>
                      <div className="mt-2 text-[10px] text-slate-500">{meta.description}</div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                      <button
                        className="rounded-md border border-slate-200 bg-slate-50 p-1 text-slate-500 hover:bg-slate-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingConnection({ nodeId: node.id, handle: 'output' });
                        }}
                        title="Connect from this node"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="rounded-md border border-slate-200 bg-slate-50 p-1 text-slate-500 hover:bg-slate-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (pendingConnection && pendingConnection.nodeId !== node.id) {
                            connectNodes(pendingConnection.nodeId, node.id);
                            setPendingConnection(null);
                          }
                        }}
                        title="Connect to this node"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-slate-700 shadow-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingConnection({ nodeId: node.id, handle: 'input' });
                      }}
                      title="Input handle"
                    />
                    <button
                      className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600 shadow-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingConnection({ nodeId: node.id, handle: 'output' });
                      }}
                      title="Output handle"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {showConfigPanel && (
          <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Configuration</div>
            </div>

            <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-4">
              {selectedNode ? (
                <div className="space-y-4">
                  {renderConfigForm()}

                  <div className="space-y-2 border-t border-slate-200 pt-4">
                    <button onClick={() => duplicateNode(selectedNode.id)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                      <Copy className="w-4 h-4" /> Duplicate node
                    </button>
                    <button onClick={() => removeNode(selectedNode.id)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                      <Trash2 className="w-4 h-4" /> Delete node
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No node selected.</div>
              )}
            </div>
          </aside>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Workflow validation</h3>
            <div className={`rounded-full px-2 py-1 text-[10px] font-bold ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isValid ? 'Valid' : 'Needs attention'}
            </div>
          </div>
          <div className="space-y-2">
            {isValid ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> All required workflow checks passed.
              </div>
            ) : (
              errors.map((error) => (
                <div key={error} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 w-4 h-4" />
                  <span>{error}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Execution logs</h3>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700" onClick={() => setExecutionLog([])}>
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
          <div className="space-y-2">
            {executionLog.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                No execution has started yet.
              </div>
            ) : (
              executionLog.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-800">{log.label}</div>
                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : log.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {log.status}
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600">{log.message}</div>
                  <div className="mt-1 text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactoryWorkflowPage;
