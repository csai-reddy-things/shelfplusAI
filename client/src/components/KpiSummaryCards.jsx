import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ClockAlert, AlertTriangle, SendHorizontal, TrendingUp } from 'lucide-react';

export default function KpiSummaryCards({ kpis = {}, loading = false }) {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Active Batches',
      value: loading ? '...' : (kpis.totalActiveBatches || 0),
      subtitle: `Total Value: ₹${(kpis.totalInventoryValue || 0).toLocaleString('en-IN')}`,
      icon: Package,
      color: 'emerald',
      bgGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      action: () => navigate('/inventory')
    },
    {
      title: 'Expiring ≤ 7 Days',
      value: loading ? '...' : (kpis.expiringWithin7Days || 0),
      subtitle: `At-Risk Value: ₹${(kpis.nearExpiryAtRiskValue || 0).toLocaleString('en-IN')}`,
      icon: ClockAlert,
      color: 'rose',
      bgGlow: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      action: () => navigate('/expiry-radar'),
      badge: kpis.expiringWithin7Days > 0 ? 'Clearance Required' : 'All Clear'
    },
    {
      title: 'Low Stock Alerts',
      value: loading ? '...' : (kpis.lowStockCount || 0),
      subtitle: 'Below Min Safety Level',
      icon: AlertTriangle,
      color: 'amber',
      bgGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      action: () => navigate('/inventory?status=LOW_STOCK'),
      badge: kpis.lowStockCount > 0 ? 'Auto-Restock Triggered' : 'Healthy'
    },
    {
      title: 'WhatsApp Orders Sent',
      value: loading ? '...' : (kpis.totalRestockOrdersSent || 0),
      subtitle: 'Dispatched to Distributors',
      icon: SendHorizontal,
      color: 'teal',
      bgGlow: 'hover:border-teal-500/50 hover:shadow-teal-500/10',
      iconBg: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
      action: () => navigate('/restock-orders'),
      badge: 'Live Auto-PO'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.action}
            className={`cursor-pointer group relative p-5 rounded-2xl bg-slate-900/90 border border-slate-800 transition-all duration-300 shadow-xl hover:-translate-y-0.5 ${card.bgGlow}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
              {card.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  card.color === 'rose'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : card.color === 'amber'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {card.badge}
                </span>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>{card.subtitle}</span>
              <TrendingUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
