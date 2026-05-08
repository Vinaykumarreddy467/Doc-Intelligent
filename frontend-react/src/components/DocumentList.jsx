import React, { useState, useEffect, useCallback } from 'react';
import { Eye, CheckCircle, Trash2, Search, X, FileText } from 'lucide-react';
import VerificationModal from './VerificationModal';

const DocumentList = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('verify');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/documents`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDocs(json.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch documents', e);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Auto-polling if any document is processing
  useEffect(() => {
    const hasProcessing = docs.some(doc => doc.status === 'processing');
    let intervalId;
    
    if (hasProcessing) {
      intervalId = setInterval(() => {
        fetchDocs();
      }, 3000); // poll every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [docs, fetchDocs]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchError('');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 10 })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSearchResults(json.data);
      } else {
        setSearchError(json.message || 'Failed to perform search.');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchError('Network error while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError('');
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
        if (res.ok) fetchDocs();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const viewDocument = (id) => {
    setSelectedDocId(id);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      processing: 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
      processed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      needs_review: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      failed: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles[status] || 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
        {(status || 'unknown').replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Section */}
      <div className="glass-panel p-6 border border-slate-700/50 shadow-lg mb-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Search size={20} className="text-primary" /> Semantic Search
        </h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder="Search through document contents using natural language..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-10"
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            )}
          </div>
          <button type="submit" className="bg-primary hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2" disabled={isSearching}>
            {isSearching ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div> : 'Search'}
          </button>
        </form>

        {searchError && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
            {searchError}
          </div>
        )}

        {searchResults && (
          <div className="mt-6 animate-fade-in border-t border-slate-700/50 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Search Results</h4>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30">
                {searchResults.results ? searchResults.results.length : 0} found
              </span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {(!searchResults.results || searchResults.results.length === 0) ? (
                <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700/50 text-slate-500 italic">
                  No documents found matching your query.
                </div>
              ) : (
                searchResults.results.map((result, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-primary/40 transition-colors group cursor-pointer" onClick={() => viewDocument(result.id)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-slate-200 group-hover:text-primary transition-colors flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" /> {result.filename || 'Unknown Document'}
                      </div>
                      <div className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                        Score: {result.score || 0}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md uppercase tracking-wider">{result.type || 'unknown'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
        <span className="w-2 h-8 rounded-full bg-secondary inline-block"></span>
        All Documents
      </h2>
      <div className="glass-panel overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-400 animate-pulse">Loading documents...</div>
        ) : docs.length === 0 ? (
           <div className="p-12 text-center text-slate-500">No documents found.</div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700/50">
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Filename</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Confidence</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, index) => (
              <tr key={doc.id} className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors group">
                <td className="p-4 font-medium text-slate-500">{index + 1}</td>
                <td className="p-4 font-medium text-slate-200 flex items-center gap-2">
                  {doc.filename}
                  {doc.status === 'processing' && (
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" title="Processing..."></div>
                  )}
                </td>
                <td className="p-4 text-slate-400 capitalize">{doc.documentType || '-'}</td>
                <td className="p-4"><StatusBadge status={doc.status} /></td>
                <td className="p-4 text-slate-400">{doc.confidence ? (doc.confidence * 100).toFixed(0) + '%' : '-'}</td>
                <td className="p-4 flex gap-3 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => viewDocument(doc.id)} 
                    className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 transition-colors rounded-lg border border-transparent hover:border-indigo-400/30"
                    title="View Details"
                  >
                    <Eye size={18}/>
                  </button>
                  {doc.status === 'needs_review' && (
                    <button 
                      onClick={() => { setSelectedDocId(doc.id); setModalMode('verify'); setIsModalOpen(true); }}
                      className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors rounded-lg border border-transparent hover:border-amber-400/30"
                      title="Review"
                    >
                      <CheckCircle size={18}/>
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(doc.id)} 
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 transition-colors rounded-lg border border-transparent hover:border-rose-400/30"
                    title="Delete"
                  >
                    <Trash2 size={18}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <VerificationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        documentId={selectedDocId}
        mode={modalMode}
        onVerify={() => {
          setIsModalOpen(false);
          fetchDocs();
        }}
      />
    </div>
  );
};

export default DocumentList;
