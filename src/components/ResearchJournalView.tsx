import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Trash2,
  Edit3,
  Link2,
  CheckCircle2,
  BookMarked,
  GraduationCap,
  Award,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  PublishedJournalRecord,
  JournalDivisionType,
} from '../data/bnhsTaxonomy';
import { PublishJournalModal } from './PublishJournalModal';
import { JournalReaderModal } from './JournalReaderModal';
import { AddPublishedLinkModal } from './AddPublishedLinkModal';

interface ResearchJournalViewProps {
  journals: PublishedJournalRecord[];
  isAdmin: boolean;
  onPublishJournal: (
    journal: Omit<PublishedJournalRecord, 'id' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void> | void;
  onEditJournal: (journal: PublishedJournalRecord) => Promise<void> | void;
  onDeleteJournal: (id: string) => Promise<void> | void;
  onIncrementViews?: (id: string) => void;
  onIncrementDownloads?: (id: string) => void;
  cloudSyncState?: 'synced' | 'syncing' | 'auto_saved' | 'error';
  lastSyncedTime?: string;
}

export function ResearchJournalView({
  journals,
  isAdmin,
  onPublishJournal,
  onEditJournal,
  onDeleteJournal,
  onIncrementViews,
  onIncrementDownloads,
  cloudSyncState = 'synced',
  lastSyncedTime = 'Just now',
}: ResearchJournalViewProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedVolume, setSelectedVolume] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAddPublishedLinkModalOpen, setIsAddPublishedLinkModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<PublishedJournalRecord | null>(null);
  const [readingJournal, setReadingJournal] = useState<PublishedJournalRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Available Volumes
  const availableVolumes = useMemo(() => {
    const set = new Set<string>();
    journals.forEach((j) => {
      if (j.journalVolume) set.add(j.journalVolume);
    });
    return Array.from(set);
  }, [journals]);

  // Filtered List
  const filteredJournals = useMemo(() => {
    return journals.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesAuthors = item.authors.toLowerCase().includes(query);
        const matchesAffiliation = item.authorAffiliation.toLowerCase().includes(query);
        const matchesKeywords = item.keywords.toLowerCase().includes(query);
        const matchesAbstract = item.abstract.toLowerCase().includes(query);
        const matchesCode = item.issnOrRefCode.toLowerCase().includes(query);
        if (
          !matchesTitle &&
          !matchesAuthors &&
          !matchesAffiliation &&
          !matchesKeywords &&
          !matchesAbstract &&
          !matchesCode
        ) {
          return false;
        }
      }

      // Division
      if (selectedDivision !== 'all' && item.division !== selectedDivision) {
        return false;
      }

      // Volume
      if (selectedVolume !== 'all' && item.journalVolume !== selectedVolume) {
        return false;
      }

      // Format
      if (selectedFormat !== 'all') {
        if (selectedFormat === 'link') {
          if (item.fileSourceType !== 'link' && !item.publishedLinkUrl) return false;
        } else if (item.fileSourceType !== selectedFormat) {
          return false;
        }
      }

      return true;
    });
  }, [journals, searchQuery, selectedDivision, selectedVolume, selectedFormat]);

  const handleCopyCitation = (journal: PublishedJournalRecord) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(journal.citationApa);
      setCopiedId(journal.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleOpenReader = (journal: PublishedJournalRecord) => {
    setReadingJournal(journal);
    if (onIncrementViews) {
      onIncrementViews(journal.id);
    }
  };

  const handleDownloadFile = (journal: PublishedJournalRecord) => {
    if (onIncrementDownloads) {
      onIncrementDownloads(journal.id);
    }

    if (journal.fileSourceType === 'local' && journal.fileDataUrl) {
      const link = document.createElement('a');
      link.href = journal.fileDataUrl;
      link.download = journal.fileName || `${journal.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (journal.driveUrl) {
      window.open(journal.driveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getDivisionBadgeColor = (div: JournalDivisionType) => {
    switch (div) {
      case 'basic':
        return 'bg-[#6B1420] text-white';
      case 'action':
        return 'bg-amber-700 text-white';
      case 'tuklas':
        return 'bg-emerald-700 text-white';
      case 'interdisciplinary':
        return 'bg-blue-800 text-white';
      default:
        return 'bg-zinc-800 text-white';
    }
  };

  const getDivisionLabel = (div: JournalDivisionType) => {
    switch (div) {
      case 'basic':
        return 'Basic Research';
      case 'action':
        return 'Action Research';
      case 'tuklas':
        return 'TUKLAS Project Fair';
      case 'interdisciplinary':
        return 'Interdisciplinary Inquiry';
      default:
        return 'General Research';
    }
  };

  return (
    <section className="space-y-8" id="research-journal-section">
      {/* ================= 1. INSTITUTIONAL HEADER & BANNER ================= */}
      <div className="bg-white border border-zinc-200 p-5 sm:p-7 md:p-9 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <img
              src="/assets/aistudio/BNHS_LOGO_animated.gif"
              alt="Barobo National High School Official Animated Seal (GIF)"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-contain shrink-0 border-2 border-[#6B1420]/20 bg-white p-1 shadow-sm bnhs-logo-animate"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6B1420] uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Barobo National High School · Published Research Library</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-[2.3rem] font-display font-semibold text-zinc-900 leading-tight">
                Research Journal (Published Research Library)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-3xl">
                The official institutional repository of published, peer-reviewed research manuscripts, action research studies, and TUKLAS STEM innovations at Barobo National High School. Read, cite, and download manuscripts via direct local file or Google Drive.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Primary Action: Add Already Published Research (Link Only) */}
            <button
              type="button"
              onClick={() => setIsAddPublishedLinkModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm whitespace-nowrap"
              title="Add already published research through a link only, along with the abstract"
            >
              <Link2 className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
              <span>Add Already Published Research (Link &amp; Abstract)</span>
            </button>

            {/* Secondary Action: Upload Manuscript (PDF / Local) */}
            <button
              type="button"
              onClick={() => {
                setEditingJournal(null);
                setIsPublishModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-zinc-800 bg-[#FAF9F5] border border-zinc-300 hover:bg-zinc-100 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#6B1420]" />
              <span>Upload Full Manuscript (PDF)</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
          <div className="p-3.5 bg-[#FAF9F5] border border-zinc-200">
            <div className="text-[11px] text-zinc-500 font-mono">Published Manuscripts</div>
            <div className="text-2xl font-mono font-bold text-zinc-900 mt-1 tabular-nums">
              {journals.length}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
              Fully Peer-Reviewed
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border border-zinc-200">
            <div className="text-[11px] text-zinc-500 font-mono">Journal Volumes</div>
            <div className="text-2xl font-mono font-bold text-[#6B1420] mt-1 tabular-nums">
              {availableVolumes.length || 2}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              SY 2024–2026 Archive
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border border-zinc-200">
            <div className="text-[11px] text-zinc-500 font-mono">Manuscript Access</div>
            <div className="text-2xl font-mono font-bold text-amber-700 mt-1 tabular-nums">
              100%
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Local PDF &amp; Google Drive
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border border-zinc-200">
            <div className="text-[11px] text-zinc-500 font-mono">Citation Support</div>
            <div className="text-2xl font-mono font-bold text-emerald-800 mt-1 tabular-nums">
              APA 7th
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              DepEd BERA Formatted
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. SEARCH & MULTI-FACET FILTER STRIP ================= */}
      <div className="bg-white border border-zinc-200 p-4 sm:p-5 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, keyword, volume, or catalog code..."
              className="w-full pl-10 pr-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
            />
          </div>

          {/* Division Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              aria-label="Filter by Research Division"
              className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-[#6B1420]"
            >
              <option value="all">All Research Divisions</option>
              <option value="basic">Basic Research (Policy &amp; Baseline)</option>
              <option value="action">Action Research (Pedagogy &amp; BERA)</option>
              <option value="tuklas">TUKLAS Project Fair (STEM)</option>
              <option value="interdisciplinary">Interdisciplinary Inquiry</option>
            </select>
          </div>

          {/* Volume Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedVolume}
              onChange={(e) => setSelectedVolume(e.target.value)}
              aria-label="Filter by Journal Volume"
              className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-[#6B1420]"
            >
              <option value="all">All Volumes</option>
              {availableVolumes.map((vol) => (
                <option key={vol} value={vol}>
                  {vol}
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              aria-label="Filter by Manuscript Format"
              className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-[#6B1420]"
            >
              <option value="all">All Formats</option>
              <option value="link">Already Published (Link &amp; Abstract)</option>
              <option value="drive">Google Drive Link</option>
              <option value="local">Local PDF Manuscript</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          <div>
            Showing <strong className="text-zinc-800">{filteredJournals.length}</strong> of {journals.length} published manuscripts
            {searchQuery && (
              <span> matching &ldquo;<span className="text-[#6B1420] font-semibold">{searchQuery}</span>&rdquo;</span>
            )}
          </div>

          {(searchQuery || selectedDivision !== 'all' || selectedVolume !== 'all' || selectedFormat !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDivision('all');
                setSelectedVolume('all');
                setSelectedFormat('all');
              }}
              className="text-xs font-semibold text-[#6B1420] hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* ================= 3. PUBLISHED JOURNAL ARTICLES GRID ================= */}
      {filteredJournals.length === 0 ? (
        <div className="p-12 bg-white border border-zinc-200 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-zinc-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-display font-semibold text-zinc-800">
              No Published Research Manuscripts Found
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              No articles match your current search or filter criteria. Try adjusting the keywords or click below to publish a new manuscript.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedDivision('all');
              setSelectedVolume('all');
              setSelectedFormat('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredJournals.map((journal) => (
            <article
              key={journal.id}
              className="bg-white border border-zinc-200 hover:border-[#6B1420] transition-colors flex flex-col justify-between overflow-hidden shadow-2xs group"
            >
              <div className="p-5 sm:p-6 space-y-3.5">
                {/* Badges: Volume & Division */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${getDivisionBadgeColor(
                      journal.division
                    )}`}
                  >
                    {getDivisionLabel(journal.division)}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 border border-zinc-200">
                    {journal.issnOrRefCode}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => handleOpenReader(journal)}
                  className="text-base font-display font-bold text-zinc-900 group-hover:text-[#6B1420] transition-colors cursor-pointer leading-snug line-clamp-2"
                >
                  {journal.title}
                </h3>

                {/* Authors & Affiliation */}
                <div className="space-y-0.5 text-xs">
                  <div className="font-semibold text-zinc-800 line-clamp-1">
                    {journal.authors}
                  </div>
                  <div className="text-[11px] text-zinc-500 italic line-clamp-1">
                    {journal.authorAffiliation}
                  </div>
                </div>

                {/* Volume & Date Strip */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 pt-1 border-t border-zinc-100">
                  <span className="truncate">{journal.journalVolume}</span>
                  <span>·</span>
                  <span className="shrink-0">{journal.publicationDate}</span>
                </div>

                {/* Abstract Preview */}
                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                  {journal.abstract}
                </p>

                {/* Format Indicator */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 pt-1 flex-wrap">
                  {journal.fileSourceType === 'link' || journal.publishedLinkUrl ? (
                    <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 font-bold rounded-2xs">
                      <Link2 className="w-3 h-3 text-amber-700 stroke-[2.5]" />
                      <span>Published via Link Only</span>
                    </span>
                  ) : journal.fileSourceType === 'drive' ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 font-medium rounded-2xs">
                      <Link2 className="w-3 h-3" />
                      <span>Google Drive Manuscript</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-medium rounded-2xs">
                      <FileText className="w-3 h-3" />
                      <span>Local PDF Manuscript</span>
                    </span>
                  )}
                  {journal.publishedVenue && (
                    <span className="text-[10px] text-zinc-600 truncate max-w-[150px]" title={journal.publishedVenue}>
                      · {journal.publishedVenue}
                    </span>
                  )}
                  {journal.fileSizeBytes ? (
                    <span className="text-[10px] font-mono text-zinc-400">
                      ({(journal.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-[#FAF9F5] border-t border-zinc-200 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReader(journal)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Abstract &amp; Manuscript</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {(journal.publishedLinkUrl || journal.driveUrl) && (
                      <a
                        href={journal.publishedLinkUrl || journal.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-zinc-700 hover:text-[#6B1420] bg-white border border-zinc-200 hover:border-zinc-300 transition-colors"
                        title="Open full published manuscript link directly in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyCitation(journal)}
                      className="p-1.5 text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 transition-colors"
                      title="Copy APA 7th Edition citation"
                    >
                      {copiedId === journal.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadFile(journal)}
                      className="p-1.5 text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 transition-colors"
                      title="Download or open manuscript file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit & Delete Controls Row */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-zinc-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingJournal(journal);
                      if (
                        journal.fileSourceType === 'link' ||
                        Boolean(journal.publishedLinkUrl)
                      ) {
                        setIsAddPublishedLinkModalOpen(true);
                      } else {
                        setIsPublishModalOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-[#6B1420] bg-white border border-zinc-200 hover:border-[#6B1420] transition-colors"
                    title="Edit published research details, link, or abstract"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#6B1420]" />
                    <span>Edit</span>
                  </button>

                  {confirmDeleteId === journal.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-red-700 font-medium">
                        Delete entry?
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteJournal(journal.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(journal.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-700 hover:text-white bg-white hover:bg-red-700 border border-red-200 hover:border-red-700 transition-colors"
                      title="Delete this published research from Research Journal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Publish / Edit Modal */}
      <PublishJournalModal
        isOpen={isPublishModalOpen}
        onClose={() => {
          setIsPublishModalOpen(false);
          setEditingJournal(null);
        }}
        editingJournal={editingJournal}
        onPublish={async (data) => {
          if (editingJournal) {
            await onEditJournal({
              ...editingJournal,
              ...data,
              updatedAtIso: new Date().toISOString(),
            });
          } else {
            await onPublishJournal(data);
          }
        }}
      />

      {/* Add / Edit Already Published Research (Link & Abstract) Modal */}
      <AddPublishedLinkModal
        isOpen={isAddPublishedLinkModalOpen}
        onClose={() => {
          setIsAddPublishedLinkModalOpen(false);
          setEditingJournal(null);
        }}
        editingJournal={editingJournal}
        onPublish={async (data) => {
          if (editingJournal) {
            await onEditJournal({
              ...editingJournal,
              ...data,
              updatedAtIso: new Date().toISOString(),
            });
          } else {
            await onPublishJournal(data);
          }
        }}
      />

      {/* Reader Modal */}
      <JournalReaderModal
        journal={readingJournal}
        onClose={() => setReadingJournal(null)}
        onDownload={handleDownloadFile}
        onEdit={(journal) => {
          setEditingJournal(journal);
          if (
            journal.fileSourceType === 'link' ||
            Boolean(journal.publishedLinkUrl)
          ) {
            setIsAddPublishedLinkModalOpen(true);
          } else {
            setIsPublishModalOpen(true);
          }
        }}
        onDelete={async (journal) => {
          await onDeleteJournal(journal.id);
        }}
      />
    </section>
  );
}
