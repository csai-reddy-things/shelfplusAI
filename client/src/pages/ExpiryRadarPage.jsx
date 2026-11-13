import React, { useState, useEffect } from 'react';
import { ClockAlert, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import ExpiryRadarBoard from '../components/ExpiryRadarBoard.jsx';

export default function ExpiryRadarPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory');
      if (res.data?.success) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.warn('Expiry items load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ClockAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Batch Shelf-Life Radar & AI Clearance Advisor
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic markdown strategies, Buy-1-Get-1 bundle tactics, and local customer broadcast blurbs.
          </p>
        </div>

        <button
          onClick={fetchItems}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Radar</span>
        </button>
      </div>

      {/* Expiry Radar Board */}
      <ExpiryRadarBoard items={items} onRefresh={fetchItems} />
    </div>
  );
}
