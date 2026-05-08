import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

const Dashboard = ({ stats }) => {
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/documents`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRecentDocs(json.data.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Failed to fetch recent docs', e);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Auto-polling if any document is processing
  useEffect(() => {
    const hasProcessing = recentDocs.some(doc => doc.status === 'processing');
    let intervalId;
    
    if (hasProcessing) {
      intervalId = setInterval(() => {
        fetchRecent();
      }, 3000); // poll every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [recentDocs, fetchRecent]);

  const StatusBadge = ({ status }) => {
    const styles = {
      processing: 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
      processed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      needs_review: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      failed: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${styles[status] || 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
        {(status || 'unknown').replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section>
        <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2 mb-6">
          <span className="w-2 h-8 rounded-full bg-primary inline-block"></span>
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Documents" value={stats.total || 0} color="from-blue-500 to-indigo-500" />
          <StatCard title="Processed" value={stats.processed || 0} color="from-emerald-400 to-teal-500" />
          <StatCard title="Needs Review" value={stats.needs_review || 0} color="from-amber-400 to-orange-500" />
          <StatCard title="Failed" value={stats.failed || 0} color="from-rose-500 to-red-600" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2 mb-6">
          <span className="w-2 h-8 rounded-full bg-secondary inline-block"></span>
          Recent Documents
        </h2>
        <div className="glass-panel overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading recent documents...</div>
          ) : recentDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No recent documents.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Filename</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc, index) => (
                  <tr key={doc.id} className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-medium text-slate-500">{index + 1}</td>
                    <td className="p-4 font-medium text-slate-200 flex items-center gap-2">
                      {doc.filename}
                      {doc.status === 'processing' && (
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" title="Processing..."></div>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 capitalize">{doc.documentType || '-'}</td>
                    <td className="p-4"><StatusBadge status={doc.status} /></td>
                    <td className="p-4 text-slate-400 text-sm flex items-center gap-1 h-full"><Clock size={14} /> {new Date(doc.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="glass-card relative overflow-hidden p-6 flex flex-col group transition-all duration-300 hover:border-slate-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full transition-transform duration-500 group-hover:scale-110`}></div>
    <div className="text-slate-400 mt-1 text-xs uppercase tracking-widest font-semibold z-10">{title}</div>
    <div className={`text-5xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r ${color} z-10`}>{value}</div>
  </div>
);

export default Dashboard;
