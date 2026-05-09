import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, FileText, FileOutput, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const STEPS = [
  {
    id: 'upload',
    label: 'Uploading File',
    description: 'Sending document to server',
    icon: Upload,
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'classify',
    label: 'Classifying Document',
    description: 'AI analyzing document type',
    icon: Search,
    color: 'from-indigo-400 to-purple-500',
  },
  {
    id: 'extract',
    label: 'Extracting Fields',
    description: 'AI extracting structured data',
    icon: FileText,
    color: 'from-purple-400 to-pink-500',
  },
  {
    id: 'summarize',
    label: 'Generating Summary',
    description: 'AI creating document summary',
    icon: FileOutput,
    color: 'from-pink-400 to-rose-500',
  },
  {
    id: 'finalize',
    label: 'Finalizing',
    description: 'Completing processing pipeline',
    icon: CheckCircle2,
    color: 'from-emerald-400 to-teal-500',
  },
];

// Estimated time offsets (seconds) for when each step becomes active
const STEP_TIMING = [0, 3, 12, 35, 60];

const ProcessingOverlay = ({ isVisible, fileName, onComplete, hasError, errorMessage }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isDone, setIsDone] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!isVisible) {
      // Reset state
      setActiveStep(0);
      setCompletedSteps(new Set());
      setIsDone(false);
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
      return;
    }

    // Advance steps progressively
    const advanceStep = (stepIndex) => {
      return setTimeout(() => {
        if (stepIndex > 0) {
          setCompletedSteps(prev => new Set([...prev, stepIndex - 1]));
        }
        if (stepIndex < STEPS.length) {
          setActiveStep(stepIndex);
        }
      }, (STEP_TIMING[stepIndex] - (STEP_TIMING[stepIndex - 1] || 0)) * 1000);
    };

    const timers = [];
    for (let i = 0; i < STEPS.length; i++) {
      const timer = advanceStep(i);
      timers.push(timer);
      timersRef.current.push(timer);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [isVisible]);

  // When hasError changes, stop all timers and mark as done with error
  useEffect(() => {
    if (hasError && isVisible) {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
      setIsDone(true);
    }
  }, [hasError, isVisible]);

  // When onComplete fires (success), fast-forward all remaining steps
  useEffect(() => {
    if (onComplete && isVisible && !hasError) {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
      // Mark all steps complete
      const allDone = new Set([0, 1, 2, 3, 4]);
      setCompletedSteps(allDone);
      setActiveStep(STEPS.length);
      setIsDone(true);
    }
  }, [onComplete, isVisible, hasError]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-darker/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg mx-4 border border-slate-700/50 shadow-[0_0_60px_rgba(0,0,0,0.5)] transform transition-all">
        {/* Header */}
        <div className="bg-slate-800/80 p-5 border-b border-slate-700/50 text-center">
          <h3 className="text-lg font-semibold text-slate-100">Processing Document</h3>
          <p className="text-sm text-slate-400 mt-1 truncate max-w-full px-4">{fileName}</p>
        </div>

        {/* Steps Timeline */}
        <div className="p-6 space-y-0">
          {STEPS.map((step, index) => {
            const isActive = activeStep === index;
            const isCompleted = completedSteps.has(index);
            const isFailed = hasError && isActive;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="relative flex items-start gap-4 pb-2 last:pb-0">
                {/* Timeline connector line */}
                {index < STEPS.length - 1 && (
                  <div className={`absolute left-[19px] top-10 w-0.5 h-10 transition-colors duration-500 ${
                    isCompleted ? 'bg-emerald-500/50' : 'bg-slate-700'
                  }`} />
                )}

                {/* Step indicator */}
                <div className="relative z-10 mt-1">
                  {isFailed ? (
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center animate-pulse">
                      <AlertCircle size={18} className="text-rose-400" />
                    </div>
                  ) : isCompleted ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    </div>
                  ) : isActive ? (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} border-2 border-transparent flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]`}>
                      <Loader2 size={18} className="text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center">
                      <StepIcon size={18} className="text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className={`text-sm font-semibold transition-colors duration-300 ${
                    isFailed ? 'text-rose-400' :
                    isCompleted ? 'text-emerald-400' :
                    isActive ? 'text-slate-100' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </div>
                  <div className={`text-xs mt-0.5 transition-colors duration-300 ${
                    isActive ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {isFailed ? errorMessage || 'Processing failed' : 
                     isCompleted ? 'Complete' :
                     isActive ? step.description : 'Waiting...'}
                  </div>

                  {/* Animated progress bar for active step */}
                  {isActive && !isFailed && (
                    <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700/50 text-center">
          {hasError ? (
            <div className="text-rose-400 text-sm flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              {errorMessage || 'Processing failed. Please try again.'}
            </div>
          ) : isDone ? (
            <div className="text-emerald-400 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              Processing complete!
            </div>
          ) : (
            <div className="text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Please wait while AI processes your document...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
