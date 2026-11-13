import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Package, ScanLine, RefreshCw, Zap } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import InventoryTableWithPosSimulator from '../components/InventoryTableWithPosSimulator.jsx';
import LiveWhatsappToastModal from '../components/LiveWhatsappToastModal.jsx';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { stageDemoNumber } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRestockNotification, setActiveRestockNotification] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory');
      if (res.data?.success) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load inventory:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRestockTriggered = (orderData) => {
    setActiveRestockNotification(orderData);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title & Stage Demo Instructions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Smart Inventory Ledger & POS Simulator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock tracking with live safety thresholds. Click <span className="text-amber-400 font-bold">-5 Rush Sale</span> to trigger automated WhatsApp restock POs on stage.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/scan-bill')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:scale-[1.02]"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan New Bill</span>
          </button>
        </div>
      </div>

      {/* Main Table & POS Component */}
      <InventoryTableWithPosSimulator
        items={items}
        loading={loading}
        onRefresh={fetchInventory}
        onRestockTriggered={handleRestockTriggered}
        stageDemoNumber={stageDemoNumber}
      />

      {/* Real-Time Live WhatsApp Toast / Modal */}
      {activeRestockNotification && (
        <LiveWhatsappToastModal
          isOpen={Boolean(activeRestockNotification)}
          onClose={() => setActiveRestockNotification(null)}
          data={activeRestockNotification}
        />
      )}
    </div>
  );
}
