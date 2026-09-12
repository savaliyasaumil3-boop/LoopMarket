import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, Truck, CheckCircle2, AlertTriangle,
  MapPin, Clock, FileText, Sparkles, RefreshCw, Layers, ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import { updateSupabaseOrder } from '../lib/supabaseData';

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
    let foundOrder: any = null;

    try {
      foundOrder = await api.getOrderDetail(id!);
    } catch {
      foundOrder = null;
    }

    if (!foundOrder) {
      try {
        const stored = JSON.parse(localStorage.getItem('loopmarket_user_orders') || '[]');
        foundOrder = stored.find((o: any) => String(o.id) === String(id) || String(o.order_id) === String(id));
      } catch {
        // ignore
      }
    }

    if (foundOrder) {
      const totalAmount = Number(
        foundOrder.total_delivered_amount ||
        foundOrder.total_amount ||
        (Number(foundOrder.quantity || foundOrder.quantity_kg || 5000) * Number(foundOrder.unit_price || 15) + Number(foundOrder.logistics_cost || 4200)) ||
        76700
      );

      const normalizedOrder = {
        ...foundOrder,
        id: foundOrder.id || foundOrder.order_id || id,
        order_number: foundOrder.order_number || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: foundOrder.status || 'ORDER_CONFIRMED',
        total_delivered_amount: totalAmount,
        total_amount: totalAmount,
        quantity: Number(foundOrder.quantity || foundOrder.quantity_kg || 5000),
        unit_price: Number(foundOrder.unit_price || 15.0),
        logistics_cost: Number(foundOrder.logistics_cost || 4200),
        material: foundOrder.material || {
          name: foundOrder.material_name || 'Circular Material Lot',
          code: foundOrder.material_code || 'MAT-101',
          category: foundOrder.material_category || 'Cardboard',
          condition: foundOrder.condition || 'Clean Baled'
        },
        seller: foundOrder.seller || {
          name: foundOrder.seller_name || 'ABC Manufacturing Pvt Ltd',
          city: foundOrder.seller_city || 'Ahmedabad'
        },
        buyer: foundOrder.buyer || {
          name: foundOrder.buyer_name || 'GreenPack Industries Ltd',
          city: foundOrder.buyer_city || 'Vadodara'
        },
        escrow: foundOrder.escrow || {
          escrow_transaction_hash: `SIM-ESCROW-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
          status: foundOrder.status === 'COMPLETED' ? 'RELEASED' : 'FUNDS_LOCKED_IN_ESCROW'
        },
        logistics: foundOrder.logistics || {
          provider_name: 'Gujarat Eco-Logistics Fleet',
          vehicle_type: '16T Covered EV Truck',
          distance_km: 85,
          waypoints: [
            { name: 'Seller Dispatch Facility', status: 'COMPLETED' },
            { name: 'Regional Weighbridge Hub', status: 'COMPLETED' },
            { name: 'Buyer Processing Yard', status: foundOrder.status === 'DELIVERED' || foundOrder.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS' }
          ]
        }
      };

      setOrder(normalizedOrder);
      if (normalizedOrder.quantity) setReceivedQty(normalizedOrder.quantity);
    }

    setLoading(false);
  };

  const updateOrderState = async (nextStatus: string, escrowStatus?: string) => {
    if (!order) return;
    setIsUpdating(true);

    const updated = {
      ...order,
      status: nextStatus,
      escrow: {
        ...order.escrow,
        status: escrowStatus || (nextStatus === 'COMPLETED' || nextStatus === 'PAYMENT_RELEASED' ? 'RELEASED' : order.escrow?.status || 'ESCROWED')
      }
    };
    setOrder(updated);

    // 1. Update localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('loopmarket_user_orders') || '[]');
      const idx = stored.findIndex((o: any) => String(o.id) === String(order.id) || String(o.order_id) === String(order.id));
      if (idx !== -1) {
        stored[idx].status = nextStatus;
        if (escrowStatus) stored[idx].escrow_status = escrowStatus;
        localStorage.setItem('loopmarket_user_orders', JSON.stringify(stored));
      }
    } catch {
      // ignore
    }

    // 2. Update Supabase
    try {
      await updateSupabaseOrder(order.id, { status: nextStatus }).catch(() => null);
    } catch {
      // ignore
    }

    // 3. Update Backend API
    try {
      await api.updateOrderStatus(order.id, nextStatus).catch(() => null);
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdvanceStatus = async (nextStatus: string) => {
    await updateOrderState(nextStatus);
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
      }).catch(() => null);
    } catch {
      // ignore
    }

    await updateOrderState('COMPLETED', 'RELEASED');
  };

  const handleRaiseDispute = async () => {
    if (!order) return;
    setIsUpdating(true);

    try {
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
      }).catch(() => ({ inspection_id: 'insp_101' }));

      await api.raiseDispute({
        inspection_id: inspRes.inspection_id,
        dispute_type: disputeType,
        evidence_text: disputeText
      }).catch(() => null);
    } catch {
      // ignore
    }

    setShowDisputeForm(false);
    await updateOrderState('DISPUTED', 'HELD_IN_DISPUTE');
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
            <span className={`b2b-badge ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
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
            ₹{Number(order.total_delivered_amount || order.total_amount || 0).toLocaleString()}
          </span>
          <span className="text-emerald-700 font-mono text-[11px] block font-semibold">
            Status: {order.escrow?.status}
          </span>
        </div>
      </div>

      {/* 9-Step Interactive Governance Stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-slate-950 uppercase font-mono text-[11px] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Order Progress & Timeline
          </span>
          <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Step {Math.max(1, currentStepIdx + 1)} of 9
          </span>
        </div>

        {/* Timeline track nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < (currentStepIdx >= 0 ? currentStepIdx : 0);
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={step.key}
                className={`relative flex flex-col items-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  isCurrent
                    ? 'bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-emerald-500 ring-offset-1'
                    : isCompleted
                    ? 'bg-emerald-50/90 text-emerald-900 border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono mb-1.5 ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : idx + 1}
                </div>

                <span className="text-[10px] font-bold leading-tight truncate w-full">
                  {step.label.replace(/^\d+\.\s*/, '')}
                </span>

                {isCurrent && (
                  <span className="mt-1 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-tighter">
                    Active Step
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Advance Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 font-mono text-[11px] font-semibold">Update Order Status:</span>
          <div className="flex flex-wrap gap-2">
            {order.status !== 'IN_TRANSIT' && order.status !== 'COMPLETED' && (
              <button
                onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                disabled={isUpdating}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Mark In-Transit
              </button>
            )}
            {order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && (
              <button
                onClick={() => handleAdvanceStatus('DELIVERED')}
                disabled={isUpdating}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Mark Delivered
              </button>
            )}
            {order.status !== 'COMPLETED' && (
              <button
                onClick={() => handleAdvanceStatus('COMPLETED')}
                disabled={isUpdating}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
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
                <span className="font-mono font-bold text-slate-900">₹{Number(order.total_delivered_amount || order.total_amount || 0).toLocaleString()}</span>
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
