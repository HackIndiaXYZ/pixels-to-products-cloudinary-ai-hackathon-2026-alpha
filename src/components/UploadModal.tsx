import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Cloud,
  Film,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  fetchUploadSignature,
  uploadDirectToCloudinary,
  registerEventWithBackend,
} from '../services/api';
import { EventItem } from '../types/event';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (event: EventItem) => void;
  config?: { cloudinaryConfigured: boolean; geminiConfigured: boolean; activeCloud: string } | null;
}

const SAMPLE_VIDEOS = [
  {
    name: 'Hackathon Grand Finale Demo Video (Cloudinary Hosted)',
    url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
    title: 'Autonomous AI Hackathon Showcase',
    category: 'Hackathon' as const,
    description: 'Final presentations and live developer pitches showcasing multimodal AI agents.',
  },
  {
    name: 'Tech Keynote & Cloud Architecture Stream',
    url: 'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/dog.mp4',
    title: 'Future of Cloud Media Keynote',
    category: 'Conference' as const,
    description: 'Engineering keynote discussing edge video transformations and auto-quality delivery.',
  },
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  config,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventItem['category']>('Hackathon');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedEvent, setUploadedEvent] = useState<EventItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
      setErrorMessage('Please select a valid video file (MP4, WebM, MOV, or MKV).');
      return;
    }
    setSelectedFile(file);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSampleSelect = (sample: typeof SAMPLE_VIDEOS[0]) => {
    setSelectedFile(null);
    setRemoteUrl(sample.url);
    setTitle(sample.title);
    setCategory(sample.category);
    setDescription(sample.description);
  };

  const handleStartUpload = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter an event title.');
      return;
    }

    if (!selectedFile && !remoteUrl.trim()) {
      setErrorMessage('Please select a video file or pick a sample video.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('Initiating direct upload...');
    setErrorMessage(null);

    try {
      let createdEvent: EventItem;

      if (selectedFile) {
        // Step 1: Request signed authorization from backend (API secret remains server-side)
        setUploadStage('Authorizing with Cloudinary (requesting signature)...');
        setUploadProgress(5);
        const signData = await fetchUploadSignature();

        // Step 2: Stream video binary DIRECTLY from browser to Cloudinary
        // Video file NEVER touches Vercel, bypassing the 4.5MB Vercel payload limit completely!
        setUploadStage('Uploading directly to Cloudinary CDN: 0%');
        const directResult = await uploadDirectToCloudinary(selectedFile, signData, (pct) => {
          setUploadProgress(Math.min(95, Math.max(5, pct)));
          setUploadStage(`Uploading directly to Cloudinary CDN: ${pct}%`);
        });

        // Step 3: Register only lightweight metadata (public_id, secure_url, duration)
        setUploadStage('Registering event asset metadata with backend...');
        setUploadProgress(98);

        createdEvent = await registerEventWithBackend({
          title: title.trim(),
          description: description.trim(),
          category,
          cloudinary: {
            publicId: directResult.public_id,
            secureUrl: directResult.secure_url,
            cloudName: signData.cloudName,
            format: directResult.format || 'mp4',
            duration: directResult.duration || 60,
            width: directResult.width || 1920,
            height: directResult.height || 1080,
            bytes: directResult.bytes || selectedFile.size,
            createdAt: directResult.created_at,
          },
        });

        setUploadProgress(100);
        setUploadStage('Upload and asset registration complete!');
      } else {
        // Sample video selected - register lightweight demo reference
        setUploadStage('Registering Cloudinary sample stream...');
        setUploadProgress(60);

        createdEvent = await registerEventWithBackend({
          title: title.trim(),
          description: description.trim(),
          category,
          cloudinary: {
            publicId: 'dog',
            secureUrl: remoteUrl.trim(),
            cloudName: config?.activeCloud || 'demo',
            format: 'mp4',
            duration: 135,
            width: 1920,
            height: 1080,
            bytes: 28400000,
          },
        });

        setUploadProgress(100);
        setUploadStage('Sample asset registered successfully!');
      }

      setUploadedEvent(createdEvent);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(
        err.message || 'Failed to upload video directly to Cloudinary. Please verify your credentials and network connection.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleProceedToAnalyze = () => {
    if (uploadedEvent) {
      onUploadSuccess(uploadedEvent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Event Video</h2>
              <p className="text-xs text-slate-400">
                Cloudinary Storage & AI Media Ingestion
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

        {/* Credentials Status Banner */}
        {config && (
          <div
            className={`rounded-xl border p-3 flex items-start gap-3 text-xs ${
              config.cloudinaryConfigured
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            }`}
          >
            <Cloud
              className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                config.cloudinaryConfigured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {config.cloudinaryConfigured
                    ? `Cloudinary Connected (${config.activeCloud})`
                    : 'Cloudinary Credentials Status'}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                  {config.cloudinaryConfigured ? 'Live Pipeline' : 'Demo / Sandbox Mode'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] opacity-90">
                {config.cloudinaryConfigured
                  ? 'Real-time video upload and dynamic transformations (f_auto, q_auto, so_, eo_) are active.'
                  : 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET not detected in environment. Uploading a video requires these credentials. You can also explore pre-loaded demo events in the meantime.'}
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Upload Error</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Successful Upload State: Cloudinary Asset Info */}
        {uploadedEvent ? (
          <div className="space-y-5 py-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-200">
                  Video Uploaded to Cloudinary Successfully!
                </h4>
                <p className="text-xs text-emerald-300/80">
                  Media asset created and ready for Gemini AI analysis.
                </p>
              </div>
            </div>

            {/* Cloudinary Asset Metadata Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cloud className="h-4 w-4 text-blue-400" />
                  Cloudinary Public ID
                </span>
                <span className="font-mono text-purple-300 font-medium">
                  {uploadedEvent.cloudinary.publicId}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cloud Name</span>
                <span className="font-mono text-slate-200">
                  {uploadedEvent.cloudinary.cloudName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Delivery Format & Quality</span>
                <span className="font-mono text-cyan-300">
                  {uploadedEvent.cloudinary.format.toUpperCase()} (f_auto, q_auto enabled)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Detected Duration</span>
                <span className="font-mono text-slate-200">
                  {uploadedEvent.durationFormatted} ({uploadedEvent.durationSeconds}s)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                Close
              </button>
              <button
                onClick={handleProceedToAnalyze}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:brightness-110 active:scale-95 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>Analyze Event with AI</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Upload Form */
          <div className="space-y-5">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Film className="h-6 w-6" />
                </div>

                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Drag and drop your event video here, or{' '}
                      <span className="text-purple-400 font-semibold underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports MP4, WebM, MOV, MKV (Up to 100MB direct preview)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Sample Selector */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-400" />
                Quick Test with Sample Cloudinary Media
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_VIDEOS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handleSampleSelect(s)}
                    className="text-left p-2 rounded-lg border border-slate-800 hover:border-purple-500/40 bg-slate-900/60 hover:bg-slate-900 text-xs transition"
                  >
                    <span className="font-medium text-slate-200 block truncate">{s.title}</span>
                    <span className="text-[10px] text-slate-400">{s.category} sample</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields: Title, Category, Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NextGen AI Summit 2026 Keynote"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Event Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventItem['category'])}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Conference">Conference</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Seminar">Seminar</option>
                    <option value="College Fest">College Fest</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Video URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={remoteUrl}
                    onChange={(e) => {
                      setRemoteUrl(e.target.value);
                      setSelectedFile(null);
                    }}
                    placeholder="https://.../video.mp4"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Description & Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any context about speakers, agenda, or key announcements..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Progress Bar while uploading */}
            {isUploading && (
              <div className="space-y-2 rounded-xl border border-purple-500/20 bg-purple-950/20 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-purple-300 font-medium">
                    <Cloud className="h-4 w-4 animate-bounce text-purple-400" />
                    <span>{uploadStage || 'Uploading directly to Cloudinary...'}</span>
                  </span>
                  <span className="font-mono text-purple-300 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  <span>Direct browser-to-Cloudinary streaming (Bypasses Vercel 4.5MB payload limit)</span>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={isUploading || (!selectedFile && !remoteUrl.trim()) || !title.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UploadCloud className="h-4 w-4" />
                <span>{isUploading ? 'Uploading to Cloudinary...' : 'Upload & Proceed'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
