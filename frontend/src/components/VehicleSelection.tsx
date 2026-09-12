import React, { useState, useEffect } from 'react';
import { Truck, Package, Clock, Star, CheckCircle, TrendingUp, Zap } from 'lucide-react';

interface VehicleOption {
  id: string;
  type: string;
  name: string;
  capacity_kg: number;
  dimensions: string;
  base_price: number;
  price_per_km: number;
  estimated_time: string;
  available_count: number;
  rating: number;
  features: string[];
  icon: string;
  image_url?: string;
}

interface VehicleSelectionProps {
  pickupCity: string;
  deliveryCity: string;
  distance_km: number;
  weight_kg: number;
  onSelectVehicle: (vehicle: VehicleOption) => void;
}

export const VehicleSelection: React.FC<VehicleSelectionProps> = ({
  pickupCity,
  deliveryCity,
  distance_km,
  weight_kg,
  onSelectVehicle
}) => {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching available vehicles (Porter/Shadowfax style)
    const mockVehicles: VehicleOption[] = [
      {
        id: 'tata-ace',
        type: '4W_MINI',
        name: 'Mini Truck',
        capacity_kg: 750,
        dimensions: '7ft x 4ft x 4ft',
        base_price: 299,
        price_per_km: 12,
        estimated_time: '2-3 hours',
        available_count: 8,
        rating: 4.7,
        features: ['Perfect for pallets', 'City permits', 'GPS tracked'],
        icon: '🚐'
      },
      {
        id: 'pickup',
        type: '4W_PICKUP',
        name: 'Pickup Truck',
        capacity_kg: 1500,
        dimensions: '8ft x 6ft x 5ft',
        base_price: 499,
        price_per_km: 15,
        estimated_time: '2-3 hours',
        available_count: 5,
        rating: 4.8,
        features: ['Extra capacity', 'Highway ready', 'Loading assistance'],
        icon: '🚚'
      },
      {
        id: 'tata-407',
        type: 'TRUCK_407',
        name: 'Light Truck (407)',
        capacity_kg: 2500,
        dimensions: '12ft x 6ft x 6ft',
        base_price: 899,
        price_per_km: 18,
        estimated_time: '3-4 hours',
        available_count: 3,
        rating: 4.9,
        features: ['Bulk cargo', 'Multiple pickups', 'Verified drivers'],
        icon: '🚛'
      },
      {
        id: 'eicher-14ft',
        type: 'TRUCK_14FT',
        name: 'Medium Truck (14ft)',
        capacity_kg: 4000,
        dimensions: '14ft x 7ft x 7ft',
        base_price: 1499,
        price_per_km: 22,
        estimated_time: '3-4 hours',
        available_count: 2,
        rating: 4.8,
        features: ['Large shipments', 'Inter-city', 'Real-time tracking'],
        icon: '🚚'
      }
    ];

    setTimeout(() => {
      setVehicles(mockVehicles);
      setLoading(false);
    }, 800);
  }, [weight_kg, distance_km]);

  const calculateTotalPrice = (vehicle: VehicleOption) => {
    return vehicle.base_price + (vehicle.price_per_km * distance_km);
  };

  const handleSelectVehicle = (vehicle: VehicleOption) => {
    setSelectedVehicle(vehicle.id);
    onSelectVehicle(vehicle);
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <Truck className="w-12 h-12 mx-auto text-slate-400 animate-pulse" />
        <p className="mt-4 text-sm text-slate-600 font-bold">Finding available vehicles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Select Your Vehicle</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {pickupCity} → {deliveryCity} • {distance_km} km • {weight_kg.toLocaleString()} kg
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Available now</span>
            <span className="text-2xl font-bold text-emerald-600">
              {vehicles.reduce((sum, v) => sum + v.available_count, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Options */}
      <div className="space-y-3">
        {vehicles.map((vehicle) => {
          const totalPrice = calculateTotalPrice(vehicle);
          const isSelected = selectedVehicle === vehicle.id;
          const isCapacitySuitable = weight_kg <= vehicle.capacity_kg;

          return (
            <div
              key={vehicle.id}
              onClick={() => isCapacitySuitable && handleSelectVehicle(vehicle)}
              className={`
                bg-white border-2 rounded-xl p-4 transition-all cursor-pointer
                ${isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }
                ${!isCapacitySuitable && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Vehicle Icon/Image */}
                <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-4xl shrink-0">
                  {vehicle.icon}
                </div>

                {/* Vehicle Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{vehicle.name}</h4>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          <span>{vehicle.capacity_kg} kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-bold">{vehicle.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{vehicle.estimated_time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs font-mono text-slate-500">{vehicle.dimensions}</span>
                        {vehicle.available_count > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                            {vehicle.available_count} available
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {vehicle.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {!isCapacitySuitable && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Exceeds capacity - Choose larger vehicle</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{totalPrice.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                        <div>Base: ₹{vehicle.base_price}</div>
                        <div>+ ₹{vehicle.price_per_km}/km</div>
                      </div>

                      {isSelected && (
                        <div className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          Selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      {selectedVehicle && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between sticky bottom-0 shadow-lg">
          <div>
            <p className="text-xs text-slate-500">Total Amount</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{calculateTotalPrice(vehicles.find(v => v.id === selectedVehicle)!).toLocaleString()}
            </p>
          </div>
          <button className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Confirm Booking
          </button>
        </div>
      )}
    </div>
  );
};
