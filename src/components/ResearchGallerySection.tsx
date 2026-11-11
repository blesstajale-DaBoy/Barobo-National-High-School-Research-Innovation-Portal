import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Images,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ResearchGalleryItemRecord } from '../data/bnhsTaxonomy';
import { resolveOverviewImageLink } from './AdminEvaluationView';

interface ResearchGallerySectionProps {
  items: ResearchGalleryItemRecord[];
  onOpenAdminManager?: () => void;
  isAdmin?: boolean;
}

export const ResearchGallerySection: React.FC<ResearchGallerySectionProps> = ({
  items,
  onOpenAdminManager,
  isAdmin,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const durationMs = 10000; // Exact 10 seconds requirement
  const intervalStepMs = 100;
  const progressTimerRef = useRef<number | null>(null);

  // Filter out any invalid or deleted items
  const validItems = items.filter((item) => !item.isDeleted);

  useEffect(() => {
    if (validItems.length > 0 && currentIndex >= validItems.length) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [validItems.length, currentIndex]);

  const handleNext = () => {
    if (validItems.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % validItems.length);
    setProgress(0);
  };

  const handlePrev = () => {
    if (validItems.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + validItems.length) % validItems.length);
    setProgress(0);
  };

  // 10-second automatic sliding pictures timer
  useEffect(() => {
    if (validItems.length <= 1 || isPaused) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const stepIncrement = (intervalStepMs / durationMs) * 100;

    progressTimerRef.current = window.setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          setCurrentIndex((prev) => (prev + 1) % validItems.length);
          return 0;
        }
        return old + stepIncrement;
      });
    }, intervalStepMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [validItems.length, isPaused]);

  if (validItems.length === 0) return null;

  const safeIndex = currentIndex < validItems.length ? currentIndex : 0;
  const currentItem = validItems[safeIndex] || validItems[0];
  const resolvedImg = resolveOverviewImageLink(currentItem.imageUrl);

  return (
    <section
      aria-label="Research Gallery"
      className="space-y-4 my-8"
      id="research-gallery-section"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B1420] tracking-wider uppercase">
            <Images className="w-4 h-4" />
            <span>Visual Documentation · STEM Exhibitions &amp; Fieldwork</span>
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900 mt-0.5">
            Research Gallery
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="font-mono">Auto-advance: 10s</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-zinc-700 font-semibold">
            {currentIndex + 1} of {validItems.length}
          </span>
        </div>
      </div>

      {/* Main 1000 x 500 Responsive Sliding Pictures Frame */}
      <div
        className="w-full max-w-[1000px] aspect-[2/1] min-h-[220px] sm:min-h-[300px] md:min-h-[400px] lg:h-[500px] mx-auto bg-zinc-950 border border-zinc-300 relative overflow-hidden group shadow-md"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Sliding Picture Image with smooth transition */}
        <div className="w-full h-full relative">
          {!imgErrorMap[currentItem.id] && resolvedImg ? (
            <img
              key={currentItem.id}
              src={resolvedImg}
              alt={currentItem.title}
              referrerPolicy="no-referrer"
              onError={() =>
                setImgErrorMap((prev) => ({ ...prev, [currentItem.id]: true }))
              }
              className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#6B1420] to-[#2B040B] text-white p-4 sm:p-8 text-center">
              <Images className="w-10 h-10 sm:w-16 sm:h-16 text-amber-300 mb-2 sm:mb-3" />
              <div className="text-sm sm:text-xl font-display font-semibold line-clamp-1">
                {currentItem.title}
              </div>
              <p className="text-[11px] sm:text-xs text-rose-200 mt-1 sm:mt-2 max-w-lg line-clamp-2">
                {currentItem.caption}
              </p>
            </div>
          )}

          {/* High-Contrast Gradient Backdrop for Text Legibility */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-black/40 to-black/10 flex flex-col justify-end p-3 sm:p-6 md:p-8 text-white">
            <div className="max-w-3xl space-y-1 sm:space-y-2 pr-12 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-amber-400 text-zinc-950 text-[9px] sm:text-[11px] font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Barobo NHS Research Gallery · 1000 × 500</span>
              </div>
              <h3 className="text-sm sm:text-xl md:text-2xl font-display font-bold text-white drop-shadow-md line-clamp-1 sm:line-clamp-2">
                {currentItem.title}
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-zinc-200 line-clamp-1 sm:line-clamp-2 md:line-clamp-3 leading-snug sm:leading-relaxed drop-shadow-xs">
                {currentItem.caption}
              </p>
            </div>
          </div>
        </div>

        {/* 10-Second Progress Bar at Bottom of 1000x500 Frame */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-amber-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Manual Left & Right Navigation Arrows */}
        {validItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous gallery slide"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-[#6B1420] text-white flex items-center justify-center transition-colors opacity-90 hover:opacity-100 shadow-md z-20"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next gallery slide"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-[#6B1420] text-white flex items-center justify-center transition-colors opacity-90 hover:opacity-100 shadow-md z-20"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Bottom Floating Bar: Play/Pause + Slide Indicators */}
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/70 backdrop-blur-xs px-2 py-1 sm:px-3 sm:py-1.5 border border-white/20">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="text-white hover:text-amber-300 transition-colors mr-0.5 sm:mr-1"
            aria-label={isPaused ? 'Resume 10s auto-slide' : 'Pause auto-slide'}
            title={isPaused ? 'Resume auto-advance' : 'Pause auto-advance'}
          >
            {isPaused ? <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {validItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
                className={`h-1.5 sm:h-2 transition-all ${
                  currentIndex === idx
                    ? 'w-4 sm:w-6 bg-amber-400'
                    : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
