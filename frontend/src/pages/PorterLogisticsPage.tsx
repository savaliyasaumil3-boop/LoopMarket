import React, { useState, useEffect } from 'react';
import {
  Truck, MapPin, Package, Phone, Star, Navigation, Clock,
  CheckCircle, AlertCircle, Loader, ArrowRight, User, MapPinned
} from 'lucide-react';
import { porterAPI, type PorterAddress } from '../lib/porterAPI';
import { GoogleMapsView } from '../components/GoogleMapsView';

interface VehicleQuote {
  vehicle_type: string;
  fare_details: {
    minor_amount: number;
    currency: string;
  };
  distance_in_kms: number;
  eta_in_mins: number;
}

export const PorterLogisticsPage: React.FC = () => {
  // Step 1: Address Form State
  const [step, setStep] = useState<'address' | 'quote' | 'booking' | 'tracking'>('address');

  // Check for contract booking data
  useEffect(() => {
    const contractData = sessionStorage.getItem('contract_booking_data');
    if (contractData) {
      try {
        const data = JSON.parse(contractData);
        // Pre-fill form with contract data
        setPickupName(data.pickup_name);
        setPickupPhone(data.pickup_phone);
        setPickupAddress(data.pickup_address);
        setPickupCity(data.pickup_city);
        setDropName(data.delivery_name);
        setDropPhone(data.delivery_phone);
        setDropAddress(data.delivery_address);
        setDropCity(data.delivery_city);
        setCustomerName(data.customer_name);

        // Clear the session storage
        sessionStorage.removeItem('contract_booking_data');

        // Show success notification
        setContractInfo({
          contract_number: data.contract_number,
          material_name: data.material_name,
          quantity_kg: data.quantity_kg
        });
      } catch (err) {
        console.error('Failed to parse contract data:', err);
      }
    }
  }, []);

  // Pickup Details
  const [pickupName, setPickupName] = useState('Warehouse Manager');
  const [pickupPhone, setPickupPhone] = useState('9876543210');
  const [pickupAddress, setPickupAddress] = useState('Plot 123, GIDC Estate');
  const [pickupCity, setPickupCity] = useState('Ahmedabad');
  const [pickupState, setPickupState] = useState('Gujarat');
  const [pickupPincode, setPickupPincode] = useState('380026');
  const [pickupLat, setPickupLat] = useState(23.0225);
  const [pickupLng, setPickupLng] = useState(72.5714);

  // Drop Details
  const [dropName, setDropName] = useState('Receiving Manager');
  const [dropPhone, setDropPhone] = useState('9876543211');
  const [dropAddress, setDropAddress] = useState('Factory Road, Industrial Area');
  const [dropCity, setDropCity] = useState('Vadodara');
  const [dropState, setDropState] = useState('Gujarat');
  const [dropPincode, setDropPincode] = useState('390001');
  const [dropLat, setDropLat] = useState(22.3072);
  const [dropLng, setDropLng] = useState(73.1812);

  // Customer Details
  const [customerName, setCustomerName] = useState('RELOOP Logistics');
  const [customerPhone, setCustomerPhone] = useState('9876543212');

  // Step 2: Quote Results
  const [quotes, setQuotes] = useState<VehicleQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<VehicleQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 3: Booking
  const [orderId, setOrderId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string>('');

  // Step 4: Tracking
  const [trackingData, setTrackingData] = useState<any>(null);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [contractInfo, setContractInfo] = useState<any>(null);

  // City Coordinates for Map
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Pune': { lat: 18.5204, lng: 73.8567 }
  };

  // Update coordinates when city changes
  useEffect(() => {
    if (cityCoordinates[pickupCity]) {
      setPickupLat(cityCoordinates[pickupCity].lat);
      setPickupLng(cityCoordinates[pickupCity].lng);
    }
  }, [pickupCity]);

  useEffect(() => {
    if (cityCoordinates[dropCity]) {
      setDropLat(cityCoordinates[dropCity].lat);
      setDropLng(cityCoordinates[dropCity].lng);
    }
  }, [dropCity]);

  // STEP 1: Get Quote from Porter
  const handleGetQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const pickupDetails: PorterAddress = {
        street_address1: pickupAddress,
        city: pickupCity,
        state: pickupState,
        pincode: pickupPincode,
        country: 'India',
        lat: pickupLat,
        lng: pickupLng,
        contact_details: {
          name: pickupName,
          phone_number: pickupPhone
        }
      };

      const dropDetails: PorterAddress = {
        street_address1: dropAddress,
        city: dropCity,
        state: dropState,
        pincode: dropPincode,
        country: 'India',
        lat: dropLat,
        lng: dropLng,
        contact_details: {
          name: dropName,
          phone_number: dropPhone
        }
      };

      const quoteResponse = await porterAPI.getQuote({
        pickup_details: pickupDetails,
        drop_details: dropDetails,
        customer: {
          name: customerName,
          mobile: {
            country_code: '+91',
            number: customerPhone
          }
        }
      });

      console.log('Porter Quote Response:', quoteResponse);

      if (quoteResponse.vehicles && quoteResponse.vehicles.length > 0) {
        setQuotes(quoteResponse.vehicles);
        setStep('quote');
      } else {
        setError('No vehicles available for this route. Please try different cities.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get quote. Please check your API key and try again.');
      console.error('Quote Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Create Order with Porter
  const handleBookVehicle = async () => {
    if (!selectedQuote) return;

    setLoading(true);
    setError(null);

    try {
      const newRequestId = porterAPI.generateRequestId();
      setRequestId(newRequestId);

      const orderData = {
        request_id: newRequestId,
        pickup_details: {
          street_address1: pickupAddress,
          city: pickupCity,
          state: pickupState,
          pincode: pickupPincode,
          country: 'India',
          lat: pickupLat,
          lng: pickupLng,
          contact_details: {
            name: pickupName,
            phone_number: pickupPhone
          }
        },
        drop_details: {
          street_address1: dropAddress,
          city: dropCity,
          state: dropState,
          pincode: dropPincode,
          country: 'India',
          lat: dropLat,
          lng: dropLng,
          contact_details: {
            name: dropName,
            phone_number: dropPhone
          }
        },
        customer: {
          name: customerName,
          mobile: {
            country_code: '+91',
            number: customerPhone
          }
        },
        delivery_instructions: {
          instructions_list: [
            'Handle with care - Circular packaging materials',
            'Contact before delivery',
            'Verify quantity at delivery'
          ]
        }
      };

      const orderResponse = await porterAPI.createOrder(orderData);
      console.log('Porter Order Response:', orderResponse);

      if (orderResponse.order_id) {
        setOrderId(orderResponse.order_id);
        setStep('booking');

        // Start tracking after 2 seconds
        setTimeout(() => {
          setStep('tracking');
          startTracking(orderResponse.order_id);
        }, 2000);
      } else {
        setError('Failed to create order. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book vehicle.');
      console.error('Booking Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Track Order
  const startTracking = async (orderIdToTrack: string) => {
    try {
      const trackingResponse = await porterAPI.trackOrder(orderIdToTrack);
      console.log('Tracking Response:', trackingResponse);
      setTrackingData(trackingResponse);

      // Get driver details if available
      if (trackingResponse.driver_details) {
        setDriverDetails(trackingResponse.driver_details);
      }

      // Poll every 10 seconds for updates
      const interval = setInterval(async () => {
        try {
          const updatedTracking = await porterAPI.trackOrder(orderIdToTrack);
          setTrackingData(updatedTracking);
        } catch (err) {
          console.error('Tracking update failed:', err);
        }
      }, 10000);

      // Cleanup on unmount
      return () => clearInterval(interval);
    } catch (err: any) {
      setError('Failed to get tracking information.');
      console.error('Tracking Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 rounded-lg">
                  <Truck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Porter Live Logistics</h1>
                  <p className="text-sm text-slate-500">Real-time vehicle booking and tracking with Porter API</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Current Step</span>
              <span className="text-lg font-bold text-emerald-600 uppercase">{step}</span>
            </div>
          </div>

          {/* Contract Info Banner */}
          {contractInfo && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div className="flex-1">
                <p className="font-bold text-emerald-900 text-sm">Contract Approved!</p>
                <p className="text-xs text-emerald-700">
                  {contractInfo.contract_number} • {contractInfo.material_name} • {contractInfo.quantity_kg.toLocaleString()} kg
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
                AUTO-FILLED
              </span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${step === 'address' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'address' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-emerald-500 text-white'}`}>
                {step !== 'address' ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-semibold text-sm">Enter Addresses</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>

            <div className={`flex items-center gap-3 ${step === 'quote' ? 'text-emerald-600' : step === 'booking' || step === 'tracking' ? 'text-slate-400' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'quote' ? 'bg-emerald-100 text-emerald-700 font-bold' : step === 'booking' || step === 'tracking' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {step === 'booking' || step === 'tracking' ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-semibold text-sm">Select Vehicle</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>

            <div className={`flex items-center gap-3 ${step === 'booking' ? 'text-emerald-600' : step === 'tracking' ? 'text-slate-400' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'booking' ? 'bg-emerald-100 text-emerald-700 font-bold' : step === 'tracking' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {step === 'tracking' ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="font-semibold text-sm">Confirm Booking</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>

            <div className={`flex items-center gap-3 ${step === 'tracking' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'tracking' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                4
              </div>
              <span className="font-semibold text-sm">Live Tracking</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-bold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Address Form */}
        {step === 'address' && (
          <form onSubmit={handleGetQuote} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pickup Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Pickup Location</h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Name *</label>
                      <input
                        type="text"
                        value={pickupName}
                        onChange={(e) => setPickupName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={pickupPhone}
                        onChange={(e) => setPickupPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                        pattern="[0-9]{10}"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">City *</label>
                      <select
                        value={pickupCity}
                        onChange={(e) => setPickupCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="Ahmedabad">Ahmedabad</option>
                        <option value="Vadodara">Vadodara</option>
                        <option value="Surat">Surat</option>
                        <option value="Rajkot">Rajkot</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Pune">Pune</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">State *</label>
                      <input
                        type="text"
                        value={pickupState}
                        onChange={(e) => setPickupState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Pincode *</label>
                    <input
                      type="text"
                      value={pickupPincode}
                      onChange={(e) => setPickupPincode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                      pattern="[0-9]{6}"
                    />
                  </div>
                </div>
              </div>

              {/* Drop Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <MapPinned className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900">Delivery Location</h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Name *</label>
                      <input
                        type="text"
                        value={dropName}
                        onChange={(e) => setDropName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={dropPhone}
                        onChange={(e) => setDropPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        pattern="[0-9]{10}"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={dropAddress}
                      onChange={(e) => setDropAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">City *</label>
                      <select
                        value={dropCity}
                        onChange={(e) => setDropCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Ahmedabad">Ahmedabad</option>
                        <option value="Vadodara">Vadodara</option>
                        <option value="Surat">Surat</option>
                        <option value="Rajkot">Rajkot</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Pune">Pune</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">State *</label>
                      <input
                        type="text"
                        value={dropState}
                        onChange={(e) => setDropState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Pincode *</label>
                    <input
                      type="text"
                      value={dropPincode}
                      onChange={(e) => setDropPincode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      pattern="[0-9]{6}"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
                <User className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-slate-900">Customer Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Getting Quotes...
                  </>
                ) : (
                  <>
                    Get Vehicle Quotes
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Vehicle Quotes */}
        {step === 'quote' && quotes.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Available Vehicles</h3>
              <div className="space-y-3">
                {quotes.map((quote, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedQuote(quote)}
                    className={`border-2 rounded-xl p-5 cursor-pointer transition ${
                      selectedQuote === quote
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Truck className="w-8 h-8 text-slate-700" />
                        <div>
                          <h4 className="font-bold text-slate-900">{quote.vehicle_type}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Navigation className="w-3.5 h-3.5" />
                              <span>{quote.distance_in_kms} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{quote.eta_in_mins} mins</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                          ₹{(quote.fare_details.minor_amount / 100).toFixed(2)}
                        </div>
                        <span className="text-xs text-slate-500">{quote.fare_details.currency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('address')}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition"
              >
                Back
              </button>
              <button
                onClick={handleBookVehicle}
                disabled={!selectedQuote || loading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Booking Confirmation */}
        {step === 'booking' && orderId && (
          <div className="bg-white border border-emerald-300 rounded-xl p-8 shadow-lg text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h3>
            <p className="text-slate-600">Your vehicle has been successfully booked</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs text-slate-500 block">Order ID</span>
              <span className="text-lg font-mono font-bold text-slate-900">{orderId}</span>
            </div>
            <p className="text-sm text-slate-500">Redirecting to live tracking...</p>
          </div>
        )}

        {/* STEP 4: Live Tracking */}
        {step === 'tracking' && trackingData && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Live Tracking</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  {trackingData.status || 'IN TRANSIT'}
                </span>
              </div>

              {/* Map */}
              <div className="h-96 rounded-lg overflow-hidden mb-4">
                <GoogleMapsView
                  origin={{ lat: pickupLat, lng: pickupLng, name: pickupCity }}
                  destination={{ lat: dropLat, lng: dropLng, name: dropCity }}
                  showRoute={true}
                  showLiveTracking={true}
                  vehicleLocation={trackingData.current_location || { lat: pickupLat, lng: pickupLng }}
                />
              </div>

              {/* Driver Details */}
              {driverDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-300 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{driverDetails.name || 'Driver'}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{driverDetails.rating || '4.8'}</span>
                        <span className="mx-2">•</span>
                        <span>{driverDetails.vehicle_number || 'GJ-01-AB-1234'}</span>
                      </div>
                    </div>
                    <button className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition">
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <span className="text-xs text-slate-500 block mb-1">Order ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{orderId}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <span className="text-xs text-slate-500 block mb-1">Request ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{requestId}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
