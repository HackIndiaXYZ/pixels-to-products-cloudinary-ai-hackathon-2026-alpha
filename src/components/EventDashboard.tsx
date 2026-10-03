import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Clock,
  Sparkles,
  Search,
  Share2,
  Download,
  Film,
  MessageSquare,
  Users,
  Tag,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Volume2,
  Maximize2,
  Calendar,
  Cloud,
  Send,
  Loader2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { askTheEvent } from '../services/api';
import { AskEventAnswer, Chapter, EventItem, Highlight, Speaker } from '../types/event';

interface EventDashboardProps {
  event: EventItem;
  onOpenRecapModal: () => void;
  onShareEvent?: () => void;
}

export const EventDashboard: React.FC<EventDashboardProps> = ({
  event,
  onOpenRecapModal,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(event.durationSeconds || 120);

  // Active view tab in right workspace
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'highlights' | 'ask'>('timeline');

  // "Ask the Event" states
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<AskEventAnswer[]>([]);
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);

  // Default suggested questions
  const exampleQuestions = [
    'When was the winning team announced?',
    'Find the section about healthcare.',
    'When did the keynote begin?',
    'Show me the project demonstrations.',
  ];

  // Handle video playback events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAskSubmit = async (queryText?: string) => {
    const q = (queryText || askQuery).trim();
    if (!q || isAsking) return;

    setIsAsking(true);
    if (!queryText) setAskQuery('');

    try {
      const answer = await askTheEvent(event.id, q);
      setChatHistory((prev) => [answer, ...prev]);
    } catch (err: any) {
      console.error('Ask event error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopyClipUrl = (hl: Highlight) => {
    navigator.clipboard.writeText(hl.clipUrl);
    setCopiedClipId(hl.id);
    setTimeout(() => setCopiedClipId(null), 2000);
  };

  const formatSec = (s: number) => {
    const sec = Math.floor(s);
    const m = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${m.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Find currently active chapter based on playback position
  const currentChapter = event.summary?.chapters?.find(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  );

  return (
    <div className="space-y-6">
      {/* 1. Event Header */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                {event.category}
              </span>

              {event.isDemo && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                  Sample Event
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Cloudinary CDN Optimized (f_auto, q_auto)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                {event.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                Duration: {event.durationFormatted} ({Math.round(event.durationSeconds)}s)
              </span>
              <span>•</span>
              <span className="font-mono text-cyan-400">
                ID: {event.cloudinary.publicId}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenRecapModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-900/25 hover:brightness-110 active:scale-95 transition"
            >
              <Film className="h-4 w-4" />
              <span>Create Recap (30s / 60s)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace: Video Player + Interactive AI Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real Cloudinary Video Player (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl group">
            <video
              ref={videoRef}
              src={event.cloudinary.playbackUrl || event.cloudinary.secureUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls
              playsInline
              className="w-full h-full object-contain"
            />

            {/* Cloudinary Active Transformation Overlay Pill */}
            <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-mono text-cyan-300 backdrop-blur-md border border-slate-700/60 shadow">
              <Cloud className="h-3.5 w-3.5 text-blue-400" />
              <span>Cloudinary CDN • f_auto,q_auto</span>
            </div>

            {/* Current Chapter Overlay if available */}
            {currentChapter && (
              <div className="absolute top-3 right-3 pointer-events-none rounded-lg bg-purple-950/80 px-2.5 py-1 text-[11px] font-medium text-purple-200 backdrop-blur-md border border-purple-500/30 shadow">
                Now: {currentChapter.title}
              </div>
            )}
          </div>

          {/* Quick Jump Scrub Bar to Chapters */}
          {event.summary?.chapters && event.summary.chapters.length > 0 && (
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-400" />
                  Quick Seek Timeline ({formatSec(currentTime)} / {formatSec(duration)})
                </span>
                <span className="text-[11px] text-slate-500">
                  Click any marker to seek
                </span>
              </div>

              {/* Progress track with chapter notches */}
              <div className="relative h-3 w-full bg-slate-800 rounded-full cursor-pointer overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Chapter Quick Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1">
                {event.summary.chapters.map((ch) => {
                  const isActive = currentTime >= ch.startTime && currentTime <= ch.endTime;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => seekTo(ch.startTime)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-purple-600 text-white font-semibold shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-purple-300">
                        {ch.formattedTime}
                      </span>
                      <span>{ch.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cloudinary Pipeline Details Box */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-blue-400" />
                Active Cloudinary Media Delivery
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {event.cloudinary.cloudName} cloud
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Video is stream-optimized with adaptive bitrates and dynamic format selection.
              Highlight clips and chapter thumbnails are generated on-the-fly via URL parameters
              without duplicating raw video storage.
            </p>
          </div>
        </div>

        {/* Right Column: AI Summary, Timeline Chapters, Highlights, and Ask the Event (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('highlights')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'highlights'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Highlights</span>
            </button>

            <button
              onClick={() => setActiveTab('ask')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'ask'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Ask Event</span>
            </button>
          </div>

          {/* TAB 1: TIMELINE / CHAPTERS */}
          {activeTab === 'timeline' && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-3 max-h-[580px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">
                  Key Moments & Chapters ({event.summary?.chapters?.length || 0})
                </span>
                <span className="text-[11px] text-slate-500">
                  Click any timestamp to seek
                </span>
              </div>

              {event.summary?.chapters && event.summary.chapters.length > 0 ? (
                <div className="space-y-2.5">
                  {event.summary.chapters.map((ch, idx) => {
                    const isCurrent = currentTime >= ch.startTime && currentTime <= ch.endTime;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => seekTo(ch.startTime)}
                        className={`group cursor-pointer rounded-xl border p-3 transition flex gap-3 ${
                          isCurrent
                            ? 'border-purple-500/60 bg-purple-950/30 shadow-md shadow-purple-950/30'
                            : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Chapter Thumbnail Frame */}
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700">
                          {ch.thumbnailUrl ? (
                            <img
                              src={ch.thumbnailUrl}
                              alt={ch.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Film className="h-4 w-4" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                            <Play className="h-4 w-4 text-white drop-shadow" />
                          </div>
                        </div>

                        {/* Chapter Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-purple-400 group-hover:text-purple-300 transition">
                              {ch.formattedTime}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold uppercase">
                                Playing
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-white">
                            {ch.title}
                          </h4>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {ch.description}
                          </p>

                          {ch.keywords && ch.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {ch.keywords.slice(0, 3).map((kw, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No chapters generated for this event yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI SUMMARY */}
          {activeTab === 'summary' && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 space-y-5 max-h-[580px] overflow-y-auto text-xs">
              {/* Executive Overview */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-purple-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Executive Overview
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {event.summary?.overview || event.description || 'No overview generated.'}
                </p>
              </div>

              {/* Key Topics */}
              {event.summary?.keyTopics && event.summary.keyTopics.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-indigo-400">
                    <Tag className="h-3.5 w-3.5" />
                    Key Topics Covered
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {event.summary.keyTopics.map((topic, i) => (
                      <span
                        key={i}
                        onClick={() => {
                          setActiveTab('ask');
                          handleAskSubmit(`Tell me about ${topic}`);
                        }}
                        className="cursor-pointer px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/70 hover:border-purple-500/50 hover:bg-slate-800 text-slate-300 text-[11px] transition"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Speakers */}
              {event.summary?.speakers && event.summary.speakers.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-cyan-400">
                    <Users className="h-3.5 w-3.5" />
                    Featured Speakers & Key People
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {event.summary.speakers.map((sp, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs">{sp.name}</span>
                          {sp.roleOrAffiliation && (
                            <span className="text-[10px] text-purple-300 font-medium">
                              {sp.roleOrAffiliation}
                            </span>
                          )}
                        </div>
                        {sp.note && (
                          <p className="text-[11px] text-slate-400">{sp.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {event.summary?.keyTakeaways && event.summary.keyTakeaways.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Key Takeaways & Insights
                  </span>
                  <ul className="space-y-1.5 text-slate-300">
                    {event.summary.keyTakeaways.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span className="text-slate-300 leading-normal">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HIGHLIGHTS */}
          {activeTab === 'highlights' && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-3 max-h-[580px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">
                  AI Highlight Clips ({event.summary?.highlights?.length || 0})
                </span>
                <button
                  onClick={onOpenRecapModal}
                  className="text-purple-400 hover:text-purple-300 text-[11px] font-medium"
                >
                  Generate Reel
                </button>
              </div>

              {event.summary?.highlights && event.summary.highlights.length > 0 ? (
                <div className="space-y-3">
                  {event.summary.highlights.map((hl) => (
                    <div
                      key={hl.id}
                      className="group rounded-xl border border-slate-800/80 bg-slate-950/50 overflow-hidden hover:border-purple-500/40 transition"
                    >
                      {/* Highlight preview banner */}
                      <div
                        onClick={() => seekTo(hl.startTime)}
                        className="relative aspect-video w-full cursor-pointer overflow-hidden bg-slate-900"
                      >
                        <img
                          src={hl.thumbnailUrl}
                          alt={hl.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                            <Play className="h-4 w-4 ml-0.5 fill-current" />
                          </div>
                        </div>

                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600/80 text-[10px] font-semibold text-white">
                          {hl.category}
                        </div>

                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                          {hl.duration}s clip
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-200">{hl.title}</h4>
                          <span className="text-[10px] font-mono text-purple-400">
                            {formatSec(hl.startTime)} - {formatSec(hl.endTime)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {hl.description}
                        </p>

                        <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
                          <button
                            onClick={() => seekTo(hl.startTime)}
                            className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                          >
                            <Play className="h-3 w-3" />
                            Jump to clip
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyClipUrl(hl)}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Copy Cloudinary Clip URL"
                            >
                              <Copy className="h-3 w-3" />
                              <span>{copiedClipId === hl.id ? 'Copied' : 'Cloudinary URL'}</span>
                            </button>

                            <a
                              href={hl.clipUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-200"
                              title="Open Cloudinary Clip in new tab"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No highlights available yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASK THE EVENT (NATURAL LANGUAGE SEARCH & Q&A) */}
          {activeTab === 'ask' && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-4 max-h-[580px] flex flex-col justify-between">
              {/* Question Input Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    Ask the Event (Gemini 3.8 Flash)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Grounded in event chapters
                  </span>
                </div>

                {/* Search Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskSubmit();
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={askQuery}
                    onChange={(e) => setAskQuery(e.target.value)}
                    placeholder="Ask anything about this event..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !askQuery.trim()}
                    className="absolute right-2 p-1.5 rounded-lg text-purple-400 hover:bg-slate-800 hover:text-purple-300 disabled:opacity-40 transition"
                  >
                    {isAsking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>

                {/* Example Quick Prompt Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium">Try asking:</span>
                  <div className="flex flex-wrap gap-1">
                    {exampleQuestions.map((eq, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAskSubmit(eq)}
                        className="text-[10px] px-2 py-1 rounded-md border border-slate-800 bg-slate-950/60 hover:border-purple-500/40 text-slate-300 transition text-left"
                      >
                        "{eq}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Response Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pt-2 pr-1 min-h-[220px]">
                {chatHistory.length > 0 ? (
                  chatHistory.map((ans) => (
                    <div
                      key={ans.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-purple-300">"{ans.query}"</span>
                        <span className="text-[10px] font-mono">{ans.timestamp}</span>
                      </div>

                      <p className="text-slate-200 leading-relaxed">{ans.answer}</p>

                      {/* Clickable Timestamps */}
                      {ans.timestamps && ans.timestamps.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                          <span className="text-[11px] text-slate-400">Jump directly to:</span>
                          {ans.timestamps.map((ts, idx) => (
                            <button
                              key={idx}
                              onClick={() => seekTo(ts.seconds)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/30 border border-purple-500/50 hover:bg-purple-600 text-purple-200 hover:text-white font-mono text-xs font-semibold transition"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>[Jump to {ts.formatted}]</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Confidence indicator */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Confidence: {ans.confidence}</span>
                        {ans.relevantChapter && (
                          <span className="text-slate-400">
                            Chapter: {ans.relevantChapter}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-700" />
                    <p className="text-xs">
                      Ask any question about this event footage to find topics and clickable timestamps.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
