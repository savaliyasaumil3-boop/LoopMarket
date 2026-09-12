import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, ArrowRight, Building2, User, Mail, Lock, 
  Phone, MapPin, Eye, EyeOff, Sparkles, CheckCircle2, 
  AlertCircle, Truck, Factory, RefreshCw, ArrowLeft
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchDemoCompany, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('abc@reloop.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'demo'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials or use 1-Click Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, 'password123');
      navigate(redirectPath);
    } catch {
      // Fallback
      await switchDemoCompany(demoEmail);
      navigate(redirectPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
            R
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-tight">RELOOP</span>
            <span className="text-[10px] text-emerald-400 font-mono">B2B CIRCULAR EXCHANGE</span>
          </div>
        </Link>
        <Link 
          to="/" 
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Brand & Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-[11px] font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Enterprise Single Sign-On & Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sign In to RELOOP</h1>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Access the secondary packaging marketplace, AI matching engine, verified digital passports, and carbon ledger.
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-2 rounded-lg transition cursor-pointer ${activeTab === 'form' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Credentials Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'demo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-emerald-300'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Personas
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Notice</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {activeTab === 'form' ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Password</label>
                  <button 
                    type="button" 
                    onClick={() => alert("For Hackathon Demo: All verified enterprise accounts use password: 'password123'. You can also use the 1-Click Demo tab!")}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Keep me signed in for 7 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Platform <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 1-Click Demo Accounts Selection */
            <div className="space-y-3">
              <div className="text-center pb-1">
                <span className="text-[11px] font-mono uppercase text-slate-400 block">
                  Instant Hackathon Evaluation Personas
                </span>
                <span className="text-xs text-slate-500">
                  Select an enterprise profile below to authenticate automatically:
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleQuickDemoLogin(acc.email)}
                    disabled={loading}
                    className="p-3 bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 rounded-xl text-left flex justify-between items-center transition group cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-emerald-300 transition text-xs">
                          {acc.name}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                          {acc.tag}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{acc.city}, IN</span>
                        <span>•</span>
                        <span>{acc.role}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">{acc.email}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm shrink-0">
                      Sign In <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Onboarding Link Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">New facility or enterprise?</span>
            <Link
              to="/signup"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition underline decoration-emerald-500/40 hover:decoration-emerald-400"
            >
              Register & Onboard Facility →
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-[11px] text-slate-500 font-mono">
        RELOOP Circular Carbon Platform • Protected by End-to-End Enterprise Cryptography
      </footer>
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  // Enterprise Onboarding Form Fields
  const [companyName, setCompanyName] = useState('Gujarat Precision Packaging Ltd');
  const [companySize, setCompanySize] = useState('Medium (50-250)');
  const [companyType, setCompanyType] = useState('Manufacturer');
  const [industry, setIndustry] = useState('FMCG');
  const [city, setCity] = useState('Ahmedabad');
  const [contactPerson, setContactPerson] = useState('Vikram Patel');
  const [email, setEmail] = useState(`vikram_${Math.floor(100 + Math.random() * 900)}@gujaratpack.in`);
  const [phone, setPhone] = useState('+91 9825123456');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillRandomDemoEnterprise = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const enterpriseNames = [
      'AeroKraft Circular Polymers',
      'Surat Eco-Board Packaging',
      'Saurashtra Bio-Crate Works',
      'Vadodara Secondary Fibers',
      'West Coast Circular Logistics',
      'Sterling Pharma Returnable Pack'
    ];
    const cities = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot', 'Mumbai', 'Pune'];
    const chosenName = enterpriseNames[Math.floor(Math.random() * enterpriseNames.length)];
    const chosenCity = cities[Math.floor(Math.random() * cities.length)];

    setCompanyName(`${chosenName} #${randomId}`);
    setCity(chosenCity);
    setContactPerson('Aakash Mehta');
    setEmail(`procurement_${randomId}@ecoloop.in`);
    setPhone('+91 9898765432');
    setPassword('password123');
    setConfirmPassword('password123');
    setError('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the RELOOP Enterprise Circular Exchange Terms.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: email.trim().toLowerCase(),
        password,
        full_name: contactPerson.trim(),
        company_name: companyName.trim(),
        company_type: companyType,
        industry,
        company_size: companySize,
        location: `${city}, Gujarat`,
        city,
        state: 'Gujarat',
        phone: phone.trim()
      });
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Onboarding failed. The email may already be registered or data is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
            R
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-tight">RELOOP</span>
            <span className="text-[10px] text-emerald-400 font-mono">FACILITY ONBOARDING</span>
          </div>
        </Link>
        <Link 
          to="/login" 
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition font-medium"
        >
          Already have an account? <span className="text-emerald-400 font-bold underline">Sign In</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header & Autofill CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-[11px] font-medium text-emerald-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Enterprise Verification</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Onboard Your Facility</h1>
              <p className="text-slate-400 text-xs mt-1">
                Join India's B2B Circular Carbon Packaging & Secondary Materials Exchange.
              </p>
            </div>

            <button
              type="button"
              onClick={fillRandomDemoEnterprise}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
              title="Auto-fill realistic industrial enterprise data for fast testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ Fast Demo Autofill</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Registration Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5 text-xs">
            
            {/* Section 1: Enterprise Profile */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider font-bold block">
                1. Enterprise & Facility Profile
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Company / Facility Name *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      placeholder="e.g. Apex Packaging Solutions Pvt Ltd"
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Company Operational Type *</label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                  >
                    <option value="Manufacturer">Manufacturer / Production Plant</option>
                    <option value="Packaging Supplier">Packaging Supplier / Converter</option>
                    <option value="Recycler">Material Recycler / Processor</option>
                    <option value="Logistics Provider">Logistics / Freight Carrier</option>
                    <option value="Retailer">Retailer / E-Commerce Fulfilment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Industry Sector *</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                  >
                    <option value="FMCG">FMCG & Fast-Moving Consumer Goods</option>
                    <option value="Manufacturing">Heavy & Precision Manufacturing</option>
                    <option value="Automotive">Automotive & Components</option>
                    <option value="Food & Beverage">Food & Beverage Processing</option>
                    <option value="Pharmaceuticals">Pharmaceuticals & Healthcare</option>
                    <option value="Retail">Retail Chains</option>
                    <option value="E-commerce">E-Commerce & Warehousing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Primary Logistics Hub City *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="Ahmedabad">Ahmedabad (Gujarat Hub)</option>
                      <option value="Vadodara">Vadodara (Industrial Zone)</option>
                      <option value="Surat">Surat (Textile & Polymer Zone)</option>
                      <option value="Rajkot">Rajkot (Foundry & Packaging)</option>
                      <option value="Mumbai">Mumbai (Maharashtra Metro)</option>
                      <option value="Pune">Pune (Auto Industrial Corridor)</option>
                      <option value="Delhi">Delhi NCR (Distribution Hub)</option>
                      <option value="Bengaluru">Bengaluru (Tech & Fulfilment)</option>
                      <option value="Hyderabad">Hyderabad (Pharma Corridor)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Facility Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                  >
                    <option value="Small (1-50)">Small Facility (1-50 workers)</option>
                    <option value="Medium (50-250)">Medium Plant (50-250 workers)</option>
                    <option value="Large (250-1000)">Large Facility (250-1000 workers)</option>
                    <option value="Enterprise (1000+)">Enterprise Multi-Plant (1000+)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Person & Credentials */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider font-bold block">
                2. Authorized Representative & Credentials
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Authorized Contact Person *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      required
                      placeholder="e.g. Vikram Patel (Head of Procurement)"
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Official Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="contact@enterprise.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Facility Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+91 9825123456"
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Account Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2 text-slate-400 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 mt-0.5 cursor-pointer"
                />
                <span>
                  I declare that the facility produces or consumes verified packaging / secondary materials, and agree to the RELOOP Circular Exchange charter & audit protocols.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Minting Verified Enterprise Account...
                </>
              ) : (
                <>
                  Complete Onboarding & Launch Dashboard <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Return to Sign In */}
          <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold underline">
              Sign in to your account →
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-[11px] text-slate-500 font-mono">
        RELOOP Circular Carbon Platform • Protected by End-to-End Enterprise Cryptography
      </footer>
    </div>
  );
};
