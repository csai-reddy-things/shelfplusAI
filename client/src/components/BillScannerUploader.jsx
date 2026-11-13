import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, RefreshCcw, FileText, CheckCircle2, AlertCircle, Scan } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import toast from 'react-hot-toast';

export default function BillScannerUploader({ onScanComplete }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Camera stream refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      stopCamera();
    };
  }, [previewUrl]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setCameraError('Camera access denied or unavailable. Please use file upload or sample invoice.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-invoice-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  /**
   * Generates a realistic Indian Wholesale FMCG Invoice on an HTML5 canvas
   * and loads it into the scanner. Perfect for live stage demos!
   */
  const handleLoadSampleInvoice = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d');

    // Background Paper Styling
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1200, 1500);

    // Invoice Header Border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 1440);

    // Title & Distributor Info
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('ANAND FMCG & DAIRY DISTRIBUTORS PVT LTD', 60, 90);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Authorized Wholesaler & C&F Agent • APMC Yard, Yeshwanthpur, Bengaluru - 560022', 60, 125);
    ctx.fillText('GSTIN: 29AABCU9603R1ZM • WhatsApp Helpline: +91 98765 43210', 60, 155);

    // Line Divider
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 180);
    ctx.lineTo(1140, 180);
    ctx.stroke();

    // Invoice Meta
    const today = new Date().toISOString().split('T')[0];
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`TAX INVOICE: #INV-AF-884920`, 60, 220);
    ctx.fillText(`DATE: ${today}`, 850, 220);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('Billed To: Apna Supermart & Daily Kirana, Indiranagar, Bengaluru', 60, 260);

    // Table Header
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(60, 300, 1080, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('ITEM DESCRIPTION', 80, 332);
    ctx.fillText('BATCH', 500, 332);
    ctx.fillText('QTY', 660, 332);
    ctx.fillText('UNIT COST', 780, 332);
    ctx.fillText('MRP/SELL', 920, 332);
    ctx.fillText('EXPIRY', 1030, 332);

    // Table Rows
    const items = [
      { name: 'Amul Taaza Milk 500ml', batch: 'BAT-AML-902', qty: '40 pcs', cost: '₹26.50', sell: '₹29.00', exp: '2026-11-16' },
      { name: 'Britannia Whole Wheat Bread 400g', batch: 'BAT-MOD-108', qty: '25 pcs', cost: '₹36.00', sell: '₹45.00', exp: '2026-11-18' },
      { name: 'Mother Dairy Fresh Paneer 200g', batch: 'BAT-MDP-411', qty: '30 pcs', cost: '₹78.00', sell: '₹92.00', exp: '2026-11-20' },
      { name: 'Maggi 2-Minute Masala Noodles 70g (12P)', batch: 'BAT-MAG-552', qty: '15 box', cost: '₹144.00', sell: '₹168.00', exp: '2027-05-10' },
      { name: 'Britannia Good Day Butter 100g', batch: 'BAT-BGD-201', qty: '50 pcs', cost: '₹18.00', sell: '₹25.00', exp: '2027-03-15' },
      { name: 'Aashirvaad MP Atta 5kg', batch: 'BAT-ASH-771', qty: '20 pcs', cost: '₹260.00', sell: '₹315.00', exp: '2027-06-25' }
    ];

    let y = 390;
    ctx.font = '18px monospace';
    ctx.fillStyle = '#1e293b';

    items.forEach((it, idx) => {
      if (idx % 2 === 1) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(60, y - 28, 1080, 42);
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillText(it.name, 80, y);
      ctx.fillText(it.batch, 500, y);
      ctx.fillText(it.qty, 660, y);
      ctx.fillText(it.cost, 780, y);
      ctx.fillText(it.sell, 920, y);
      ctx.fillText(it.exp, 1030, y);
      y += 50;
    });

    // Summary Box
    ctx.strokeRect(700, y + 40, 440, 160);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SUBTOTAL:     ₹12,410.00', 730, y + 80);
    ctx.fillText('GST (5% & 12%): ₹1,120.00', 730, y + 120);
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('NET PAYABLE:  ₹13,530.00', 730, y + 170);

    // Terms
    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText('* Received stock in good condition. Subject to Bangalore jurisdiction.', 60, y + 250);
    ctx.fillText('Generated by Anand Wholesale Billing ERP • Verified Physical Copy', 60, y + 275);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample-wholesale-bill.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95));
        toast.success('Loaded realistic Wholesale Supplier Bill for stage demo!');
      }
    }, 'image/jpeg', 0.95);
  };

  const handleExecuteScan = async () => {
    if (!selectedFile && !previewUrl) {
      toast.error('Please upload an invoice photo or load the sample bill first.');
      return;
    }

    setIsScanning(true);
    const toastId = toast.loading('Gemini 2.5 Flash Vision analyzing supplier invoice...');

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('billImage', selectedFile);
      } else if (previewUrl) {
        formData.append('base64Image', previewUrl);
      }

      const res = await apiClient.post('/bills/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success && res.data?.data) {
        toast.success('Invoice extracted successfully with line items!', { id: toastId });
        onScanComplete(res.data.data);
      } else {
        throw new Error('Could not parse extraction payload.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(`Scan failed: ${err.message}`, { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Sample Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'camera'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>
        </div>

        <button
          onClick={handleLoadSampleInvoice}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition group shadow-sm"
        >
          <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>⚡ Load Sample Wholesale Invoice (Demo)</span>
        </button>
      </div>

      {/* Upload or Camera Capture Box */}
      <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/60 p-6 overflow-hidden min-h-[340px] flex flex-col items-center justify-center">
        {activeTab === 'upload' && !previewUrl && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center text-center max-w-md cursor-pointer"
            onClick={() => document.getElementById('bill-file-input')?.click()}
          >
            <input
              id="bill-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Scan className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Drop supplier invoice photo here or <span className="text-emerald-400 underline">browse</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Supports wholesale bills, delivery challans, and GST receipts (JPEG, PNG, WEBP up to 5MB)
            </p>
            <span className="text-[11px] px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Zero Manual Entry: Gemini extracts SKUs, Batches & Expiry Dates
            </span>
          </div>
        )}

        {activeTab === 'camera' && !previewUrl && (
          <div className="w-full flex flex-col items-center space-y-4">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{cameraError}</span>
              </div>
            ) : (
              <div className="relative w-full max-w-lg aspect-video rounded-xl overflow-hidden bg-black border border-slate-700">
                <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/50 rounded-xl m-4 border-dashed" />
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex space-x-3">
              <button
                onClick={captureCameraSnapshot}
                disabled={!cameraActive}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Take Invoice Photo</span>
              </button>
              <button
                onClick={startCamera}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Selected Image Preview with Laser Scanning Overlay */}
        {previewUrl && (
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="relative max-h-96 w-auto rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
              <img src={previewUrl} alt="Bill Preview" className="max-h-96 object-contain rounded-xl" />

              {/* Laser Scanning Animation */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[bounce_2s_infinite]" />
                  <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 shadow-2xl">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>Gemini 2.5 Flash Vision Reading Line Items...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleExecuteScan}
                disabled={isScanning}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition transform hover:scale-[1.02] disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                <span>{isScanning ? 'Extracting with Gemini...' : 'Scan Bill with Gemini Vision'}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  stopCamera();
                }}
                disabled={isScanning}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                Reset Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
