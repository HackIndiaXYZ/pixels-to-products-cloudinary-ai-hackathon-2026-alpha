import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Cloud,
  Film,
  Zap,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { analyzeEvent } from '../services/api';
import { EventItem } from '../types/event';

interface ProcessingViewProps {
  event: EventItem;
  onProcessingComplete: (updatedEvent: EventItem) => void;
  onCancel: () => void;
}

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  icon: any;
}

const STEPS: PipelineStep[] = [
  {
    id: 'upload',
    label: 'Uploading video',
    description: 'Stored securely in Cloudinary media bucket with automatic ingest transformations',
    icon: Cloud,
  },
  {
    id: 'analyze_media',
    label: 'Analyzing media',
    description: 'Extracting video duration, audio stream, and visual resolution metadata',
    icon: Film,
  },
  {
    id: 'moments',
    label: 'Finding important moments',
    description: 'Detecting speaker transitions, visual demonstrations, and milestone events',
    icon: Zap,
  },
  {
    id: 'summary',
    label: 'Generating summary',
    description: 'Gemini 3.8 Flash synthesizing executive overview, speakers, and key takeaways',
    icon: Sparkles,
  },
  {
    id: 'highlights',
    label: 'Creating highlights',
    description: 'Generating Cloudinary clip URLs (so_, eo_) and chapter frame thumbnails',
    icon: Film,
  },
  {
    id: 'optimize',
    label: 'Optimizing delivery',
    description: 'Configuring dynamic CDN delivery with f_auto and q_auto parameters',
    icon: CheckCircle2,
  },
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  event,
  onProcessingComplete,
  onCancel,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultEvent, setResultEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Simulate progressive step transitions while real Gemini API runs
    const timer1 = setTimeout(() => {
      if (isMounted) setCurrentStepIndex(2);
    }, 1200);

    const timer2 = setTimeout(() => {
      if (isMounted) setCurrentStepIndex(3);
    }, 2400);

    // Call real backend analyze endpoint
    analyzeEvent(event.id)
      .then((updated) => {
        if (!isMounted) return;
        setResultEvent(updated);
        setCurrentStepIndex(4);
        setTimeout(() => {
          if (!isMounted) return;
          setCurrentStepIndex(5);
          setTimeout(() => {
            if (!isMounted) return;
            setIsDone(true);
            onProcessingComplete(updated);
          }, 800);
        }, 800);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Processing error:', err);
        setError(err.message || 'Media analysis failed. Please try again.');
      });

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [event.id]);

  const handleRetry = () => {
    setError(null);
    setCurrentStepIndex(1);
    analyzeEvent(event.id)
      .then((updated) => {
        setResultEvent(updated);
        setCurrentStepIndex(5);
        setIsDone(true);
        onProcessingComplete(updated);
      })
      .catch((err) => {
        setError(err.message || 'Retry failed');
      });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs text-purple-300">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-purple-400" />
            <span>Cloudinary AI Media Pipeline in Action</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Processing "{event.title}"
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Extracting timestamped chapters, executive summaries, and Cloudinary-optimized clips.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-200">
                <p className="font-semibold text-sm">Processing Encountered an Issue</p>
                <p className="mt-1 text-red-300/80">{error}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Analysis
              </button>
            </div>
          </div>
        )}

        {/* Step-by-Step Pipeline Progress */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || isDone;
            const isCurrent = idx === currentStepIndex && !isDone && !error;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-300 ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isCurrent
                    ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-950/20'
                    : 'border-slate-800/80 bg-slate-950/30 opacity-40'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : isCurrent ? (
                    <div className="h-6 w-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        isCompleted
                          ? 'text-emerald-300'
                          : isCurrent
                          ? 'text-purple-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                      {isCompleted && ' ✓'}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-mono text-purple-400 animate-pulse">
                        Processing...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Action */}
        {isDone && resultEvent && (
          <div className="pt-2 text-center">
            <button
              onClick={() => onProcessingComplete(resultEvent)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-purple-600/30 hover:brightness-110 active:scale-95 transition"
            >
              <span>Open Event Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
