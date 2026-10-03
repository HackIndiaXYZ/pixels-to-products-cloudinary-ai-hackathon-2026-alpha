import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryAssetInfo } from '../../src/types/event';

dotenv.config();

export const DEMO_CLOUD_NAME = 'demo';

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
}

export interface DirectUploadConfig {
  signature?: string;
  timestamp?: number;
  apiKey?: string;
  cloudName: string;
  folder: string;
  tags: string;
  uploadPreset?: string;
  uploadUrl: string;
}

export class CloudinaryService {
  /**
   * Dynamically fetch credentials from environment variables without exposing secrets
   */
  static getCredentials() {
    dotenv.config();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || '';
    return { cloudName, apiKey, apiSecret, uploadPreset };
  }

  /**
   * Verify if required Cloudinary environment variables are present and not default placeholders
   */
  static isConfigured(): boolean {
    const { cloudName, apiKey, apiSecret, uploadPreset } = this.getCredentials();
    const hasValidCloud = Boolean(cloudName && cloudName !== 'your_cloudinary_cloud_name');
    const hasValidApiKeys = Boolean(
      apiKey &&
      apiKey !== 'your_cloudinary_api_key' &&
      apiSecret &&
      apiSecret !== 'your_cloudinary_api_secret'
    );
    const hasValidPreset = Boolean(uploadPreset && uploadPreset !== 'your_upload_preset');

    return hasValidCloud && (hasValidApiKeys || hasValidPreset);
  }

  /**
   * Returns active cloud name (or fallback demo if unconfigured)
   */
  static getActiveCloudName(): string {
    const { cloudName } = this.getCredentials();
    return this.isConfigured() ? cloudName : DEMO_CLOUD_NAME;
  }

  /**
   * Initialize or update Cloudinary configuration from current environment variables
   */
  static ensureConfigured() {
    const { cloudName, apiKey, apiSecret, uploadPreset } = this.getCredentials();

    if (!cloudName || cloudName === 'your_cloudinary_cloud_name') {
      throw new Error(
        'Missing CLOUDINARY_CLOUD_NAME in Vercel environment variables. Please set it in your Vercel Project Settings.'
      );
    }

    if (
      (!apiKey || apiKey === 'your_cloudinary_api_key' || !apiSecret || apiSecret === 'your_cloudinary_api_secret') &&
      (!uploadPreset || uploadPreset === 'your_upload_preset')
    ) {
      throw new Error(
        'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_UPLOAD_PRESET) in Vercel Project Settings.'
      );
    }

    if (apiKey && apiSecret && apiKey !== 'your_cloudinary_api_key' && apiSecret !== 'your_cloudinary_api_secret') {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }

    return { cloudName, apiKey, apiSecret, uploadPreset };
  }

  /**
   * Generate secure server-side signed parameters or preset configuration for direct browser upload.
   * CLOUDINARY_API_SECRET is kept strictly server-side and never sent to the browser.
   */
  static generateUploadSignature(
    folder: string = 'eventlens_events',
    tags: string = 'eventlens'
  ): DirectUploadConfig {
    const { cloudName, apiKey, apiSecret, uploadPreset } = this.ensureConfigured();

    // Case 1: Server has API Key & Secret -> Generate SHA HMAC signature
    if (apiKey && apiSecret && apiKey !== 'your_cloudinary_api_key' && apiSecret !== 'your_cloudinary_api_secret') {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign: Record<string, any> = {
        folder,
        tags,
        timestamp,
      };

      if (uploadPreset && uploadPreset !== 'your_upload_preset') {
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
        uploadPreset: uploadPreset && uploadPreset !== 'your_upload_preset' ? uploadPreset : undefined,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      };
    }

    // Case 2: Upload preset configured without secret
    if (uploadPreset && uploadPreset !== 'your_upload_preset') {
      return {
        cloudName,
        folder,
        tags,
        uploadPreset,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      };
    }

    throw new Error(
      'Missing Cloudinary credentials. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel Project Settings.'
    );
  }

  /**
   * Build complete CloudinaryAssetInfo from direct upload response metadata
   */
  static buildAssetInfoFromUpload(data: {
    publicId: string;
    secureUrl: string;
    cloudName?: string;
    format?: string;
    duration?: number;
    width?: number;
    height?: number;
    bytes?: number;
    createdAt?: string;
  }): CloudinaryAssetInfo {
    const targetCloud = data.cloudName || this.getActiveCloudName();
    const format = data.format || 'mp4';
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
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Construct optimized delivery URL for full video with auto-format and auto-quality
   */
  static buildOptimizedVideoUrl(
    publicId: string,
    cloud: string = this.getActiveCloudName(),
    format: string = 'mp4'
  ): string {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, '');
    return `https://res.cloudinary.com/${cloud}/video/upload/f_auto,q_auto/${cleanPublicId}.${format}`;
  }

  /**
   * Construct snapshot thumbnail at a specific second timestamp
   */
  static buildChapterThumbnailUrl(
    publicId: string,
    seconds: number,
    cloud: string = this.getActiveCloudName(),
    width: number = 640
  ): string {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, '');
    const safeSecond = Math.max(0, Math.floor(seconds));
    return `https://res.cloudinary.com/${cloud}/video/upload/so_${safeSecond},w_${width},c_scale,q_auto,f_jpg/${cleanPublicId}.jpg`;
  }

  /**
   * Construct real Cloudinary highlight clip URL using start_offset (so_) and end_offset (eo_)
   */
  static buildHighlightClipUrl(
    publicId: string,
    startSec: number,
    endSec: number,
    cloud: string = this.getActiveCloudName(),
    format: string = 'mp4'
  ): string {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, '');
    const so = Math.max(0, Math.floor(startSec));
    const eo = Math.max(so + 1, Math.floor(endSec));
    return `https://res.cloudinary.com/${cloud}/video/upload/so_${so},eo_${eo},f_auto,q_auto/${cleanPublicId}.${format}`;
  }

  /**
   * Build Cloudinary recap video URL with duration trim or preview
   */
  static buildRecapUrl(
    publicId: string,
    targetDurationSeconds: number,
    cloud: string = this.getActiveCloudName(),
    startOffset: number = 0
  ): string {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, '');
    const so = Math.max(0, Math.floor(startOffset));
    const eo = so + targetDurationSeconds;
    return `https://res.cloudinary.com/${cloud}/video/upload/so_${so},eo_${eo},f_auto,q_auto/${cleanPublicId}.mp4`;
  }

  /**
   * Build audio waveform preview URL
   */
  static buildWaveformUrl(
    publicId: string,
    cloud: string = this.getActiveCloudName()
  ): string {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, '');
    return `https://res.cloudinary.com/${cloud}/video/upload/fl_waveform,co_rgb:a855f7,b_rgb:0f172a/${cleanPublicId}.png`;
  }
}
