/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { UploadModal } from './components/UploadModal';
import { ProcessingView } from './components/ProcessingView';
import { EventDashboard } from './components/EventDashboard';
import { MyEventsView } from './components/MyEventsView';
import { HighlightsView } from './components/HighlightsView';
import { RecapModal } from './components/RecapModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfigStatus, fetchConfigStatus, fetchEvents } from './services/api';
import { EventItem } from './types/event';

export default function App() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLandingView, setIsLandingView] = useState<boolean>(true);

  // Modals & Flows
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [processingEvent, setProcessingEvent] = useState<EventItem | null>(null);

  // Initial data loading
  useEffect(() => {
    fetchConfigStatus()
      .then(setConfig)
      .catch((err) => console.error('Failed to load config:', err));

    fetchEvents()
      .then((loadedEvents) => {
        setEvents(loadedEvents);
        if (loadedEvents.length > 0) {
          setActiveEvent(loadedEvents[0]);
        }
      })
      .catch((err) => console.error('Failed to load events:', err));
  }, []);

  const handleUploadSuccess = (uploadedEvent: EventItem) => {
    setIsUploadOpen(false);
    setProcessingEvent(uploadedEvent);
    setEvents((prev) => [uploadedEvent, ...prev]);
  };

  const handleProcessingComplete = (updatedEvent: EventItem) => {
    setProcessingEvent(null);
    setActiveEvent(updatedEvent);
    setEvents((prev) => prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)));
    setIsLandingView(false);
    setActiveTab('dashboard');
  };

  const handleSelectDemoEvent = () => {
    const demo = events.find((e) => e.isDemo) || events[0];
    if (demo) {
      setActiveEvent(demo);
      setIsLandingView(false);
      setActiveTab('dashboard');
    }
  };

  const handleSelectEvent = (event: EventItem) => {
    setActiveEvent(event);
    setIsLandingView(false);
    setActiveTab('dashboard');
  };

  const handlePlayHighlightInEvent = (event: EventItem, startTime: number) => {
    setActiveEvent(event);
    setIsLandingView(false);
    setActiveTab('dashboard');
    // We let EventDashboard handle playback
  };

  const handleRecapCreated = (updatedEvent: EventItem) => {
    setActiveEvent(updatedEvent);
    setEvents((prev) => prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)));
  };

  const handleResetDemoData = (freshEvents: EventItem[]) => {
    setEvents(freshEvents);
    if (freshEvents.length > 0) {
      setActiveEvent(freshEvents[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        config={config}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectDemo={handleSelectDemoEvent}
        onNavigateHome={() => setIsLandingView(true)}
      />

      {/* Main View Area */}
      {processingEvent ? (
        <main className="flex-1 bg-slate-950">
          <ProcessingView
            event={processingEvent}
            onProcessingComplete={handleProcessingComplete}
            onCancel={() => setProcessingEvent(null)}
          />
        </main>
      ) : isLandingView ? (
        <main className="flex-1 bg-slate-950">
          <LandingPage
            onOpenUpload={() => setIsUploadOpen(true)}
            onExploreDemo={handleSelectDemoEvent}
            onSelectEvent={handleSelectEvent}
            demoEvent={events.find((e) => e.isDemo) || events[0]}
          />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            events={events}
            activeEvent={activeEvent}
            onSelectEvent={handleSelectEvent}
            onOpenUpload={() => setIsUploadOpen(true)}
          />

          {/* Dynamic Content Pane */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && activeEvent && (
                <EventDashboard
                  event={activeEvent}
                  onOpenRecapModal={() => setIsRecapOpen(true)}
                />
              )}

              {activeTab === 'dashboard' && !activeEvent && (
                <div className="text-center py-20">
                  <p className="text-sm text-slate-400">No active event selected.</p>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-xs font-semibold text-white"
                  >
                    Upload Video
                  </button>
                </div>
              )}

              {activeTab === 'events' && (
                <MyEventsView
                  events={events}
                  onSelectEvent={handleSelectEvent}
                  onOpenUpload={() => setIsUploadOpen(true)}
                />
              )}

              {activeTab === 'highlights' && (
                <HighlightsView
                  events={events}
                  onPlayHighlightInEvent={handlePlayHighlightInEvent}
                />
              )}

              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">Media Pipeline Settings</h2>
                    <p className="text-xs text-slate-400">
                      Cloudinary transformations, Gemini 3.8 Flash configurations, and environment statuses.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-semibold text-white hover:bg-purple-500 transition"
                      >
                        View Full Pipeline Diagnostics
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        config={config}
      />

      {/* Recap Modal */}
      {activeEvent && (
        <RecapModal
          isOpen={isRecapOpen}
          onClose={() => setIsRecapOpen(false)}
          event={activeEvent}
          onRecapCreated={handleRecapCreated}
        />
      )}

      {/* Settings / Architecture Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onResetDemoData={handleResetDemoData}
        onConfigUpdated={(newConfig) => setConfig(newConfig)}
      />
    </div>
  );
}
