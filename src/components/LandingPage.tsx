import React from 'react';
import {
  UploadCloud,
  Sparkles,
  Search,
  Share2,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Film,
  Layers,
} from 'lucide-react';
import { EventItem } from '../types/event';

interface LandingPageProps {
  onOpenUpload: () => void;
  onExploreDemo: () => void;
  onSelectEvent: (event: EventItem) => void;
  demoEvent?: EventItem;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenUpload,
  onExploreDemo,
  onSelectEvent,
  demoEvent,
}) => {
  const steps = [
    {
      step: '01',
      title: 'Upload',
      desc: 'Drop in hours of conference or hackathon footage with Cloudinary storage.',
      icon: UploadCloud,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      step: '02',
      title: 'Analyze',
      desc: 'Gemini 3.8 Flash extracts structured summaries, key takeaways, and speakers.',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      step: '03',
      title: 'Discover',
      desc: 'Click timestamped chapters or ask natural language questions with instant video seeking.',
      icon: Search,
      color: 'from-indigo-500 to-cyan-500',
    },
    {
      step: '04',
      title: 'Share',
      desc: 'Generate viral recap reels and trimmed highlight clips delivered dynamically via Cloudinary.',
      icon: Share2,
      color: 'from-cyan-500 to-emerald-500',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-950 pb-16">
      {/* Background radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden opacity-35">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/30 blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] rounded-full bg-blue-600/25 blur-[140px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20">
        {/* Track Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1.5 text-xs text-purple-300 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-medium">Cloudinary AI Media Pipelines Track</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Turn hours of event footage into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">
              one unforgettable story.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            EventLens uses AI and Cloudinary to transform long event videos into summaries,
            searchable moments, and shareable highlights.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-900/30 hover:brightness-110 active:scale-95 transition"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload an Event</span>
            </button>

            <button
              onClick={onExploreDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-medium text-slate-200 hover:bg-slate-800/90 hover:border-slate-600 active:scale-95 transition"
            >
              <Play className="h-4 w-4 text-purple-400 fill-purple-400/20" />
              <span>See How It Works (Live Demo)</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              f_auto & q_auto Optimization
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Structured Gemini Reasoning
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Clickable Timeline Seeking
            </span>
          </div>
        </div>

        {/* Visual Pipeline Progression (Upload → Analyze → Discover → Share) */}
        <div className="mt-16 sm:mt-24">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-400">
              The Real-Time Media Pipeline
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Upload → Analyze → Discover → Share
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-purple-500/40 hover:bg-slate-900/70 transition duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${st.color} flex items-center justify-center text-white shadow-lg`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600 group-hover:text-purple-400 transition">
                      {st.step}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>

                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured Sample Event Spotlight Card */}
        {demoEvent && (
          <div className="mt-16 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 via-slate-900/60 to-slate-950/80 p-6 sm:p-8 backdrop-blur-md">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Thumbnail / Video Preview frame */}
              <div
                onClick={() => onSelectEvent(demoEvent)}
                className="group relative w-full lg:w-1/2 aspect-video rounded-xl overflow-hidden cursor-pointer border border-purple-500/30 shadow-2xl bg-black"
              >
                <img
                  src={demoEvent.cloudinary.thumbnailUrl}
                  alt={demoEvent.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-purple-500 transition">
                    <Play className="h-6 w-6 ml-0.5 fill-current" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-purple-600/80 backdrop-blur-md text-xs font-semibold text-white">
                    {demoEvent.category}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-[11px] font-mono text-cyan-300">
                    Cloudinary f_auto
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 font-mono text-xs text-white">
                  {demoEvent.durationFormatted}
                </div>
              </div>

              {/* Event Details and actions */}
              <div className="w-full lg:w-1/2 space-y-4 text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  <span>Featured Demo Experience</span>
                </div>

                <h3 className="text-2xl font-bold text-white leading-snug">
                  {demoEvent.title}
                </h3>

                <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                  {demoEvent.description}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-2.5 text-center">
                    <span className="text-xs text-slate-400 block">Chapters</span>
                    <span className="text-lg font-bold text-purple-400 font-mono">
                      {demoEvent.summary?.chapters?.length || 5}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-2.5 text-center">
                    <span className="text-xs text-slate-400 block">Highlights</span>
                    <span className="text-lg font-bold text-indigo-400 font-mono">
                      {demoEvent.summary?.highlights?.length || 3}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-2.5 text-center">
                    <span className="text-xs text-slate-400 block">Q&A Ready</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono">100%</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => onSelectEvent(demoEvent)}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition"
                  >
                    <span>Launch Event Recap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={onOpenUpload}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Upload Your Video</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
