import React, { useState, useEffect } from 'react';
import {
  X,
  Link2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Calendar,
  Building,
  Users,
  FileText,
} from 'lucide-react';
import {
  PublishedJournalRecord,
  JournalDivisionType,
} from '../data/bnhsTaxonomy';
import { extractGoogleDriveFileId } from '../utils/videoUtils';

interface AddPublishedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (
    journal: Omit<PublishedJournalRecord, 'id' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void> | void;
  editingJournal?: PublishedJournalRecord | null;
  uploaderUid?: string;
}

export function AddPublishedLinkModal({
  isOpen,
  onClose,
  onPublish,
  editingJournal,
  uploaderUid = 'bnhs_user',
}: AddPublishedLinkModalProps) {
  const [publishedLinkUrl, setPublishedLinkUrl] = useState('');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [authorAffiliation, setAuthorAffiliation] = useState(
    'Barobo National High School — Science & Research Faculty'
  );
  const [division, setDivision] = useState<JournalDivisionType>('basic');
  const [publishedVenue, setPublishedVenue] = useState(
    'Barobo National High School Research Journal & DepEd Repository'
  );
  const [journalVolume, setJournalVolume] = useState('Volume 4, Issue 1 (SY 2025–2026)');
  const [issnOrRefCode, setIssnOrRefCode] = useState(
    `BNHS-EXT-2026-00${Math.floor(Math.random() * 90) + 10}`
  );
  const [publicationDate, setPublicationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [keyFindings, setKeyFindings] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingJournal) {
      setPublishedLinkUrl(
        editingJournal.publishedLinkUrl ||
          editingJournal.driveUrl ||
          editingJournal.doiOrExternalLink ||
          ''
      );
      setTitle(editingJournal.title || '');
      setAuthors(editingJournal.authors || '');
      setAuthorAffiliation(
        editingJournal.authorAffiliation ||
          'Barobo National High School — Science & Research Faculty'
      );
      setDivision(editingJournal.division || 'basic');
      setPublishedVenue(
        editingJournal.publishedVenue ||
          'Barobo National High School Research Journal & DepEd Repository'
      );
      setJournalVolume(
        editingJournal.journalVolume || 'Volume 4, Issue 1 (SY 2025–2026)'
      );
      setIssnOrRefCode(
        editingJournal.issnOrRefCode ||
          `BNHS-EXT-2026-00${Math.floor(Math.random() * 90) + 10}`
      );
      setPublicationDate(
        editingJournal.publicationDate || new Date().toISOString().split('T')[0]
      );
      setAbstract(editingJournal.abstract || '');
      setKeywords(editingJournal.keywords || '');
      setKeyFindings(editingJournal.keyFindings || '');
    } else {
      setPublishedLinkUrl('');
      setTitle('');
      setAuthors('');
      setAuthorAffiliation(
        'Barobo National High School — Science & Research Faculty'
      );
      setDivision('basic');
      setPublishedVenue(
        'Barobo National High School Research Journal & DepEd Repository'
      );
      setJournalVolume('Volume 4, Issue 1 (SY 2025–2026)');
      setIssnOrRefCode(`BNHS-EXT-2026-00${Math.floor(Math.random() * 90) + 10}`);
      setPublicationDate(new Date().toISOString().split('T')[0]);
      setAbstract('');
      setKeywords('');
      setKeyFindings('');
    }
  }, [editingJournal, isOpen]);

  if (!isOpen) return null;

  const detectedDriveId = extractGoogleDriveFileId(publishedLinkUrl);
  const isDrive = !!detectedDriveId || publishedLinkUrl.includes('drive.google.com');

  // Real-time APA 7th Edition citation generator
  const generateCitation = () => {
    const primaryAuthor = authors.trim() ? authors.trim() : 'Proponent, B.';
    const pubYear = publicationDate ? publicationDate.substring(0, 4) : '2026';
    const paperTitle = title.trim() ? title.trim() : 'Untitled Manuscript';
    const venue = publishedVenue.trim() ? publishedVenue.trim() : 'Barobo NHS Research Repository';
    return `${primaryAuthor} (${pubYear}). ${paperTitle}. ${venue}, ${journalVolume}. ${
      publishedLinkUrl.trim() ? publishedLinkUrl.trim() : 'https://bnhs-portal.deped.gov.ph'
    }`;
  };

  const wordCount = abstract.trim() ? abstract.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!publishedLinkUrl.trim()) {
      setErrorMsg('Please enter the direct published research link (Google Drive, journal repository, or DOI link).');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please provide the full research title.');
      return;
    }

    if (!authors.trim()) {
      setErrorMsg('Please enter the author(s) or proponent(s).');
      return;
    }

    if (!abstract.trim()) {
      setErrorMsg('Please provide the research abstract so end users can read the executive summary.');
      return;
    }

    setIsSubmitting(true);

    try {
      const driveEmbed = detectedDriveId
        ? `https://drive.google.com/file/d/${detectedDriveId}/preview`
        : publishedLinkUrl.includes('drive.google.com')
        ? publishedLinkUrl.replace('/view', '/preview')
        : undefined;

      const record: Omit<PublishedJournalRecord, 'id' | 'createdAtIso' | 'updatedAtIso'> = {
        portalId: 'bnhs',
        title: title.trim(),
        authors: authors.trim(),
        authorAffiliation: authorAffiliation.trim(),
        division,
        journalVolume: journalVolume.trim() || 'Volume 4, Issue 1 (SY 2025–2026)',
        issnOrRefCode: issnOrRefCode.trim(),
        publicationDate: publicationDate || new Date().toISOString().split('T')[0],
        abstract: abstract.trim(),
        keywords: keywords.trim(),
        keyFindings: keyFindings.trim(),
        doiOrExternalLink: publishedLinkUrl.trim(),
        fileSourceType: isDrive ? 'drive' : 'link',
        fileName:
          editingJournal?.fileName ||
          `${title.trim().slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}_published_link.pdf`,
        driveUrl: isDrive ? publishedLinkUrl.trim() : undefined,
        driveEmbedUrl: driveEmbed,
        publishedLinkUrl: publishedLinkUrl.trim(),
        publishedVenue: publishedVenue.trim(),
        citationApa: generateCitation(),
        viewsCount: editingJournal?.viewsCount || 1,
        downloadsCount: editingJournal?.downloadsCount || 0,
        uploaderUid: editingJournal?.uploaderUid || uploaderUid,
        isBaseline: false,
      };

      await onPublish(record);
      onClose();
    } catch (err: any) {
      console.error('Failed to register published research by link:', err);
      setErrorMsg(err.message || 'Failed to submit published research. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 shadow-2xl max-w-3xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-[#6B1420] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-bold shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                Research Journal · Link-Only Cataloging
              </div>
              <h2 className="text-base sm:text-lg font-display font-bold text-white">
                {editingJournal
                  ? 'Edit Published Research (Link & Abstract)'
                  : 'Add Already Published Research (Link & Abstract)'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xs hover:bg-white/20 text-rose-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Institutional Note */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 text-xs text-amber-950 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-900 block">Link-Only Submission Mode:</strong>
              No local document upload required. Simply provide the link to the already published paper (e.g. Google Drive sharing link, university repository, or open journal URL) and enter the study abstract. End users will easily read the abstract and view the manuscript via link.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Published Research Link */}
          <div className="space-y-3 p-4 bg-[#FAF9F5] border border-zinc-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#6B1420]" />
                <span>Published Research Link (URL) *</span>
              </label>
              {isDrive ? (
                <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-200">
                  Google Drive Detected (Embedded Preview Ready)
                </span>
              ) : publishedLinkUrl.trim() ? (
                <span className="text-[10px] font-mono font-semibold text-zinc-700 bg-zinc-200 px-2 py-0.5">
                  External URL / Repository
                </span>
              ) : null}
            </div>
            <input
              type="url"
              required
              value={publishedLinkUrl}
              onChange={(e) => setPublishedLinkUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/... or https://journal.deped.gov.ph/article/..."
              className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
            />
            <p className="text-[11px] text-zinc-500">
              Paste the public sharing link or external journal link where the full manuscript is hosted.
            </p>
          </div>

          {/* Section 2: Core Metadata */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-900 block mb-1">
                Full Research Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Assessment of Science Laboratory Inquiry Approaches in Barobo Secondary Schools"
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-900 block mb-1">
                  Authors / Proponents *
                </label>
                <input
                  type="text"
                  required
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz, LPT, Maria Santos, MST"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-900 block mb-1">
                  Author Affiliation / School
                </label>
                <input
                  type="text"
                  value={authorAffiliation}
                  onChange={(e) => setAuthorAffiliation(e.target.value)}
                  placeholder="e.g. Barobo National High School — Science Faculty"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-900 block mb-1">
                  Research Division
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value as JournalDivisionType)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                >
                  <option value="basic">Basic Research</option>
                  <option value="action">Action Research</option>
                  <option value="tuklas">TUKLAS Project Fair</option>
                  <option value="interdisciplinary">Interdisciplinary Inquiry</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-900 block mb-1">
                  Published Venue / Journal
                </label>
                <input
                  type="text"
                  value={publishedVenue}
                  onChange={(e) => setPublishedVenue(e.target.value)}
                  placeholder="e.g. DepEd Caraga BERA Journal"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-900 block mb-1">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Abstract (Primary End-User View Element) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#6B1420]" />
                <span>Research Abstract *</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-500">
                {wordCount} words
              </span>
            </div>
            <textarea
              required
              rows={6}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Provide the comprehensive abstract covering the study's background, research objectives, methodology, main empirical findings, and pedagogical or policy conclusions. End users will read this abstract directly in the portal reader."
              className="w-full p-3 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420] leading-relaxed"
            />
          </div>

          {/* Section 4: Keywords & Key Findings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-900 block mb-1">
                Keywords (Comma Separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Action Research, BERA Theme 1, Reading Remediation"
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-900 block mb-1">
                Key Findings / Highlights
              </label>
              <input
                type="text"
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                placeholder="e.g. Reading comprehension improved by 28% after 8 weeks"
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>
          </div>

          {/* Section 5: APA 7th Edition Citation Preview */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 space-y-1.5">
            <div className="text-[11px] font-semibold text-[#6B1420] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Generated APA 7th Edition Citation Preview</span>
            </div>
            <p className="text-xs italic text-zinc-700 leading-relaxed font-serif">
              {generateCitation()}
            </p>
          </div>
        </form>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-[#FAF9F5] border-t border-zinc-200 px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{editingJournal ? 'Saving Changes...' : 'Cataloging Research...'}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                <span>{editingJournal ? 'Save Changes' : 'Save & Publish by Link'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
