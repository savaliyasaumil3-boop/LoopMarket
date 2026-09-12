import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Search, CheckCircle2, ShieldCheck,
  Sparkles, ExternalLink, Download, ArrowRight, X, Truck, Package, Loader,
  Clock, Calendar, ShoppingBag, Tag, Building2, Database, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { addContract, fetchContracts } from '../lib/supabaseData';
import { VehicleSelection } from '../components/VehicleSelection';
import { GoogleMapsView } from '../components/GoogleMapsView';

const DEFAULT_CONTRACTS: any[] = [];

const DEFAULT_COMPANIES = [
  { id: 'comp-demo-1', name: 'ABC Manufacturing Pvt Ltd', city: 'Ahmedabad' },
  { id: 'comp-demo-2', name: 'GreenPack Industries Ltd', city: 'Vadodara' },
  { id: 'comp-demo-3', name: 'Gujarat Circular Polymers & Pulp', city: 'Surat' },
  { id: 'comp-demo-4', name: 'Surat Warehousing & Logistics Hub', city: 'Surat' },
  { id: 'comp-demo-5', name: 'Reliance Circular Polymer Works', city: 'Jamnagar' },
  { id: 'comp-demo-6', name: 'Tata Chemicals Eco-Resource Facility', city: 'Mithapur' },
  { id: 'comp-demo-7', name: 'Adani Clean Energy & Packaging Hub', city: 'Mundra' },
  { id: 'comp-demo-8', name: 'Ahmedabad Eco-Metal Recovery Ltd', city: 'Ahmedabad' }
];

export const ContractsPage: React.FC = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // BUY vs SELL Role Filter State: 'ALL' | 'SELLER' | 'BUYER'
  const [roleTab, setRoleTab] = useState<'ALL' | 'SELLER' | 'BUYER'>('ALL');

  // Modals & Logistics States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [showVehicleBooking, setShowVehicleBooking] = useState(false);
  const [contractToBook, setContractToBook] = useState<any | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // New Contract Form State
  const [myRole, setMyRole] = useState<'SELLER' | 'BUYER'>('SELLER');
  const [partnerCompanyId, setPartnerCompanyId] = useState('');
  const [customPartnerName, setCustomPartnerName] = useState('');
  const [companiesList, setCompaniesList] = useState<any[]>(DEFAULT_COMPANIES);
  const [materialName, setMaterialName] = useState('Corrugated Cardboard OCC 11');
  const [quantityKg, setQuantityKg] = useState<number>(5000);
  const [unitPrice, setUnitPrice] = useState<number>(14.5);
  const [duration, setDuration] = useState('30 Days Transactional');
  const [deliveryTerms, setDeliveryTerms] = useState('Delivered via LoopMarket Logistics within 48 hours of dispatch trigger.');
  const [paymentTerms, setPaymentTerms] = useState('100% Mock Escrow protection locked upon activation.');
  const [inspectionTerms, setInspectionTerms] = useState('Purity and weight verification with digital passport attached.');

  useEffect(() => {
    loadContracts();
    api.getCompanies()
      .then(res => {
        if (res && Array.isArray(res) && res.length > 0) {
          setCompaniesList(res);
        } else {
          setCompaniesList(DEFAULT_COMPANIES);
        }
      })
      .catch(() => setCompaniesList(DEFAULT_COMPANIES));
  }, [statusFilter, roleTab]);

  const loadContracts = async () => {
    setLoading(true);

    // 1. Read locally added contracts from localStorage
    let userContracts: any[] = [];
    try {
      userContracts = JSON.parse(localStorage.getItem('loopmarket_user_contracts') || '[]');
    } catch {
      userContracts = [];
    }

    // 2. Fetch from Supabase
    let sbItems: any[] = [];
    try {
      const sbData = await fetchContracts();
      if (sbData && Array.isArray(sbData)) {
        sbItems = sbData.map(c => ({
          ...c,
          is_supabase: true,
          total_amount: c.total_amount || (Number(c.quantity_kg || 1000) * Number(c.unit_price || 15))
        }));
      }
    } catch (e) {
      console.warn('Supabase contract load notice:', e);
    }

    // 3. Fetch from Backend API
    let apiItems: any[] = [];
    try {
      const apiData = await api.getContracts({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      if (apiData && Array.isArray(apiData)) {
        apiItems = apiData;
      }
    } catch (e) {
      console.warn('Backend API contract load notice:', e);
    }

    // Combine all sources
    const map = new Map<string, any>();

    // Add items (User contracts take priority)
    apiItems.forEach(c => map.set(String(c.id), c));
    sbItems.forEach(c => map.set(String(c.id), { ...map.get(String(c.id)), ...c, is_supabase: true }));
    userContracts.forEach(c => map.set(String(c.id), c));

    let combined = Array.from(map.values());

    // Filter by BUY vs SELL Role Tab
    if (roleTab === 'SELLER') {
      combined = combined.filter(c => c.role === 'SELLER' || c.seller_id === company?.id || !c.buyer_id);
    } else if (roleTab === 'BUYER') {
      combined = combined.filter(c => c.role === 'BUYER' || c.buyer_id === company?.id);
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

    const partnerComp = companiesList.find(c => String(c.id) === String(partnerCompanyId));
    const partnerName = partnerComp ? partnerComp.name : (customPartnerName || 'Partner Industrial Corp');
    const partnerCity = partnerComp ? partnerComp.city : 'Ahmedabad';

    const calculatedTotal = Number(quantityKg) * Number(unitPrice);
    const contractNum = `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newContract: any = {
      id: `ctr_${Date.now()}`,
      contract_number: contractNum,
      title: `${materialName} Supply Agreement`,
      role: myRole,
      seller_id: myRole === 'SELLER' ? (company?.id || 'comp-demo-1') : (partnerComp?.id || 'comp-partner'),
      seller_name: myRole === 'SELLER' ? (company?.name || 'ABC Manufacturing Pvt Ltd') : partnerName,
      buyer_id: myRole === 'BUYER' ? (company?.id || 'comp-demo-1') : (partnerComp?.id || 'comp-partner'),
      buyer_name: myRole === 'BUYER' ? (company?.name || 'ABC Manufacturing Pvt Ltd') : partnerName,
      buyer_city: partnerCity,
      material_name: materialName,
      quantity_kg: Number(quantityKg),
      unit_price: Number(unitPrice),
      total_amount: calculatedTotal,
      contract_duration: duration,
      status: 'ACTIVE',
      seller_signed: true,
      buyer_signed: true,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      inspection_terms: inspectionTerms,
      created_at: new Date().toISOString()
    };

    // 1. Store in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('loopmarket_user_contracts') || '[]');
      localStorage.setItem('loopmarket_user_contracts', JSON.stringify([newContract, ...existing]));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // 2. Insert into Supabase DB
    try {
      await addContract(newContract);
    } catch (sbErr) {
      console.warn('Supabase contract insert notice:', sbErr);
    }

    // 3. Insert into Backend API
    try {
      await api.createContract({
        seller_id: newContract.seller_id,
        buyer_id: newContract.buyer_id,
        material_name: materialName,
        quantity_kg: quantityKg,
        unit_price: unitPrice,
        contract_duration: duration
      });
    } catch (apiErr) {
      console.warn('Backend API contract insert notice:', apiErr);
    }

    // Update UI immediately
    setContracts(prev => [newContract, ...prev]);
    setShowAddModal(false);

    // Reset Form
    setPartnerCompanyId('');
    setCustomPartnerName('');
    alert(`✅ Contract ${contractNum} created and added to active contracts!`);
  };

  const handleSignContract = async (contractId: string) => {
    try {
      await api.signContract(contractId).catch(() => null);

      const updatedContract = { ...selectedContract, buyer_signed: true, status: 'ACTIVE' };
      setSelectedContract(null);
      setRedirecting(true);

      // Prepare contract data for Porter page
      const contractData = {
        contract_id: updatedContract.id,
        contract_number: updatedContract.contract_number,
        material_name: updatedContract.material_name,
        quantity_kg: updatedContract.quantity_kg,
        pickup_city: updatedContract.seller_name ? 'Ahmedabad' : 'Vadodara',
        pickup_address: 'Industrial Park Facility',
        pickup_name: updatedContract.seller_name || 'Seller Enterprise',
        pickup_phone: '9876543210',
        delivery_city: updatedContract.buyer_city || 'Surat',
        delivery_address: 'Manufacturing Hub',
        delivery_name: updatedContract.buyer_name || 'Buyer Enterprise',
        delivery_phone: '9876543211',
        customer_name: company?.name || 'LoopMarket Fleet User'
      };

      sessionStorage.setItem('contract_booking_data', JSON.stringify(contractData));

      setTimeout(() => {
        navigate('/porter-logistics?from=contract&id=' + updatedContract.id);
      }, 1500);

    } catch (e: any) {
      alert(e.message || 'Failed to sign contract');
      setRedirecting(false);
    }
  };

  const handleVehicleSelected = (vehicle: any) => {
    alert(`✅ Vehicle booked: ${vehicle.name}. Logistics team dispatched.`);
    setShowVehicleBooking(false);
    setContractToBook(null);
  };

  const activeContractsCount = contracts.filter(c => c.status === 'ACTIVE').length;
  const activeContractsValue = contracts
    .filter(c => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Active Now';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Active Now';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Legal & Governance</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> B2B SMART CONTRACTS
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Contracts & Supply Agreements</h1>
          <p className="text-slate-500 mt-0.5">
            Manage circular supply agreements, toggle between Buy & Sell options, inspect live duration timers, and execute digital signatures.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4 text-emerald-400" /> Add New Contract
        </button>
      </div>

      {/* Active Contracts Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-950 text-white rounded-xl p-4 flex items-center justify-between border border-emerald-800 shadow-sm">
          <div>
            <span className="text-[11px] font-mono text-emerald-300 uppercase block font-semibold">Active Supply Contracts</span>
            <span className="text-2xl font-black text-white">{activeContractsCount} Live Contracts</span>
          </div>
          <div className="w-10 h-10 bg-emerald-900/80 rounded-lg flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase block font-semibold">Committed Active Volume</span>
            <span className="text-2xl font-black text-slate-950 font-mono">₹{activeContractsValue.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase block font-semibold">Contract Security & Escrow</span>
            <span className="text-sm font-bold text-emerald-700 block mt-0.5">100% Mock Escrow Protected</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls: BUY vs SELL Tabs, Search, & Status Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        
        {/* BUY / SELL Perspective Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoleTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                roleTab === 'ALL'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> All Contracts ({contracts.length})
            </button>

            <button
              onClick={() => setRoleTab('SELLER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                roleTab === 'SELLER'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5" /> Sell Option (Supplier)
            </button>

            <button
              onClick={() => setRoleTab('BUYER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                roleTab === 'BUYER'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Buy Option (Offtaker)
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Showing {contracts.length} agreements
          </span>
        </div>

        {/* Search Input & Status Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by contract #, material name, or company partner..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-500 font-mono text-[11px] uppercase">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="b2b-input w-full sm:w-40 font-semibold text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">AI Draft</option>
            </select>
          </div>
        </div>

      </div>

      {/* ACTIVE CONTRACTS LISTING AREA (Empty Space Fixed) */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading active supply contracts...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No contracts found in this view</h3>
            <p className="text-slate-500 text-xs">
              Click the <strong className="text-slate-900 font-semibold">"Add New Contract"</strong> button above to create a new Buy or Sell agreement.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-950 text-white rounded font-bold text-xs inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" /> Create Contract Now
            </button>
          </div>
        ) : (
          contracts.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 shadow-sm transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">

                {/* Top Badges: Contract #, Status, BUY/SELL Tag, & Creation Time */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-slate-950 text-sm">{c.contract_number}</span>
                  
                  <span className={`b2b-badge ${
                    c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' :
                    c.status === 'COMPLETED' ? 'bg-slate-900 text-white border-slate-900 font-bold' :
                    'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {c.status === 'ACTIVE' ? '🟢 ACTIVE' : c.status}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                    c.role === 'BUYER' || c.buyer_id === company?.id
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {c.role === 'BUYER' || c.buyer_id === company?.id ? '🛒 BUY CONTRACT' : '🏷️ SELL CONTRACT'}
                  </span>

                  {/* Active Time & Duration Badge */}
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" /> Created: {formatDate(c.created_at)}
                  </span>
                </div>

                {/* Title & Material Specs */}
                <div>
                  <h3 className="font-bold text-sm text-slate-950">{c.title}</h3>
                  <div className="text-slate-600 space-y-1 mt-1 text-xs">
                    <p className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong>Counterparty Partner:</strong> {c.buyer_name || c.buyer?.name} ({c.buyer_city || c.buyer?.city || 'Gujarat'})
                    </p>
                    <p className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong>Material Specs:</strong> {c.material_name} ({Number(c.quantity_kg).toLocaleString()} kg @ ₹{c.unit_price}/kg)
                    </p>
                    <p className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <strong>Active Duration:</strong> {c.contract_duration || '30 Days Transactional'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Price Value & Action Buttons */}
              <div className="flex lg:flex-col items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Agreed Contract Value</span>
                  <span className="text-lg font-black text-slate-950 font-mono">₹{Number(c.total_amount || (c.quantity_kg * c.unit_price)).toLocaleString()}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedContract(c)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> Inspect Terms
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Contract Modal (Buy vs Sell Support) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase">New Supply Agreement</span>
                <h3 className="text-base font-bold text-white mt-0.5">Create & Mint Contract</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 text-xs">

              {/* BUY vs SELL Option Radio Cards */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Your Perspective / Role *</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setMyRole('SELLER')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 transition ${
                      myRole === 'SELLER'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold">I am SELLING (Supplier)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Offloading surplus material</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMyRole('BUYER')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 transition ${
                      myRole === 'BUYER'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold">I am BUYING (Offtaker)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Procuring material stock</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contracting Partner Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Contracting Counterparty Company *</label>
                <select
                  value={partnerCompanyId}
                  onChange={(e) => setPartnerCompanyId(e.target.value)}
                  className="b2b-input font-medium"
                  required
                >
                  <option value="">-- Select counterparty company ({companiesList.length} available) --</option>
                  {companiesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>

              {/* Material Specs */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Material Specification *</label>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="e.g. Baled OCC Cardboard Grade 11"
                  className="b2b-input font-medium"
                  required
                />
              </div>

              {/* Quantity & Unit Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Committed Quantity (kg)</label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="b2b-input font-mono font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Unit Price (₹/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="b2b-input font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Calculated Total Banner */}
              <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between font-mono">
                <span className="text-[11px] text-slate-300">Total Contract Value:</span>
                <span className="text-base font-black text-emerald-400">
                  ₹{(Number(quantityKg || 0) * Number(unitPrice || 0)).toLocaleString()}
                </span>
              </div>

              {/* Duration Select */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Active Contract Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="b2b-input font-medium"
                >
                  <option value="30 Days Transactional">30 Days Single Transactional</option>
                  <option value="Quarterly Recurring Offtake (90 Days)">Quarterly Recurring Offtake (90 Days)</option>
                  <option value="Annual Closed-Loop Agreement (365 Days)">Annual Closed-Loop Agreement (365 Days)</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-emerald-400" /> Create & Add Contract
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Contract Detail & Signature Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400">{selectedContract.contract_number}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedContract.title}</h3>
              </div>
              <button onClick={() => setSelectedContract(null)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">

              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center justify-between">
                <div>
                  <strong>Active Governance Status:</strong> {selectedContract.status}
                  <span className="block text-[10px] text-emerald-700 mt-0.5">Created on {formatDate(selectedContract.created_at)}</span>
                </div>
                <span className="font-mono text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded border border-emerald-300">
                  {selectedContract.contract_duration || '30 Days Active'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Seller: {selectedContract.seller_name || selectedContract.seller?.name || 'ABC Manufacturing'}</span>
                  <span>Buyer: {selectedContract.buyer_name || selectedContract.buyer?.name || 'GreenPack Ltd'}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Quantity: {Number(selectedContract.quantity_kg).toLocaleString()} kg</span>
                  <span>Total Amount: ₹{Number(selectedContract.total_amount || (selectedContract.quantity_kg * selectedContract.unit_price)).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">1. Delivery & Freight Terms</h4>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200">{selectedContract.delivery_terms || 'Standard ex-works dispatch via LoopMarket Fleet.'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">2. Mock Escrow Payment Terms</h4>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200">{selectedContract.payment_terms || '100% Mock escrow protection.'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">3. Quality Inspection & Passport Verification</h4>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200">{selectedContract.inspection_terms || 'Purity verification with digital passport.'}</p>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => alert(`Contract ${selectedContract.contract_number} exported as PDF.`)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded font-semibold text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSignContract(selectedContract.id)}
                  disabled={redirecting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {redirecting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Redirecting to Logistics...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Sign & Book Vehicle
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Vehicle Booking Modal */}
      {showVehicleBooking && contractToBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-600 text-white p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">Contract Approved Successfully!</h3>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    {contractToBook.contract_number} • Book your vehicle
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <VehicleSelection
                pickupCity="Ahmedabad"
                deliveryCity="Vadodara"
                distance_km={82}
                weight_kg={contractToBook.quantity_kg}
                onSelectVehicle={handleVehicleSelected}
              />
            </div>
          </div>
        </div>
      )}

      {/* Redirect Success Modal */}
      {redirecting && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-emerald-300 rounded-xl p-8 shadow-2xl text-center space-y-4 max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Contract Approved!</h3>
            <p className="text-slate-600">Redirecting to Porter logistics for vehicle booking...</p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Preparing your booking details</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
