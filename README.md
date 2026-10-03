# EventLens 🎥✨
> **AI Media Pipelines for Long-Form Events**  
> *Cloudinary AI Media Pipelines Hackathon Project*

Turn hours of event footage into searchable moments, AI summaries, and shareable highlights.

---

## 🚀 Project Overview

EventLens transforms long event footage (hackathons, conferences, seminars, college fests, webinars, product launches, or sports) into rich, interactive, and searchable media experiences.

Using **Cloudinary** for automated ingestion, storage, dynamic video transformations, and optimized CDN delivery, combined with **Google Gemini 3.8 Flash** for multimodal reasoning and timeline extraction, EventLens produces:

1. **AI-Generated Event Summaries**: Executive overviews, key takeaways, and detected speakers.
2. **Timestamped Chapters & Key Moments**: Chronological segments with clickable seeking directly into the Cloudinary video player.
3. **Interactive "Ask the Event" Natural Language Search**: Query anything about the event (e.g. *"When was the winning team announced?"* or *"Find the healthcare demo"*) with guaranteed non-hallucinated clickable timestamps `[Jump to MM:SS]`.
4. **Instant Highlight Clips & Recaps**: 30-second, 60-second, and 2-minute dynamic highlight reels rendered on-the-fly via Cloudinary URL-based trimming (`so_`, `eo_`, `f_auto`, `q_auto`).
5. **Optimized Delivery**: Real-time format adaptation (`f_auto`) and perceptual quality optimization (`q_auto`).

---

## 🛠️ System Architecture (Direct-to-Cloudinary CDN)

```text
    BROWSER (Client)                           EVENTLENS BACKEND (Vercel)
         │                                                │
         │─── 1. GET /api/upload/sign ───────────────────>│ (Signs with CLOUDINARY_API_SECRET)
         │<── 2. Return HMAC Signature & Parameters ──────│ (Secret NEVER leaves server)
         │
         │ (Direct stream — zero binary through Vercel, bypassing 4.5MB limit)
         ▼
  CLOUDINARY CDN (api.cloudinary.com/v1_1/:cloud/video/upload)
         │
         │<── 3. Real-Time Byte Upload Progress (0% -> 100%)
         │─── 4. Returns Asset Metadata (public_id, secure_url, duration, format)
         │
         ▼
    BROWSER (Client)
         │
         │─── 5. POST /api/events/register (Tiny JSON metadata only) ───> VERCEL BACKEND
                                                                              │
                                                                              ▼
                                                                     GEMINI 3.8 FLASH
                                                                 (AI Chapters, Highlights)
                                                                              │
                                                                              ▼
                                                                     EVENT DASHBOARD
```

---

## ☁️ How Cloudinary is Used

Cloudinary is the foundational media engine powering EventLens:

1. **Video Ingest & Storage**: Master event videos are uploaded securely via streamed buffer or URL ingestion (`cloudinary.v2.uploader.upload_stream`), generating unique public IDs, eager web-optimized derivatives, and master asset records.
2. **On-the-Fly Video Playback & CDN Delivery**: The custom HTML5 video player utilizes Cloudinary's dynamic URL transformations:
   - `f_auto`: Automatically selects AV1, VP9, or H.264 based on the user's browser.
   - `q_auto`: Optimizes bitrate and perceptual quality to eliminate buffering while saving bandwidth.
3. **Dynamic Highlight Clip Trimming**: Highlight clips are rendered instantaneously without re-encoding master files by utilizing Cloudinary's offset parameters:
   - `https://res.cloudinary.com/<cloud>/video/upload/so_<start>,eo_<end>,f_auto,q_auto/<public_id>.mp4`
4. **Chapter Snapshot Thumbnails**: Every timeline chapter generates a preview frame from the exact timestamp:
   - `https://res.cloudinary.com/<cloud>/video/upload/so_<second>,w_640,c_scale,q_auto,f_jpg/<public_id>.jpg`
5. **Smart Recap Reels**: Dynamic recap sequences for 30s, 60s, and 120s social sharing.
6. **Built-in Demo Fallback**: Cloudinary's public cloud (`demo`) is integrated as an out-of-the-box sandbox, allowing instant testing even before custom API credentials are configured.

---

## 🧠 How Gemini is Used

Gemini provides structured media intelligence through the `@google/genai` TypeScript SDK:

1. **Structured Event Analysis**:
   - Model: `gemini-3.8-flash`
   - Strict `responseSchema` with JSON mode to guarantee clean, validated output matching the `EventSummary` interface.
   - Extracts executive overviews, key topics, actionable takeaways, speakers, and sequential chapters with precise second offsets.
2. **"Ask the Event" (Natural Language Search & Q&A)**:
   - Users ask conversational questions about the event.
   - Gemini searches across detected transcripts, chapters, and highlights.
   - Answers are paired with verified second timestamps `[Jump to MM:SS]` that directly seek the Cloudinary video player.
   - **Accuracy Guarantee**: Zero hallucination rule. If a detail was not detected in the footage, Gemini explicitly reports that it was not detected.

---

## 🔑 Required Environment Variables

Create a `.env` file in the project root:

```bash
# GEMINI AI API Key
GEMINI_API_KEY="your_gemini_api_key_here"

# CLOUDINARY CREDENTIALS
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# APPLICATION HOST URL
APP_URL="http://localhost:3000"
```

> **Note**: If `CLOUDINARY_CLOUD_NAME` is left blank, EventLens will automatically run in demo mode using Cloudinary's public demo catalog, allowing you to review all transformations (`so_`, `eo_`, `f_auto`, `q_auto`) immediately.

---

## ▲ Deploying to Vercel

EventLens is pre-configured for zero-friction deployment on **Vercel** with a serverless backend architecture.

### Option 1: Deploy with Vercel CLI (Fastest)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy directly from the project directory**:
   ```bash
   vercel
   ```
   (Follow the prompts: set framework to **Vite**, build command `npm run build`, output directory `dist`).

3. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub / GitLab

1. Push your repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com/new), select **Import Git Repository**.
3. Vercel will automatically detect `vercel.json` and configure:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In the **Environment Variables** section, add your 4 keys:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `GEMINI_API_KEY`
5. Click **Deploy**. Your frontend and serverless `/api/*` routes will be live instantly!

---

## 💻 Local Development Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and populate your credentials:
```bash
cp .env.example .env
```

### 3. Run the Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` with Express backend API routes and Vite frontend middlewares mounted.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📦 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Express, Multer, Node.js Stream Pipeline
- **Media Engine**: Cloudinary Node.js SDK (`cloudinary.v2`)
- **AI Engine**: Google GenAI SDK (`@google/genai`), Gemini 3.8 Flash
- **Bundler & Dev Server**: Vite with TSX runner
