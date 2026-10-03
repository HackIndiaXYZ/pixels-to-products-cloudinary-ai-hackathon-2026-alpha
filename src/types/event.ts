export interface CloudinaryAssetInfo {
  publicId: string;
  secureUrl: string;
  cloudName: string;
  format: string;
  duration: number; // in seconds
  width?: number;
  height?: number;
  bytes?: number;
  playbackUrl: string; // with f_auto, q_auto
  thumbnailUrl: string;
  waveformUrl?: string;
  createdAt: string;
}

export interface Speaker {
  name: string;
  roleOrAffiliation?: string;
  note?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  formattedTime: string; // e.g. "00:03:12"
  keywords?: string[];
  thumbnailUrl?: string; // Cloudinary so_<startTime> frame thumbnail
}

export interface Highlight {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  category: 'Keynote' | 'Demo' | 'Award' | 'Q&A' | 'Inspiring' | 'Technical' | 'General';
  impactScore?: number;
  clipUrl: string; // Cloudinary so_<start>,eo_<end>,f_auto,q_auto URL
  thumbnailUrl: string;
}

export interface EventSummary {
  overview: string;
  keyTopics: string[];
  keyTakeaways: string[];
  speakers: Speaker[];
  chapters: Chapter[];
  highlights: Highlight[];
}

export interface RecapVideo {
  id: string;
  targetDuration: 30 | 60 | 120;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  durationSeconds: number;
  includedMomentsCount: number;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  category: 'Hackathon' | 'Conference' | 'Product Launch' | 'Seminar' | 'College Fest' | 'Webinar' | 'Sports' | 'Other';
  date: string;
  durationFormatted: string;
  durationSeconds: number;
  status: 'uploaded' | 'analyzing' | 'ready' | 'error';
  isDemo?: boolean;
  cloudinary: CloudinaryAssetInfo;
  summary?: EventSummary;
  recaps?: RecapVideo[];
  errorMessage?: string;
  createdAt: string;
}

export interface AskEventAnswer {
  id: string;
  query: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  timestamps: Array<{
    seconds: number;
    formatted: string;
    label: string;
  }>;
  relevantChapter?: string;
  timestamp: string;
}
