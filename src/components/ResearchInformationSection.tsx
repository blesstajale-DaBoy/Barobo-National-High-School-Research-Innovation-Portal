import React, { useState } from 'react';
import {
  Video,
  Play,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Film,
  Globe,
  Share2,
} from 'lucide-react';
import { ResearchInformationItemRecord } from '../data/bnhsTaxonomy';
import { parseVideoSource } from '../utils/videoUtils';

interface ResearchInformationSectionProps {
  items: ResearchInformationItemRecord[];
  onOpenAdminManager?: () => void;
  isAdmin?: boolean;
}

export const ResearchInformationSection: React.FC<ResearchInformationSectionProps> = ({
  items,
  onOpenAdminManager,
  isAdmin,
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const validItems = items.length > 0 ? items : [];

  const handleNext = () => {
    if (validItems.length <= 1) return;
    setActiveIdx((prev) => (prev + 1) % validItems.length);
  };

  const handlePrev = () => {
    if (validItems.length <= 1) return;
    setActiveIdx((prev) => (prev - 1 + validItems.length) % validItems.length);
  };

  if (validItems.length === 0) return null;

  const currentItem = validItems[activeIdx] || validItems[0];
  const videoData = parseVideoSource(currentItem.videoUrl || '');

  return (
    <section
      aria-label="Research Information"
      className="space-y-4 my-8"
      id="research-information-section"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B1420] tracking-wider uppercase">
            <Film className="w-4 h-4 text-[#6B1420]" />
            <span>Institutional Research Video Series · 1000 × 500 Dimensions</span>
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900 mt-0.5">
            Research Information
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-mono text-zinc-700 font-semibold bg-zinc-100 px-2 py-0.5 border border-zinc-200">
            <Video className="w-3.5 h-3.5 text-[#6B1420]" />
            <span>Video {activeIdx + 1} of {validItems.length}</span>
          </span>
        </div>
      </div>

      {/* Main 1000 x 500 Responsive Research Information Video Frame */}
      <div
        className="w-full max-w-[1000px] md:h-[500px] mx-auto bg-zinc-950 border border-zinc-300 relative overflow-hidden shadow-lg flex flex-col justify-between"
      >
        {/* Top Header Strip inside 1000x500 box */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#6B1420] text-white flex items-center justify-between gap-3 border-b border-rose-950 shrink-0">
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="bg-amber-400 text-zinc-950 font-mono font-bold px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] tracking-wide uppercase shrink-0">
              VIDEO ONLY · 1000 × 500
            </span>
            <span className="text-rose-100 font-medium truncate text-xs">
              {currentItem.category || 'Barobo NHS Research Protocols'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {videoData.type === 'youtube' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-red-600 text-white rounded-xs">
                YouTube Video
              </span>
            )}
            {videoData.type === 'drive' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded-xs">
                Google Drive Video
              </span>
            )}
            {videoData.type === 'direct' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 text-white rounded-xs">
                MP4 / Web Video
              </span>
            )}

            <div className="flex items-center gap-1 ml-1 sm:ml-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={validItems.length <= 1}
                aria-label="Previous video topic"
                className="p-1 rounded-sm bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
                title="Previous Video"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={validItems.length <= 1}
                aria-label="Next video topic"
                className="p-1 rounded-sm bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
                title="Next Video"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Split Content inside 1000x500 container: Video Player (Left) & Guidance Summary (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-zinc-900">
          {/* Left Column: Interactive Video Player (YouTube, Google Drive, or HTML5 Video) */}
          <div className="md:col-span-7 aspect-video md:aspect-auto md:h-full bg-black relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800">
            {videoData.type !== 'none' && videoData.embedUrl ? (
              videoData.isEmbeddableIframe ? (
                <iframe
                  key={`${currentItem.id}_${videoData.embedUrl}`}
                  src={videoData.embedUrl}
                  title={currentItem.title}
                  className="w-full h-full border-0 bg-black min-h-[200px] md:min-h-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  key={`${currentItem.id}_${videoData.embedUrl}`}
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black min-h-[200px] md:min-h-0"
                  src={videoData.embedUrl}
                >
                  Your browser does not support HTML5 video playback.
                </video>
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                <Video className="w-12 h-12 text-zinc-600 mb-2" />
                <div className="text-sm font-medium text-zinc-300">No Video Attached</div>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Upload an MP4 video or paste a YouTube or Google Drive video link in the Admin section.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Title, Category, Description & Reference Link */}
          <div className="md:col-span-5 p-4 sm:p-5 md:p-6 flex flex-col justify-between bg-white overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#6B1420] uppercase tracking-wide border-b border-[#6B1420]/30 pb-0.5">
                  {currentItem.category || 'Research Guidance'}
                </span>
                <span className="text-zinc-400">·</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {videoData.type === 'youtube'
                    ? 'YouTube Stream'
                    : videoData.type === 'drive'
                    ? 'Google Drive'
                    : 'MP4 Video'}
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-display font-bold text-zinc-900 leading-snug">
                {currentItem.title}
              </h3>

              <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                {currentItem.description}
              </p>
            </div>

            {/* Bottom Actions inside 1000x500 box */}
            <div className="pt-3 border-t border-zinc-200 mt-4 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>BNHS Approved Video</span>
              </div>

              <div className="flex items-center gap-2">
                {videoData.originalUrl && (
                  <a
                    href={videoData.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                    title="Open video in new tab"
                  >
                    <span>Open Video</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {currentItem.linkUrl && (
                  <a
                    href={currentItem.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors"
                  >
                    <span>Reference</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Video Playlist Tabs inside 1000x500 Frame */}
        <div className="bg-[#FAF9F5] border-t border-zinc-200 px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {validItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  activeIdx === idx
                    ? 'bg-[#6B1420] text-white border-[#6B1420] font-semibold'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400'
                }`}
              >
                <Play className="w-3 h-3 shrink-0" />
                <span>
                  Video {idx + 1}: {item.category || item.title.slice(0, 18)}
                </span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500 shrink-0 ml-3">
            <span>Barobo National High School</span>
          </div>
        </div>
      </div>
    </section>
  );
};
