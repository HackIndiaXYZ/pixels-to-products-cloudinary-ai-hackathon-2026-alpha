import React from 'react';
import { Sparkles, Cloud, UploadCloud, Settings, Database, Video } from 'lucide-react';
import { ConfigStatus } from '../services/api';

interface NavbarProps {
  config: ConfigStatus | null;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onSelectDemo: () => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onOpenUpload,
  onOpenSettings,
  onSelectDemo,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left transition hover:opacity-90 focus:outline-none"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-lg shadow-purple-500/20">
              <Video className="h-5 w-5 text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-950">
                <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Event<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">Lens</span>
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                AI Media Pipelines
              </span>
            </div>
          </button>

          {/* Cloudinary Track Pill */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">
            <Cloud className="h-3.5 w-3.5 text-blue-400" />
            <span>Powered by Cloudinary & Gemini</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Cloud status badge */}
          <div
            onClick={onOpenSettings}
            className="hidden sm:flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 transition"
            title="Click to view Cloudinary & Gemini Pipeline status"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                config?.cloudinaryConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-slate-400">
              cloud: <span className="text-slate-200">{config?.activeCloud || 'demo'}</span>
            </span>
          </div>

          {/* Quick Demo Button */}
          <button
            onClick={onSelectDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20 hover:border-purple-500/50"
          >
            <Database className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Try Demo Event</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:brightness-110 active:scale-95"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Event</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            title="Pipeline & Cloudinary Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
