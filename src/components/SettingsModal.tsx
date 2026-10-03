import React, { useState } from 'react';
import {
  X,
  Cloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  ShieldCheck,
  ArrowDown,
  RefreshCw,
  Key,
  Save,
} from 'lucide-react';
import { ConfigStatus, seedDemoEvents, updateCredentials } from '../services/api';
import { EventItem } from '../types/event';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigStatus | null;
  onResetDemoData: (events: EventItem[]) => void;
  onConfigUpdated?: (config: ConfigStatus) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onResetDemoData,
  onConfigUpdated,
}) => {
  const [cloudName, setCloudName] = useState(config?.activeCloud || '');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    try {
      const seeded = await seedDemoEvents();
      onResetDemoData(seeded);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const updated = await updateCredentials({
        cloudName: cloudName.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
      });
      if (onConfigUpdated) onConfigUpdated(updated);
      setSaveMessage('Cloudinary credentials updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message || 'Failed to update credentials'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const pipelineStages = [
    { label: 'VIDEO', desc: 'Raw event footage (MP4, WebM, MOV)' },
    { label: 'CLOUDINARY UPLOAD', desc: 'Secure cloud ingest, storage, and initial media metadata' },
    { label: 'AI MEDIA ANALYSIS', desc: 'Stream metrics, duration, audio signals, and visual frames' },
    { label: 'STRUCTURED METADATA', desc: 'Standardized EventSummary, Chapter, and Highlight schemas' },
    { label: 'GEMINI UNDERSTANDING', desc: 'Gemini 3.8 Flash semantic reasoning & speaker extraction' },
    { label: 'TIMELINE + SUMMARY', desc: 'Chronological clickable chapters & executive takeaways' },
    { label: 'HIGHLIGHT GENERATION', desc: 'Dynamic clip ranges calculated from high-impact moments' },
    { label: 'OPTIMIZED CLOUDINARY DELIVERY', desc: 'Real-time CDN transformations via f_auto and q_auto' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Media Pipeline Architecture</h2>
              <p className="text-xs text-slate-400">
                Cloudinary AI Media Pipelines & Gemini Integration Status
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

        {/* Integration Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cloudinary Status */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-blue-400" />
                Cloudinary Media Storage
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  config?.cloudinaryConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {config?.cloudinaryConfigured ? 'Connected' : 'Demo Cloud Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Active cloud:{' '}
              <span className="font-mono text-slate-200 font-semibold">
                {config?.activeCloud || 'demo'}
              </span>
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Provides real-time dynamic clip trimming (so_, eo_), snapshot frames, format auto-adaptation (f_auto), and quality tuning (q_auto).
            </p>
          </div>

          {/* Gemini AI Status */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Gemini 3.8 Flash AI Engine
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  config?.geminiConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {config?.geminiConfigured ? 'Active & Ready' : 'AI Studio Managed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Model: <span className="font-mono text-purple-300">gemini-3.8-flash</span>
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Synthesizes timestamped chapters, highlights, and answers "Ask the Event" queries without inventing unsupported timestamps.
            </p>
          </div>
        </div>

        {/* Runtime Cloudinary Configuration Form */}
        <form onSubmit={handleSaveCredentials} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-purple-400" />
              Configure Custom Cloudinary Account (Optional)
            </span>
            <span className="text-[10px] text-slate-500">
              Or use environment variables
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                Cloud Name
              </label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="my_cloud_name"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="1234567890..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                API Secret
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {saveMessage && (
              <span className="text-[11px] text-purple-300">{saveMessage}</span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                <span>{isSaving ? 'Updating...' : 'Save Credentials'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Media Pipeline Workflow Diagram */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            End-to-End Pipeline Execution
          </span>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2 text-xs">
            {pipelineStages.map((stage, idx) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between py-1">
                  <span className="font-mono font-bold text-purple-300 text-xs">
                    {stage.label}
                  </span>
                  <span className="text-slate-400 text-[11px] text-right">
                    {stage.desc}
                  </span>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <div className="flex justify-center py-0.5 text-slate-600">
                    <ArrowDown className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Demo Seed Reset Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs text-slate-300 hover:bg-slate-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-purple-400" />
            <span>Reset Demo Seed Events</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
