import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Film,
  Play,
  Share2,
  Download,
  CheckCircle2,
  Clock,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { generateRecap } from '../services/api';
import { EventItem, RecapVideo } from '../types/event';

interface RecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onRecapCreated: (updatedEvent: EventItem) => void;
}

export const RecapModal: React.FC<RecapModalProps> = ({
  isOpen,
  onClose,
  event,
  onRecapCreated,
}) => {
  const [durationOption, setDurationOption] = useState<30 | 60 | 120>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeRecap, setActiveRecap] = useState<RecapVideo | null>(
    event.recaps && event.recaps.length > 0 ? event.recaps[0] : null
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateRecap({
        eventId: event.id,
        targetDuration: durationOption,
        title: `${durationOption}s Cloudinary Smart Recap`,
      });

      setActiveRecap(result.recap);
      onRecapCreated(result.event);
    } catch (err: any) {
      console.error('Recap creation failed:', err);
      setError(err.message || 'Failed to generate recap.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (activeRecap) {
      navigator.clipboard.writeText(activeRecap.videoUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Event Recap</h2>
              <p className="text-xs text-slate-400">
                Automated highlight reel powered by Cloudinary video transforms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Duration Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Choose Target Duration:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { sec: 30, label: '30 Seconds', desc: 'Social & TikTok bite-sized' },
              { sec: 60, label: '60 Seconds', desc: 'Comprehensive story' },
              { sec: 120, label: '2 Minutes', desc: 'Extended executive recap' },
            ].map((opt) => (
              <button
                key={opt.sec}
                type="button"
                onClick={() => setDurationOption(opt.sec as 30 | 60 | 120)}
                className={`p-3 rounded-xl border text-left transition ${
                  durationOption === opt.sec
                    ? 'border-purple-500 bg-purple-500/15 text-white shadow-md shadow-purple-950/20'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{opt.label}</span>
                  <Clock className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <span className="text-[11px] text-slate-400 block leading-tight">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button or In-Progress */}
        <div className="flex items-center justify-between border-y border-slate-800 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cloud className="h-4 w-4 text-blue-400" />
            <span>Delivered via Cloudinary dynamic transform URL (f_auto, q_auto)</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Generating Cloudinary Reel...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate {durationOption}s Recap</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Video Player Display */}
        {activeRecap && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Generated Recap: {activeRecap.title}
              </span>
              <span className="text-[11px] font-mono text-purple-400">
                {activeRecap.durationSeconds}s runtime
              </span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-xl">
              <video
                src={activeRecap.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Actions for the recap video */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
                {activeRecap.videoUrl}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  <Share2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{copiedUrl ? 'Copied!' : 'Copy Cloudinary URL'}</span>
                </button>

                <a
                  href={activeRecap.videoUrl}
                  download="eventlens_recap.mp4"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Existing Event Recaps list if available */}
        {event.recaps && event.recaps.length > 1 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Previous Recaps for this Event
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {event.recaps.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRecap(r)}
                  className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition ${
                    activeRecap?.id === r.id
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.targetDuration}s Recap
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
