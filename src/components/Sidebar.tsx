import React from 'react';
import {
  LayoutDashboard,
  Film,
  Sparkles,
  Sliders,
  FolderOpen,
  PlusCircle,
  PlayCircle,
  Cloud,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { EventItem } from '../types/event';

export type ActiveTab = 'dashboard' | 'events' | 'highlights' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  events: EventItem[];
  activeEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  events,
  activeEvent,
  onSelectEvent,
  onOpenUpload,
}) => {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/50 flex flex-col justify-between hidden md:flex">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4 text-purple-400" />
              <span>Event Dashboard</span>
            </div>
            {activeEvent && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'events'
                ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderOpen className="h-4 w-4 text-indigo-400" />
              <span>My Events</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('highlights')}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'highlights'
                ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Film className="h-4 w-4 text-cyan-400" />
              <span>Highlight Clips</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {events.reduce((acc, ev) => acc + (ev.summary?.highlights?.length || 0), 0)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'settings'
                ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Sliders className="h-4 w-4 text-slate-400" />
            <span>Pipeline Config</span>
          </button>
        </div>

        {/* Active Event Card */}
        {activeEvent ? (
          <div className="p-3 rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-slate-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Active Event
              </span>
              {activeEvent.isDemo && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                  Demo
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                {activeEvent.title}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {activeEvent.durationFormatted}
                </span>
                <span>•</span>
                <span className="text-indigo-400 font-mono text-[10px]">
                  {activeEvent.cloudinary.format.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-slate-800/80 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {activeEvent.summary?.chapters?.length || 0} chapters
              </span>
              <span className="font-mono text-cyan-400">f_auto,q_auto</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 text-center space-y-2">
            <Sparkles className="h-5 w-5 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">No active event selected</p>
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Upload Video
            </button>
          </div>
        )}

        {/* Event Quick Switcher List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
            <span>Recent Events</span>
            <button
              onClick={onOpenUpload}
              className="text-purple-400 hover:text-purple-300 text-[11px] flex items-center gap-1"
            >
              <PlusCircle className="h-3 w-3" />
              New
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {events.map((ev) => {
              const isSelected = activeEvent?.id === ev.id;
              return (
                <button
                  key={ev.id}
                  onClick={() => {
                    onSelectEvent(ev);
                    setActiveTab('dashboard');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 text-slate-100 font-medium border border-slate-700'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  <span className="truncate pr-2">{ev.title}</span>
                  {ev.isDemo && (
                    <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 flex-shrink-0">
                      Demo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Powered by Cloudinary Badge Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80">
        <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-2.5 flex items-center gap-2.5">
          <Cloud className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="text-slate-300 font-medium block">Powered by Cloudinary</span>
            <span className="text-slate-500 text-[10px]">AI Media Pipelines Track</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
