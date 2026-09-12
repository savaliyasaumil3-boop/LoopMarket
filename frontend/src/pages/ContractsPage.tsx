import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, CheckCircle2, ShieldCheck, 
  Sparkles, ExternalLink, Download, ArrowRight, X
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const ContractsPage: React.FC = () => {
  const { company } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  // New Contract Form
  const [partnerCompanyId, setPartnerCompanyId] = useState('');
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
  }, [statusFilter]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await api.getContracts({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      setContracts(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContract({
        seller_id: company?.id || 'comp-demo-1',
        buyer_id: partnerCompanyId || companiesList[1]?.id,
        material_name: materialName,
        quantity_kg: quantityKg,
        unit_price: unitPrice,
        contract_duration: duration,
        ...(deliveryTerms && { delivery_terms: deliveryTerms }),
        ...(paymentTerms && { payment_terms: paymentTerms }),
        ...(inspectionTerms && { inspection_terms: inspectionTerms })
      });
      setShowAddModal(false);
      loadContracts();
    } catch (e: any) {
      alert(e.message || 'Error creating contract');
    }
  };

  const handleSignContract = async (contractId: string) => {
    try {
      await api.signContract(contractId);
      loadContracts();
      if (selectedContract) {
        setSelectedContract({ ...selectedContract, buyer_signed: true, status: 'ACTIVE' });
      }
    } catch (e: any) {
      alert(e.message || 'Failed to sign contract');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
      
      {/* Header - Handwritten Sketch Page 5 Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Legal & Governance</span>
            <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
              AI SMART CONTRACTS
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mt-1">Contract Panel & Supply Agreements</h1>
          <p className="text-slate-500 mt-0.5">
            Manage circular supply agreements, review automated legal clauses, and execute digital signatures.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Contract
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadContracts()}
            placeholder="Search by company name, contract #, or product..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 font-mono text-[11px] uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="b2b-input w-full sm:w-36 font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="DRAFT">AI Draft</option>
          </select>
        </div>
      </div>

      {/* Contract Cards / Table (Matching Handwritten Sketch Page 5) */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
            No contracts found.
          </div>
        ) : (
          contracts.map((c, idx) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-400 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{c.contract_number}</span>
                  <span className={`b2b-badge ${
                    c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                    c.status === 'COMPLETED' ? 'bg-slate-900 text-white border-slate-900' :
                    'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {c.status}
                  </span>
                  {c.is_ai_draft && (
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      AI Generated Clause
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900">{c.title}</h3>
                <div className="text-slate-600 space-y-0.5">
                  <p><strong>Company Partner:</strong> {c.buyer?.name} ({c.buyer?.city})</p>
                  <p><strong>Product / Material Information:</strong> {c.material_name} ({Number(c.quantity_kg).toLocaleString()} kg @ ₹{c.unit_price}/kg)</p>
                  <p><strong>Contract Duration:</strong> {c.contract_duration}</p>
                </div>
              </div>

              <div className="flex md:flex-col items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Contract Value</span>
                  <span className="text-base font-black text-slate-950 font-mono">₹{c.total_amount?.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => setSelectedContract(c)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Inspect Terms
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
              
              {/* Disclaimer */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg">
                <strong>Legal Notice:</strong> AI-generated draft clause — standard template for circular secondary packaging exchange.
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Seller: {selectedContract.seller?.name}</span>
                  <span>Buyer: {selectedContract.buyer?.name}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Quantity: {Number(selectedContract.quantity_kg).toLocaleString()} kg</span>
                  <span>Total: ₹{selectedContract.total_amount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">1. Delivery & Logistics Terms</h4>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200">{selectedContract.delivery_terms}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">2. Mock Escrow Payment Terms</h4>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200">{selectedContract.payment_terms}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">3. Quality Inspection & Dispute Resolution</h4>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200">{selectedContract.inspection_terms}</p>
              </div>

              <div className="pt-2 flex justify-between font-mono text-[11px] text-slate-500">
                <span>Seller Signed: {selectedContract.seller_signed ? '✓ YES' : 'PENDING'}</span>
                <span>Buyer Signed: {selectedContract.buyer_signed ? '✓ YES' : 'PENDING'}</span>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => alert(`Contract ${selectedContract.contract_number} downloaded as PDF.`)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded font-semibold text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>

              <div className="flex gap-2">
                {!selectedContract.buyer_signed && (
                  <button
                    onClick={() => handleSignContract(selectedContract.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Sign & Activate Contract
                  </button>
                )}
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

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Create New Supply Contract</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Contracting Partner Company *</label>
                <select
                  value={partnerCompanyId}
                  onChange={(e) => setPartnerCompanyId(e.target.value)}
                  className="b2b-input"
                  required
                >
                  <option value="">Select counterparty company...</option>
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
                  className="b2b-input"
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
                  <option value="Single Transaction / 30 Days">Single Transaction / 30 Days</option>
                  <option value="Quarterly Recurring Offtake">Quarterly Recurring Offtake</option>
                  <option value="Annual Closed-Loop Agreement">Annual Closed-Loop Agreement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Delivery & Logistics Terms</label>
                <textarea
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  placeholder="Leave blank for AI defaults..."
                  className="b2b-input h-14 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Terms</label>
                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Leave blank for AI defaults..."
                  className="b2b-input h-14 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quality Inspection Terms</label>
                <textarea
                  value={inspectionTerms}
                  onChange={(e) => setInspectionTerms(e.target.value)}
                  placeholder="Leave blank for AI defaults..."
                  className="b2b-input h-14 resize-none"
                />
              </div>

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
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold transition"
                >
                  Draft & Mint Contract
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
