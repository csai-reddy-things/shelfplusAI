import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  Package,
  ClockAlert,
  SendHorizontal,
  Users,
  Sparkles,
  Smartphone,
  LogOut,
  RefreshCw,
  Store,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../lib/apiClient.js';
import toast from 'react-hot-toast';
import SupplierDirectoryModal from './SupplierDirectoryModal.jsx';

export default function SidebarLayout() {
  const { user, storeProfile, logout, stageDemoNumber, setStageDemoNumber } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(stageDemoNumber);
  const [isSeeding, setIsSeeding] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({ expiring: 0, lowStock: 0 });

  // Fetch quick counts for sidebar badges
  const fetchBadgeCounts = async () => {
    try {
      const res = await apiClient.get('/dashboard/summary');
      if (res.data?.data?.kpis) {
        setBadgeCounts({
          expiring: res.data.data.kpis.expiringWithin7Days || 0,
          lowStock: res.data.data.kpis.lowStockCount || 0
        });
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleSavePhone = (e) => {
    e.preventDefault();
    setStageDemoNumber(tempPhone);
    setEditingPhone(false);
    toast.success(`Active WhatsApp target set to ${tempPhone}`);
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    const toastId = toast.loading('Populating realistic Indian Supermarket items & supplier contacts...');
    try {
      const res = await apiClient.post('/demo/seed', {
        demo_whatsapp_number: stageDemoNumber,
        store_name: storeProfile?.store_name || 'Apna Supermart & Kirana',
        owner_name: storeProfile?.owner_name || 'Rajesh Kumar',
        city: storeProfile?.city || 'Bengaluru'
      });
      toast.success(res.data?.message || 'Demo data loaded successfully!', { id: toastId });
      fetchBadgeCounts();
    } catch (err) {
      toast.error(`Seed failed: ${err.message}`, { id: toastId });
    } finally {
      setIsSeeding(false);
    }
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/scan-bill',
      label: 'AI Bill Scanner',
      icon: ScanLine,
      isAi: true
    },
    {
      to: '/inventory',
      label: 'Smart Inventory & POS',
      icon: Package,
      badge: badgeCounts.lowStock > 0 ? `${badgeCounts.lowStock} Low` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      to: '/expiry-radar',
      label: 'Expiry Radar & AI',
      icon: ClockAlert,
      badge: badgeCounts.expiring > 0 ? `${badgeCounts.expiring} Alert` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    {
      to: '/restock-orders',
      label: 'WhatsApp Restock Hub',
      icon: SendHorizontal,
      badge: null
    }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">ShelfPulse</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AI</span>
              </div>
              <p className="text-xs text-slate-400">Hyperlocal Kirana Ops</p>
            </div>
          </div>
        </div>

        {/* Store Profile Quick Card */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="truncate">
              <h4 className="text-xs font-semibold text-white truncate">{storeProfile?.store_name || 'Apna Supermart'}</h4>
              <p className="text-[11px] text-slate-400 truncate">{storeProfile?.city || 'Bengaluru'} • {storeProfile?.owner_name || 'Retailer'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.isAi && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    VISION
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Live Stage Demo Phone & Quick Config Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-3">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Stage WhatsApp Target</span>
              </span>
              <button
                onClick={() => setEditingPhone(!editingPhone)}
                className="text-[10px] text-slate-400 hover:text-emerald-300 underline"
              >
                {editingPhone ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingPhone ? (
              <form onSubmit={handleSavePhone} className="space-y-1.5">
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full text-xs px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-1 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Save Target
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-mono font-medium text-white truncate">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{stageDemoNumber}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSupplierModalOpen(true)}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Suppliers</span>
            </button>
            <button
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              title="Populates realistic Indian Supermarket Inventory & Suppliers"
              className="flex items-center justify-center space-x-1 py-2 px-2.5 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>Seed</span>
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center justify-center p-2 text-xs rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-20">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">ShelfPulse AI</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSupplierModalOpen(true)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2 z-20">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`
                }
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-slate-800 flex justify-between">
              <button
                onClick={handleSeedDemoData}
                className="text-xs text-emerald-400 font-semibold"
              >
                🌱 Load Demo Stock
              </button>
              <button
                onClick={logout}
                className="text-xs text-rose-400 font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Supplier Directory Modal */}
      {supplierModalOpen && (
        <SupplierDirectoryModal
          isOpen={supplierModalOpen}
          onClose={() => setSupplierModalOpen(false)}
        />
      )}
    </div>
  );
}
