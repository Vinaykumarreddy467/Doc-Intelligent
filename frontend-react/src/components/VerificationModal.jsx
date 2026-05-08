import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const VerificationModal = ({ isOpen, onClose, documentId, onVerify, mode = 'verify' }) => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      fetch(`${API_URL}/documents/${documentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDoc(data.data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, documentId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/documents/${documentId}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentType: doc.documentType || '',
        extractedText: doc.extractedText || '',
        summary: doc.summary || ''
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        onVerify();
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-darker/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all">
        <div className="bg-slate-800/80 p-4 text-slate-100 flex justify-between items-center border-b border-slate-700/50">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-6 rounded-full bg-secondary inline-block"></span>
            {mode === 'view' ? 'Document Details' : 'Verify Document'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow bg-slate-900/50 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-48 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-primary"></div>
              <div className="text-slate-400 text-sm animate-pulse tracking-widest uppercase">Loading details...</div>
            </div>
          ) : doc ? (
            <form id="verify-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 mb-2 pb-6 border-b border-slate-800">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Filename</div>
                  <div className="font-medium text-slate-200">{doc.filename}</div>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">AI Confidence</div>
                  <div className="font-medium text-primary text-lg">{(doc.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Document Type</label>
                <select 
                  className={`w-full p-3 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all appearance-none ${mode === 'view' ? 'opacity-70 pointer-events-none' : ''}`}
                  value={doc.documentType || ''}
                  onChange={(e) => setDoc({...doc, documentType: e.target.value})}
                  disabled={mode === 'view'}
                >
                  <option value="invoice">Invoice</option>
                  <option value="contract">Contract</option>
                  <option value="receipt">Receipt</option>
                  <option value="resume">Resume</option>
                  <option value="report">Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Extracted Text</label>
                <textarea 
                  className={`w-full p-4 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl h-40 font-mono text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-y custom-scrollbar ${mode === 'view' ? 'opacity-80' : ''}`}
                  value={doc.extractedText || ''}
                  onChange={(e) => setDoc({...doc, extractedText: e.target.value})}
                  readOnly={mode === 'view'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Summary</label>
                <textarea 
                  className={`w-full p-4 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl h-28 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-y custom-scrollbar leading-relaxed ${mode === 'view' ? 'opacity-80' : ''}`}
                  value={doc.summary || ''}
                  onChange={(e) => setDoc({...doc, summary: e.target.value})}
                  readOnly={mode === 'view'}
                />
              </div>
            </form>
          ) : (
            <div className="text-center text-rose-500 py-12 bg-rose-500/10 rounded-xl border border-rose-500/20">Failed to load document data.</div>
          )}
        </div>

        <div className="bg-slate-800/80 p-5 border-t border-slate-700/50 flex justify-end gap-3 backdrop-blur-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all text-sm font-medium">Close</button>
          {mode === 'verify' && (
            <button type="submit" form="verify-form" className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl flex items-center gap-2 transition-all font-semibold shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:-translate-y-0.5">
              <Check size={18} strokeWidth={2.5} /> Save & Verify
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
