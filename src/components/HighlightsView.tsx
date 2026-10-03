import React, { useState } from 'react';
import { Play, Film, Share2, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';
import { EventItem, Highlight } from '../types/event';

interface HighlightsViewProps {
  events: EventItem[];
  onPlayHighlightInEvent: (event: EventItem, startTime: number) => void;
}

export const HighlightsView: React.FC<HighlightsViewProps> = ({
  events,
  onPlayHighlightInEvent,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Aggregate all highlights across events
  const allHighlights: Array<{ highlight: Highlight; parentEvent: EventItem }> = [];
  for (const ev of events) {
    if (ev.summary?.highlights) {
      for (const hl of ev.summary.highlights) {
        allHighlights.push({ highlight: hl, parentEvent: ev });
      }
    }
  }

  const handleCopy = (hl: Highlight) => {
    navigator.clipboard.writeText(hl.clipUrl);
    setCopiedId(hl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Highlights Reel</h2>
          <p className="text-xs text-slate-400">
            Social-ready clips generated via Cloudinary URL offsets (so_, eo_) and Gemini moments
          </p>
        </div>
        <div className="rounded-lg border border-purple-500/30 bg-purple-950/30 px-3 py-1 text-xs text-purple-300 font-mono">
          {allHighlights.length} Generated Clips
        </div>
      </div>

      {allHighlights.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allHighlights.map(({ highlight: hl, parentEvent: ev }) => (
            <div
              key={hl.id}
              className="group rounded-2xl border border-slate-800/80 bg-slate-900/50 overflow-hidden hover:border-purple-500/50 hover:bg-slate-900/80 transition flex flex-col justify-between"
            >
              {/* Thumbnail frame with play trigger */}
              <div
                onClick={() => onPlayHighlightInEvent(ev, hl.startTime)}
                className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
              >
                <img
                  src={hl.thumbnailUrl}
                  alt={hl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="h-12 w-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                    <Play className="h-5 w-5 ml-0.5 fill-current" />
                  </div>
                </div>

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-600/80 backdrop-blur-md text-[10px] font-semibold text-white">
                    {hl.category}
                  </span>
                </div>

                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                  {hl.duration}s clip
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2 flex-1">
                <span className="text-[10px] text-purple-400 font-medium block truncate">
                  From: {ev.title}
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                  {hl.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {hl.description}
                </p>
              </div>

              {/* Actions */}
              <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => onPlayHighlightInEvent(ev, hl.startTime)}
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Play Clip</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(hl)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                    title="Copy Cloudinary Dynamic Clip URL"
                  >
                    {copiedId === hl.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <a
                    href={hl.clipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                    title="Open in new window"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
          No highlights have been generated yet.
        </div>
      )}
    </div>
  );
};
