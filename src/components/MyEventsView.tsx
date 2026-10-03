import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  PlusCircle,
  Play,
  Film,
  Sparkles,
  Cloud,
  CheckCircle2,
  Trash2,
  Search,
} from 'lucide-react';
import { EventItem } from '../types/event';

interface MyEventsViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onOpenUpload: () => void;
}

export const MyEventsView: React.FC<MyEventsViewProps> = ({
  events,
  onSelectEvent,
  onOpenUpload,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((ev) => {
    const matchesCat = filterCategory === 'all' || ev.category === filterCategory;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Media Library</h2>
          <p className="text-xs text-slate-400">
            All processed events with Cloudinary storage and AI summaries
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Upload New Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['all', 'Hackathon', 'Conference', 'Product Launch', 'Webinar'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Events' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/50 overflow-hidden hover:border-purple-500/50 hover:bg-slate-900/80 transition duration-200 flex flex-col justify-between"
            >
              {/* Thumbnail frame */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={ev.cloudinary.thumbnailUrl}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="h-12 w-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                    <Play className="h-5 w-5 ml-0.5 fill-current" />
                  </div>
                </div>

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-600/80 backdrop-blur-md text-[10px] font-semibold text-white">
                    {ev.category}
                  </span>
                  {ev.isDemo && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/80 backdrop-blur-md text-[10px] font-medium text-amber-100">
                      Sample
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                  {ev.durationFormatted}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2 flex-1">
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                  {ev.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {ev.summary?.overview || ev.description || 'No description available'}
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {ev.summary?.chapters?.length || 0} chapters
                </span>
                <span className="font-mono text-purple-400">f_auto,q_auto</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <Film className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-300 font-medium">No events found</p>
          <p className="text-xs text-slate-500">
            Upload an event video or reset sample demo events.
          </p>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Upload Video</span>
          </button>
        </div>
      )}
    </div>
  );
};
