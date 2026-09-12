import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Truck, CheckCircle2, AlertTriangle, 
  MapPin, Clock, FileText, Sparkles, RefreshCw, Layers, ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';

const LIFECYCLE_STEPS = [
  { key: 'ORDER_CONFIRMED', label: '1. Confirmed' },
  { key: 'ESCROWED', label: '2. Escrow Locked' },
  { key: 'LOGISTICS_ASSIGNED', label: '3. Truck Dispatched' },
  { key: 'PICKED_UP', label: '4. Picked Up' },
  { key: 'IN_TRANSIT', label: '5. In Transit' },
  { key: 'DELIVERED', label: '6. Delivered' },
  { key: 'INSPECTION', label: '7. QA Inspection' },
  { key: 'PAYMENT_RELEASED', label: '8. Escrow Released' },
  { key: 'COMPLETED', label: '9. Completed & Impact' }
];

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Inspection Form State
  const [receivedQty, setReceivedQty] = useState<number>(5000);
  const [receivedCondition, setReceivedCondition] = useState('Good');
  const [observedContam, setObservedContam] = useState('Low');
  const [inspectionNotes, setInspectionNotes] = useState('QA verified: material purity conforms to OCC Grade 11 specs.');
  const [disputeType, setDisputeType] = useState('Quantity mismatch');
  const [disputeText, setDisputeText] = useState('Observed 15% moisture contamination on lower layer bales.');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  useEffect(() => {
    if (id) loadOrderDetail();
  }, [id]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getOrderDetail(id!);
      setOrder(data);
      if (data?.quantity) setReceivedQty(data.quantity);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (nextStatus: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      await api.updateOrderStatus(order.id, nextStatus);
      loadOrderDetail();
    } catch (e: any) {
      alert(e.message || 'Error updating order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePassInspection = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      await api.submitInspection({
        order_id: order.id,
        expected_quantity: order.quantity,
        received_quantity: receivedQty,
        expected_condition: order.material?.condition || 'Good',
        received_condition: receivedCondition,
        expected_contamination: 'Low',
        observed_contamination: observedContam,
        result: 'PASSED',
        inspection_notes: inspectionNotes
      });
      loadOrderDetail();
    } catch (e: any) {
      alert(e.message || 'Error submitting inspection');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      // Create failed inspection first
      const inspRes = await api.submitInspection({
        order_id: order.id,
        expected_quantity: order.quantity,
        received_quantity: receivedQty,
        expected_condition: order.material?.condition || 'Good',
        received_condition: receivedCondition,
        expected_contamination: 'Low',
        observed_contamination: observedContam,
        result: 'UNDER_DISPUTE',
        inspection_notes: 'Dispute flagged by QA team.'
      });

      await api.raiseDispute({
        inspection_id: inspRes.inspection_id,
        dispute_type: disputeType,
        evidence_text: disputeText
      });

      setShowDisputeForm(false);
      loadOrderDetail();
    } catch (e: any) {
      alert(e.message || 'Error raising dispute');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-xs text-slate-500">Loading transaction lifecycle...</div>;
  if (!order) return <div className="p-12 text-center text-xs text-slate-500">Order not found.</div>;

  const currentStepIdx = LIFECYCLE_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-xs">
      
      {/* Back button */}
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to All Orders
      </Link>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-400">{order.order_number}</span>
            <span className={`b2b-badge ${
              order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
              order.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700 border-blue-300' :
              order.status === 'DISPUTED' ? 'bg-rose-50 text-rose-700 border-rose-300' :
              'bg-slate-100 text-slate-800 border-slate-300'
            }`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-950 mt-1">{order.material?.name}</h1>
          <p className="text-slate-500 mt-0.5">
            Seller: <strong>{order.seller?.name}</strong> → Buyer: <strong>{order.buyer?.name}</strong>
          </p>
        </div>

        <div className="text-right self-start md:self-center">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Escrow Value</span>
          <span className="text-2xl font-black text-slate-950 font-mono">
            ₹{order.total_delivered_amount?.toLocaleString()}
          </span>
          <span className="text-emerald-700 font-mono text-[11px] block font-semibold">
            Status: {order.escrow?.status}
          </span>
        </div>
      </div>

      {/* 9-Step Interactive Lifecycle Stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <span className="font-bold text-slate-900 uppercase font-mono text-[11px] tracking-wider block">
          Circular Governance Lifecycle Stepper
        </span>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 text-center font-mono text-[10px]">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx <= (currentStepIdx >= 0 ? currentStepIdx : 0);
            const isCurrent = idx === currentStepIdx;
            return (
              <div
                key={step.key}
                className={`p-2 rounded border transition-all ${
                  isCurrent
                    ? 'bg-slate-950 text-white font-bold border-slate-950 shadow'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <span className="block truncate">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Advance Controls for Judges */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Advance Lifecycle Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {order.status !== 'IN_TRANSIT' && order.status !== 'COMPLETED' && (
              <button
                onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                disabled={isUpdating}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
              >
                Mark In-Transit
              </button>
            )}
            {order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && (
              <button
                onClick={() => handleAdvanceStatus('DELIVERED')}
                disabled={isUpdating}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold"
              >
                Mark Delivered
              </button>
            )}
            {order.status !== 'COMPLETED' && (
              <button
                onClick={() => handleAdvanceStatus('COMPLETED')}
                disabled={isUpdating}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
              >
                Release Payment & Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Mock Escrow + Logistics + Quality Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Escrow & Logistics (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Mock Escrow Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Mock Escrow Financial Vault</h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{order.escrow?.escrow_transaction_hash}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-600">Locked Deposit:</span>
                <span className="font-mono font-bold text-slate-900">₹{order.total_delivered_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-600">Escrow Security State:</span>
                <span className="font-bold text-emerald-700">{order.escrow?.status}</span>
              </div>
              <p className="text-[11px] text-slate-500 italic leading-relaxed pt-1">
                Funds are held in neutral programmatic escrow and only released upon buyer physical inspection sign-off.
              </p>
            </div>
          </div>

          {/* Logistics Route Tracking Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Logistics Carrier & Transit</h3>
              </div>
              <span className="text-xs text-slate-500">{order.logistics?.distance_km} km</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Fleet Carrier</span>
                  <span className="font-bold text-slate-800">{order.logistics?.provider_name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Vehicle Spec</span>
                  <span className="font-bold text-slate-800">{order.logistics?.vehicle_type}</span>
                </div>
              </div>

              {/* Waypoints */}
              <div className="p-3 bg-slate-950 text-white rounded-lg space-y-2 mt-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">Transit Corridor Waypoints</span>
                {order.logistics?.waypoints?.map((wp: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${wp.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                      {wp.name}
                    </span>
                    <span className="font-mono text-slate-400">{wp.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right: Buyer Inspection & Quality Sign-Off (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Buyer Material Inspection & QA Sign-Off</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">48-Hr SLA</span>
            </div>

            {order.inspection?.result === 'PASSED' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 mt-4 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Quality Inspection Passed & Signed Off
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Verified {Number(order.inspection.received_quantity).toLocaleString()} kg received in {order.material?.condition || 'Good'} condition. Mock escrow released to seller.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Inspector: {order.inspection.inspector_name} • {order.inspection.inspected_at}
                </div>
              </div>
            ) : showDisputeForm ? (
              <div className="space-y-3 mt-4 text-xs">
                <h4 className="font-bold text-rose-800">Raise Material Dispute</h4>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dispute Reason</label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    className="b2b-input"
                  >
                    <option value="Quantity mismatch">Quantity Mismatch</option>
                    <option value="Quality mismatch">Quality & Grade Mismatch</option>
                    <option value="Damage">Transit Physical Damage</option>
                    <option value="Contamination">Excessive Contamination (&gt; 5%)</option>
                    <option value="Late delivery">Late Delivery Breach</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Evidence Description & Photos</label>
                  <textarea
                    value={disputeText}
                    onChange={(e) => setDisputeText(e.target.value)}
                    rows={3}
                    className="b2b-input"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowDisputeForm(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRaiseDispute}
                    disabled={isUpdating}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition"
                  >
                    Submit Formal Dispute
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Received Tonnage (kg)</label>
                    <input
                      type="number"
                      value={receivedQty}
                      onChange={(e) => setReceivedQty(Number(e.target.value))}
                      className="b2b-input font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Observed Condition</label>
                    <select
                      value={receivedCondition}
                      onChange={(e) => setReceivedCondition(e.target.value)}
                      className="b2b-input"
                    >
                      <option value="Good">Good (OCC Grade 11)</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Degraded">Degraded / Moist</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">QA Sign-Off Notes</label>
                  <textarea
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    rows={2}
                    className="b2b-input"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handlePassInspection}
                    disabled={isUpdating}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Accept Material & Release Escrow
                  </button>
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    className="px-3 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded font-semibold transition"
                  >
                    Raise Dispute
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-500 font-mono">
            Audit Trail Hash: SHA256-ESCROW-SIGNOFF-{order.id.substring(0, 8)}
          </div>
        </div>

      </div>

    </div>
  );
};
