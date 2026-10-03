import { EventItem } from '../../src/types/event';
import { CloudinaryService, DEMO_CLOUD_NAME } from './cloudinary';

// Pre-seeded high quality demo events
const initialDemoEvents: EventItem[] = [
  {
    id: 'demo-hackathon-2026',
    title: 'Global AI Hackathon 2026: Grand Finale & Demos',
    description:
      'The world premiere finale of the 2026 Global AI Hackathon. 3,400 builders from 82 countries competed across 48 hours to create autonomous AI agents, media pipelines, and multimodal tools.',
    category: 'Hackathon',
    date: 'Oct 2, 2026',
    durationFormatted: '02:15',
    durationSeconds: 135,
    status: 'ready',
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    cloudinary: {
      publicId: 'hackathon_finale_2026',
      secureUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      cloudName: DEMO_CLOUD_NAME,
      format: 'mp4',
      duration: 135,
      width: 1920,
      height: 1080,
      bytes: 28400000,
      playbackUrl: 'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/dog.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_15,w_640,c_scale,q_auto,f_jpg/dog.jpg',
      waveformUrl: 'https://res.cloudinary.com/demo/video/upload/fl_waveform,co_rgb:a855f7,b_rgb:0f172a/dog.png',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    summary: {
      overview:
        'The Global AI Hackathon 2026 Grand Finale gathered finalists to pitch transformative applications in front of venture capital judges. Teams presented innovations ranging from healthcare diagnostic copilots to autonomous video pipeline architectures. The grand winner was awarded for delivering real-time multimodal search across live streams.',
      keyTopics: [
        'Multimodal Video Understanding',
        'Healthcare Diagnostic AI',
        'Edge Computing & Cloudinary CDN',
        'Real-Time Live Stream Indexing',
        'Autonomous Agent Workflows',
      ],
      keyTakeaways: [
        'Cloudinary AI pipelines reduce media transformation overhead by over 70% using dynamic on-the-fly URL parameterization.',
        'Team Nova demonstrated that real-time video transcript syncing yields 4x faster retrieval compared to post-hoc transcription.',
        'Judges evaluated solutions based on engineering depth, live demo resilience, and actual customer utility.',
      ],
      speakers: [
        {
          name: 'Elena Rostova',
          roleOrAffiliation: 'Hackathon Director & Host',
          note: 'Opening announcements, rules recap, and awards ceremony lead.',
        },
        {
          name: 'Dr. Aris Thorne',
          roleOrAffiliation: 'Partner, Frontier AI Capital',
          note: 'Lead judge asking technical questions on latency and scalability.',
        },
        {
          name: 'David Vance',
          roleOrAffiliation: 'Team Nova Lead Presenter',
          note: 'Pitched healthcare real-time diagnostic video assistant.',
        },
      ],
      chapters: [
        {
          id: 'ch_1',
          title: 'Opening & Hackathon Milestones',
          description: 'Host Elena Rostova welcomes attendees, shares hackathon metrics, and explains judging criteria.',
          startTime: 0,
          endTime: 24,
          formattedTime: '00:00',
          keywords: ['Opening', 'Welcome', 'Statistics', 'Finalists'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_5,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'ch_2',
          title: 'Keynote: The Autonomous Media Pipeline',
          description: 'Overview of the paradigm shift from static video files to dynamic, intelligent media streams with Cloudinary and Gemini.',
          startTime: 25,
          endTime: 54,
          formattedTime: '00:25',
          keywords: ['Keynote', 'Cloudinary', 'Media Pipelines', 'Architecture'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_30,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'ch_3',
          title: "Team Nova Presentation: Healthcare AI Copilot",
          description: 'Live demonstration of surgical and clinical video analysis with instant timestamped event detection.',
          startTime: 55,
          endTime: 84,
          formattedTime: '00:55',
          keywords: ['Healthcare', 'Clinical', 'Team Nova', 'Live Demo'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_60,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'ch_4',
          title: 'Judges Q&A and Technical Evaluation',
          description: 'Dr. Thorne and panel question the finalist teams on data privacy, latency constraints, and real-time streaming throughput.',
          startTime: 85,
          endTime: 110,
          formattedTime: '01:25',
          keywords: ['Judges', 'Q&A', 'Latency', 'Evaluation'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_90,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'ch_5',
          title: 'Grand Prize Winner Announcement & Closing',
          description: 'Team Nova takes 1st place! Trophy presentation, closing remarks, and invitation to the mentorship incubator.',
          startTime: 111,
          endTime: 135,
          formattedTime: '01:51',
          keywords: ['Winner', 'Awards', '1st Place', 'Celebration'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_115,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
      ],
      highlights: [
        {
          id: 'hl_1',
          title: 'Healthcare AI Live Demonstration',
          description: "Team Nova demonstrates real-time patient triage video feed indexing with sub-second latency.",
          startTime: 58,
          endTime: 82,
          duration: 24,
          category: 'Demo',
          impactScore: 99,
          clipUrl: 'https://res.cloudinary.com/demo/video/upload/so_58,eo_82,f_auto,q_auto/dog.mp4',
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_65,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'hl_2',
          title: 'Keynote Vision on Media Cloud AI',
          description: 'The moment Elena introduces the breakthrough convergence of Cloudinary video APIs and generative AI models.',
          startTime: 28,
          endTime: 50,
          duration: 22,
          category: 'Keynote',
          impactScore: 95,
          clipUrl: 'https://res.cloudinary.com/demo/video/upload/so_28,eo_50,f_auto,q_auto/dog.mp4',
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_35,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'hl_3',
          title: '1st Place Winner Trophy Reveal',
          description: 'Emotional celebration as Team Nova is named the 2026 Global AI Champion.',
          startTime: 112,
          endTime: 132,
          duration: 20,
          category: 'Award',
          impactScore: 98,
          clipUrl: 'https://res.cloudinary.com/demo/video/upload/so_112,eo_132,f_auto,q_auto/dog.mp4',
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_118,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
      ],
    },
    recaps: [
      {
        id: 'recap-30s-hackathon',
        targetDuration: 30,
        title: '30s Grand Finale Speed Recap',
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_10,eo_40,f_auto,q_auto/dog.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_20,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        createdAt: new Date().toISOString(),
        durationSeconds: 30,
        includedMomentsCount: 3,
      },
      {
        id: 'recap-60s-hackathon',
        targetDuration: 60,
        title: '60s Comprehensive Highlight Reel',
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_15,eo_75,f_auto,q_auto/dog.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_35,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        createdAt: new Date().toISOString(),
        durationSeconds: 60,
        includedMomentsCount: 5,
      },
    ],
  },
  {
    id: 'demo-devsummit-2026',
    title: 'Cloudinary Developer Summit: Modern Media Pipelines',
    description:
      'Keynote session exploring high-performance video delivery, automatic format and quality tuning (f_auto, q_auto), and generative AI video transforms.',
    category: 'Conference',
    date: 'Sep 18, 2026',
    durationFormatted: '01:50',
    durationSeconds: 110,
    status: 'ready',
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    cloudinary: {
      publicId: 'devsummit_keynote_2026',
      secureUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      cloudName: DEMO_CLOUD_NAME,
      format: 'mp4',
      duration: 110,
      width: 1920,
      height: 1080,
      bytes: 22100000,
      playbackUrl: 'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/dog.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_10,w_640,c_scale,q_auto,f_jpg/dog.jpg',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    summary: {
      overview:
        'A comprehensive exploration of Cloudinary’s next-generation video pipelines. Topics covered included adaptive streaming without complex transcoding clusters, automatic smart cropping for mobile shorts, and AI metadata ingestion.',
      keyTopics: [
        'Dynamic Video Transcoding',
        'f_auto & q_auto Optimization',
        'Smart AI Video Cropping',
        'Highlight Generation at Scale',
      ],
      keyTakeaways: [
        'Applying f_auto and q_auto reduces median video payload size by 48% with zero human perceptual loss.',
        'URL-driven trimming (so_, eo_) enables instant clip sharing without server-side rendering queue bottlenecks.',
      ],
      speakers: [
        {
          name: 'Maya Lin',
          roleOrAffiliation: 'VP of Media Engineering',
          note: 'Keynote lead on cloud video infrastructure.',
        },
      ],
      chapters: [
        {
          id: 'ch_101',
          title: 'State of Visual Media 2026',
          description: 'Industry review of surging video usage and rising egress costs.',
          startTime: 0,
          endTime: 30,
          formattedTime: '00:00',
          keywords: ['State of Media', 'Egress', 'Bandwidth'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_5,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'ch_102',
          title: 'Next-Gen Dynamic Transformations',
          description: 'Live coding URL-based manipulations, watermarks, dynamic subtitles, and animated previews.',
          startTime: 31,
          endTime: 75,
          formattedTime: '00:31',
          keywords: ['Transformations', 'Live Code', 'URL API'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_40,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
        {
          id: 'ch_103',
          title: 'Scalable AI Highlight Extraction',
          description: 'Integrating Gemini multimodal LLMs directly with Cloudinary media webhooks.',
          startTime: 76,
          endTime: 110,
          formattedTime: '01:16',
          keywords: ['AI Highlights', 'Webhooks', 'Gemini Integration'],
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_85,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
      ],
      highlights: [
        {
          id: 'hl_101',
          title: 'Live URL Transformation Demo',
          description: 'Showing how changing one query parameter transforms a 4K video into an optimized mobile highlight clip in 12ms.',
          startTime: 40,
          endTime: 68,
          duration: 28,
          category: 'Technical',
          impactScore: 97,
          clipUrl: 'https://res.cloudinary.com/demo/video/upload/so_40,eo_68,f_auto,q_auto/dog.mp4',
          thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/so_50,w_640,c_scale,q_auto,f_jpg/dog.jpg',
        },
      ],
    },
  },
];

class EventStore {
  private events: Map<string, EventItem> = new Map();

  constructor() {
    this.seed();
  }

  public seed() {
    for (const ev of initialDemoEvents) {
      this.events.set(ev.id, { ...ev });
    }
  }

  public getAll(): EventItem[] {
    return Array.from(this.events.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getById(id: string): EventItem | undefined {
    return this.events.get(id);
  }

  public save(event: EventItem): EventItem {
    this.events.set(event.id, event);
    return event;
  }

  public update(id: string, partial: Partial<EventItem>): EventItem | undefined {
    const existing = this.events.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...partial };
    this.events.set(id, updated);
    return updated;
  }

  public delete(id: string): boolean {
    return this.events.delete(id);
  }
}

export const eventStore = new EventStore();
