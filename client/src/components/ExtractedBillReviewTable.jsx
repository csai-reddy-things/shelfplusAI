import React, { useState } from 'react';
import { Check, Plus, Trash2, AlertTriangle, ShieldCheck, ArrowRight, Store, Calendar, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiClient } from '../lib/apiClient.js';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'DAIRY_AND_CHILLED', label: 'Dairy & Chilled' },
  { value: 'BAKERY_AND_BREADS', label: 'Bakery & Breads' },
  { value: 'SNACKS_AND_BISCUITS', label: 'Snacks & Biscuits' },
  { value: 'BEVERAGES_AND_JUICES', label: 'Beverages & Juices' },
  { value: 'STAPLES_AND_GRAINS', label: 'Staples & Grains' },
  { value: 'INSTANT_AND_PACKAGED_FOOD', label: 'Instant & Packaged Food' },
  { value: 'PERSONAL_AND_HOME_CARE', label: 'Personal & Home Care' },
  { value: 'FRESH_PRODUCE', label: 'Fresh Produce' }
];

const UNITS = ['pcs', 'packets', 'kg', 'liters', 'boxes', 'cartons'];

export default function ExtractedBillReviewTable({ initialData, onCommitSuccess, onCancel }) {
  const [header, setHeader] = useState({
    supplier_name: initialData.supplier_name || 'Wholesale Supplier Desk',
    supplier_phone: initialData.supplier_phone || '+919876543210',
    invoice_number: initialData.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
    invoice_date: initialData.invoice_date || new Date().toISOString().split('T')[0],
    total_amount: Number(initialData.total_amount) || 0,
    confidence_score: initialData.confidence_score || 0.95
  });

  const [items, setItems] = useState(initialData.items || []);
  const [isCommitting, setIsCommitting] = useState(false);

  const handleHeaderChange = (field, val) => {
    setHeader((prev) => ({ ...prev, [field]: val }));
  };

  const handleItemChange = (index, field, val) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddItem = () => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    const futureDate = today.toISOString().split('T')[0];

    setItems((prev) => [
      ...prev,
      {
        item_name: 'New Stock Item',
        sku_code: `SKU-${Date.now().toString().slice(-4)}`,
        category: 'SNACKS_AND_BISCUITS',
        batch_number: `BAT-${Date.now().toString().slice(-6)}`,
        quantity_received: 10,
        unit: 'pcs',
        cost_price: 25.00,
        selling_price: 30.00,
        expiry_date: futureDate,
        is_expiry_estimated: false,
        min_stock_threshold: 5,
        recommended_reorder_qty: 25
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('Invoice must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    const toastId = toast.loading('Syncing approved bill items into live inventory...');

    try {
      const payload = {
        supplier_name: header.supplier_name,
        supplier_phone: header.supplier_phone,
        invoice_number: header.invoice_number,
        invoice_date: header.invoice_date,
        total_amount: Number(header.total_amount) || 0,
        confidence_score: header.confidence_score,
        items: items.map((it) => ({
          item_name: it.item_name,
          sku_code: it.sku_code || '',
          category: it.category,
          batch_number: it.batch_number,
          quantity_received: parseInt(it.quantity_received, 10),
          unit: it.unit,
          cost_price: parseFloat(it.cost_price),
          selling_price: parseFloat(it.selling_price),
          expiry_date: it.expiry_date,
          is_expiry_estimated: Boolean(it.is_expiry_estimated),
          min_stock_threshold: parseInt(it.min_stock_threshold || 5, 10),
          recommended_reorder_qty: parseInt(it.recommended_reorder_qty || 20, 10)
        }))
      };

      const res = await apiClient.post('/bills/commit', payload);

      if (res.data?.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success(res.data.message || 'Inventory synced successfully!', { id: toastId });
        onCommitSuccess?.(res.data.data);
      }
    } catch (err) {
      console.error('Commit error:', err);
      toast.error(`Sync failed: ${err.message}`, { id: toastId });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-2xl">
      {/* Header Overview Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-white">Review & Confirm Extracted Bill</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Confidence: {Math.round((header.confidence_score || 0.95) * 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gemini Vision has extracted line items. Review or tweak dates and thresholds before approving into Supabase.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            disabled={isCommitting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            Discard
          </button>
          <button
            onClick={handleCommit}
            disabled={isCommitting}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Approve & Sync to Inventory</span>
          </button>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
            <Store className="w-3 h-3 text-emerald-400" />
            <span>Supplier / Distributor Name</span>
          </label>
          <input
            type="text"
            value={header.supplier_name}
            onChange={(e) => handleHeaderChange('supplier_name', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
            <FileText className="w-3 h-3 text-emerald-400" />
            <span>Invoice / Bill Reference No</span>
          </label>
          <input
            type="text"
            value={header.invoice_number}
            onChange={(e) => handleHeaderChange('invoice_number', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>Invoice Date</span>
          </label>
          <input
            type="date"
            value={header.invoice_date}
            onChange={(e) => handleHeaderChange('invoice_date', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Invoice Total Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={header.total_amount}
            onChange={(e) => handleHeaderChange('total_amount', parseFloat(e.target.value) || 0)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Item Name</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Batch Code</th>
              <th className="py-3 px-3">Qty</th>
              <th className="py-3 px-3">Unit</th>
              <th className="py-3 px-3">Cost (₹)</th>
              <th className="py-3 px-3">MRP (₹)</th>
              <th className="py-3 px-3">Expiry Date</th>
              <th className="py-3 px-3">Safety Min</th>
              <th className="py-3 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                <td className="py-2.5 px-3 min-w-[200px]">
                  <input
                    type="text"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                    className="w-full text-xs font-semibold px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white focus:border-emerald-500"
                  />
                </td>
                <td className="py-2.5 px-3 min-w-[160px]">
                  <select
                    value={item.category}
                    onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-300 focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 px-3 min-w-[120px]">
                  <input
                    type="text"
                    value={item.batch_number}
                    onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-300 focus:border-emerald-500"
                  />
                </td>
                <td className="py-2.5 px-3 w-20">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity_received}
                    onChange={(e) => handleItemChange(idx, 'quantity_received', parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-bold text-center px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white focus:border-emerald-500"
                  />
                </td>
                <td className="py-2.5 px-3 w-24">
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-300 focus:border-emerald-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 px-3 w-24">
                  <input
                    type="number"
                    step="0.5"
                    value={item.cost_price}
                    onChange={(e) => handleItemChange(idx, 'cost_price', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-300 focus:border-emerald-500"
                  />
                </td>
                <td className="py-2.5 px-3 w-24">
                  <input
                    type="number"
                    step="0.5"
                    value={item.selling_price}
                    onChange={(e) => handleItemChange(idx, 'selling_price', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-semibold px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-emerald-400 focus:border-emerald-500"
                  />
                </td>
                <td className="py-2.5 px-3 min-w-[160px]">
                  <div className="space-y-1">
                    <input
                      type="date"
                      value={item.expiry_date}
                      onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                      className={`w-full text-xs font-mono px-2 py-1.5 rounded bg-slate-950 border focus:border-emerald-500 ${
                        item.is_expiry_estimated
                          ? 'border-amber-500/60 text-amber-300'
                          : 'border-slate-700 text-slate-300'
                      }`}
                    />
                    {item.is_expiry_estimated && (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-amber-400 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        <span>AI Estimated Date</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 w-20">
                  <input
                    type="number"
                    min="1"
                    value={item.min_stock_threshold}
                    onChange={(e) => handleItemChange(idx, 'min_stock_threshold', parseInt(e.target.value, 10) || 5)}
                    className="w-full text-xs text-center px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-300 focus:border-emerald-500"
                  />
                </td>
                <td className="py-2.5 px-2 text-center">
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    title="Remove row"
                    className="p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleAddItem}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add Item Row</span>
        </button>

        <div className="text-xs text-slate-400">
          Total Line Items: <span className="font-bold text-white">{items.length}</span>
        </div>
      </div>
    </div>
  );
}
