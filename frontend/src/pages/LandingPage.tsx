import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Sparkles, RefreshCw, Truck, 
  Leaf, ChevronRight, BarChart3, Layers, CheckCircle2, Box, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-900 selection:text-white">
      
      {/* Top Banner Navigation */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-base shadow-sm">
              R
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">RELOOP</span>
              <span className="text-[10px] text-slate-400 font-mono">CIRCULAR CARBON ECOSYSTEM</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <Link to="/marketplace" className="hover:text-slate-950 transition">Marketplace</Link>
            <Link to="/simulator" className="hover:text-slate-950 transition">What-If Simulator</Link>
            <Link to="/impact" className="hover:text-slate-950 transition">Carbon Methodology</Link>
            <Link to="/logistics" className="hover:text-slate-950 transition">Logistics Network</Link>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center gap-1.5"
                >
                  Dashboard ({user?.full_name?.split(' ')[0] || 'Account'})
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                >
                  Sign Up
                </Link>
                <Link 
                  to="/dashboard"
                  className="hidden sm:flex text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-slate-950 text-white hover:bg-slate-800 transition items-center gap-1.5 shadow-sm"
                >
                  Launch App <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
        
        {/* Subtle badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-800 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>B2B Circular Packaging & Secondary Materials Exchange</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.1]">
          Turn Packaging Waste Into Your Next Resource.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          RELOOP connects manufacturers, retailers, packaging recyclers, and logistics providers through AI-powered matching, optimized freight, verified trust, and measurable circular carbon impact.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/marketplace"
            className="px-6 py-3 rounded-lg bg-slate-950 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
          >
            Explore Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/sell"
            className="px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition"
          >
            List Your Material (AI Quick-Fill)
          </Link>
          <Link
            to="/admin"
            className="px-6 py-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-xs sm:text-sm hover:bg-emerald-100 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Judge 1-Click Demo
          </Link>
        </div>

        {/* Live Metrics Ticker */}
        <div className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-mono text-slate-500 uppercase block">Material Diverted</span>
            <span className="text-2xl font-black text-slate-900 font-mono">485,000 kg</span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Post-industrial surplus</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-mono text-slate-500 uppercase block">Verified Enterprises</span>
            <span className="text-2xl font-black text-slate-900 font-mono">30+ Hubs</span>
            <span className="text-[11px] text-slate-600 font-medium block mt-0.5">Across 9 Industrial Zones</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-mono text-slate-500 uppercase block">Net Avoided Carbon</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">567.2 Tons</span>
            <span className="text-[11px] text-slate-600 font-medium block mt-0.5">GHG Scope 3 Validated</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-mono text-slate-500 uppercase block">Avg Cost Savings</span>
            <span className="text-2xl font-black text-slate-900 font-mono">28.4%</span>
            <span className="text-[11px] text-slate-600 font-medium block mt-0.5">Vs virgin procurement</span>
          </div>
        </div>

      </section>

      {/* Two-Layer AI & Core Principle Feature Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase text-emerald-700 font-semibold tracking-wider">Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
            Built on Rigorous Material Intelligence & Explainability
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            AI never hallucinates prices or compatibility. Deterministic physics and economics first, contextual LLMs second.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-slate-400 transition">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-bold">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Layer 1: MiniMax NLP Parser</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Converts raw natural language descriptions, voice transcripts, and procurement queries into strictly validated schemas (material, grade, quantity kg, contamination, location).
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-slate-400 transition">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-bold">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">Deterministic 5-Factor Match Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluates Material Compatibility (30%), Quantity (20%), Road Distance (20%), Delivered Cost (15%), and Circularity (15%) before ranking candidates.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-slate-400 transition">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-bold">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">Layer 2: Gemini Explainability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides Netflix-style personalized recommendations grounded strictly in valid candidates, writing precise, auditable rationale for why a match was recommended.
            </p>
          </div>
        </div>
      </section>

      {/* Complete Lifecycle Workflow */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-200 bg-slate-50 rounded-2xl my-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono uppercase text-slate-500 font-semibold tracking-wider">End-to-End Governance</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
            Complete Circular Transaction Lifecycle
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-700">
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded font-semibold">1. LIST</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded font-semibold">2. PASSPORT</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded font-semibold">3. MATCH</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded font-semibold">4. CONTRACT</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded font-semibold">5. ESCROW</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded font-semibold">6. SHIP</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded font-semibold">7. INSPECT</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-3 py-1.5 bg-emerald-900 text-white rounded font-bold">8. IMPACT</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 px-6 max-w-7xl mx-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-slate-900">RELOOP</span> — AI-Powered Circular Packaging & Materials Exchange
        </div>
        <div className="flex gap-6 font-medium">
          <Link to="/marketplace" className="hover:text-slate-900">Marketplace</Link>
          <Link to="/contracts" className="hover:text-slate-900">Contracts</Link>
          <Link to="/logistics" className="hover:text-slate-900">Logistics</Link>
          <Link to="/impact" className="hover:text-slate-900">Impact</Link>
          <Link to="/admin" className="text-emerald-700 font-bold hover:underline">Demo Console</Link>
        </div>
      </footer>

    </div>
  );
};
