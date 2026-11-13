import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ExternalLink, X, Smartphone, Clock, Sparkles, MessageSquare } from 'lucide-react';

export default function LiveWhatsappToastModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const navigate = useNavigate();

  const order = data.order || data;
  const dispatch = data.dispatch || {};
  const waMeLink = data.waMeLink || dispatch.waMeLink;
  const status = dispatch.status || order.dispatch_status || 'DEMO_SIMULATED';
  const providerSid = dispatch.providerSid || order.provider_message_sid || 'DEMO-SIM-001';
  const messageBody = order.whatsapp_message_body || dispatch.messageBody || '';
  const recipient = order.recipient_whatsapp || dispatch.recipient || '+919876543210';
  const itemName = order.item_name_snapshot || 'Supermarket Stock Item';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">WhatsApp Restock Dispatched!</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  status === 'SENT_LIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                }`}>
                  {status === 'SENT_LIVE' ? 'LIVE TWILIO DISPATCH' : 'STAGE DEMO SIMULATED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Low-stock safety threshold breached: Auto PO triggered</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dispatch Metadata Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Supplier WhatsApp Target
            </span>
            <div className="flex items-center space-x-1.5 font-mono font-bold text-emerald-400">
              <Smartphone className="w-3.5 h-3.5" />
              <span>{recipient}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Provider Message SID
            </span>
            <div className="font-mono text-slate-300 truncate" title={providerSid}>
              {providerSid}
            </div>
          </div>
        </div>

        {/* WhatsApp Chat Bubble Preview */}
        <div className="p-4 rounded-xl bg-[#0b141a] border border-[#202c33] text-white space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#8696a0] pb-2 border-b border-[#202c33]">
            <span>WhatsApp Business Order Preview</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Formatted for Mobile</span>
            </span>
          </div>
          <pre className="text-xs font-sans whitespace-pre-wrap text-[#e9edef] leading-relaxed max-h-48 overflow-y-auto">
            {messageBody}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {waMeLink && (
            <a
              href={waMeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:scale-[1.02]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in WhatsApp Web / App</span>
            </a>
          )}
          <button
            onClick={() => {
              onClose();
              navigate('/restock-orders');
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            View Restock History
          </button>
        </div>
      </div>
    </div>
  );
}
