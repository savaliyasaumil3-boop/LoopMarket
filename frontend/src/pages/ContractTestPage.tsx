import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, CheckCircle, ArrowRight } from 'lucide-react';

export const ContractTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [testComplete, setTestComplete] = useState(false);

  const testContractRedirect = () => {
    // Simulate contract approval
    const mockContractData = {
      contract_id: 'TEST-123',
      contract_number: 'CNT-2026-001',
      material_name: 'Corrugated Cardboard OCC 11',
      quantity_kg: 5000,
      pickup_city: 'Ahmedabad',
      pickup_address: 'Plot 123, GIDC Estate, Vatva',
      pickup_name: 'ABC Manufacturing',
      pickup_phone: '9876543210',
      pickup_state: 'Gujarat',
      pickup_pincode: '380026',
      delivery_city: 'Vadodara',
      delivery_address: 'Factory Road, Industrial Area',
      delivery_name: 'XYZ Industries',
      delivery_phone: '9876543211',
      delivery_state: 'Gujarat',
      delivery_pincode: '390001',
      customer_name: 'RELOOP Logistics',
      customer_phone: '9876543212'
    };

    console.log('📦 Storing contract data:', mockContractData);
    sessionStorage.setItem('contract_booking_data', JSON.stringify(mockContractData));

    setTestComplete(true);

    setTimeout(() => {
      console.log('🚀 Redirecting to Porter logistics...');
      navigate('/porter-logistics?from=contract&id=TEST-123');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-lg max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8 text-emerald-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contract Redirect Test</h1>
          <p className="text-sm text-slate-500 mt-2">
            Test the automatic redirect from contract approval to Porter logistics
          </p>
        </div>

        {!testComplete ? (
          <button
            onClick={testContractRedirect}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Test Contract Approval
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-emerald-900">Redirecting...</p>
              <p className="text-xs text-emerald-700 mt-1">Contract data stored in sessionStorage</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 text-left space-y-2">
          <p className="text-xs font-bold text-slate-700">What this test does:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>✅ Creates mock contract data</li>
            <li>✅ Stores in sessionStorage</li>
            <li>✅ Redirects to /porter-logistics</li>
            <li>✅ Auto-fills all form fields</li>
          </ul>
        </div>

        <button
          onClick={() => {
            const data = sessionStorage.getItem('contract_booking_data');
            console.log('📋 Current sessionStorage:', data);
            alert(data ? 'Data found: ' + data.substring(0, 100) + '...' : 'No data found');
          }}
          className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition"
        >
          Check SessionStorage
        </button>
      </div>
    </div>
  );
};
