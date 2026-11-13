import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Store, Lock, Mail, ArrowRight, ShieldCheck, Phone, MapPin, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, signup, stageDemoNumber } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('demo-store@shelfpulse.ai');
  const [password, setPassword] = useState('Supermart@2026');
  const [storeName, setStoreName] = useState('Apna Supermart & Daily Kirana');
  const [ownerName, setOwnerName] = useState('Rajesh Kumar');
  const [phoneNumber, setPhoneNumber] = useState(stageDemoNumber || '+919876543210');
  const [city, setCity] = useState('Bengaluru');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signup({
          email,
          password,
          storeName,
          ownerName,
          phoneNumber,
          city
        });
        toast.success('Store account created! Welcome to ShelfPulse AI.');
      } else {
        await login(email, password);
        toast.success('Signed in successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    try {
      await login('demo-store@shelfpulse.ai', 'Supermart@2026');
      toast.success('Instant Stage Demo Access Granted!');
      navigate('/dashboard');
    } catch (err) {
      // In case signup needed first
      try {
        await signup({
          email: 'demo-store@shelfpulse.ai',
          password: 'Supermart@2026',
          storeName: 'Apna Supermart & Kirana',
          ownerName: 'Rajesh Kumar',
          phoneNumber: stageDemoNumber,
          city: 'Bengaluru'
        });
        navigate('/dashboard');
      } catch (e) {
        toast.error('Demo login failed: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ShelfPulse <span className="text-emerald-400">AI</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Smart Restock & Expiry Radar for Local Supermarkets
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-8 shadow-2xl rounded-2xl space-y-6">
          {/* Quick Demo Stage Access Button */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-bold text-white block">Stage Presentation Demo?</span>
              <span className="text-[11px] text-slate-400">Jump directly to live dashboard in 1-click</span>
            </div>
            <button
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition transform hover:scale-105 disabled:opacity-50"
            >
              Demo Login
            </button>
          </div>

          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 pb-3 text-xs font-bold transition border-b-2 ${
                !isSignUp
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 pb-3 text-xs font-bold transition border-b-2 ${
                isSignUp
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New Store
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Supermarket / Kirana Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Owner Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>City / Locality</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Default Store WhatsApp Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full text-xs font-mono px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Store Manager Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Authenticating...' : isSignUp ? 'Provision Store Profile' : 'Access Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Supabase Auth & Multi-Tenant PostgreSQL RLS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
