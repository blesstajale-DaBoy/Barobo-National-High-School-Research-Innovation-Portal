import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  ResearchDivisionId,
  ResearchRecord,
  AuthorRoleType,
  ResearchStatus,
  getCategoriesForDivision,
} from '../data/bnhsTaxonomy';
import { BLUEPRINT_LIMITS } from '../lib/firebase';

interface ResearchSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDivision?: ResearchDivisionId;
  editingRecord?: ResearchRecord | null;
  isAdmin: boolean;
  currentUserName: string;
  onSubmit: (
    payload: Omit<
      ResearchRecord,
      'id' | 'portalId' | 'authorUid' | 'createdAtIso' | 'updatedAtIso'
    >,
    uploadedFileData?: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    } | null
  ) => Promise<void>;
}

export const ResearchSubmissionModal: React.FC<ResearchSubmissionModalProps> = ({
  isOpen,
  onClose,
  initialDivision = 'basic',
  editingRecord = null,
  isAdmin,
  currentUserName,
  onSubmit,
}) => {
  const [division, setDivision] = useState<ResearchDivisionId>(initialDivision);
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [authors, setAuthors] = useState<string>(currentUserName || '');
  const [authorRole, setAuthorRole] = useState<AuthorRoleType>('Teacher');
  const [adviser, setAdviser] = useState<string>('');
  const [departmentOrGrade, setDepartmentOrGrade] = useState<string>('');
  const [schoolYear, setSchoolYear] = useState<string>('2026-2027');
  const [status, setStatus] = useState<ResearchStatus>('Pending Review');
  const [abstract, setAbstract] = useState<string>('');
  const [methodology, setMethodology] = useState<string>('');
  const [keyFindings, setKeyFindings] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentType, setAttachmentType] = useState<string>('application/pdf');
  const [attachmentSize, setAttachmentSize] = useState<number>(0);
  const [driveUrl, setDriveUrl] = useState<string>('');
  const [uploadedFilePayload, setUploadedFilePayload] = useState<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  } | null>(null);
  const [fileNotice, setFileNotice] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const availableCategories = getCategoriesForDivision(division);
  const selectedCategoryObj =
    availableCategories.find((c) => c.name === category) || availableCategories[0];
  const availableSubcategories = selectedCategoryObj ? selectedCategoryObj.subcategories : [];

  useEffect(() => {
    if (editingRecord) {
      setDivision(editingRecord.division);
      setCategory(editingRecord.category);
      setSubcategory(editingRecord.subcategory);
      setTitle(editingRecord.title);
      setAuthors(editingRecord.authors);
      setAuthorRole(editingRecord.authorRole);
      setAdviser(editingRecord.adviser);
      setDepartmentOrGrade(editingRecord.departmentOrGrade);
      setSchoolYear(editingRecord.schoolYear);
      setStatus(editingRecord.status);
      setAbstract(editingRecord.abstract);
      setMethodology(editingRecord.methodology);
      setKeyFindings(editingRecord.keyFindings);
      setKeywords(editingRecord.keywords);
      setAttachmentName(editingRecord.attachmentName);
      setAttachmentType(editingRecord.attachmentType);
      setAttachmentSize(editingRecord.attachmentSize);
      setDriveUrl(editingRecord.driveUrl);
      setUploadedFilePayload(null);
      setFileNotice('');
      setErrorMsg('');
    } else {
      const cats = getCategoriesForDivision(initialDivision);
      const firstCat = cats[0]?.name || '';
      const firstSub = cats[0]?.subcategories[0] || '';
      setDivision(initialDivision);
      setCategory(firstCat);
      setSubcategory(firstSub);
      setTitle('');
      setAuthors(currentUserName || '');
      setAuthorRole(initialDivision === 'tuklas' ? 'Student' : 'Teacher');
      setAdviser('');
      setDepartmentOrGrade(
        initialDivision === 'tuklas' ? 'Grade 12 - STEM Strand' : 'Science Department'
      );
      setSchoolYear('2026-2027');
      setStatus(isAdmin ? 'Approved' : 'Pending Review');
      setAbstract('');
      setMethodology('');
      setKeyFindings('');
      setKeywords('');
      setAttachmentName('');
      setAttachmentType('application/pdf');
      setAttachmentSize(0);
      setDriveUrl('');
      setUploadedFilePayload(null);
      setFileNotice('');
      setErrorMsg('');
    }
  }, [editingRecord, initialDivision, isOpen, currentUserName, isAdmin]);

  const handleDivisionChange = (newDiv: ResearchDivisionId) => {
    setDivision(newDiv);
    const cats = getCategoriesForDivision(newDiv);
    const firstCat = cats[0]?.name || '';
    const firstSub = cats[0]?.subcategories[0] || '';
    setCategory(firstCat);
    setSubcategory(firstSub);
    if (!editingRecord) {
      setAuthorRole(newDiv === 'tuklas' ? 'Student' : 'Teacher');
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const found = availableCategories.find((c) => c.name === newCat);
    setSubcategory(found?.subcategories[0] || '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentName(file.name.slice(0, BLUEPRINT_LIMITS.ATTACHMENT_NAME_MAX));
    setAttachmentType(
      (file.type || 'application/octet-stream').slice(0, BLUEPRINT_LIMITS.ATTACHMENT_TYPE_MAX)
    );
    setAttachmentSize(file.size);

    if (file.size <= 500000) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (result && result.length <= BLUEPRINT_LIMITS.FILE_DATA_URL_MAX) {
          setUploadedFilePayload({
            fileName: file.name.slice(0, BLUEPRINT_LIMITS.ATTACHMENT_NAME_MAX),
            mimeType: (file.type || 'application/pdf').slice(0, 120),
            sizeBytes: file.size,
            dataUrl: result,
          });
          setFileNotice(
            `Full manuscript binary (${(file.size / 1024).toFixed(1)} KB) staged for cloud storage & cross-computer download.`
          );
        }
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFilePayload(null);
      setFileNotice(
        `Filename "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) recorded. Because the file exceeds 500 KB, its metadata is stored in the database and you can optionally attach a Google Drive link below for full cloud hosting.`
      );
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanTitle = title.trim().slice(0, BLUEPRINT_LIMITS.TITLE_MAX);
    const cleanAbstract = abstract.trim().slice(0, BLUEPRINT_LIMITS.ABSTRACT_MAX);
    const cleanAuthors = authors.trim().slice(0, BLUEPRINT_LIMITS.AUTHORS_MAX);

    if (cleanTitle.length < BLUEPRINT_LIMITS.TITLE_MIN) {
      setErrorMsg('Please enter a complete research title (at least 3 characters).');
      return;
    }
    if (cleanAbstract.length < BLUEPRINT_LIMITS.ABSTRACT_MIN) {
      setErrorMsg('Please provide a structured abstract (at least 10 characters).');
      return;
    }
    if (cleanAuthors.length < BLUEPRINT_LIMITS.AUTHORS_MIN) {
      setErrorMsg('Please list the lead and co-author researcher names.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          title: cleanTitle,
          division,
          category: (category || availableCategories[0]?.name || 'General').slice(
            0,
            BLUEPRINT_LIMITS.CATEGORY_MAX
          ),
          subcategory: subcategory.trim().slice(0, BLUEPRINT_LIMITS.SUBCATEGORY_MAX),
          abstract: cleanAbstract,
          keywords: keywords.trim().slice(0, BLUEPRINT_LIMITS.KEYWORDS_MAX),
          authors: cleanAuthors,
          authorRole,
          adviser: adviser.trim().slice(0, BLUEPRINT_LIMITS.ADVISER_MAX),
          departmentOrGrade: departmentOrGrade.trim().slice(0, BLUEPRINT_LIMITS.DEPT_MAX),
          schoolYear: schoolYear.trim().slice(0, BLUEPRINT_LIMITS.SCHOOL_YEAR_MAX),
          status: isAdmin ? status : editingRecord ? editingRecord.status : 'Pending Review',
          methodology: methodology.trim().slice(0, BLUEPRINT_LIMITS.METHODOLOGY_MAX),
          keyFindings: keyFindings.trim().slice(0, BLUEPRINT_LIMITS.FINDINGS_MAX),
          attachmentName:
            attachmentName.trim().slice(0, BLUEPRINT_LIMITS.ATTACHMENT_NAME_MAX) ||
            'Unattached_Manuscript.pdf',
          attachmentType:
            attachmentType.trim().slice(0, BLUEPRINT_LIMITS.ATTACHMENT_TYPE_MAX) ||
            'application/pdf',
          attachmentSize: attachmentSize >= 0 ? attachmentSize : 0,
          fileDocId: editingRecord?.fileDocId || '',
          driveUrl: driveUrl.trim().slice(0, BLUEPRINT_LIMITS.DRIVE_URL_MAX),
          evaluationScore: editingRecord ? editingRecord.evaluationScore : isAdmin ? 92 : 0,
          evaluationRemarks: editingRecord
            ? editingRecord.evaluationRemarks
            : isAdmin
            ? 'Direct institutional repository entry approved by Coordinator.'
            : '',
          evaluatedBy: editingRecord
            ? editingRecord.evaluatedBy
            : isAdmin
            ? 'BNHS Research Coordinator'
            : '',
        },
        uploadedFilePayload
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to save research entry. Please verify fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-submit-title"
    >
      <div className="bg-white border border-zinc-200 w-full max-w-3xl my-8 overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#6B1420] text-white">
          <div>
            <p className="text-xs text-rose-200">
              Barobo National High School · Shared Cloud Research Repository
            </p>
            <h2 id="modal-submit-title" className="text-lg font-display font-semibold">
              {editingRecord ? 'Update Research Record' : 'Submit Research Manuscript or TUKLAS Project'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-rose-100 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Division Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-2">
              1. Select Major Research Division
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  { id: 'basic', label: '1. Basic Research', sub: 'Foundational & Policy' },
                  { id: 'action', label: '2. Action Research', sub: 'All 7 DepEd Themes' },
                  { id: 'tuklas', label: '3. TUKLAS Project Fair', sub: '5 Major Categories & Innovation Expo' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleDivisionChange(item.id)}
                  className={`text-left p-3 border transition-colors ${
                    division === item.id
                      ? 'border-[#6B1420] bg-rose-950/5 text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-xs font-semibold text-zinc-900">{item.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme / Category and Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                {division === 'action'
                  ? 'Action Research Theme (7 Official Themes)'
                  : division === 'tuklas'
                  ? 'TUKLAS Major Category (5 Categories incl. Innovation Expo)'
                  : 'Basic Research Focus Area'}
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              >
                {availableCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                {division === 'tuklas' ? 'TUKLAS Subcategory' : 'Specific Subcategory / Strand'}
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Research Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Complete Research Title
            </label>
            <input
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Project SIKAT: Structured Interactive Reading Scaffolds for Grade 8 Learners..."
              className="w-full px-3.5 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
            />
          </div>

          {/* Proponents, Role, Adviser */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Researchers / Proponents (Lead & Co-Authors)
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.AUTHORS_MAX}
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g., Katrina Mae S. Ledesma, Joshua R. Baliling"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Proponent Classification
              </label>
              <select
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value as AuthorRoleType)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              >
                <option value="Teacher">Teacher Researcher</option>
                <option value="Student">Student Researcher</option>
                <option value="Collaborative">Teacher–Student Collaborative</option>
              </select>
            </div>
          </div>

          {/* Adviser, Department/Grade, School Year, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Research Adviser / Mentor
              </label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.ADVISER_MAX}
                value={adviser}
                onChange={(e) => setAdviser(e.target.value)}
                placeholder="e.g., Dr. Elena M. Urbiztondo"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Department / Grade & Strand
              </label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.DEPT_MAX}
                value={departmentOrGrade}
                onChange={(e) => setDepartmentOrGrade(e.target.value)}
                placeholder="e.g., Grade 12 - STEM"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                School Year
              </label>
              <select
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 font-mono focus:outline-none focus:border-[#6B1420]"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Project Status {isAdmin ? '(Admin)' : '(Auto-Reviewed)'}
              </label>
              <select
                value={status}
                disabled={!isAdmin}
                onChange={(e) => setStatus(e.target.value as ResearchStatus)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-zinc-50 text-zinc-900 disabled:opacity-75 focus:outline-none focus:border-[#6B1420]"
              >
                <option value="Pending Review">Pending Review</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Approved">Approved</option>
                <option value="Revision Requested">Revision Requested</option>
              </select>
            </div>
          </div>

          {/* Abstract */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Structured Abstract (Context, Objectives, Summary)
            </label>
            <textarea
              rows={4}
              required
              maxLength={BLUEPRINT_LIMITS.ABSTRACT_MAX}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Summarize the rationale, research questions, intervention or experimental setup, and primary conclusion..."
              className="w-full px-3.5 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
            />
          </div>

          {/* Methodology & Key Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Research Methodology & Design
              </label>
              <textarea
                rows={3}
                maxLength={BLUEPRINT_LIMITS.METHODOLOGY_MAX}
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="e.g., Quasi-experimental pretest-posttest design, RCBD bioassay, or developmental IoT prototyping..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Key Empirical Findings / Intervention Results
              </label>
              <textarea
                rows={3}
                maxLength={BLUEPRINT_LIMITS.FINDINGS_MAX}
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                placeholder="e.g., Statistical outcomes, t-test/ANOVA p-values, accuracy metrics, or classroom mastery gains..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Keywords (Comma-separated)
            </label>
            <input
              type="text"
              maxLength={BLUEPRINT_LIMITS.KEYWORDS_MAX}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., Action Research, Phil-IRI, Seaweed Bio-Stimulant, Barobo NHS"
              className="w-full px-3.5 py-2 text-sm border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
            />
          </div>

          {/* Document Upload (PDF / Word) & Google Drive Integration */}
          <div className="p-4 bg-[#FAF9F5] border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900">
                  Manuscript Document Upload (PDF / Word) & Google Drive Integration
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Upload a PDF (`.pdf`) or Microsoft Word (`.doc`, `.docx`) manuscript, or link a shared Google Drive folder/file.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Select PDF or Word File from Computer
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-zinc-400 bg-white hover:border-[#6B1420] cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <Upload className="w-4 h-4 text-[#6B1420]" />
                  <span>Choose .PDF, .DOCX, or .DOC File</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {attachmentName && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-700 font-mono">
                    <FileText className="w-3.5 h-3.5 text-[#6B1420] shrink-0" />
                    <span className="truncate">{attachmentName}</span>
                    {attachmentSize > 0 && (
                      <span className="text-zinc-500 shrink-0">
                        · {(attachmentSize / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Or Record Attachment Filename Manually
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.ATTACHMENT_NAME_MAX}
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="e.g., BNHS_Action_Research_2026.pdf"
                  className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>

            {fileNotice && (
              <div className="flex items-start gap-2 text-xs text-emerald-900 bg-emerald-50/80 border border-emerald-200 p-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{fileNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#6B1420]" />
                <span>Google Drive Document or Folder URL (Optional Cloud Integration)</span>
              </label>
              <input
                type="url"
                maxLength={BLUEPRINT_LIMITS.DRIVE_URL_MAX}
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... or https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {submitting
                ? 'Saving to BNHS Database...'
                : editingRecord
                ? 'Save Research Changes'
                : 'Submit Research Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
