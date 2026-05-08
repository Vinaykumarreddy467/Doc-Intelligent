import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, FileText, Upload } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import UploadArea from './components/UploadArea';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total: 0, processed: 0, needs_review: 0, failed: 0 });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/documents/stats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, [API_URL]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-darker text-slate-200 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none"></div>

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">DocuIntell</h1>
            <p className="text-slate-400 text-sm mt-1">Intelligent Document Processing</p>
          </div>
          
          <nav className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'documents' ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <FileText size={18} /> Documents
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'upload' ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <Upload size={18} /> Upload
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow p-6 max-w-7xl mx-auto w-full relative z-10 animate-slide-up">
        {activeTab === 'dashboard' && <Dashboard stats={stats} />}
        {activeTab === 'documents' && <DocumentList />}
        {activeTab === 'upload' && <UploadArea />}
      </main>
    </div>
  );
}

export default App;
