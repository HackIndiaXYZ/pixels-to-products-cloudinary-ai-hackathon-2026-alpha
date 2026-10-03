import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { CloudinaryService } from './services/cloudinary';
import { GeminiService } from './services/gemini';
import { eventStore } from './services/eventStore';
import { EventItem, RecapVideo } from '../src/types/event';

dotenv.config();

const app = express();

// Middleware for parsing lightweight JSON and urlencoded data
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API Routes

// 1. Status / Health & Config Check with Clear Diagnostics
app.get('/api/config/status', (_req: Request, res: Response) => {
  const { cloudName, apiKey, apiSecret, uploadPreset } = CloudinaryService.getCredentials();
  const geminiConfigured = GeminiService.isConfigured();
  const cloudinaryConfigured = CloudinaryService.isConfigured();

  const missingVars: string[] = [];
  if (!cloudName || cloudName === 'your_cloudinary_cloud_name') {
    missingVars.push('CLOUDINARY_CLOUD_NAME');
  }
  const hasApiKeys = Boolean(
    apiKey &&
    apiKey !== 'your_cloudinary_api_key' &&
    apiSecret &&
    apiSecret !== 'your_cloudinary_api_secret'
  );
  const hasPreset = Boolean(
    uploadPreset &&
    uploadPreset !== 'your_upload_preset'
  );

  if (!hasApiKeys && !hasPreset) {
    missingVars.push('CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET (or CLOUDINARY_UPLOAD_PRESET)');
  }

  if (!geminiConfigured) {
    missingVars.push('GEMINI_API_KEY');
  }

  res.json({
    cloudinaryConfigured,
    geminiConfigured,
    activeCloud: CloudinaryService.getActiveCloudName(),
    hasRealKeys: cloudinaryConfigured && geminiConfigured,
    hasUploadPreset: hasPreset,
    missingVars,
    diagnostic:
      missingVars.length === 0
        ? 'All required production environment variables are configured and active.'
        : `Missing or incomplete environment variables: ${missingVars.join(', ')}. Configure them in Vercel Settings -> Environment Variables.`,
  });
});

// Update runtime credentials
app.post('/api/config/credentials', (req: Request, res: Response) => {
  const { cloudName, apiKey, apiSecret } = req.body;
  if (cloudName) process.env.CLOUDINARY_CLOUD_NAME = cloudName.trim();
  if (apiKey) process.env.CLOUDINARY_API_KEY = apiKey.trim();
  if (apiSecret) process.env.CLOUDINARY_API_SECRET = apiSecret.trim();

  res.json({
    cloudinaryConfigured: CloudinaryService.isConfigured(),
    geminiConfigured: GeminiService.isConfigured(),
    activeCloud: CloudinaryService.getActiveCloudName(),
    hasRealKeys: CloudinaryService.isConfigured() && GeminiService.isConfigured(),
  });
});

// 2. Direct Upload Signature Generation
// Generates secure HMAC signature server-side. CLOUDINARY_API_SECRET is NEVER sent to the client.
app.get('/api/upload/sign', (_req: Request, res: Response) => {
  try {
    const signData = CloudinaryService.generateUploadSignature();
    res.json(signData);
  } catch (error: any) {
    console.error('Signature generation error:', error);
    res.status(400).json({
      error: error.message || 'Failed to generate Cloudinary upload signature. Check environment variables.',
    });
  }
});

// 3. Register Event after direct Cloudinary upload completes
// Client sends only small JSON metadata (public_id, secure_url, duration, etc.)
app.post('/api/events/register', (req: Request, res: Response) => {
  try {
    const { title, description, category, cloudinary: rawCloudinary } = req.body;

    if (!title || !rawCloudinary?.publicId || !rawCloudinary?.secureUrl) {
      return res.status(400).json({
        error: 'Missing required event fields: title, cloudinary.publicId, and cloudinary.secureUrl are required.',
      });
    }

    const eventTitle = title.trim();
    const eventCategory = category || 'Conference';
    const eventDesc = description ? description.trim() : '';

    const assetInfo = CloudinaryService.buildAssetInfoFromUpload({
      publicId: rawCloudinary.publicId,
      secureUrl: rawCloudinary.secureUrl,
      cloudName: rawCloudinary.cloudName,
      format: rawCloudinary.format,
      duration: rawCloudinary.duration,
      width: rawCloudinary.width,
      height: rawCloudinary.height,
      bytes: rawCloudinary.bytes,
      createdAt: rawCloudinary.createdAt,
    });

    const durationSeconds = assetInfo.duration || 120;
    const durationFormatted = GeminiService.formatSeconds(durationSeconds);

    const newEvent: EventItem = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: eventTitle,
      description: eventDesc,
      category: eventCategory,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      durationFormatted,
      durationSeconds,
      status: 'ready',
      isDemo: false,
      createdAt: new Date().toISOString(),
      cloudinary: assetInfo,
    };

    const saved = eventStore.save(newEvent);
    res.status(201).json({ event: saved });
  } catch (error: any) {
    console.error('Event registration error:', error);
    res.status(500).json({
      error: error.message || 'Failed to register event metadata.',
    });
  }
});

// 4. Deprecated legacy upload endpoint guard (prevents Vercel 413)
app.post('/api/upload', (_req: Request, res: Response) => {
  res.status(400).json({
    error:
      'Direct binary upload to the server is deprecated to prevent Vercel 413 Payload Too Large limits. Use the direct browser-to-Cloudinary upload pipeline via /api/upload/sign and /api/events/register.',
  });
});

// 5. Get all events
app.get('/api/events', (_req: Request, res: Response) => {
  res.json({ events: eventStore.getAll() });
});

// 6. Get event by ID
app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = eventStore.getById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json({ event });
});

// 7. Seed / reset demo events
app.post('/api/events/seed', (_req: Request, res: Response) => {
  eventStore.seed();
  res.json({ success: true, events: eventStore.getAll() });
});

// 8. Analyze event media with Gemini (generates summary, chapters, highlights)
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const event = eventStore.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Set status to analyzing
    eventStore.update(eventId, { status: 'analyzing' });

    // Run multimodal media analysis
    const summary = await GeminiService.analyzeEventMedia({
      title: event.title,
      description: event.description,
      category: event.category,
      durationSeconds: event.durationSeconds,
      cloudName: event.cloudinary.cloudName,
      publicId: event.cloudinary.publicId,
    });

    // Save summary and update status to ready
    const updated = eventStore.update(eventId, {
      summary,
      status: 'ready',
    });

    res.json({ success: true, event: updated });
  } catch (error: any) {
    console.error('Media analysis error:', error);
    res.status(500).json({ error: error.message || 'Media analysis failed' });
  }
});

// 9. Ask the Event - Natural language search & Q&A
app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    const { eventId, query } = req.body;
    if (!eventId || !query) {
      return res.status(400).json({ error: 'eventId and query are required' });
    }

    const event = eventStore.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = await GeminiService.askTheEvent(event, query);
    res.json(result);
  } catch (error: any) {
    console.error('Ask the Event error:', error);
    res.status(500).json({ error: error.message || 'Failed to search event' });
  }
});

// 10. Generate Recap (30s, 60s, 120s) with Cloudinary transformations
app.post('/api/highlights/generate-recap', (req: Request, res: Response) => {
  try {
    const { eventId, targetDuration, title } = req.body;
    const dur: 30 | 60 | 120 = Number(targetDuration) === 60 ? 60 : Number(targetDuration) === 120 ? 120 : 30;

    const event = eventStore.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const recapTitle = title || `${dur}s Smart Highlight Recap`;
    const pid = event.cloudinary.publicId;
    const cloud = event.cloudinary.cloudName;

    // Build real Cloudinary URL with auto format, quality, and duration trimming
    const videoUrl = CloudinaryService.buildRecapUrl(pid, dur, cloud, 10);
    const thumbnailUrl = CloudinaryService.buildChapterThumbnailUrl(pid, 15, cloud);

    const newRecap: RecapVideo = {
      id: `recap_${Date.now()}`,
      targetDuration: dur,
      title: recapTitle,
      videoUrl,
      thumbnailUrl,
      createdAt: new Date().toISOString(),
      durationSeconds: dur,
      includedMomentsCount: dur === 30 ? 3 : dur === 60 ? 5 : 8,
    };

    const currentRecaps = event.recaps || [];
    const updated = eventStore.update(eventId, {
      recaps: [newRecap, ...currentRecaps],
    });

    res.json({ recap: newRecap, event: updated });
  } catch (error: any) {
    console.error('Recap generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recap video' });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error handler:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
