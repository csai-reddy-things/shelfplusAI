import React, { useState, useEffect } from 'react';
import { SendHorizontal, ExternalLink, Clock, Smartphone, MessageSquare, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import toast from 'react-hot-toast';

export default function RestockOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/restock/orders');
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.warn('Orders load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <SendHorizontal className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              WhatsApp Restock Purchase Orders Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit ledger of real-time automated purchase orders dispatched to suppliers.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading order dispatch history...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Restock Orders Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Simulate customer sales on the Smart Inventory page to trigger real-time WhatsApp purchase orders.
            </p>
          </div>
        ) : (
          orders.map((ord) => {
            const isLive = ord.dispatch_status === 'SENT_LIVE';
            const cleanPhone = (ord.recipient_whatsapp || '').replace('+', '');
            const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(ord.whatsapp_message_body)}`;
            const dateStr = new Date(ord.created_at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            return (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-4 shadow-xl"
              >
                {/* Order Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">{ord.item_name_snapshot}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      (Triggered at {ord.current_stock_at_trigger} remaining stock)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isLive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                    }`}>
                      {isLive ? 'TWILIO DISPATCHED' : 'DEMO SIMULATED'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {ord.trigger_source === 'AUTO_LOW_STOCK' ? 'AUTO RE-ORDER' : 'MANUAL 1-CLICK'}
                    </span>
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Ordered Qty</span>
                    <span className="font-extrabold text-white font-mono text-sm">
                      {ord.ordered_quantity} {ord.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Recipient Target</span>
                    <span className="font-mono text-emerald-400 font-semibold">{ord.recipient_whatsapp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Message SID</span>
                    <span className="font-mono text-slate-300 text-[11px] truncate block" title={ord.provider_message_sid}>
                      {ord.provider_message_sid || 'DEMO-SIM'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Timestamp</span>
                    <span className="text-slate-300 text-[11px]">{dateStr}</span>
                  </div>
                </div>

                {/* Formatted WhatsApp Message Preview */}
                <div className="p-3.5 rounded-xl bg-[#0b141a] border border-[#202c33] text-white">
                  <pre className="text-xs font-sans whitespace-pre-wrap text-[#e9edef] leading-relaxed">
                    {ord.whatsapp_message_body}
                  </pre>
                </div>

                {/* Launch Button */}
                <div className="flex justify-end pt-1">
                  <a
                    href={waMeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch in WhatsApp Web / App</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
