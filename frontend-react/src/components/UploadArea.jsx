import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle } from 'lucide-react';
import ProcessingOverlay from './ProcessingOverlay';

const UploadArea = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState(false);
  const [errorText, setErrorText] = useState('');
  const uploadPromiseRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

  const handleFileSelect = useCallback((files) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setMessage(null);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setProcessingComplete(false);
    setProcessingError(false);
    setErrorText('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Store the promise so ProcessingOverlay can detect completion
    const uploadPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/documents/upload`, {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();

        if (res.ok && json.success) {
          setMessage({ type: 'success', text: `Document processed! Status: ${json.data.status}` });
          setProcessingComplete(true);
          setSelectedFile(null);
          // Navigate to dashboard after a moment
          setTimeout(() => {
            setUploading(false);
            if (onUploadComplete) onUploadComplete();
          }, 2000);
        } else {
          throw new Error(json.message || 'Upload failed');
        }
      } catch (e) {
        console.error(e);
        setProcessingError(true);
        setErrorText(e.message || 'Network error during upload. Is the backend running?');
        setMessage({ type: 'error', text: e.message || 'Network error during upload.' });
        setTimeout(() => setUploading(false), 2000);
      }
    })();

    uploadPromiseRef.current = uploadPromise;
  }, [selectedFile, API_URL, onUploadComplete]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
        <span className="w-2 h-8 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400 inline-block"></span>
        Upload Document
      </h2>

      {/* Message */}
      {message && !uploading && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Drop zone */}
      <div 
        className={`glass-panel p-16 text-center border-2 border-dashed transition-all duration-300 cursor-pointer relative overflow-hidden group ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-slate-600 hover:border-primary/50 hover:bg-slate-800/80'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && document.getElementById('fileUpload').click()}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
        
        <input 
          type="file" 
          id="fileUpload" 
          className="hidden" 
          onChange={(e) => handleFileSelect(e.target.files)} 
          accept=".pdf,.docx,.doc,.txt,.csv,.jpg,.png"
          disabled={uploading}
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
        
        {/* Selected file indicator */}
        {selectedFile && !uploading && (
          <div className="mt-6 z-10 relative inline-flex items-center gap-3 bg-slate-800/80 px-5 py-3 rounded-xl border border-slate-700/50">
            <File size={20} className="text-primary" />
            <span className="text-slate-200 font-medium">{selectedFile.name}</span>
            <span className="text-xs text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Upload button */}
      {selectedFile && !uploading && (
        <button 
          onClick={handleUpload}
          className="w-full py-4 bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-400 hover:to-primary text-white rounded-xl font-semibold text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
        >
          <UploadCloud size={22} />
          Upload & Process
        </button>
      )}

      {/* Upload progress indicator (small bar while overlay is shown) */}
      {uploading && (
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary via-secondary to-emerald-400 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
      )}

      {/* Step-by-step processing overlay */}
      <ProcessingOverlay 
        isVisible={uploading}
        fileName={selectedFile?.name || ''}
        onComplete={processingComplete}
        hasError={processingError}
        errorMessage={errorText}
      />
    </div>
  );
};

export default UploadArea;
