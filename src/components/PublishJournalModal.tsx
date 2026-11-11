import React, { useState, useRef } from 'react';
import {
  X,
  BookOpen,
  Upload,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  PublishedJournalRecord,
  JournalDivisionType,
} from '../data/bnhsTaxonomy';
import { extractGoogleDriveFileId } from '../utils/videoUtils';

interface PublishJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (journal: Omit<PublishedJournalRecord, 'id' | 'createdAtIso' | 'updatedAtIso'>) => Promise<void> | void;
  editingJournal?: PublishedJournalRecord | null;
  uploaderUid?: string;
}

export function PublishJournalModal({
  isOpen,
  onClose,
  onPublish,
  editingJournal,
  uploaderUid = 'bnhs_user',
}: PublishJournalModalProps) {
  const [sourceType, setSourceType] = useState<'local' | 'drive' | 'link'>(
    editingJournal?.fileSourceType || 'local'
  );
  const [title, setTitle] = useState(editingJournal?.title || '');
  const [authors, setAuthors] = useState(editingJournal?.authors || '');
  const [affiliation, setAffiliation] = useState(
    editingJournal?.authorAffiliation || 'Barobo National High School — Science & Research Faculty'
  );
  const [division, setDivision] = useState<JournalDivisionType>(
    editingJournal?.division || 'basic'
  );
  const [journalVolume, setJournalVolume] = useState(
    editingJournal?.journalVolume || 'Volume 4, Issue 1 (SY 2025–2026)'
  );
  const [issnOrRefCode, setIssnOrRefCode] = useState(
    editingJournal?.issnOrRefCode || `BNHS-JRNL-2026-00${Math.floor(Math.random() * 90) + 10}`
  );
  const [publicationDate, setPublicationDate] = useState(
    editingJournal?.publicationDate || new Date().toISOString().split('T')[0]
  );
  const [abstract, setAbstract] = useState(editingJournal?.abstract || '');
  const [keywords, setKeywords] = useState(editingJournal?.keywords || '');
  const [keyFindings, setKeyFindings] = useState(editingJournal?.keyFindings || '');

  // Local File state
  const [fileName, setFileName] = useState(editingJournal?.fileName || '');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(editingJournal?.fileSizeBytes || 0);
  const [fileDataUrl, setFileDataUrl] = useState<string>(editingJournal?.fileDataUrl || '');

  // Google Drive state
  const [driveUrl, setDriveUrl] = useState(editingJournal?.driveUrl || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const detectedDriveId = extractGoogleDriveFileId(driveUrl);
  const isDriveValid = !!detectedDriveId || driveUrl.includes('drive.google.com');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processLocalFile(file);
  };

  const processLocalFile = (file: File) => {
    setErrorMsg('');
    setFileName(file.name);
    setFileSizeBytes(file.size);

    // Limit warning for large files
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File size exceeds 25MB. For very large manuscripts, using a Google Drive sharing link is recommended.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the local manuscript file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLocalFile(file);
    }
  };

  const generateCitation = () => {
    const primaryAuthor = authors.trim() ? authors.trim() : 'Proponent, B.';
    const pubYear = publicationDate ? publicationDate.substring(0, 4) : '2026';
    const paperTitle = title.trim() ? title.trim() : 'Untitled Manuscript';
    return `${primaryAuthor} (${pubYear}). ${paperTitle}. Barobo National High School Research Journal, ${journalVolume}.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter the research paper / journal manuscript title.');
      return;
    }
    if (!authors.trim()) {
      setErrorMsg('Please enter the names of the authors or proponents.');
      return;
    }
    if (!abstract.trim() || abstract.trim().length < 20) {
      setErrorMsg('Please provide a structured abstract (at least 20 characters).');
      return;
    }

    if (sourceType === 'local') {
      if (!fileName) {
        setErrorMsg('Please select a local research file (PDF or Word document).');
        return;
      }
    } else {
      if (!driveUrl.trim()) {
        setErrorMsg('Please enter the Google Drive manuscript sharing link.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const generatedDriveEmbed = detectedDriveId
        ? `https://drive.google.com/file/d/${detectedDriveId}/preview`
        : driveUrl.includes('/preview')
        ? driveUrl
        : driveUrl;

      const record: Omit<PublishedJournalRecord, 'id' | 'createdAtIso' | 'updatedAtIso'> = {
        portalId: 'bnhs',
        title: title.trim(),
        authors: authors.trim(),
        authorAffiliation: affiliation.trim(),
        division,
        journalVolume: journalVolume.trim(),
        issnOrRefCode: issnOrRefCode.trim(),
        publicationDate: publicationDate || new Date().toISOString().split('T')[0],
        abstract: abstract.trim(),
        keywords: keywords.trim(),
        keyFindings: keyFindings.trim(),
        fileSourceType: sourceType,
        fileName: sourceType === 'local' ? fileName : (fileName || 'Google_Drive_Manuscript.pdf'),
        fileSizeBytes: sourceType === 'local' ? fileSizeBytes : 1500000,
        fileDataUrl: sourceType === 'local' ? fileDataUrl : '',
        driveUrl: sourceType === 'drive' ? driveUrl.trim() : '',
        driveEmbedUrl: sourceType === 'drive' ? generatedDriveEmbed : '',
        citationApa: generateCitation(),
        viewsCount: editingJournal?.viewsCount || 1,
        downloadsCount: editingJournal?.downloadsCount || 0,
        uploaderUid,
        isBaseline: false,
      };

      await onPublish(record);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred while publishing the manuscript.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-zinc-200 shadow-2xl max-w-3xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#6B1420] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-amber-300/40 text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-wider uppercase text-amber-300 font-semibold">
                Barobo National High School · Published Research Library
              </div>
              <h2 className="text-lg sm:text-xl font-display font-semibold text-white">
                {editingJournal ? 'Edit Published Research Journal' : 'Publish to Research Journal'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-white/20 text-rose-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-zinc-800">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="text-xs">{errorMsg}</div>
            </div>
          )}

          {/* Source Selection Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-900">
              Manuscript Upload Method <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSourceType('local')}
                className={`flex items-center justify-center gap-2.5 p-3.5 border transition-all text-xs font-semibold ${
                  sourceType === 'local'
                    ? 'border-[#6B1420] bg-rose-50 text-[#6B1420] shadow-2xs'
                    : 'border-zinc-200 bg-[#FAF9F5] text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Local File (PDF / DOCX)</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('drive')}
                className={`flex items-center justify-center gap-2.5 p-3.5 border transition-all text-xs font-semibold ${
                  sourceType === 'drive'
                    ? 'border-[#6B1420] bg-rose-50 text-[#6B1420] shadow-2xs'
                    : 'border-zinc-200 bg-[#FAF9F5] text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Google Drive Document Link</span>
              </button>
            </div>
          </div>

          {/* Conditional Upload Box */}
          {sourceType === 'local' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed transition-colors text-center space-y-3 cursor-pointer ${
                isDragOver
                  ? 'border-[#6B1420] bg-rose-50/50'
                  : fileName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-zinc-300 bg-[#FAF9F5] hover:border-zinc-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center mx-auto text-[#6B1420] shadow-xs">
                {fileName ? <FileCheck className="w-6 h-6 text-emerald-600" /> : <Upload className="w-6 h-6" />}
              </div>
              {fileName ? (
                <div className="space-y-1">
                  <div className="font-semibold text-zinc-900 text-sm flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{fileName}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB · Ready to Publish
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs text-[#6B1420] font-semibold underline mt-1"
                  >
                    Change Manuscript File
                  </button>
                </div>
              ) : (
                <div>
                  <div className="font-semibold text-zinc-900 text-sm">
                    Drop your research manuscript here, or browse
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Supports official PDF or DOCX formats (Up to 25MB)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-[#FAF9F5] border border-zinc-200 space-y-2.5">
              <label className="block text-xs font-semibold text-zinc-900">
                Google Drive Manuscript Sharing Link <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">
                  Ensure link permissions are set to &ldquo;Anyone with the link can view&rdquo;
                </span>
                {isDriveValid && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valid Google Drive Link
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Manuscript Metadata */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-zinc-900 text-sm border-b border-zinc-200 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#6B1420]" />
              <span>Publication &amp; Metadata Details</span>
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">
                Manuscript Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Community Marine Sanctuary Assessment in Barobo Bay..."
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                required
              />
            </div>

            {/* Authors & Affiliation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">
                  Authors / Proponents <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Maria Clara Santos, John Paul Dela Cruz"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">
                  Institutional Affiliation / Department
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="e.g. Science Department / SHS STEM Faculty"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>

            {/* Division & Journal Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">
                  Research Classification / Division
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value as JournalDivisionType)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                >
                  <option value="basic">Basic Research (Policy &amp; Baseline)</option>
                  <option value="action">Action Research (Pedagogy &amp; BERA Themes)</option>
                  <option value="tuklas">TUKLAS Project Fair (STEM &amp; Innovation)</option>
                  <option value="interdisciplinary">Interdisciplinary Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">
                  Journal Volume &amp; Issue
                </label>
                <input
                  type="text"
                  value={journalVolume}
                  onChange={(e) => setJournalVolume(e.target.value)}
                  placeholder="Volume 4, Issue 1 (SY 2025–2026)"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>

            {/* Reference Code & Publication Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">
                  BNHS Catalog / ISSN Reference Code
                </label>
                <input
                  type="text"
                  value={issnOrRefCode}
                  onChange={(e) => setIssnOrRefCode(e.target.value)}
                  placeholder="BNHS-JRNL-2026-001"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 font-mono focus:outline-none focus:border-[#6B1420]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 font-mono focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>

            {/* Structured Abstract */}
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">
                Structured Abstract <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={4}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Provide a comprehensive summary detailing background, research question, methodology, key findings, and practical implications..."
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420] leading-relaxed"
                required
              />
            </div>

            {/* Key Findings */}
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">
                Key Findings &amp; Practical Recommendations
              </label>
              <textarea
                rows={2}
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                placeholder="Highlight key quantitative or qualitative outcomes and practical applications..."
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">
                Indexing Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Marine Sanctuary, Coral Reef Biodiversity, Barobo Bay"
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            {/* APA Citation Live Preview */}
            <div className="p-3 bg-[#FAF9F5] border border-zinc-200 space-y-1">
              <div className="text-[11px] font-semibold text-[#6B1420] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generated Official Citation (APA 7th Edition)</span>
              </div>
              <p className="text-[11px] text-zinc-700 italic">
                {generateCitation()}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50 transition-colors shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing...' : editingJournal ? 'Save Journal Changes' : 'Publish to Research Journal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
