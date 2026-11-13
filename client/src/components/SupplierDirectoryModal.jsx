import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Phone, Clock, Store, Check, Smartphone } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'DAIRY_AND_CHILLED',
  'BAKERY_AND_BREADS',
  'SNACKS_AND_BISCUITS',
  'BEVERAGES_AND_JUICES',
  'STAPLES_AND_GRAINS',
  'INSTANT_AND_PACKAGED_FOOD',
  'PERSONAL_AND_HOME_CARE',
  'FRESH_PRODUCE'
];

export default function SupplierDirectoryModal({ isOpen, onClose }) {
  const { stageDemoNumber, setStageDemoNumber } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    whatsapp_number: stageDemoNumber || '+919876543210',
    primary_category: 'DAIRY_AND_CHILLED',
    lead_time_hours: 24
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/suppliers');
      if (res.data?.success) {
        setSuppliers(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch suppliers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Registering distributor...');

    try {
      const res = await apiClient.post('/suppliers', {
        ...formData,
        lead_time_hours: parseInt(formData.lead_time_hours, 10)
      });

      if (res.data?.success) {
        toast.success('Supplier successfully registered!', { id: toastId });
        setShowAddForm(false);
        setFormData({
          supplier_name: '',
          contact_person: '',
          whatsapp_number: stageDemoNumber,
          primary_category: 'DAIRY_AND_CHILLED',
          lead_time_hours: 24
        });
        fetchSuppliers();
      }
    } catch (err) {
      toast.error(`Supplier creation failed: ${err.message}`, { id: toastId });
    }
  };

  const handleSetAsDemoNumber = (num) => {
    setStageDemoNumber(num);
    toast.success(`Active Stage Demo WhatsApp number set to ${num}!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Wholesale Distributor Directory</h3>
              <p className="text-xs text-slate-400">Manage local suppliers & stage demo WhatsApp contacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stage Demo Number Callout */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Active Live Demo Target:</span>
            <span className="font-mono font-bold text-emerald-300">{stageDemoNumber}</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-restock messages route here</span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {showAddForm ? (
            <form onSubmit={handleCreateSupplier} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-white">Register New Wholesale Supplier</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Supplier Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    placeholder="e.g. Anand FMCG Wholesalers"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Suresh (Sales Desk)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">WhatsApp Number (E.164 with +)</label>
                  <input
                    type="text"
                    required
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fulfillment Lead Time (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.lead_time_hours}
                    onChange={(e) => setFormData({ ...formData, lead_time_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Primary Product Category</label>
                  <select
                    value={formData.primary_category}
                    onChange={(e) => setFormData({ ...formData, primary_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                Save Supplier
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Wholesale Distributor</span>
            </button>
          )}

          {/* Suppliers List */}
          <div className="space-y-2">
            {loading ? (
              <p className="text-xs text-center text-slate-500 py-6">Loading suppliers...</p>
            ) : suppliers.length === 0 ? (
              <p className="text-xs text-center text-slate-500 py-6">
                No suppliers registered yet. Click "Seed Demo Stock" or add one above.
              </p>
            ) : (
              suppliers.map((supp) => {
                const isCurrentDemo = supp.whatsapp_number === stageDemoNumber;
                return (
                  <div
                    key={supp.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{supp.supplier_name}</span>
                        {isCurrentDemo && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active Stage Target
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 flex items-center space-x-3 text-[11px]">
                        <span>{supp.contact_person || 'Sales Desk'}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400">{supp.whatsapp_number}</span>
                        <span>•</span>
                        <span>Lead: {supp.lead_time_hours}h</span>
                      </div>
                    </div>

                    {!isCurrentDemo && (
                      <button
                        onClick={() => handleSetAsDemoNumber(supp.whatsapp_number)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition"
                      >
                        Set as Target
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
