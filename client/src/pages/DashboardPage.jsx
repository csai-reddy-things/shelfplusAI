import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Package,
  ClockAlert,
  SendHorizontal,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Store
} from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import KpiSummaryCards from '../components/KpiSummaryCards.jsx';
import LiveWhatsappToastModal from '../components/LiveWhatsappToastModal.jsx';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { storeProfile, stageDemoNumber } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedRestockOrder, setSelectedRestockOrder] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/dashboard/summary');
      if (res.data?.success) {
        setSummaryData(res.data.data);
      }
    } catch (err) {
      console.warn('Dashboard summary error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const kpis = summaryData?.kpis || {};
  const recentOrders = summaryData?.recentRestockOrders || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {summaryData?.storeProfile?.store_name || storeProfile?.store_name || 'Apna Supermart'}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Live Command Center
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-entry invoice onboarding, real-time batch expiry radar, and automated WhatsApp restock engine.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/scan-bill')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:scale-[1.02]"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Supplier Bill</span>
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Smart POS Simulator</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KpiSummaryCards kpis={kpis} loading={loading} />

      {/* Zero Batches Seed Callout (if brand new account) */}
      {!loading && kpis.totalActiveBatches === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ready for Live Stage Demonstration?</span>
            </h3>
            <p className="text-xs text-slate-400">
              Populate realistic Indian supermarket inventory (Amul Milk, Britannia Bread, Maggi, Atta) and link your phone number in 1-click.
            </p>
          </div>
          <button
            onClick={async () => {
              await apiClient.post('/demo/seed', { demo_whatsapp_number: stageDemoNumber });
              toast.success('Seeded realistic supermarket batches!');
              fetchSummary();
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition"
          >
            Load Demo Supermarket Stock
          </button>
        </div>
      )}

      {/* 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent WhatsApp Restock Orders Feed */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <SendHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Live WhatsApp Restock Feed</h3>
            </div>
            <button
              onClick={() => navigate('/restock-orders')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <p>No restock orders triggered yet.</p>
                <p className="text-slate-400">
                  Tip: Go to <span className="text-emerald-400 cursor-pointer" onClick={() => navigate('/inventory')}>Smart Inventory</span> and click <span className="text-amber-400 font-bold">-5 Rush Sale</span> to trigger a live auto-restock order!
                </p>
              </div>
            ) : (
              recentOrders.map((order) => {
                const isLive = order.dispatch_status === 'SENT_LIVE';
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedRestockOrder(order)}
                    className="cursor-pointer p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                        {order.item_name_snapshot}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isLive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                      }`}>
                        {isLive ? 'TWILIO SENT' : 'DEMO DISPATCHED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Ordered: <strong className="text-white">{order.ordered_quantity} {order.unit}</strong></span>
                      <span className="font-mono text-emerald-400">{order.recipient_whatsapp}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate font-mono bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      {order.whatsapp_message_body}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Expiry & Inventory Action Radar */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ClockAlert className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Loss-Prevention Expiry Radar</h3>
            </div>
            <button
              onClick={() => navigate('/expiry-radar')}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1"
            >
              <span>Clearance Tactics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
                <span className="text-[10px] uppercase font-semibold text-rose-400 block mb-1">
                  Critical Expiry (≤3d)
                </span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {kpis.criticalExpiryCount || 0} Batches
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Flash clearance needed</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30">
                <span className="text-[10px] uppercase font-semibold text-amber-400 block mb-1">
                  Warning Horizon (4-14d)
                </span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {kpis.warningExpiryCount || 0} Batches
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Bundle promotions</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">AI Clearance & Markdown Engine</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  GEMINI 2.5 FLASH
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ShelfPulse analyzes perishables, dairy, and bakery items approaching shelf expiry and recommends dynamic markdown pricing and walk-in customer bundles before stock degrades.
              </p>
              <button
                onClick={() => navigate('/expiry-radar')}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md transition hover:opacity-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Clearance Advisor</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing clicked restock order */}
      {selectedRestockOrder && (
        <LiveWhatsappToastModal
          isOpen={Boolean(selectedRestockOrder)}
          onClose={() => setSelectedRestockOrder(null)}
          data={{
            order: selectedRestockOrder,
            waMeLink: `https://wa.me/${selectedRestockOrder.recipient_whatsapp.replace('+', '')}?text=${encodeURIComponent(selectedRestockOrder.whatsapp_message_body)}`
          }}
        />
      )}
    </div>
  );
}
