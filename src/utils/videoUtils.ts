/**
 * Utility functions for parsing and embedding videos from YouTube, Google Drive, and direct video sources.
 */

export interface ParsedVideoInfo {
  type: 'youtube' | 'drive' | 'direct' | 'none';
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
  isEmbeddableIframe: boolean;
}

/**
 * Extracts the YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

/**
 * Extracts Google Drive file ID from sharing links:
 * - https://drive.google.com/file/d/FILE_ID/view...
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const pathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];

  const paramMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (paramMatch && paramMatch[1] && trimmed.includes('drive.google.com')) {
    return paramMatch[1];
  }
  return null;
}

/**
 * Converts a raw video URL (YouTube, Google Drive, Direct Video, or Uploaded DataURL)
 * into a structured object with an embeddable URL for <iframe> or <video>.
 */
export function parseVideoSource(rawUrl: string): ParsedVideoInfo {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      type: 'none',
      embedUrl: '',
      originalUrl: '',
      isEmbeddableIframe: false,
    };
  }

  const url = rawUrl.trim();

  // 1. YouTube Detection
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return {
      type: 'youtube',
      videoId: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1`,
      originalUrl: url,
      isEmbeddableIframe: true,
    };
  }

  // 2. Google Drive Detection
  const driveId = extractGoogleDriveFileId(url);
  if (driveId) {
    return {
      type: 'drive',
      videoId: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      originalUrl: url,
      isEmbeddableIframe: true,
    };
  }

  // 3. Direct Video or Uploaded Data URL
  return {
    type: 'direct',
    embedUrl: url,
    originalUrl: url,
    isEmbeddableIframe: false,
  };
}
