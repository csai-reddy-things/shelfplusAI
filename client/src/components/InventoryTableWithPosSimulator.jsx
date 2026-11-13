import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ArrowUpDown,
  Phone
} from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'DAIRY_AND_CHILLED', label: 'Dairy & Chilled' },
  { value: 'BAKERY_AND_BREADS', label: 'Bakery & Breads' },
  { value: 'SNACKS_AND_BISCUITS', label: 'Snacks & Biscuits' },
  { value: 'BEVERAGES_AND_JUICES', label: 'Beverages' },
  { value: 'STAPLES_AND_GRAINS', label: 'Staples' },
  { value: 'INSTANT_AND_PACKAGED_FOOD', label: 'Instant Foods' },
  { value: 'PERSONAL_AND_HOME_CARE', label: 'Personal Care' },
  { value: 'FRESH_PRODUCE', label: 'Produce' }
];

export default function InventoryTableWithPosSimulator({
  items = [],
  loading = false,
  onRefresh,
  onRestockTriggered,
  stageDemoNumber
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, LOW_STOCK, CRITICAL, WARNING, HEALTHY, EXPIRED
  const [adjustingId, setAdjustingId] = useState(null);

  // Filter items in-memory for instant responsive UI
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku_code?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'LOW_STOCK') {
      matchesStatus = item.is_low_stock;
    } else if (selectedStatus !== 'ALL') {
      matchesStatus = item.expiry_status === selectedStatus;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // POS Sale Simulation: Adjust stock by -1 or -5
  const handleSaleSimulation = async (item, delta) => {
    setAdjustingId(item.id);
    const toastId = toast.loading(`Simulating ${Math.abs(delta)} unit sale for ${item.item_name}...`);

    try {
      const res = await apiClient.patch(`/inventory/${item.id}/adjust-stock`, {
        delta,
        override_whatsapp_recipient: stageDemoNumber
      });

      if (res.data?.success) {
        const { isBelowThreshold, restockTriggered, restockDetails, newQuantity } = res.data.data;

        if (isBelowThreshold && restockTriggered) {
          toast.success(
            `⚡ Low stock threshold breached! Automated WhatsApp restock order dispatched!`,
            { id: toastId, duration: 4000 }
          );
          if (onRestockTriggered) {
            onRestockTriggered(restockDetails);
          }
        } else {
          toast.success(`Sale recorded! Stock is now ${newQuantity} ${item.unit}.`, { id: toastId });
        }

        onRefresh?.();
      }
    } catch (err) {
      toast.error(`Sale simulation error: ${err.message}`, { id: toastId });
    } finally {
      setAdjustingId(null);
    }
  };

  // Manual Restock One-Click Trigger
  const handleManualRestock = async (item) => {
    setAdjustingId(item.id);
    const toastId = toast.loading(`Generating WhatsApp restock PO for ${item.item_name}...`);

    try {
      const res = await apiClient.post('/restock/trigger', {
        inventory_item_id: item.id,
        order_quantity: item.recommended_reorder_qty || 25,
        override_whatsapp_recipient: stageDemoNumber
      });

      if (res.data?.success) {
        toast.success(`WhatsApp restock PO dispatched to distributor!`, { id: toastId });
        if (onRestockTriggered) {
          onRestockTriggered(res.data.data);
        }
        onRefresh?.();
      }
    } catch (err) {
      toast.error(`Restock trigger failed: ${err.message}`, { id: toastId });
    } finally {
      setAdjustingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items, batches, SKU codes..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'ALL', label: 'All Stock' },
            { id: 'LOW_STOCK', label: '⚠️ Low Stock' },
            { id: 'CRITICAL', label: '🚨 Critical (0-3d)' },
            { id: 'WARNING', label: '⏳ Warning (4-14d)' },
            { id: 'HEALTHY', label: '✅ Healthy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedStatus === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition ${
              selectedCategory === cat.value
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Inventory & POS Simulator Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Product & SKU</th>
              <th className="py-3.5 px-4 font-semibold">Category</th>
              <th className="py-3.5 px-4 font-semibold">Batch Code</th>
              <th className="py-3.5 px-4 font-semibold min-w-[160px]">Stock Health</th>
              <th className="py-3.5 px-4 font-semibold">Price (₹)</th>
              <th className="py-3.5 px-4 font-semibold">Expiry Radar</th>
              <th className="py-3.5 px-4 font-semibold">Assigned Supplier</th>
              <th className="py-3.5 px-4 font-semibold text-center min-w-[200px]">
                POS Simulator & Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span>Loading live supermarket batches...</span>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <p className="text-sm">No inventory items matched your filter criteria.</p>
                  <p className="text-xs text-slate-500 mt-1">Use the "Load Demo Stock" button in the sidebar or scan a supplier bill.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const days = item.days_until_expiry ?? 30;
                const isCritical = days <= 3;
                const isWarning = days > 3 && days <= 14;
                const isLow = item.current_quantity <= item.min_stock_threshold;
                const progressPercent = Math.min(
                  100,
                  Math.round((item.current_quantity / (item.min_stock_threshold * 2.5)) * 100)
                );

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition group ${
                      isLow ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Item Name & SKU */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{item.item_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.sku_code || 'SKU-STD'}</div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Batch Number */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">
                      {item.batch_number}
                    </td>

                    {/* Stock Health Progress Bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-extrabold ${isLow ? 'text-amber-400' : 'text-white'}`}>
                            {item.current_quantity} {item.unit}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Min: {item.min_stock_threshold}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLow
                                ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-400 font-mono text-xs">₹{item.selling_price}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Cost: ₹{item.cost_price}</div>
                    </td>

                    {/* Expiry Badge */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            days <= 0
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isCritical
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {days <= 0
                              ? 'Expired'
                              : `${days}d left`}
                          </span>
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.expiry_date}
                        </div>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="py-3 px-4">
                      <div className="text-xs text-white truncate max-w-[150px]">
                        {item.suppliers?.supplier_name || 'Wholesale Hub'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{item.suppliers?.whatsapp_number || stageDemoNumber}</span>
                      </div>
                    </td>

                    {/* POS Simulator Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleSaleSimulation(item, -1)}
                          disabled={adjustingId === item.id || item.current_quantity <= 0}
                          title="Simulate Single Customer Sale (-1 Unit)"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-emerald-500/40 transition disabled:opacity-40"
                        >
                          -1 Sale
                        </button>

                        <button
                          onClick={() => handleSaleSimulation(item, -5)}
                          disabled={adjustingId === item.id || item.current_quantity <= 0}
                          title="Stage Demo: Simulate Rush Sale (-5 Units) to trigger live WhatsApp Restock PO!"
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/20 transition disabled:opacity-40"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>-5 Rush</span>
                        </button>

                        <button
                          onClick={() => handleManualRestock(item)}
                          disabled={adjustingId === item.id}
                          title="Trigger WhatsApp Restock Purchase Order to Supplier"
                          className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
