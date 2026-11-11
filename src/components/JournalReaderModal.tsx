import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Maximize2,
  Link2,
} from 'lucide-react';
import { PublishedJournalRecord } from '../data/bnhsTaxonomy';
import { extractGoogleDriveFileId } from '../utils/videoUtils';

interface JournalReaderModalProps {
  journal: PublishedJournalRecord | null;
  onClose: () => void;
  onDownload?: (journal: PublishedJournalRecord) => void;
}

export function JournalReaderModal({
  journal,
  onClose,
  onDownload,
}: JournalReaderModalProps) {
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'metadata'>('reader');

  if (!journal) return null;

  const detectedDriveId = journal.driveUrl ? extractGoogleDriveFileId(journal.driveUrl) : null;
  const embedUrl = journal.driveEmbedUrl || (detectedDriveId ? `https://drive.google.com/file/d/${detectedDriveId}/preview` : null);

  const handleCopyCitation = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(journal.citationApa);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2500);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(journal);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 shadow-2xl max-w-5xl w-full my-auto h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#6B1420] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-amber-300/40 text-amber-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-amber-300">
                <span className="font-semibold">{journal.journalVolume}</span>
                <span className="text-white/40">·</span>
                <span>{journal.issnOrRefCode}</span>
                <span className="text-white/40">·</span>
                <span className="px-1.5 py-0.2 bg-white/15 text-white uppercase text-[10px] rounded-2xs">
                  {journal.division.toUpperCase()} RESEARCH
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-display font-semibold text-white truncate max-w-xl">
                {journal.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyCitation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-amber-300 hover:bg-amber-200 transition-colors shadow-2xs whitespace-nowrap"
              title="Copy official APA 7th Edition citation"
            >
              {copiedCitation ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cite (APA 7th)</span>
                  <span className="sm:hidden">Cite</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm hover:bg-white/20 text-rose-100 transition-colors ml-1"
              aria-label="Close manuscript viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher for mobile / tablet */}
        <div className="bg-[#FAF9F5] border-b border-zinc-200 px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reader')}
              className={`px-3 py-1 font-semibold transition-colors ${
                activeTab === 'reader'
                  ? 'bg-[#6B1420] text-white'
                  : 'text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200'
              }`}
            >
              Manuscript Document View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1 font-semibold transition-colors ${
                activeTab === 'metadata'
                  ? 'bg-[#6B1420] text-white'
                  : 'text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200'
              }`}
            >
              Abstract &amp; Citation Details
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 hidden md:flex items-center gap-3">
            <span>By <strong>{journal.authors}</strong></span>
            <span>·</span>
            <span>Published {journal.publicationDate}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Document Viewer (Left / Full) */}
          <div
            className={`flex-1 bg-zinc-900 flex flex-col overflow-hidden ${
              activeTab === 'metadata' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {journal.fileSourceType === 'drive' && embedUrl ? (
              <div className="w-full h-full flex flex-col">
                <div className="bg-zinc-800 text-zinc-300 px-4 py-2 text-[11px] flex items-center justify-between border-b border-zinc-700">
                  <span className="flex items-center gap-1.5 font-mono">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Google Drive Published Manuscript Preview</span>
                  </span>
                  {(journal.driveUrl || journal.publishedLinkUrl) && (
                    <a
                      href={journal.driveUrl || journal.publishedLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center gap-1.5 hover:underline"
                    >
                      <span>Open Full Manuscript Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <iframe
                  src={embedUrl}
                  title={journal.title}
                  className="w-full flex-1 border-0 bg-white"
                  allow="autoplay"
                />
              </div>
            ) : (journal.fileSourceType === 'link' || journal.publishedLinkUrl) ? (
              <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
                {/* External Published Link Header */}
                <div className="bg-[#520E17] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-rose-950">
                  <div className="flex items-center gap-2 text-xs">
                    <Link2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="font-semibold text-rose-100">Published Research (External Repository / Online Link)</span>
                    {journal.publishedVenue && (
                      <span className="text-amber-300 font-mono hidden sm:inline">· {journal.publishedVenue}</span>
                    )}
                  </div>
                  <a
                    href={journal.publishedLinkUrl || journal.driveUrl || journal.doiOrExternalLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-xs"
                  >
                    <span>Open Published Manuscript in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* If there's an embed preview URL, show iframe; otherwise show comprehensive executive abstract reading mode */}
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={journal.title}
                    className="w-full flex-1 border-0 bg-white"
                    allow="autoplay"
                  />
                ) : (
                  <div className="p-6 sm:p-10 space-y-6 max-w-3xl mx-auto flex-1">
                    <div className="border-b border-zinc-200 pb-5 space-y-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono font-semibold uppercase">
                        <span>Already Published Research</span>
                        {journal.publishedVenue && <span>· {journal.publishedVenue}</span>}
                      </div>
                      <h1 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 leading-snug">
                        {journal.title}
                      </h1>
                      <div className="text-xs text-zinc-700 font-medium">
                        {journal.authors}
                      </div>
                      <div className="text-[11px] text-zinc-500 italic">
                        {journal.authorAffiliation}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400">
                        {journal.journalVolume} · Catalog: {journal.issnOrRefCode} · Published: {journal.publicationDate}
                      </div>
                    </div>

                    {/* Executive Abstract Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#6B1420]" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B1420]">
                          Official Published Abstract
                        </h3>
                      </div>
                      <div className="p-4 bg-[#FAF9F5] border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed text-justify space-y-3 font-serif">
                        <p>{journal.abstract}</p>
                      </div>
                    </div>

                    {journal.keyFindings && (
                      <div className="p-4 bg-amber-50/70 border border-amber-200 space-y-1.5">
                        <h4 className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          <span>Key Empirical Findings &amp; Outcomes</span>
                        </h4>
                        <p className="text-xs text-amber-950 leading-relaxed">
                          {journal.keyFindings}
                        </p>
                      </div>
                    )}

                    {/* Direct Manuscript Launcher Box */}
                    <div className="p-4 bg-zinc-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-amber-300">
                          Full Manuscript Access
                        </div>
                        <p className="text-[11px] text-zinc-300 max-w-md">
                          Click below to access the full published research paper, data tables, and complete references via the author’s published repository link.
                        </p>
                      </div>
                      <a
                        href={journal.publishedLinkUrl || journal.driveUrl || journal.doiOrExternalLink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>View Full Manuscript</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : journal.fileSourceType === 'local' && journal.fileDataUrl ? (
              <div className="w-full h-full flex flex-col">
                <div className="bg-zinc-800 text-zinc-300 px-4 py-1.5 text-[11px] flex items-center justify-between border-b border-zinc-700">
                  <span className="flex items-center gap-1.5 font-mono">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{journal.fileName || 'Local PDF Manuscript'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Download PDF</span>
                    <Download className="w-3 h-3" />
                  </button>
                </div>
                <iframe
                  src={journal.fileDataUrl}
                  title={journal.title}
                  className="w-full flex-1 border-0 bg-white"
                />
              </div>
            ) : (
              /* Fallback Manuscript Reader Canvas */
              <div className="flex-1 bg-white overflow-y-auto p-6 sm:p-10 space-y-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center space-y-3 pb-6 border-b border-zinc-200">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-[#6B1420] text-[11px] font-mono font-semibold uppercase">
                      Barobo National High School Research Journal
                    </div>
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 leading-snug">
                      {journal.title}
                    </h1>
                    <div className="text-xs text-zinc-600 font-medium">
                      {journal.authors}
                    </div>
                    <div className="text-[11px] text-zinc-500 italic">
                      {journal.authorAffiliation}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 pt-1">
                      {journal.journalVolume} · Ref: {journal.issnOrRefCode} · Published: {journal.publicationDate}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B1420]">
                      Abstract
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed text-justify">
                      {journal.abstract}
                    </p>
                  </div>

                  {journal.keyFindings && (
                    <div className="p-4 bg-amber-50/60 border border-amber-200 space-y-1.5">
                      <h4 className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Key Empirical Findings &amp; Outcomes</span>
                      </h4>
                      <p className="text-xs text-amber-950 leading-relaxed">
                        {journal.keyFindings}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-zinc-500">
                      Manuscript File: <strong>{journal.fileName}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      {(journal.driveUrl || journal.publishedLinkUrl) && (
                        <a
                          href={journal.driveUrl || journal.publishedLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300"
                        >
                          <span>Open Published Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Full Manuscript</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Details / Metadata Panel (Right / Tab) */}
          <div
            className={`w-full md:w-80 lg:w-96 bg-[#FAF9F5] border-t md:border-t-0 md:border-l border-zinc-200 p-5 overflow-y-auto space-y-5 text-xs text-zinc-800 ${
              activeTab === 'reader' ? 'hidden md:block' : 'block'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Institutional Manuscript
              </div>
              <h3 className="font-display font-semibold text-zinc-900 text-sm mt-0.5">
                {journal.title}
              </h3>
            </div>

            <div className="space-y-3 pb-4 border-b border-zinc-200">
              <div>
                <span className="text-[11px] text-zinc-500 block">Proponents &amp; Authors</span>
                <span className="font-semibold text-zinc-900">{journal.authors}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Affiliation</span>
                <span className="text-zinc-700">{journal.authorAffiliation}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Volume &amp; Issue</span>
                  <span className="font-medium text-zinc-900">{journal.journalVolume}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Catalog Code</span>
                  <span className="font-mono text-zinc-900">{journal.issnOrRefCode}</span>
                </div>
              </div>
              {journal.publishedVenue && (
                <div>
                  <span className="text-[11px] text-zinc-500 block">Published Journal / Venue</span>
                  <span className="font-medium text-amber-900">{journal.publishedVenue}</span>
                </div>
              )}
              {journal.publishedLinkUrl && (
                <div>
                  <span className="text-[11px] text-zinc-500 block">Published Manuscript Link</span>
                  <a
                    href={journal.publishedLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B1420] hover:underline font-mono text-[10px] break-all inline-flex items-center gap-1"
                  >
                    <span>View Repository Record</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {/* Structured Abstract Summary */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider">
                Abstract Summary
              </span>
              <p className="text-xs text-zinc-600 leading-relaxed max-h-48 overflow-y-auto pr-1">
                {journal.abstract}
              </p>
            </div>

            {/* Keywords */}
            {journal.keywords && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider">
                  Keywords
                </span>
                <div className="flex flex-wrap gap-1">
                  {journal.keywords.split(',').map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-zinc-200 text-zinc-700 text-[10px] rounded-2xs"
                    >
                      {kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Official APA Citation Box */}
            <div className="p-3 bg-white border border-[#6B1420]/30 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#6B1420] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>APA 7th Edition Citation</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCitation}
                  className="text-[11px] font-semibold text-[#6B1420] hover:underline"
                >
                  {copiedCitation ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-zinc-700 italic leading-snug">
                {journal.citationApa}
              </p>
            </div>

            {/* Institutional Compliance Notice */}
            <div className="p-3 bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>BNHS Institutional Open Access</span>
              </div>
              <p className="leading-relaxed">
                Published under Barobo National High School Research &amp; Innovation Committee oversight. Peer-reviewed for school-wide and community dissemination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
