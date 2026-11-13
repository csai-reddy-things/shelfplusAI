import React, { useState } from 'react';
import {
  ClockAlert,
  Sparkles,
  Percent,
  Copy,
  Check,
  TrendingDown,
  ShoppingBag,
  AlertCircle,
  Share2,
  Tag
} from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import toast from 'react-hot-toast';

export default function ExpiryRadarBoard({ items = [], onRefresh }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [advisoryResult, setAdvisoryResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Group items by urgency bucket
  const expiredItems = items.filter((i) => (i.days_until_expiry ?? 30) <= 0);
  const criticalItems = items.filter((i) => (i.days_until_expiry ?? 30) > 0 && (i.days_until_expiry ?? 30) <= 3);
  const warningItems = items.filter((i) => (i.days_until_expiry ?? 30) > 3 && (i.days_until_expiry ?? 30) <= 14);
  const safeItems = items.filter((i) => (i.days_until_expiry ?? 30) > 14);

  // Calculate capital at risk
  const nearExpiryBatches = [...criticalItems, ...warningItems, ...expiredItems];
  const totalAtRiskCapital = nearExpiryBatches.reduce((acc, it) => {
    return acc + (Number(it.cost_price) || 0) * (Number(it.current_quantity) || 0);
  }, 0);

  // Generate AI Clearance Strategy with Gemini 2.5 Flash
  const handleGenerateAiClearance = async () => {
    if (nearExpiryBatches.length === 0) {
      toast('No near-expiry inventory batches currently require clearance!', { icon: '✨' });
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('Gemini 2.5 Flash architecting clearance bundles & markdown plan...');

    try {
      const payloadItems = nearExpiryBatches.map((b) => ({
        id: b.id,
        item_name: b.item_name,
        category: b.category,
        batch_number: b.batch_number,
        current_quantity: b.current_quantity,
        unit: b.unit,
        cost_price: b.cost_price,
        selling_price: b.selling_price,
        days_until_expiry: b.days_until_expiry
      }));

      const res = await apiClient.post('/expiry/advisory', { items: payloadItems });

      if (res.data?.success) {
        setAdvisoryResult(res.data.data);
        toast.success('AI Markdown & Clearance Strategy generated!', { id: toastId });
        onRefresh?.();
      }
    } catch (err) {
      toast.error(`Advisory failed: ${err.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyBlurb = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Promotional WhatsApp message copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & AI Advisory CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ClockAlert className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">Expiry Radar & Clearance Intelligence</h2>
          </div>
          <p className="text-xs text-slate-400">
            Automated batch shelf-life categorization. Stop discarding stock: recover up to 85% capital via AI clearance bundles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Capital at Risk</span>
            <span className="text-base font-extrabold text-rose-400 font-mono">
              ₹{totalAtRiskCapital.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={handleGenerateAiClearance}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{isGenerating ? 'Generating Strategy...' : 'Generate AI Clearance Plan'}</span>
          </button>
        </div>
      </div>

      {/* AI Strategy Results Panel (When Generated) */}
      {advisoryResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-950/20 to-slate-900/90 border border-amber-500/30 space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{advisoryResult.summary_headline}</h3>
                <p className="text-xs text-amber-300">
                  Estimated Recoverable Capital: ₹{advisoryResult.estimated_recoverable_value?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {advisoryResult.recommendations?.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 hover:border-amber-500/40 transition"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-white">{rec.item_name}</h4>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    -{rec.recommended_discount_percent}% OFF
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Promo Clearance Price:</span>
                  <span className="font-mono font-bold text-emerald-400">₹{rec.new_promotional_price}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-amber-400 block">
                    Counter & Bundle Tactic:
                  </span>
                  <p>{rec.clearance_tactic}</p>
                </div>

                {rec.whatsapp_promo_blurb && (
                  <button
                    onClick={() => handleCopyBlurb(rec.whatsapp_promo_blurb, idx)}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition"
                  >
                    {copiedId === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Broadcast!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy WhatsApp Customer Blurb</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Urgency Horizon Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bucket 1: Critical (0-3 Days) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/30 border border-rose-500/40">
            <span className="text-xs font-bold text-rose-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Critical (0–3 Days)</span>
            </span>
            <span className="text-xs font-mono font-bold text-white bg-rose-500/20 px-2 py-0.5 rounded-md">
              {criticalItems.length}
            </span>
          </div>

          <div className="space-y-2">
            {criticalItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
                No critical batches right now.
              </div>
            ) : (
              criticalItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition space-y-1.5"
                >
                  <div className="font-bold text-xs text-white">{item.item_name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Stock: {item.current_quantity} {item.unit}</span>
                    <span className="text-rose-400 font-bold font-mono">
                      {item.days_until_expiry}d left
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Batch: {item.batch_number} • Exp: {item.expiry_date}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bucket 2: Warning (4-14 Days) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-500/40">
            <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Warning (4–14 Days)</span>
            </span>
            <span className="text-xs font-mono font-bold text-white bg-amber-500/20 px-2 py-0.5 rounded-md">
              {warningItems.length}
            </span>
          </div>

          <div className="space-y-2">
            {warningItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
                No warning batches.
              </div>
            ) : (
              warningItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition space-y-1.5"
                >
                  <div className="font-bold text-xs text-white">{item.item_name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Stock: {item.current_quantity} {item.unit}</span>
                    <span className="text-amber-400 font-bold font-mono">
                      {item.days_until_expiry}d left
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Batch: {item.batch_number} • Exp: {item.expiry_date}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bucket 3: Expired */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
              <span>Expired Batches</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {expiredItems.length}
            </span>
          </div>

          <div className="space-y-2">
            {expiredItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
                Zero expired stock on shelves!
              </div>
            ) : (
              expiredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-rose-900/40 space-y-1.5 opacity-80"
                >
                  <div className="font-bold text-xs text-rose-300 line-through">{item.item_name}</div>
                  <div className="text-[11px] text-rose-400">
                    Expired on {item.expiry_date} ({item.current_quantity} {item.unit})
                  </div>
                  <div className="text-[10px] text-slate-500">Mark for supplier return credit</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bucket 4: Safe / Healthy (> 14 Days) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Safe Stock (&gt;14 Days)</span>
            </span>
            <span className="text-xs font-mono font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded-md">
              {safeItems.length}
            </span>
          </div>

          <div className="space-y-2">
            {safeItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
              >
                <div className="font-medium text-xs text-white truncate">{item.item_name}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.current_quantity} {item.unit}</span>
                  <span className="text-emerald-400 font-mono font-medium">{item.days_until_expiry}d left</span>
                </div>
              </div>
            ))}
            {safeItems.length > 4 && (
              <div className="text-center text-[11px] text-slate-500 pt-1">
                + {safeItems.length - 4} more healthy batches
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
