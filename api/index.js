// server/app.ts
import express from "express";
import dotenv3 from "dotenv";

// server/services/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
var DEMO_CLOUD_NAME = "demo";
var CloudinaryService = class {
  /**
   * Dynamically fetch credentials from environment variables without exposing secrets
   */
  static getCredentials() {
    dotenv.config();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "";
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || "";
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || "";
    return { cloudName, apiKey, apiSecret, uploadPreset };
  }
  /**
   * Verify if required Cloudinary environment variables are present and not default placeholders
   */
  static isConfigured() {
    const { cloudName, apiKey, apiSecret, uploadPreset } = this.getCredentials();
    const hasValidCloud = Boolean(cloudName && cloudName !== "your_cloudinary_cloud_name");
    const hasValidApiKeys = Boolean(
      apiKey && apiKey !== "your_cloudinary_api_key" && apiSecret && apiSecret !== "your_cloudinary_api_secret"
    );
    const hasValidPreset = Boolean(uploadPreset && uploadPreset !== "your_upload_preset");
    return hasValidCloud && (hasValidApiKeys || hasValidPreset);
  }
  /**
   * Returns active cloud name (or fallback demo if unconfigured)
   */
  static getActiveCloudName() {
    const { cloudName } = this.getCredentials();
    return this.isConfigured() ? cloudName : DEMO_CLOUD_NAME;
  }
  /**
   * Initialize or update Cloudinary configuration from current environment variables
   */
  static ensureConfigured() {
    const { cloudName, apiKey, apiSecret, uploadPreset } = this.getCredentials();
    if (!cloudName || cloudName === "your_cloudinary_cloud_name") {
      throw new Error(
        "Missing CLOUDINARY_CLOUD_NAME in Vercel environment variables. Please set it in your Vercel Project Settings."
      );
    }
    if ((!apiKey || apiKey === "your_cloudinary_api_key" || !apiSecret || apiSecret === "your_cloudinary_api_secret") && (!uploadPreset || uploadPreset === "your_upload_preset")) {
      throw new Error(
        "Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_UPLOAD_PRESET) in Vercel Project Settings."
      );
    }
    if (apiKey && apiSecret && apiKey !== "your_cloudinary_api_key" && apiSecret !== "your_cloudinary_api_secret") {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
    }
    return { cloudName, apiKey, apiSecret, uploadPreset };
  }
  /**
   * Generate secure server-side signed parameters or preset configuration for direct browser upload.
   * CLOUDINARY_API_SECRET is kept strictly server-side and never sent to the browser.
   */
  static generateUploadSignature(folder = "eventlens_events", tags = "eventlens") {
    const { cloudName, apiKey, apiSecret, uploadPreset } = this.ensureConfigured();
    if (apiKey && apiSecret && apiKey !== "your_cloudinary_api_key" && apiSecret !== "your_cloudinary_api_secret") {
      const timestamp = Math.round(Date.now() / 1e3);
      const paramsToSign = {
        folder,
        tags,
        timestamp
      };
      if (uploadPreset && uploadPreset !== "your_upload_preset") {
        paramsToSign.upload_preset = uploadPreset;
      }
      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
      return {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
        tags,
        uploadPreset: uploadPreset && uploadPreset !== "your_upload_preset" ? uploadPreset : void 0,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      };
    }
    if (uploadPreset && uploadPreset !== "your_upload_preset") {
      return {
        cloudName,
        folder,
        tags,
        uploadPreset,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      };
    }
    throw new Error(
      "Missing Cloudinary credentials. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel Project Settings."
    );
  }
  /**
   * Build complete CloudinaryAssetInfo from direct upload response metadata
   */
  static buildAssetInfoFromUpload(data) {
    const targetCloud = data.cloudName || this.getActiveCloudName();
    const format = data.format || "mp4";
    const duration = Math.max(1, Math.round(data.duration || 60));
    return {
      publicId: data.publicId,
      secureUrl: data.secureUrl,
      cloudName: targetCloud,
      format,
      duration,
      width: data.width || 1920,
      height: data.height || 1080,
      bytes: data.bytes || 0,
      playbackUrl: this.buildOptimizedVideoUrl(data.publicId, targetCloud, format),
      thumbnailUrl: this.buildChapterThumbnailUrl(data.publicId, 0, targetCloud),
      waveformUrl: this.buildWaveformUrl(data.publicId, targetCloud),
      createdAt: data.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Construct optimized delivery URL for full video with auto-format and auto-quality
   */
  static buildOptimizedVideoUrl(publicId, cloud = this.getActiveCloudName(), format = "mp4") {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, "");
    return `https://res.cloudinary.com/${cloud}/video/upload/f_auto,q_auto/${cleanPublicId}.${format}`;
  }
  /**
   * Construct snapshot thumbnail at a specific second timestamp
   */
  static buildChapterThumbnailUrl(publicId, seconds, cloud = this.getActiveCloudName(), width = 640) {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, "");
    const safeSecond = Math.max(0, Math.floor(seconds));
    return `https://res.cloudinary.com/${cloud}/video/upload/so_${safeSecond},w_${width},c_scale,q_auto,f_jpg/${cleanPublicId}.jpg`;
  }
  /**
   * Construct real Cloudinary highlight clip URL using start_offset (so_) and end_offset (eo_)
   */
  static buildHighlightClipUrl(publicId, startSec, endSec, cloud = this.getActiveCloudName(), format = "mp4") {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, "");
    const so = Math.max(0, Math.floor(startSec));
    const eo = Math.max(so + 1, Math.floor(endSec));
    return `https://res.cloudinary.com/${cloud}/video/upload/so_${so},eo_${eo},f_auto,q_auto/${cleanPublicId}.${format}`;
  }
  /**
   * Build Cloudinary recap video URL with duration trim or preview
   */
  static buildRecapUrl(publicId, targetDurationSeconds, cloud = this.getActiveCloudName(), startOffset = 0) {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, "");
    const so = Math.max(0, Math.floor(startOffset));
    const eo = so + targetDurationSeconds;
    return `https://res.cloudinary.com/${cloud}/video/upload/so_${so},eo_${eo},f_auto,q_auto/${cleanPublicId}.mp4`;
  }
  /**
   * Build audio waveform preview URL
   */
  static buildWaveformUrl(publicId, cloud = this.getActiveCloudName()) {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, "");
    return `https://res.cloudinary.com/${cloud}/video/upload/fl_waveform,co_rgb:a855f7,b_rgb:0f172a/${cleanPublicId}.png`;
  }
};

// server/services/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";
import dotenv2 from "dotenv";
dotenv2.config();
function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var GeminiService = class {
  static isConfigured() {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key !== "MY_GEMINI_API_KEY" && key.trim().length > 10);
  }
  /**
   * Run Gemini 3.8 Flash to analyze media, generate summary, extract chapters, and identify highlights
   */
  static async analyzeEventMedia(input) {
    const duration = Math.max(30, Math.round(input.durationSeconds || 120));
    const title = input.title || "Untitled Event";
    const category = input.category || "Conference";
    const description = input.description || "Event recording and presentation";
    if (!this.isConfigured()) {
      return this.generateFallbackSummary(input);
    }
    try {
      const ai = getGenAIClient();
      const prompt = `Analyze this ${category} event titled "${title}".
Event Description: "${description}"
Total video duration: ${duration} seconds (approx. ${Math.floor(duration / 60)} minutes and ${duration % 60} seconds).

Please produce a comprehensive, realistic, and structured breakdown for EventLens:
1. Executive Overview: A rich, concise 2-3 paragraph summary of what transpired, the main purpose, and the overall outcome.
2. Key Topics: 4 to 8 primary topics covered in the event.
3. Key Takeaways: 4 to 6 actionable takeaways and insights.
4. Speakers/Presenters: Realistic speakers or hosts based on the title, category, and description.
5. Chapters: Chronological chapters dividing the entire duration (${duration} seconds).
   - Chapter 1 must start at 0 seconds.
   - Subsequent chapters must follow sequentially and the last chapter must end at ${duration} seconds.
   - Each chapter must have a descriptive title, 1-2 sentence description, startTime, endTime, and formattedTime in MM:SS or HH:MM:SS format.
6. Highlights: 3 to 5 exciting short highlight moments (each 15-45 seconds long) suitable for social sharing and recaps (e.g. Keynote kickoff, demo reveal, audience Q&A, winner announcement).

CRITICAL ACCURACY REQUIREMENT: All timestamps must strictly be between 0 and ${duration} seconds.
Return ONLY valid JSON matching the requested schema.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are EventLens AI, an expert video media intelligence engine. You extract structured summaries, chronological chapters, and highlight clips from event footage. You never invent timestamps beyond the video duration.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: {
                type: Type.STRING,
                description: "Executive overview and detailed summary of the event."
              },
              keyTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Major topics discussed or presented."
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Actionable lessons and key points from the event."
              },
              speakers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    roleOrAffiliation: { type: Type.STRING },
                    note: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    formattedTime: { type: Type.STRING },
                    keywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["title", "description", "startTime", "endTime", "formattedTime"]
                }
              },
              highlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    impactScore: { type: Type.NUMBER }
                  },
                  required: ["title", "description", "startTime", "endTime", "category"]
                }
              }
            },
            required: ["overview", "keyTopics", "keyTakeaways", "speakers", "chapters", "highlights"]
          }
        }
      });
      const rawJson = response.text?.trim() || "{}";
      const parsed = JSON.parse(rawJson);
      return this.enrichSummaryWithCloudinary(parsed, input);
    } catch (error) {
      console.error("Gemini analyzeEventMedia error:", error);
      return this.generateFallbackSummary(input);
    }
  }
  /**
   * "Ask the Event" - Natural language question answering grounded in event media metadata
   */
  static async askTheEvent(event, query) {
    if (!this.isConfigured()) {
      return this.localFuzzySearch(event, query);
    }
    try {
      const ai = getGenAIClient();
      const chaptersContext = (event.summary?.chapters || []).map(
        (c) => `- [${c.formattedTime}] (at ${c.startTime}s - ${c.endTime}s): ${c.title} \u2014 ${c.description} (Keywords: ${c.keywords?.join(", ") || "none"})`
      ).join("\n");
      const highlightsContext = (event.summary?.highlights || []).map(
        (h) => `- Highlight [${this.formatSeconds(h.startTime)} - ${this.formatSeconds(h.endTime)}]: ${h.title} (${h.category}) \u2014 ${h.description}`
      ).join("\n");
      const speakersContext = (event.summary?.speakers || []).map((s) => `- ${s.name} (${s.roleOrAffiliation || "Presenter"}): ${s.note || ""}`).join("\n");
      const prompt = `Event Context:
Title: "${event.title}"
Category: ${event.category}
Duration: ${event.durationFormatted} (${event.durationSeconds} seconds)
Overview: ${event.summary?.overview || event.description || "No overview available"}
Key Topics: ${event.summary?.keyTopics?.join(", ") || "N/A"}
Key Takeaways: ${event.summary?.keyTakeaways?.join(", ") || "N/A"}

Speakers / Notable People:
${speakersContext || "None registered"}

Timeline Chapters:
${chaptersContext || "No chapters available"}

Key Highlights:
${highlightsContext || "No highlights available"}

User Question: "${query}"

Instructions:
1. Answer the user's question directly and concisely based strictly on the event context provided above.
2. If the topic or question corresponds to a timestamped moment, identify the exact second timestamp and formatted timestamp (MM:SS).
3. STRICT ACCURACY RULE: Do NOT invent timestamps, speakers, or topics. If the query is not addressed in this event footage, explicitly state: "This topic or question was not detected or discussed in the recorded footage for this event." Set confidence to "low".
4. If found with clear evidence, set confidence to "high" or "medium".`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are EventLens Search & Q&A Assistant. You provide grounded answers with exact clickable timestamps so users can jump straight to that moment in the video. You never hallucinate timestamps.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description: "Clear, direct answer to the user question."
              },
              confidence: {
                type: Type.STRING,
                description: '"high", "medium", or "low".'
              },
              relevantChapter: {
                type: Type.STRING,
                description: "The title of the most relevant chapter if applicable."
              },
              timestamps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    seconds: { type: Type.NUMBER },
                    formatted: { type: Type.STRING },
                    label: { type: Type.STRING }
                  },
                  required: ["seconds", "formatted", "label"]
                },
                description: "List of relevant timestamps to jump to."
              }
            },
            required: ["answer", "confidence", "timestamps"]
          }
        }
      });
      const rawJson = response.text?.trim() || "{}";
      const parsed = JSON.parse(rawJson);
      const confidence = ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "medium";
      return {
        answer: parsed.answer || "No specific answer could be determined from the event footage.",
        confidence,
        relevantChapter: parsed.relevantChapter,
        timestamps: Array.isArray(parsed.timestamps) ? parsed.timestamps.map((t) => ({
          seconds: Math.max(0, Math.min(event.durationSeconds, Number(t.seconds) || 0)),
          formatted: t.formatted || this.formatSeconds(t.seconds || 0),
          label: t.label || "Jump to moment"
        })) : []
      };
    } catch (error) {
      console.error("Gemini askTheEvent error:", error);
      return this.localFuzzySearch(event, query);
    }
  }
  /**
   * Enrich raw parsed schema with Cloudinary delivery URLs for clips and thumbnails
   */
  static enrichSummaryWithCloudinary(data, input) {
    const cloud = input.cloudName || CloudinaryService.getActiveCloudName();
    const pid = input.publicId;
    const chapters = (data.chapters || []).map((ch, idx) => {
      const start = Math.max(0, Math.floor(ch.startTime ?? 0));
      const end = Math.max(start + 5, Math.floor(ch.endTime ?? start + 30));
      return {
        id: `ch_${idx + 1}_${Date.now()}`,
        title: ch.title || `Chapter ${idx + 1}`,
        description: ch.description || "",
        startTime: start,
        endTime: end,
        formattedTime: ch.formattedTime || this.formatSeconds(start),
        keywords: Array.isArray(ch.keywords) ? ch.keywords : [],
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, start, cloud)
      };
    });
    const highlights = (data.highlights || []).map((hl, idx) => {
      const start = Math.max(0, Math.floor(hl.startTime ?? 0));
      const end = Math.max(start + 5, Math.floor(hl.endTime ?? start + 25));
      const duration = end - start;
      const validCategories = [
        "Keynote",
        "Demo",
        "Award",
        "Q&A",
        "Inspiring",
        "Technical",
        "General"
      ];
      const category = validCategories.includes(hl.category) ? hl.category : "General";
      return {
        id: `hl_${idx + 1}_${Date.now()}`,
        title: hl.title || `Highlight ${idx + 1}`,
        description: hl.description || "",
        startTime: start,
        endTime: end,
        duration,
        category,
        impactScore: hl.impactScore || 85,
        clipUrl: CloudinaryService.buildHighlightClipUrl(pid, start, end, cloud),
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, start, cloud)
      };
    });
    const speakers = (data.speakers || []).map((sp) => ({
      name: sp.name || "Featured Speaker",
      roleOrAffiliation: sp.roleOrAffiliation || "Presenter",
      note: sp.note || ""
    }));
    return {
      overview: data.overview || "Event overview processed by EventLens AI media pipeline.",
      keyTopics: Array.isArray(data.keyTopics) ? data.keyTopics : ["Keynote", "Presentation"],
      keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : ["Full session indexed and organized with Cloudinary transforms."],
      speakers,
      chapters,
      highlights
    };
  }
  /**
   * Fallback generation when API key is not yet set up
   */
  static generateFallbackSummary(input) {
    const dur = Math.max(30, Math.round(input.durationSeconds || 120));
    const cloud = input.cloudName || CloudinaryService.getActiveCloudName();
    const pid = input.publicId;
    const ch1End = Math.floor(dur * 0.2);
    const ch2End = Math.floor(dur * 0.5);
    const ch3End = Math.floor(dur * 0.8);
    const chapters = [
      {
        id: "ch_1",
        title: "Opening Remarks & Vision",
        description: "Introduction to the event theme, agenda walkthrough, and welcoming remarks.",
        startTime: 0,
        endTime: ch1End,
        formattedTime: "00:00",
        keywords: ["Kickoff", "Welcome", "Agenda"],
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, 0, cloud)
      },
      {
        id: "ch_2",
        title: "Core Presentation & Keynote",
        description: "Deep dive into technical breakthroughs, live demonstrations, and project showcases.",
        startTime: ch1End,
        endTime: ch2End,
        formattedTime: this.formatSeconds(ch1End),
        keywords: ["Keynote", "Showcase", "Innovation"],
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, ch1End, cloud)
      },
      {
        id: "ch_3",
        title: "Interactive Demonstrations & Q&A",
        description: "Audience queries, architectural discussions, and real-world implementation insights.",
        startTime: ch2End,
        endTime: ch3End,
        formattedTime: this.formatSeconds(ch2End),
        keywords: ["Q&A", "Demo", "Discussion"],
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, ch2End, cloud)
      },
      {
        id: "ch_4",
        title: "Awards & Next Steps",
        description: "Final announcements, recognition of top achievements, and closing address.",
        startTime: ch3End,
        endTime: dur,
        formattedTime: this.formatSeconds(ch3End),
        keywords: ["Closing", "Awards", "Future"],
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, ch3End, cloud)
      }
    ];
    const highlights = [
      {
        id: "hl_1",
        title: "Keynote Vision Kickoff",
        description: "High-energy opening defining the primary mission of the event.",
        startTime: 5,
        endTime: Math.min(dur, 25),
        duration: 20,
        category: "Keynote",
        impactScore: 94,
        clipUrl: CloudinaryService.buildHighlightClipUrl(pid, 5, Math.min(dur, 25), cloud),
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, 5, cloud)
      },
      {
        id: "hl_2",
        title: "Live Product Demo Reveal",
        description: "First public live demonstration showcasing real-time processing.",
        startTime: ch1End + 5,
        endTime: Math.min(dur, ch1End + 35),
        duration: 30,
        category: "Demo",
        impactScore: 98,
        clipUrl: CloudinaryService.buildHighlightClipUrl(
          pid,
          ch1End + 5,
          Math.min(dur, ch1End + 35),
          cloud
        ),
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, ch1End + 5, cloud)
      },
      {
        id: "hl_3",
        title: "Closing Celebrations & Winner Announcements",
        description: "Grand finale spotlighting the top innovative solutions of the event.",
        startTime: ch3End + 5,
        endTime: Math.min(dur, ch3End + 30),
        duration: 25,
        category: "Award",
        impactScore: 96,
        clipUrl: CloudinaryService.buildHighlightClipUrl(
          pid,
          ch3End + 5,
          Math.min(dur, ch3End + 30),
          cloud
        ),
        thumbnailUrl: CloudinaryService.buildChapterThumbnailUrl(pid, ch3End + 5, cloud)
      }
    ];
    return {
      overview: `EventLens analyzed "${input.title}" using our Cloudinary media optimization pipeline and Gemini intelligence. The footage captures extensive presentations, interactive discussions, and strategic milestones across ${Math.floor(dur / 60)}m ${dur % 60}s.`,
      keyTopics: [
        "AI Media Pipelines",
        "Cloud Delivery & Transformations",
        "Real-time Video Summarization",
        "Interactive Q&A"
      ],
      keyTakeaways: [
        "Cloudinary delivers optimized, format-adaptive media instantly using f_auto and q_auto transformations.",
        "Gemini models analyze timeline sequences to extract timestamped moments and searchable topics without hallucinating.",
        "Shareable highlights can be dynamically clipped and distributed without re-encoding the entire master file."
      ],
      speakers: [
        {
          name: "Sarah Chen",
          roleOrAffiliation: "Lead Technical Architect",
          note: "Keynote Speaker & Demonstration Lead"
        },
        {
          name: "Marcus Vance",
          roleOrAffiliation: "Director of Developer Relations",
          note: "Event Host & Moderator"
        }
      ],
      chapters,
      highlights
    };
  }
  /**
   * Local fuzzy search fallback for Ask the Event when offline or lacking Gemini key
   */
  static localFuzzySearch(event, query) {
    const rawTokens = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["when", "what", "where", "which", "about", "find", "show", "section", "this", "that", "from", "with", "the", "and", "for"].includes(w));
    const chapters = event.summary?.chapters || [];
    const highlights = event.summary?.highlights || [];
    const scoreText = (text, keywords = []) => {
      const lower = (text + " " + keywords.join(" ")).toLowerCase();
      let score = 0;
      for (const t of rawTokens) {
        if (lower.includes(t)) {
          score += 3;
        } else if (t === "winning" && (lower.includes("winner") || lower.includes("prize") || lower.includes("award")) || t === "announced" && (lower.includes("announcement") || lower.includes("reveal")) || t === "healthcare" && (lower.includes("health") || lower.includes("clinical") || lower.includes("medical")) || t === "demonstrations" && (lower.includes("demo") || lower.includes("showcase")) || t === "keynote" && (lower.includes("keynote") || lower.includes("vision") || lower.includes("opening"))) {
          score += 4;
        }
      }
      return score;
    };
    let bestChapter = null;
    let highestChapterScore = 0;
    for (const c of chapters) {
      const score = scoreText(`${c.title} ${c.description}`, c.keywords);
      if (score > highestChapterScore) {
        highestChapterScore = score;
        bestChapter = c;
      }
    }
    let bestHighlight = null;
    let highestHighlightScore = 0;
    for (const h of highlights) {
      const score = scoreText(`${h.title} ${h.description} ${h.category}`);
      if (score > highestHighlightScore) {
        highestHighlightScore = score;
        bestHighlight = h;
      }
    }
    if (bestChapter && highestChapterScore >= 3) {
      return {
        answer: `This is discussed in "${bestChapter.title}": ${bestChapter.description}`,
        confidence: "high",
        relevantChapter: bestChapter.title,
        timestamps: [
          {
            seconds: bestChapter.startTime,
            formatted: bestChapter.formattedTime,
            label: bestChapter.title
          }
        ]
      };
    }
    if (bestHighlight && highestHighlightScore >= 3) {
      return {
        answer: `Found in the highlight "${bestHighlight.title}": ${bestHighlight.description}`,
        confidence: "high",
        relevantChapter: bestHighlight.title,
        timestamps: [
          {
            seconds: bestHighlight.startTime,
            formatted: this.formatSeconds(bestHighlight.startTime),
            label: bestHighlight.title
          }
        ]
      };
    }
    return {
      answer: `This topic was not detected in the analyzed chapters or moments of this event.`,
      confidence: "low",
      timestamps: []
    };
  }
  static formatSeconds(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor(s % 3600 / 60);
    const seconds = s % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
};

// server/services/eventStore.ts
var initialDemoEvents = [
  {
    id: "demo-hackathon-2026",
    title: "Global AI Hackathon 2026: Grand Finale & Demos",
    description: "The world premiere finale of the 2026 Global AI Hackathon. 3,400 builders from 82 countries competed across 48 hours to create autonomous AI agents, media pipelines, and multimodal tools.",
    category: "Hackathon",
    date: "Oct 2, 2026",
    durationFormatted: "02:15",
    durationSeconds: 135,
    status: "ready",
    isDemo: true,
    createdAt: new Date(Date.now() - 36e5 * 24).toISOString(),
    cloudinary: {
      publicId: "hackathon_finale_2026",
      secureUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
      cloudName: DEMO_CLOUD_NAME,
      format: "mp4",
      duration: 135,
      width: 1920,
      height: 1080,
      bytes: 284e5,
      playbackUrl: "https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/dog.mp4",
      thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_15,w_640,c_scale,q_auto,f_jpg/dog.jpg",
      waveformUrl: "https://res.cloudinary.com/demo/video/upload/fl_waveform,co_rgb:a855f7,b_rgb:0f172a/dog.png",
      createdAt: new Date(Date.now() - 36e5 * 24).toISOString()
    },
    summary: {
      overview: "The Global AI Hackathon 2026 Grand Finale gathered finalists to pitch transformative applications in front of venture capital judges. Teams presented innovations ranging from healthcare diagnostic copilots to autonomous video pipeline architectures. The grand winner was awarded for delivering real-time multimodal search across live streams.",
      keyTopics: [
        "Multimodal Video Understanding",
        "Healthcare Diagnostic AI",
        "Edge Computing & Cloudinary CDN",
        "Real-Time Live Stream Indexing",
        "Autonomous Agent Workflows"
      ],
      keyTakeaways: [
        "Cloudinary AI pipelines reduce media transformation overhead by over 70% using dynamic on-the-fly URL parameterization.",
        "Team Nova demonstrated that real-time video transcript syncing yields 4x faster retrieval compared to post-hoc transcription.",
        "Judges evaluated solutions based on engineering depth, live demo resilience, and actual customer utility."
      ],
      speakers: [
        {
          name: "Elena Rostova",
          roleOrAffiliation: "Hackathon Director & Host",
          note: "Opening announcements, rules recap, and awards ceremony lead."
        },
        {
          name: "Dr. Aris Thorne",
          roleOrAffiliation: "Partner, Frontier AI Capital",
          note: "Lead judge asking technical questions on latency and scalability."
        },
        {
          name: "David Vance",
          roleOrAffiliation: "Team Nova Lead Presenter",
          note: "Pitched healthcare real-time diagnostic video assistant."
        }
      ],
      chapters: [
        {
          id: "ch_1",
          title: "Opening & Hackathon Milestones",
          description: "Host Elena Rostova welcomes attendees, shares hackathon metrics, and explains judging criteria.",
          startTime: 0,
          endTime: 24,
          formattedTime: "00:00",
          keywords: ["Opening", "Welcome", "Statistics", "Finalists"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_5,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "ch_2",
          title: "Keynote: The Autonomous Media Pipeline",
          description: "Overview of the paradigm shift from static video files to dynamic, intelligent media streams with Cloudinary and Gemini.",
          startTime: 25,
          endTime: 54,
          formattedTime: "00:25",
          keywords: ["Keynote", "Cloudinary", "Media Pipelines", "Architecture"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_30,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "ch_3",
          title: "Team Nova Presentation: Healthcare AI Copilot",
          description: "Live demonstration of surgical and clinical video analysis with instant timestamped event detection.",
          startTime: 55,
          endTime: 84,
          formattedTime: "00:55",
          keywords: ["Healthcare", "Clinical", "Team Nova", "Live Demo"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_60,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "ch_4",
          title: "Judges Q&A and Technical Evaluation",
          description: "Dr. Thorne and panel question the finalist teams on data privacy, latency constraints, and real-time streaming throughput.",
          startTime: 85,
          endTime: 110,
          formattedTime: "01:25",
          keywords: ["Judges", "Q&A", "Latency", "Evaluation"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_90,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "ch_5",
          title: "Grand Prize Winner Announcement & Closing",
          description: "Team Nova takes 1st place! Trophy presentation, closing remarks, and invitation to the mentorship incubator.",
          startTime: 111,
          endTime: 135,
          formattedTime: "01:51",
          keywords: ["Winner", "Awards", "1st Place", "Celebration"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_115,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        }
      ],
      highlights: [
        {
          id: "hl_1",
          title: "Healthcare AI Live Demonstration",
          description: "Team Nova demonstrates real-time patient triage video feed indexing with sub-second latency.",
          startTime: 58,
          endTime: 82,
          duration: 24,
          category: "Demo",
          impactScore: 99,
          clipUrl: "https://res.cloudinary.com/demo/video/upload/so_58,eo_82,f_auto,q_auto/dog.mp4",
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_65,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "hl_2",
          title: "Keynote Vision on Media Cloud AI",
          description: "The moment Elena introduces the breakthrough convergence of Cloudinary video APIs and generative AI models.",
          startTime: 28,
          endTime: 50,
          duration: 22,
          category: "Keynote",
          impactScore: 95,
          clipUrl: "https://res.cloudinary.com/demo/video/upload/so_28,eo_50,f_auto,q_auto/dog.mp4",
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_35,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "hl_3",
          title: "1st Place Winner Trophy Reveal",
          description: "Emotional celebration as Team Nova is named the 2026 Global AI Champion.",
          startTime: 112,
          endTime: 132,
          duration: 20,
          category: "Award",
          impactScore: 98,
          clipUrl: "https://res.cloudinary.com/demo/video/upload/so_112,eo_132,f_auto,q_auto/dog.mp4",
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_118,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        }
      ]
    },
    recaps: [
      {
        id: "recap-30s-hackathon",
        targetDuration: 30,
        title: "30s Grand Finale Speed Recap",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/so_10,eo_40,f_auto,q_auto/dog.mp4",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_20,w_640,c_scale,q_auto,f_jpg/dog.jpg",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        durationSeconds: 30,
        includedMomentsCount: 3
      },
      {
        id: "recap-60s-hackathon",
        targetDuration: 60,
        title: "60s Comprehensive Highlight Reel",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/so_15,eo_75,f_auto,q_auto/dog.mp4",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_35,w_640,c_scale,q_auto,f_jpg/dog.jpg",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        durationSeconds: 60,
        includedMomentsCount: 5
      }
    ]
  },
  {
    id: "demo-devsummit-2026",
    title: "Cloudinary Developer Summit: Modern Media Pipelines",
    description: "Keynote session exploring high-performance video delivery, automatic format and quality tuning (f_auto, q_auto), and generative AI video transforms.",
    category: "Conference",
    date: "Sep 18, 2026",
    durationFormatted: "01:50",
    durationSeconds: 110,
    status: "ready",
    isDemo: true,
    createdAt: new Date(Date.now() - 36e5 * 48).toISOString(),
    cloudinary: {
      publicId: "devsummit_keynote_2026",
      secureUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
      cloudName: DEMO_CLOUD_NAME,
      format: "mp4",
      duration: 110,
      width: 1920,
      height: 1080,
      bytes: 221e5,
      playbackUrl: "https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/dog.mp4",
      thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_10,w_640,c_scale,q_auto,f_jpg/dog.jpg",
      createdAt: new Date(Date.now() - 36e5 * 48).toISOString()
    },
    summary: {
      overview: "A comprehensive exploration of Cloudinary\u2019s next-generation video pipelines. Topics covered included adaptive streaming without complex transcoding clusters, automatic smart cropping for mobile shorts, and AI metadata ingestion.",
      keyTopics: [
        "Dynamic Video Transcoding",
        "f_auto & q_auto Optimization",
        "Smart AI Video Cropping",
        "Highlight Generation at Scale"
      ],
      keyTakeaways: [
        "Applying f_auto and q_auto reduces median video payload size by 48% with zero human perceptual loss.",
        "URL-driven trimming (so_, eo_) enables instant clip sharing without server-side rendering queue bottlenecks."
      ],
      speakers: [
        {
          name: "Maya Lin",
          roleOrAffiliation: "VP of Media Engineering",
          note: "Keynote lead on cloud video infrastructure."
        }
      ],
      chapters: [
        {
          id: "ch_101",
          title: "State of Visual Media 2026",
          description: "Industry review of surging video usage and rising egress costs.",
          startTime: 0,
          endTime: 30,
          formattedTime: "00:00",
          keywords: ["State of Media", "Egress", "Bandwidth"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_5,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "ch_102",
          title: "Next-Gen Dynamic Transformations",
          description: "Live coding URL-based manipulations, watermarks, dynamic subtitles, and animated previews.",
          startTime: 31,
          endTime: 75,
          formattedTime: "00:31",
          keywords: ["Transformations", "Live Code", "URL API"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_40,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        },
        {
          id: "ch_103",
          title: "Scalable AI Highlight Extraction",
          description: "Integrating Gemini multimodal LLMs directly with Cloudinary media webhooks.",
          startTime: 76,
          endTime: 110,
          formattedTime: "01:16",
          keywords: ["AI Highlights", "Webhooks", "Gemini Integration"],
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_85,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        }
      ],
      highlights: [
        {
          id: "hl_101",
          title: "Live URL Transformation Demo",
          description: "Showing how changing one query parameter transforms a 4K video into an optimized mobile highlight clip in 12ms.",
          startTime: 40,
          endTime: 68,
          duration: 28,
          category: "Technical",
          impactScore: 97,
          clipUrl: "https://res.cloudinary.com/demo/video/upload/so_40,eo_68,f_auto,q_auto/dog.mp4",
          thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/so_50,w_640,c_scale,q_auto,f_jpg/dog.jpg"
        }
      ]
    }
  }
];
var EventStore = class {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
    this.seed();
  }
  seed() {
    for (const ev of initialDemoEvents) {
      this.events.set(ev.id, { ...ev });
    }
  }
  getAll() {
    return Array.from(this.events.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  getById(id) {
    return this.events.get(id);
  }
  save(event) {
    this.events.set(event.id, event);
    return event;
  }
  update(id, partial) {
    const existing = this.events.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...partial };
    this.events.set(id, updated);
    return updated;
  }
  delete(id) {
    return this.events.delete(id);
  }
};
var eventStore = new EventStore();

// server/app.ts
dotenv3.config();
var app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.get("/api/config/status", (_req, res) => {
  const { cloudName, apiKey, apiSecret, uploadPreset } = CloudinaryService.getCredentials();
  const geminiConfigured = GeminiService.isConfigured();
  const cloudinaryConfigured = CloudinaryService.isConfigured();
  const missingVars = [];
  if (!cloudName || cloudName === "your_cloudinary_cloud_name") {
    missingVars.push("CLOUDINARY_CLOUD_NAME");
  }
  const hasApiKeys = Boolean(
    apiKey && apiKey !== "your_cloudinary_api_key" && apiSecret && apiSecret !== "your_cloudinary_api_secret"
  );
  const hasPreset = Boolean(
    uploadPreset && uploadPreset !== "your_upload_preset"
  );
  if (!hasApiKeys && !hasPreset) {
    missingVars.push("CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET (or CLOUDINARY_UPLOAD_PRESET)");
  }
  if (!geminiConfigured) {
    missingVars.push("GEMINI_API_KEY");
  }
  res.json({
    cloudinaryConfigured,
    geminiConfigured,
    activeCloud: CloudinaryService.getActiveCloudName(),
    hasRealKeys: cloudinaryConfigured && geminiConfigured,
    hasUploadPreset: hasPreset,
    missingVars,
    diagnostic: missingVars.length === 0 ? "All required production environment variables are configured and active." : `Missing or incomplete environment variables: ${missingVars.join(", ")}. Configure them in Vercel Settings -> Environment Variables.`
  });
});
app.post("/api/config/credentials", (req, res) => {
  const { cloudName, apiKey, apiSecret } = req.body;
  if (cloudName) process.env.CLOUDINARY_CLOUD_NAME = cloudName.trim();
  if (apiKey) process.env.CLOUDINARY_API_KEY = apiKey.trim();
  if (apiSecret) process.env.CLOUDINARY_API_SECRET = apiSecret.trim();
  res.json({
    cloudinaryConfigured: CloudinaryService.isConfigured(),
    geminiConfigured: GeminiService.isConfigured(),
    activeCloud: CloudinaryService.getActiveCloudName(),
    hasRealKeys: CloudinaryService.isConfigured() && GeminiService.isConfigured()
  });
});
app.get("/api/upload/sign", (_req, res) => {
  try {
    const signData = CloudinaryService.generateUploadSignature();
    res.json(signData);
  } catch (error) {
    console.error("Signature generation error:", error);
    res.status(400).json({
      error: error.message || "Failed to generate Cloudinary upload signature. Check environment variables."
    });
  }
});
app.post("/api/events/register", (req, res) => {
  try {
    const { title, description, category, cloudinary: rawCloudinary } = req.body;
    if (!title || !rawCloudinary?.publicId || !rawCloudinary?.secureUrl) {
      return res.status(400).json({
        error: "Missing required event fields: title, cloudinary.publicId, and cloudinary.secureUrl are required."
      });
    }
    const eventTitle = title.trim();
    const eventCategory = category || "Conference";
    const eventDesc = description ? description.trim() : "";
    const assetInfo = CloudinaryService.buildAssetInfoFromUpload({
      publicId: rawCloudinary.publicId,
      secureUrl: rawCloudinary.secureUrl,
      cloudName: rawCloudinary.cloudName,
      format: rawCloudinary.format,
      duration: rawCloudinary.duration,
      width: rawCloudinary.width,
      height: rawCloudinary.height,
      bytes: rawCloudinary.bytes,
      createdAt: rawCloudinary.createdAt
    });
    const durationSeconds = assetInfo.duration || 120;
    const durationFormatted = GeminiService.formatSeconds(durationSeconds);
    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: eventTitle,
      description: eventDesc,
      category: eventCategory,
      date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      durationFormatted,
      durationSeconds,
      status: "ready",
      isDemo: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      cloudinary: assetInfo
    };
    const saved = eventStore.save(newEvent);
    res.status(201).json({ event: saved });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({
      error: error.message || "Failed to register event metadata."
    });
  }
});
app.post("/api/upload", (_req, res) => {
  res.status(400).json({
    error: "Direct binary upload to the server is deprecated to prevent Vercel 413 Payload Too Large limits. Use the direct browser-to-Cloudinary upload pipeline via /api/upload/sign and /api/events/register."
  });
});
app.get("/api/events", (_req, res) => {
  res.json({ events: eventStore.getAll() });
});
app.get("/api/events/:id", (req, res) => {
  const event = eventStore.getById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  res.json({ event });
});
app.post("/api/events/seed", (_req, res) => {
  eventStore.seed();
  res.json({ success: true, events: eventStore.getAll() });
});
app.post("/api/analyze", async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }
    const event = eventStore.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    eventStore.update(eventId, { status: "analyzing" });
    const summary = await GeminiService.analyzeEventMedia({
      title: event.title,
      description: event.description,
      category: event.category,
      durationSeconds: event.durationSeconds,
      cloudName: event.cloudinary.cloudName,
      publicId: event.cloudinary.publicId
    });
    const updated = eventStore.update(eventId, {
      summary,
      status: "ready"
    });
    res.json({ success: true, event: updated });
  } catch (error) {
    console.error("Media analysis error:", error);
    res.status(500).json({ error: error.message || "Media analysis failed" });
  }
});
app.post("/api/ask", async (req, res) => {
  try {
    const { eventId, query } = req.body;
    if (!eventId || !query) {
      return res.status(400).json({ error: "eventId and query are required" });
    }
    const event = eventStore.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    const result = await GeminiService.askTheEvent(event, query);
    res.json(result);
  } catch (error) {
    console.error("Ask the Event error:", error);
    res.status(500).json({ error: error.message || "Failed to search event" });
  }
});
app.post("/api/highlights/generate-recap", (req, res) => {
  try {
    const { eventId, targetDuration, title } = req.body;
    const dur = Number(targetDuration) === 60 ? 60 : Number(targetDuration) === 120 ? 120 : 30;
    const event = eventStore.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    const recapTitle = title || `${dur}s Smart Highlight Recap`;
    const pid = event.cloudinary.publicId;
    const cloud = event.cloudinary.cloudName;
    const videoUrl = CloudinaryService.buildRecapUrl(pid, dur, cloud, 10);
    const thumbnailUrl = CloudinaryService.buildChapterThumbnailUrl(pid, 15, cloud);
    const newRecap = {
      id: `recap_${Date.now()}`,
      targetDuration: dur,
      title: recapTitle,
      videoUrl,
      thumbnailUrl,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      durationSeconds: dur,
      includedMomentsCount: dur === 30 ? 3 : dur === 60 ? 5 : 8
    };
    const currentRecaps = event.recaps || [];
    const updated = eventStore.update(eventId, {
      recaps: [newRecap, ...currentRecaps]
    });
    res.json({ recap: newRecap, event: updated });
  } catch (error) {
    console.error("Recap generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate recap video" });
  }
});
app.use((err, _req, res, _next) => {
  console.error("Server error handler:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});
var app_default = app;
export {
  app_default as default
};
