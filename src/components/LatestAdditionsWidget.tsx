import React, { useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileText, ArrowUpRight, Clock } from 'lucide-react';
import { ResearchRecord, ResearchDivisionId } from '../data/bnhsTaxonomy';
import { getDivisionLabel } from '../utils/reportExporter';

interface LatestAdditionsWidgetProps {
  researches: ResearchRecord[];
  onSelectResearch: (record: ResearchRecord) => void;
  onNavigateDivision: (division: ResearchDivisionId) => void;
}

function formatShortDate(isoStr: string): string {
  if (!isoStr) return 'Recent';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const LatestAdditionsWidget: React.FC<LatestAdditionsWidgetProps> = ({
  researches,
  onSelectResearch,
  onNavigateDivision,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Get the 5 most recently uploaded research records
  const latestFive = useMemo(() => {
    return [...researches]
      .sort((a, b) => {
        const timeA = a.createdAtIso || a.updatedAtIso || '';
        const timeB = b.createdAtIso || b.updatedAtIso || '';
        return timeB.localeCompare(timeA);
      })
      .slice(0, 5);
  }, [researches]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -360 : 360;
    scrollContainerRef.current.scrollBy({
      left: offset,
      behavior: 'smooth',
    });
  };

  if (latestFive.length === 0) return null;

  return (
    <section
      aria-labelledby="latest-additions-heading"
      className="bg-white border border-zinc-200 p-6 md:p-8 space-y-5"
    >
      {/* Widget Header & Horizontal Scroll Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#6B1420]" />
            <span>Real-Time Repository Feed · 5 Most Recent Uploads</span>
          </div>
          <h2
            id="latest-additions-heading"
            className="text-xl md:text-2xl font-display font-semibold text-zinc-900 mt-0.5"
          >
            Latest Additions
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500 mr-1 hidden sm:inline">
            Scroll Cards
          </span>
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll latest additions left"
            className="p-2 border border-zinc-300 bg-[#FAF9F5] text-zinc-700 hover:border-[#6B1420] hover:text-[#6B1420] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll latest additions right"
            className="p-2 border border-zinc-300 bg-[#FAF9F5] text-zinc-700 hover:border-[#6B1420] hover:text-[#6B1420] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Card List */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth"
      >
        {latestFive.map((record, index) => (
          <article
            key={record.id}
            className="w-[300px] sm:w-[340px] shrink-0 snap-start bg-[#FAF9F5] border border-zinc-200 hover:border-[#6B1420] transition-colors p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono font-semibold text-[#6B1420] tabular-nums">
                    0{index + 1}
                  </span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onNavigateDivision(record.division)}
                    className="font-semibold text-[#6B1420] hover:underline truncate"
                  >
                    {getDivisionLabel(record.division)}
                  </button>
                </div>
                <span className="font-mono text-[11px] text-zinc-500 shrink-0 tabular-nums">
                  {formatShortDate(record.createdAtIso || record.updatedAtIso)}
                </span>
              </div>

              {/* Theme / Category Kicker */}
              <div className="text-xs text-zinc-600 truncate">
                <span className="font-medium text-zinc-800">{record.category}</span>
                {record.subcategory && (
                  <>
                    <span aria-hidden="true"> / </span>
                    <span>{record.subcategory}</span>
                  </>
                )}
              </div>

              {/* Research Title */}
              <h3 className="text-base font-display font-semibold text-zinc-900 leading-snug line-clamp-2">
                <button
                  type="button"
                  onClick={() => onSelectResearch(record)}
                  className="text-left hover:text-[#6B1420] transition-colors"
                >
                  {record.title}
                </button>
              </h3>

              {/* Brief Abstract Preview */}
              <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                {record.abstract}
              </p>
            </div>

            {/* Footer Metadata & Action */}
            <div className="pt-3 border-t border-zinc-200/80 space-y-2.5 text-xs">
              <div className="text-zinc-600 truncate">
                <strong className="text-zinc-900">Proponents:</strong> {record.authors}
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 font-mono">
                <span className="inline-flex items-center gap-1 truncate">
                  <FileText className="w-3 h-3 text-[#6B1420] shrink-0" />
                  <span className="truncate">
                    {record.attachmentName || 'Manuscript.pdf'}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-zinc-700">
                  {record.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectResearch(record)}
                className="w-full inline-flex items-center justify-between px-3 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap"
              >
                <span>Inspect Research Record</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
