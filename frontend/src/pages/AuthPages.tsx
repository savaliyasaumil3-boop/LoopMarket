import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Building2, User, Mail, Lock, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export const LoginPage: React.FC = () => {
  const { login, switchDemoCompany } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('abc@reloop.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    try {
      await login(demoEmail, 'password123');
      navigate('/dashboard');
    } catch {
      await switchDemoCompany(demoEmail);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-xs">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-8 shadow-sm space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-lg mx-auto shadow-sm">
            R
          </div>
          <h1 className="text-xl font-black text-slate-950 mt-2">Sign in to RELOOP</h1>
          <p className="text-slate-500 text-xs">B2B Circular Packaging & Secondary Materials Exchange</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="b2b-input"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="b2b-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold transition shadow-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-mono uppercase text-slate-400 block text-center">1-Click Hackathon Demo Logins</span>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('abc@reloop.in')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">ABC Manufacturing (Seller)</span>
                <span className="text-[10px] text-slate-400">Ahmedabad • FMCG</span>
              </div>
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono">Sign in</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('buyer@greenpack.com')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">GreenPack Industries (Buyer)</span>
                <span className="text-[10px] text-slate-400">Vadodara • Packaging</span>
              </div>
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono">Sign in</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link to="/signup" className="text-slate-600 hover:text-slate-950 font-semibold underline">
            Need to register your facility? Onboard here →
          </Link>
        </div>

      </div>
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Handwritten Sketch Page 1 Onboarding Form Fields
  const [companyName, setCompanyName] = useState('Gujarat Precision Packaging Ltd');
  const [companySize, setCompanySize] = useState('Medium (50-250)');
  const [companyType, setCompanyType] = useState('Manufacturer');
  const [industry, setIndustry] = useState('FMCG');
  const [location, setLocation] = useState('Ahmedabad, Gujarat');
  const [city, setCity] = useState('Ahmedabad');
  const [contactPerson, setContactPerson] = useState('Vikram Patel');
  const [email, setEmail] = useState('vikram@gujaratpack.in');
  const [phone, setPhone] = useState('+91 9825123456');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.register({
        email,
        password,
        full_name: contactPerson,
        company_name: companyName,
        company_type: companyType,
        industry,
        company_size: companySize,
        location,
        city,
        phone
      });
      await login(email, password);
      navigate('/dashboard');
    } catch (e: any) {
      alert(e.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-xs">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-8 shadow-sm space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-lg mx-auto shadow-sm">
            R
          </div>
          <h1 className="text-xl font-black text-slate-950 mt-2">Onboard Your Enterprise</h1>
          <p className="text-slate-500 text-xs">Join India's B2B Circular Carbon Packaging Exchange</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700">Company / Facility Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="b2b-input"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Company Type *</label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="b2b-input"
              >
                <option value="Manufacturer">Manufacturer / Factory</option>
                <option value="Retailer">Retailer / E-Commerce</option>
                <option value="Recycler">Packaging Recycler</option>
                <option value="Logistics Provider">Logistics Provider</option>
                <option value="Packaging Supplier">Packaging Supplier</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Industry Sector *</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="b2b-input"
              >
                <option value="FMCG">FMCG</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="E-commerce">E-Commerce</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Automotive">Automotive</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Primary Hub City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="b2b-input"
              >
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Surat">Surat</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
                <option value="Delhi">Delhi</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Company Size</label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="b2b-input"
              >
                <option value="Small (1-50)">Small (1-50)</option>
                <option value="Medium (50-250)">Medium (50-250)</option>
                <option value="Large (250-1000)">Large (250-1000)</option>
                <option value="Enterprise (1000+)">Enterprise (1000+)</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700">Authorized Contact Person *</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                className="b2b-input"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Work Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="b2b-input"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Phone Number *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="b2b-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold transition shadow-sm mt-4"
          >
            {loading ? 'Creating Profile...' : 'Complete Onboarding & Launch'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-slate-600 hover:text-slate-950 font-semibold underline">
            Already registered? Sign in here →
          </Link>
        </div>

      </div>
    </div>
  );
};
