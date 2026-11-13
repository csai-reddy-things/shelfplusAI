import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, CheckCircle2, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import BillScannerUploader from '../components/BillScannerUploader.jsx';
import ExtractedBillReviewTable from '../components/ExtractedBillReviewTable.jsx';

export default function ScanBillPage() {
  const navigate = useNavigate();
  const [extractedData, setExtractedData] = useState(null);
  const [committedResult, setCommittedResult] = useState(null);

  const handleScanComplete = (data) => {
    setExtractedData(data);
    setCommittedResult(null);
  };

  const handleCommitSuccess = (result) => {
    setCommittedResult(result);
  };

  const handleReset = () => {
    setExtractedData(null);
    setCommittedResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ScanLine className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              AI Vision Supplier Bill Scanner
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-entry wholesale invoice ingestion powered by Gemini 2.5 Flash Vision.
          </p>
        </div>

        {extractedData && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Another Invoice</span>
          </button>
        )}
      </div>

      {/* Main Scanner Flow */}
      {!extractedData && !committedResult && (
        <BillScannerUploader onScanComplete={handleScanComplete} />
      )}

      {extractedData && !committedResult && (
        <ExtractedBillReviewTable
          initialData={extractedData}
          onCommitSuccess={handleCommitSuccess}
          onCancel={handleReset}
        />
      )}

      {committedResult && (
        <div className="p-8 rounded-2xl bg-gradient-to-b from-emerald-950/20 to-slate-900 border border-emerald-500/40 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Inventory Synchronized Successfully!</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Added <strong className="text-emerald-400">{committedResult.syncedItemsCount} batches</strong> to your live supermarket stock ledger with verified batch codes and expiry horizons.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:scale-105"
            >
              <span>View in Smart Inventory & POS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            >
              Scan Another Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
