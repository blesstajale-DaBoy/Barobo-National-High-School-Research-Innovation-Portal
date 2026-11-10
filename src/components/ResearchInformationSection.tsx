import React, { useState } from 'react';
import {
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { ResearchInformationItemRecord } from '../data/bnhsTaxonomy';
import { resolveOverviewImageLink } from './AdminEvaluationView';

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
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

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
  const resolvedImg = resolveOverviewImageLink(currentItem.imageUrl || '');

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
            <Info className="w-4 h-4" />
            <span>Institutional Policies &amp; Research Guidelines</span>
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900 mt-0.5">
            Research Information
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="font-mono text-zinc-700 font-semibold">
            {activeIdx + 1} of {validItems.length} Information Topics
          </span>
          {isAdmin && onOpenAdminManager && (
            <button
              type="button"
              onClick={onOpenAdminManager}
              className="px-2.5 py-1 text-xs font-semibold text-[#6B1420] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              Manage Information in Admin
            </button>
          )}
        </div>
      </div>

      {/* Main 1000 x 500 Research Information Frame */}
      <div
        className="w-full max-w-[1000px] h-[500px] mx-auto bg-white border border-zinc-300 relative overflow-hidden shadow-md flex flex-col justify-between"
      >
        {/* Top Header Strip inside 1000x500 box */}
        <div className="px-6 py-3.5 bg-[#6B1420] text-white flex items-center justify-between gap-4 border-b border-rose-950">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="bg-amber-400 text-zinc-950 font-mono font-bold px-2 py-0.5 text-[11px] uppercase">
              BNHS Guidance · 1000 × 500
            </span>
            <span className="text-rose-100 font-medium truncate">
              {currentItem.category || 'Barobo NHS Research Protocols'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={validItems.length <= 1}
              aria-label="Previous info slide"
              className="p-1 rounded-sm bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={validItems.length <= 1}
              aria-label="Next info slide"
              className="p-1 rounded-sm bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Split Content inside 1000x500 container */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 p-6 md:p-8 gap-6 overflow-y-auto items-center">
          {/* Left Column: Visual / Graphic */}
          <div className="md:col-span-5 h-full max-h-[380px] bg-zinc-100 border border-zinc-200 relative overflow-hidden flex items-center justify-center">
            {resolvedImg && !imgErrorMap[currentItem.id] ? (
              <img
                src={resolvedImg}
                alt={currentItem.title}
                referrerPolicy="no-referrer"
                onError={() =>
                  setImgErrorMap((prev) => ({ ...prev, [currentItem.id]: true }))
                }
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#6B1420] to-[#3B070E] text-white">
                <BookOpen className="w-12 h-12 text-amber-300 mb-2" />
                <div className="font-display font-semibold text-sm">
                  {currentItem.category}
                </div>
                <p className="text-[11px] text-rose-200 mt-1">
                  Institutional Research Resource
                </p>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
              <span className="text-[11px] font-mono text-white">
                Barobo NHS Research Center · SY 2025–2027
              </span>
            </div>
          </div>

          {/* Right Column: Title, Description & Action */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4 h-full py-1">
            <div className="space-y-3">
              <div className="inline-block text-xs font-semibold text-[#6B1420] border-b-2 border-amber-400 pb-0.5">
                {currentItem.category}
              </div>
              <h3 className="text-xl md:text-2xl font-display font-bold text-zinc-900 leading-tight">
                {currentItem.title}
              </h3>
              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {currentItem.description}
              </p>
            </div>

            {/* Bottom Actions inside 1000x500 box */}
            <div className="pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Verified by BNHS Research Committee</span>
              </div>

              {currentItem.linkUrl ? (
                <a
                  href={currentItem.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors"
                >
                  <span>Learn More</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-[11px] font-mono text-zinc-400">
                  Topic {activeIdx + 1} of {validItems.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Slide Indicator Tabs inside 1000x500 Frame */}
        <div className="bg-[#FAF9F5] border-t border-zinc-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {validItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors border ${
                  activeIdx === idx
                    ? 'bg-[#6B1420] text-white border-[#6B1420] font-semibold'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400'
                }`}
              >
                {idx + 1}. {item.category || item.title.slice(0, 18)}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span>Barobo National High School</span>
          </div>
        </div>
      </div>
    </section>
  );
};
