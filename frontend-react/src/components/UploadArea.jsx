import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const UploadArea = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) handleFiles(files);
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

  const handleFiles = useCallback(async (files) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('Document uploaded and processing started!');
      } else {
        alert('Upload failed.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error during upload.');
    } finally {
      setUploading(false);
    }
  }, [API_URL]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
        <span className="w-2 h-8 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400 inline-block"></span>
        Upload Document
      </h2>
      <div 
        className={`glass-panel p-16 text-center border-2 border-dashed transition-all duration-300 cursor-pointer relative overflow-hidden group ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-slate-600 hover:border-primary/50 hover:bg-slate-800/80'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileUpload').click()}
      >
        {/* Glow effect on hover/drag */}
        <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
        
        <input 
          type="file" 
          id="fileUpload" 
          className="hidden" 
          onChange={(e) => handleFiles(e.target.files)} 
          accept=".pdf,.docx,.doc,.txt,.csv,.jpg,.png"
        />
        
        <div className={`flex justify-center mb-6 text-primary transition-transform duration-500 z-10 relative ${isDragging ? 'scale-125 -translate-y-2' : 'group-hover:scale-110 group-hover:-translate-y-1'}`}>
          <div className="p-4 bg-slate-800/80 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <UploadCloud size={48} className="text-indigo-400" />
          </div>
        </div>
        
        <p className="text-xl text-slate-200 mb-3 font-medium z-10 relative">
          {isDragging ? 'Drop it like it\'s hot!' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-slate-500 z-10 relative">PDF, DOCX, TXT, CSV, Images (max 50MB)</p>
        
        {uploading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in">
            <div className="animate-spin h-12 w-12 border-4 border-slate-700 border-t-primary rounded-full mb-4"></div>
            <div className="text-primary font-semibold tracking-widest uppercase text-sm animate-pulse">Processing Document...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadArea;
