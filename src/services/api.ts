import { AskEventAnswer, EventItem, RecapVideo } from '../types/event';

export interface ConfigStatus {
  cloudinaryConfigured: boolean;
  geminiConfigured: boolean;
  activeCloud: string;
  hasRealKeys: boolean;
}

export interface UploadSignature {
  signature?: string;
  timestamp?: number;
  apiKey?: string;
  cloudName: string;
  folder: string;
  tags: string;
  uploadPreset?: string;
  uploadUrl: string;
}

export interface CloudinaryDirectUploadResult {
  public_id: string;
  secure_url: string;
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  created_at?: string;
}

export async function fetchConfigStatus(): Promise<ConfigStatus> {
  const res = await fetch('/api/config/status');
  if (!res.ok) throw new Error('Failed to fetch config status');
  return res.json();
}

export async function updateCredentials(credentials: {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}): Promise<ConfigStatus> {
  const res = await fetch('/api/config/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update credentials');
  }

  return res.json();
}

export async function fetchEvents(): Promise<EventItem[]> {
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
  return data.events || [];
}

export async function fetchEventById(id: string): Promise<EventItem> {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Event not found');
  const data = await res.json();
  return data.event;
}

export async function seedDemoEvents(): Promise<EventItem[]> {
  const res = await fetch('/api/events/seed', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo events');
  const data = await res.json();
  return data.events || [];
}

/**
 * Fetch server-generated HMAC signature for direct browser-to-Cloudinary upload.
 * CLOUDINARY_API_SECRET remains strictly on the server.
 */
export async function fetchUploadSignature(): Promise<UploadSignature> {
  const res = await fetch('/api/upload/sign');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error || 'Failed to retrieve Cloudinary upload authorization. Check backend credentials.'
    );
  }
  return res.json();
}

/**
 * Direct browser-to-Cloudinary video upload.
 * The video binary goes straight to Cloudinary (never passes through Vercel serverless functions).
 * Accurately tracks upload byte progress without payload size limits.
 */
export async function uploadDirectToCloudinary(
  file: File,
  signData: UploadSignature,
  onProgress?: (percent: number) => void
): Promise<CloudinaryDirectUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    if (signData.uploadPreset) {
      formData.append('upload_preset', signData.uploadPreset);
    }
    if (signData.apiKey) {
      formData.append('api_key', signData.apiKey);
    }
    if (signData.timestamp) {
      formData.append('timestamp', String(signData.timestamp));
    }
    if (signData.signature) {
      formData.append('signature', signData.signature);
    }
    if (signData.folder) {
      formData.append('folder', signData.folder);
    }
    if (signData.tags) {
      formData.append('tags', signData.tags);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', signData.uploadUrl);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          reject(new Error('Cloudinary returned an unparseable response.'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          const message =
            err.error?.message || err.message || `Cloudinary rejected the upload (Status: ${xhr.status})`;
          reject(new Error(`Cloudinary Direct Upload Error: ${message}`));
        } catch {
          reject(new Error(`Cloudinary upload failed with HTTP status ${xhr.status}.`));
        }
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Network error occurred during direct Cloudinary upload. Please check your internet connection or Cloudinary credentials.'
        )
      );
    };

    xhr.ontimeout = () => {
      reject(new Error('Direct Cloudinary upload timed out.'));
    };

    xhr.send(formData);
  });
}

/**
 * Register lightweight event metadata with the EventLens backend.
 * Only small JSON metadata (public_id, secure_url, duration) is sent to Vercel.
 */
export async function registerEventWithBackend(payload: {
  title: string;
  description?: string;
  category: string;
  cloudinary: {
    publicId: string;
    secureUrl: string;
    cloudName?: string;
    format?: string;
    duration?: number;
    width?: number;
    height?: number;
    bytes?: number;
    createdAt?: string;
  };
}): Promise<EventItem> {
  const res = await fetch('/api/events/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to register event metadata with backend.');
  }

  const data = await res.json();
  return data.event;
}

export async function analyzeEvent(eventId: string): Promise<EventItem> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Media analysis failed');
  }

  const data = await res.json();
  return data.event;
}

export async function askTheEvent(eventId: string, query: string): Promise<AskEventAnswer> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, query }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to search event');
  }

  const data = await res.json();
  return {
    id: `ans_${Date.now()}`,
    query,
    answer: data.answer,
    confidence: data.confidence,
    timestamps: data.timestamps || [],
    relevantChapter: data.relevantChapter,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function generateRecap(payload: {
  eventId: string;
  targetDuration: 30 | 60 | 120;
  title?: string;
}): Promise<{ recap: RecapVideo; event: EventItem }> {
  const res = await fetch('/api/highlights/generate-recap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate recap');
  }

  return res.json();
}
