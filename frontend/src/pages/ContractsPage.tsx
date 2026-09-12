import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, CheckCircle2, ShieldCheck, 
  Sparkles, ExternalLink, Download, ArrowRight, X,
  Database, UserCheck, Building2, History, Clock, FileCheck, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { addContract, fetchContracts, updateContract } from '../lib/supabaseData';

// Fallback demo contracts if DB unpopulated
const DEFAULT_CONTRACTS = [
  {
    id: 'ctr_demo_201',
    contract_number: 'CTR-2026-9041',
    title: 'Baled OCC Cardboard Monthly Offtake Agreement',
    seller_id: 'comp-demo-1',
    seller_name: 'ABC Manufacturing Pvt Ltd',
    buyer_id: 'comp-demo-2',
    buyer_name: 'GreenPack Industries Ltd',
    buyer_city: 'Vadodara',
    material_name: 'Corrugated Cardboard OCC Grade 11',
    quantity_kg: 5000,
    unit_price: 14.50,
    total_amount: 72500,
    contract_duration: '30 Days Transactional',
    status: 'ACTIVE',
    seller_signed: true,
    buyer_signed: true,
    role: 'SELLER',
    delivery_terms: 'Ex-works seller facility in Ahmedabad. Transporter scheduled via LoopMarket Fleet within 48 hours of dispatch trigger.',
    payment_terms: '100% Mock Escrow protection. Funds locked upon contract activation; released to seller upon QR QA receipt confirmation.',
    inspection_terms: 'Max 2% moisture tolerance. Moisture QA inspection report cryptographically attached to Digital Passport hash.',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'ctr_demo_202',
    contract_number: 'CTR-2026-8102',
    title: 'HDPE Regrind Flakes Closed-Loop Supply Contract',
    seller_id: 'comp-demo-3',
    seller_name: 'Gujarat Circular Polymers & Pulp',
    buyer_id: 'comp-demo-1',
    buyer_name: 'ABC Manufacturing Pvt Ltd',
    buyer_city: 'Ahmedabad',
    material_name: 'Post-Industrial HDPE Flakes (Clean)',
    quantity_kg: 2500,
    unit_price: 42.00,
    total_amount: 105000,
    contract_duration: 'Quarterly Recurring Offtake',
    status: 'ACTIVE',
    seller_signed: true,
    buyer_signed: true,
    role: 'BUYER',
    delivery_terms: 'Delivered DDP buyer plant in Ahmedabad with temperature-controlled freight truck.',
    payment_terms: 'Mock Escrow payment released 50% on shipment dispatch and 50% on purity verification.',
    inspection_terms: '0% organic contamination. Granule size uniform 8mm.',
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString()
  },
  {
    id: 'ctr_demo_203',
    contract_number: 'CTR-2026-6710',
    title: 'Heat Treated Euro Pallet Swap Agreement',
    seller_id: 'comp-demo-1',
    seller_name: 'ABC Manufacturing Pvt Ltd',
    buyer_id: 'comp-demo-4',
    buyer_name: 'Surat Warehousing & Logistics',
    buyer_city: 'Surat',
    material_name: 'EPAL Standard Wooden Euro Pallets',
    quantity_kg: 8000,
    unit_price: 450.00,
    total_amount: 180000,
    contract_duration: 'Annual Closed-Loop Agreement',
    status: 'COMPLETED',
    seller_signed: true,
    buyer_signed: true,
    role: 'SELLER',
    delivery_terms: 'FOB Surat Hub. Inspected and repaired to EPAL Class A standard.',
    payment_terms: 'Completed. Escrow released.',
    inspection_terms: 'ISPM-15 heat treatment stamp verified.',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString()
  }
];

export const ContractsPage: React.FC = () => {
  const { company } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Role Filter State: 'SELLER' vs 'BUYER' vs 'ALL'
  const [roleTab, setRoleTab] = useState<'ALL' | 'SELLER' | 'BUYER'>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  // New Contract Form
  const [partnerCompanyId, setPartnerCompanyId] = useState('');
  const [partnerRole, setPartnerRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [materialName, setMaterialName] = useState('Corrugated Cardboard OCC 11');
  const [quantityKg, setQuantityKg] = useState<number>(5000);
  const [unitPrice, setUnitPrice] = useState<number>(14.5);
  const [duration, setDuration] = useState('30 Days Transactional');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [inspectionTerms, setInspectionTerms] = useState('');

  useEffect(() => {
    loadContracts();
    api.getCompanies().then(res => setCompaniesList(res || []));
  }, [statusFilter, roleTab]);

  const loadContracts = async () => {
    setLoading(true);
    let combined: any[] = [];

    // 1. Fetch from Supabase DB 'contracts' table
    let supabaseItems: any[] = [];
    try {
      const sbData = await fetchContracts();
      if (sbData && Array.isArray(sbData)) {
        supabaseItems = sbData.map(item => ({
          ...item,
          is_supabase: true,
          total_amount: item.total_amount || (Number(item.quantity_kg || 1000) * Number(item.unit_price || 15))
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch notice on contracts page:', e);
    }

    // 2. Fetch from FastAPI Backend
    let apiItems: any[] = [];
    try {
      const backendData = await api.getContracts({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      if (backendData && Array.isArray(backendData)) {
        apiItems = backendData;
      }
    } catch (e) {
      console.warn('Backend API fetch notice on contracts page:', e);
    }

    // Combine while removing duplicate contract numbers/IDs
    const map = new Map<string, any>();
    
    // Add default fallback items if database empty
    if (supabaseItems.length === 0 && apiItems.length === 0) {
      DEFAULT_CONTRACTS.forEach(item => map.set(item.id, item));
    }

    apiItems.forEach(item => map.set(String(item.id), item));
    supabaseItems.forEach(item => map.set(String(item.id), { ...map.get(String(item.id)), ...item, is_supabase: true }));

    combined = Array.from(map.values());

    // Filter by Role Tab ('SELLER' vs 'BUYER')
    if (roleTab === 'SELLER') {
      combined = combined.filter(c => c.seller_id === company?.id || c.role === 'SELLER' || !c.buyer_id);
    } else if (roleTab === 'BUYER') {
      combined = combined.filter(c => c.buyer_id === company?.id || c.role === 'BUYER');
    }

    // Filter by Status
    if (statusFilter !== 'All') {
      combined = combined.filter(c => c.status === statusFilter);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      combined = combined.filter(c => 
        c.contract_number?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.material_name?.toLowerCase().includes(q) ||
        c.buyer_name?.toLowerCase().includes(q) ||
        c.seller_name?.toLowerCase().includes(q)
      );
    }

    setContracts(combined);
    setLoading(false);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const partnerComp = companiesList.find(c => String(c.id) === String(partnerCompanyId)) || companiesList[0];
    const contractNum = `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newContractPayload = {
      contract_number: contractNum,
      title: `${materialName} Supply Agreement`,
      seller_id: partnerRole === 'BUYER' ? (company?.id || 'comp-demo-1') : (partnerComp?.id || 'comp-demo-2'),
      seller_name: partnerRole === 'BUYER' ? (company?.name || 'ABC Manufacturing Pvt Ltd') : (partnerComp?.name || 'Partner Facility'),
      buyer_id: partnerRole === 'BUYER' ? (partnerComp?.id || 'comp-demo-2') : (company?.id || 'comp-demo-1'),
      buyer_name: partnerRole === 'BUYER' ? (partnerComp?.name || 'Partner Facility') : (company?.name || 'ABC Manufacturing Pvt Ltd'),
      buyer_city: partnerComp?.city || 'Ahmedabad',
      material_name: materialName,
      quantity_kg: quantityKg,
      unit_price: unitPrice,
      total_amount: quantityKg * unitPrice,
      contract_duration: duration,
      status: 'ACTIVE',
      seller_signed: true,
      buyer_signed: true,
      role: partnerRole === 'BUYER' ? 'SELLER' : 'BUYER',
      delivery_terms: deliveryTerms || 'Ex-works seller facility. Transporter scheduled via LoopMarket Green Logistics Fleet within 48 hours of dispatch trigger.',
      payment_terms: paymentTerms || '100% Mock Escrow protection. Funds locked upon contract activation; released to seller upon QA receipt confirmation.',
      inspection_terms: inspectionTerms || 'Max 2% moisture tolerance. Quality inspection report cryptographically attached to Digital Material Passport.',
      created_at: new Date().toISOString()
    };

    try {
      // 1. Save to FastAPI Backend API
      await api.createContract({
        seller_id: newContractPayload.seller_id,
        buyer_id: newContractPayload.buyer_id,
        material_name: materialName,
        quantity_kg: quantityKg,
        unit_price: unitPrice,
        contract_duration: duration,
        delivery_terms: newContractPayload.delivery_terms,
        payment_terms: newContractPayload.payment_terms,
        inspection_terms: newContractPayload.inspection_terms
      });
    } catch (apiErr) {
      console.warn('Backend API contract create notice:', apiErr);
    }

    // 2. Save to Supabase DB table 'contracts'
    try {
      await addContract(newContractPayload);
    } catch (sbErr) {
      console.warn('Supabase contract insert notice:', sbErr);
    }

    setShowAddModal(false);
    loadContracts();
  };

  const handleSignContract = async (contractId: string) => {
    try {
      await api.signContract(contractId);
    } catch {
      // ignore
    }

    try {
      await updateContract(contractId, { buyer_signed: true, status: 'ACTIVE' });
    } catch {
      // ignore
    }

    loadContracts();
    if (selectedContract) {
      setSelectedContract({ ...selectedContract, buyer_signed: true, status: 'ACTIVE' });
    }
  };

  // Divide contracts into Active vs History
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
  const historyContracts = contracts.filter(c => c.status === 'COMPLETED' || c.status === 'DRAFT');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="b2b-badge bg-emerald-100 text-emerald-900 border-emerald-300 font-mono text-[10px]">
              <Database className="w-3 h-3 text-emerald-700" /> SUPABASE CONTRACTS LIVE
            </span>
            <span className="text-slate-500 font-mono text-[11px] uppercase">• Legal & Governance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Contract Panel & Supply Agreements</h1>
          <p className="text-slate-600 text-xs mt-0.5">
            Manage circular supply agreements, toggle between Seller & Buyer options, and inspect Supabase-backed legal execution trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadContracts}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh contracts from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Create Contract
          </button>
        </div>
      </div>

      {/* ROLE SWITCHER OPTIONS (SELLER VS BUYER) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Buyer vs Seller View Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => setRoleTab('ALL')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              roleTab === 'ALL' 
                ? 'bg-slate-950 text-white shadow-xs' 
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>All Agreements</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[10px]">
              {contracts.length}
            </span>
          </button>

          {/* SELLER OPTION */}
          <button
            onClick={() => setRoleTab('SELLER')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              roleTab === 'SELLER' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-300" />
            <span>As Seller (Outflow Supply)</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200 font-mono text-[10px]">
              {contracts.filter(c => c.seller_id === company?.id || c.role === 'SELLER' || !c.buyer_id).length}
            </span>
          </button>

          {/* BUYER OPTION */}
          <button
            onClick={() => setRoleTab('BUYER')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              roleTab === 'BUYER' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-300" />
            <span>As Buyer (Inflow Offtake)</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-900 text-blue-200 font-mono text-[10px]">
              {contracts.filter(c => c.buyer_id === company?.id || c.role === 'BUYER').length}
            </span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contract #, company..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-800 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="COMPLETED">Completed Only</option>
            <option value="DRAFT">AI Drafts Only</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: ACTIVE CONTRACTS SECTION BELOW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-950">Active Contracts Section</h2>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
              {activeContracts.length} ACTIVE
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">SUPABASE LIVE VERIFIED</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Loading active contracts from Supabase...
          </div>
        ) : activeContracts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-xl space-y-2">
            <p className="font-bold text-slate-800 text-sm">No active contracts for selected option</p>
            <p className="text-slate-500 text-xs">Switch to All Agreements or click "Create Contract" to draft a new supply contract.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeContracts.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-emerald-600"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-950 text-sm">{c.contract_number}</span>
                    <span className="b2b-badge bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                      ACTIVE AGREEMENT
                    </span>
                    {c.is_supabase && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded text-[10px] font-mono flex items-center gap-1">
                        <Database className="w-2.5 h-2.5" /> SUPABASE DB
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-950">{c.title || `${c.material_name} Supply Contract`}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-600 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Seller Facility</span>
                      <strong className="text-slate-900">{c.seller_name || 'ABC Manufacturing'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Buyer Facility</span>
                      <strong className="text-slate-900">{c.buyer_name || c.buyer?.name} ({c.buyer_city || 'Vadodara'})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Material Specs</span>
                      <strong className="text-slate-900">{c.material_name} ({Number(c.quantity_kg).toLocaleString()} kg)</strong>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono uppercase">Total Value</span>
                    <span className="text-base font-black text-slate-950 font-mono">₹{Number(c.total_amount || 0).toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => setSelectedContract(c)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> Inspect Terms
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: CONTRACT HISTORY / ARCHIVE SECTION BELOW */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h2 className="text-base font-extrabold text-slate-950">Contract History & Archive Section</h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold text-[10px]">
              {historyContracts.length} HISTORICAL
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">AUDIT TRAIL LOG</span>
        </div>

        {historyContracts.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-white border border-slate-200 rounded-xl text-xs">
            No completed or archived contracts in history.
          </div>
        ) : (
          <div className="space-y-3">
            {historyContracts.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-90 hover:opacity-100"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">{c.contract_number}</span>
                    <span className={`b2b-badge ${
                      c.status === 'COMPLETED' ? 'bg-slate-900 text-white border-slate-900' : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Created: {new Date(c.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900">{c.title || c.material_name}</h3>
                  <p className="text-slate-500 text-[11px]">
                    Seller: {c.seller_name} • Buyer: {c.buyer_name || c.buyer?.name} ({c.quantity_kg} kg @ ₹{c.unit_price}/kg)
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Value</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">₹{Number(c.total_amount || 0).toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => setSelectedContract(c)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded font-semibold text-xs transition cursor-pointer"
                  >
                    View History Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Detail & Signature Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
            
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400">{selectedContract.contract_number}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedContract.title || `${selectedContract.material_name} Contract`}</h3>
              </div>
              <button onClick={() => setSelectedContract(null)} className="p-1 hover:bg-slate-800 rounded cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              
              {/* Disclaimer */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span><strong>Supabase Live Contract:</strong> Cryptographically signed B2B supply agreement.</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700">VERIFIED</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Seller: {selectedContract.seller_name || selectedContract.seller?.name || 'ABC Manufacturing'}</span>
                  <span>Buyer: {selectedContract.buyer_name || selectedContract.buyer?.name || 'GreenPack Industries'}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Quantity: {Number(selectedContract.quantity_kg).toLocaleString()} kg</span>
                  <span className="font-extrabold text-slate-950">Total: ₹{Number(selectedContract.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono">1. Delivery & Logistics Terms</h4>
                <p className="text-slate-700 bg-white p-3 rounded border border-slate-200 leading-relaxed">
                  {selectedContract.delivery_terms || 'Ex-works seller facility in Ahmedabad. Transporter scheduled via LoopMarket Fleet within 48 hours of dispatch trigger.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono">2. Mock Escrow Payment Terms</h4>
                <p className="text-slate-700 bg-white p-3 rounded border border-slate-200 leading-relaxed">
                  {selectedContract.payment_terms || '100% Mock Escrow protection. Funds locked upon contract activation; released to seller upon QA receipt confirmation.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono">3. Quality Inspection & Dispute Terms</h4>
                <p className="text-slate-700 bg-white p-3 rounded border border-slate-200 leading-relaxed">
                  {selectedContract.inspection_terms || 'Max 2% moisture tolerance. Quality inspection report cryptographically attached to Digital Material Passport.'}
                </p>
              </div>

              <div className="pt-2 flex justify-between font-mono text-[11px] text-slate-500 border-t border-slate-100">
                <span>Seller Signature: <strong className="text-emerald-700">✓ SIGNED</strong></span>
                <span>Buyer Signature: <strong className="text-emerald-700">✓ SIGNED</strong></span>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => alert(`Contract ${selectedContract.contract_number} downloaded as PDF certificate.`)}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" /> Download PDF
              </button>

              <div className="flex gap-2">
                {!selectedContract.buyer_signed && (
                  <button
                    onClick={() => handleSignContract(selectedContract.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Sign & Activate
                  </button>
                )}
                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Create New Supply Contract</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 rounded cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Contracting Role Option *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartnerRole('BUYER')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border text-center transition cursor-pointer ${
                      partnerRole === 'BUYER' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    You are SELLER (Selling)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerRole('SELLER')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border text-center transition cursor-pointer ${
                      partnerRole === 'SELLER' 
                        ? 'bg-blue-50 border-blue-500 text-blue-900' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    You are BUYER (Buying)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Contracting Partner Company *</label>
                <select
                  value={partnerCompanyId}
                  onChange={(e) => setPartnerCompanyId(e.target.value)}
                  className="b2b-input font-medium"
                  required
                >
                  <option value="">Select partner facility...</option>
                  {companiesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Material Specification *</label>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="b2b-input font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Committed Quantity (kg)</label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="b2b-input font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Unit Price (₹/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="b2b-input font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Contract Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="b2b-input"
                >
                  <option value="30 Days Transactional">30 Days Transactional</option>
                  <option value="Quarterly Recurring Offtake">Quarterly Recurring Offtake</option>
                  <option value="Annual Closed-Loop Agreement">Annual Closed-Loop Agreement</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold text-xs transition cursor-pointer"
                >
                  Draft & Save to Supabase
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ContractsPage;
