import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  ExternalLink,
  CheckCircle2,
  Edit3,
  Trash2,
  Eye,
  Award,
  Bell,
  BellRing,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  ResearchRecord,
  ResearchStatus,
  ResearchCommentRecord,
  ResearchSubscriptionRecord,
} from '../data/bnhsTaxonomy';
import {
  downloadResearchDossierHtml,
  downloadManuscriptWordDoc,
  getDivisionLabel,
} from '../utils/reportExporter';
import { ResearchStatusTimeline } from './ResearchStatusTimeline';

interface ResearchDetailModalProps {
  record: ResearchRecord | null;
  onClose: () => void;
  isAdmin: boolean;
  currentUserUid?: string | null;
  currentUserName?: string;
  onEdit: (record: ResearchRecord) => void;
  onDelete: (record: ResearchRecord) => Promise<void>;
  onDownloadAttachedBinary: (record: ResearchRecord) => Promise<void>;
  onEvaluate: (
    record: ResearchRecord,
    newStatus: ResearchStatus,
    score: number,
    remarks: string,
    evaluatorName: string
  ) => Promise<void>;
  evaluatorDefaultName: string;
  comments: ResearchCommentRecord[];
  onAddComment: (
    record: ResearchRecord,
    authorName: string,
    authorRole: string,
    content: string
  ) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  activeSubscription?: ResearchSubscriptionRecord | null;
  onOpenNotifyModal: (record: ResearchRecord) => void;
}

function getGoogleDriveEmbedUrl(url: string): string | null {
  if (!url) return null;
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  return null;
}

export const ResearchDetailModal: React.FC<ResearchDetailModalProps> = ({
  record,
  onClose,
  isAdmin,
  currentUserUid,
  currentUserName,
  onEdit,
  onDelete,
  onDownloadAttachedBinary,
  onEvaluate,
  evaluatorDefaultName,
  comments,
  onAddComment,
  onDeleteComment,
  activeSubscription,
  onOpenNotifyModal,
}) => {
  const [showDrivePreview, setShowDrivePreview] = useState(false);
  const [evalStatus, setEvalStatus] = useState<ResearchStatus>(
    record?.status || 'Approved'
  );
  const [rubricRationale, setRubricRationale] = useState<number>(24);
  const [rubricMethod, setRubricMethod] = useState<number>(23);
  const [rubricFindings, setRubricFindings] = useState<number>(28);
  const [rubricDoc, setRubricDoc] = useState<number>(19);
  const [evalRemarks, setEvalRemarks] = useState<string>(
    record?.evaluationRemarks || ''
  );
  const [evaluatedBy, setEvaluatedBy] = useState<string>(
    record?.evaluatedBy || evaluatorDefaultName || 'BNHS Research Committee'
  );
  const [savingEval, setSavingEval] = useState<boolean>(false);
  const [evalSavedMsg, setEvalSavedMsg] = useState<string>('');

  // Comment Form State
  const [commentAuthorName, setCommentAuthorName] = useState<string>(
    currentUserName || ''
  );
  const [commentAuthorRole, setCommentAuthorRole] = useState<string>(
    isAdmin ? 'Research Committee / Coordinator' : 'Teacher / Student Researcher'
  );
  const [commentContent, setCommentContent] = useState<string>('');
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [deletingRecord, setDeletingRecord] = useState<boolean>(false);

  React.useEffect(() => {
    if (record) {
      setEvalStatus(record.status);
      setEvalRemarks(record.evaluationRemarks || '');
      setEvaluatedBy(
        record.evaluatedBy || evaluatorDefaultName || 'BNHS Research Committee'
      );
      setEvalSavedMsg('');
      setShowDrivePreview(false);
      setConfirmingDelete(false);
      setCommentAuthorName(currentUserName || '');
      setCommentAuthorRole(
        isAdmin
          ? 'Research Committee / Coordinator'
          : 'Teacher / Student Researcher'
      );
      if (record.evaluationScore > 0) {
        const total = record.evaluationScore;
        setRubricRationale(Math.min(25, Math.round(total * 0.25)));
        setRubricMethod(Math.min(25, Math.round(total * 0.25)));
        setRubricFindings(Math.min(30, Math.round(total * 0.3)));
        setRubricDoc(
          Math.max(
            0,
            Math.min(
              20,
              total -
                Math.min(25, Math.round(total * 0.25)) -
                Math.min(25, Math.round(total * 0.25)) -
                Math.min(30, Math.round(total * 0.3))
            )
          )
        );
      }
    }
  }, [record, evaluatorDefaultName, currentUserName, isAdmin]);

  if (!record) return null;

  // Authors and Admins can edit and delete any research they submitted, even after it is posted
  const canEdit =
    isAdmin || (Boolean(currentUserUid) && record.authorUid === currentUserUid);
  const canDelete =
    isAdmin || (Boolean(currentUserUid) && record.authorUid === currentUserUid);

  const computedTotalScore = Math.min(
    100,
    Math.max(0, rubricRationale + rubricMethod + rubricFindings + rubricDoc)
  );
  const embedDriveUrl = getGoogleDriveEmbedUrl(record.driveUrl);

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEval(true);
    setEvalSavedMsg('');
    try {
      await onEvaluate(
        record,
        evalStatus,
        computedTotalScore,
        evalRemarks.trim(),
        evaluatedBy.trim() || 'BNHS Research Committee'
      );
      setEvalSavedMsg(
        'Official evaluation & workflow status saved. Subscribed users have been notified via email alert.'
      );
    } finally {
      setSavingEval(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setPostingComment(true);
    try {
      await onAddComment(
        record,
        commentAuthorName.trim() || currentUserName || 'BNHS Researcher',
        commentAuthorRole.trim() || 'Researcher',
        commentContent.trim()
      );
      setCommentContent('');
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="bg-white border border-zinc-200 w-full max-w-4xl my-8 overflow-hidden shadow-xl">
        {/* Top Institutional Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#6B1420] text-white">
          <div className="text-xs text-rose-100 flex items-center gap-2 flex-wrap">
            <span className="font-mono">{record.id}</span>
            <span aria-hidden="true">·</span>
            <span>{getDivisionLabel(record.division)}</span>
            <span aria-hidden="true">·</span>
            <span>SY {record.schoolYear}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-white">Status: {record.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenNotifyModal(record)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeSubscription
                  ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {activeSubscription ? (
                <>
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Alerts Active ({activeSubscription.subscriberEmail})</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notify Me</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-rose-100 hover:text-white transition-colors"
              aria-label="Close research details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 max-h-[84vh] overflow-y-auto space-y-6">
          {/* Unboxed Metadata Kicker */}
          <div className="text-xs text-zinc-600 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#6B1420]">{record.category}</span>
              {record.subcategory && (
                <>
                  <span aria-hidden="true">/</span>
                  <span>{record.subcategory}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{record.departmentOrGrade}</span>
              {record.evaluationScore > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-semibold text-amber-800">
                    Committee Rating: {record.evaluationScore}/100
                  </span>
                </>
              )}
            </div>

            {/* Quick Edit & Delete Strip at Top of Record */}
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit(record);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#6B1420]" />
                    <span>Edit Research</span>
                  </button>
                )}
                {canDelete && !confirmingDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Research</span>
                  </button>
                )}
                {canDelete && confirmingDelete && (
                  <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1">
                    <span className="text-[11px] font-semibold text-red-800">
                      Confirm delete?
                    </span>
                    <button
                      type="button"
                      disabled={deletingRecord}
                      onClick={async () => {
                        setDeletingRecord(true);
                        try {
                          await onDelete(record);
                          onClose();
                        } finally {
                          setDeletingRecord(false);
                        }
                      }}
                      className="px-2 py-0.5 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800"
                    >
                      {deletingRecord ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="px-2 py-0.5 text-[11px] text-zinc-700 hover:text-zinc-900"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Study Title */}
          <h2
            id="detail-modal-title"
            className="text-xl md:text-2xl font-display font-semibold text-zinc-900 leading-snug"
          >
            {record.title}
          </h2>

          {/* Author & Adviser Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y border-zinc-200 text-xs">
            <div>
              <div className="text-zinc-500">Authors / Proponents</div>
              <div className="font-semibold text-zinc-900 mt-0.5">
                {record.authors}
              </div>
              <div className="text-zinc-500 mt-0.5">
                {record.authorRole} Research Entry
              </div>
            </div>
            <div>
              <div className="text-zinc-500">Research Adviser / Consultant</div>
              <div className="font-semibold text-zinc-900 mt-0.5">
                {record.adviser || 'Barobo NHS Research Faculty'}
              </div>
              <div className="text-zinc-500 mt-0.5">{record.departmentOrGrade}</div>
            </div>
            <div>
              <div className="text-zinc-500">Recorded Manuscript File</div>
              <div className="font-mono text-zinc-900 mt-0.5 truncate">
                {record.attachmentName || 'No file recorded'}
              </div>
              <div className="text-zinc-500 font-mono mt-0.5">
                {record.attachmentSize > 0
                  ? `${(record.attachmentSize / 1024).toFixed(1)} KB`
                  : 'Catalog Record'}
              </div>
            </div>
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-900">
              01. Executive Abstract
            </h3>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
              {record.abstract}
            </p>
          </div>

          {/* Methodology & Key Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-zinc-900">
                02. Research Methodology &amp; Design
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {record.methodology ||
                  'Empirical methodology documented in the full manuscript file.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-zinc-900">
                03. Key Findings &amp; Educational / Innovation Impact
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {record.keyFindings ||
                  'Empirical outcomes and recommendations recorded in the attached study.'}
              </p>
            </div>
          </div>

          {/* Keywords */}
          {record.keywords && (
            <div className="pt-2 border-t border-zinc-200 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-900">Indexing Keywords: </span>
              <span>{record.keywords}</span>
            </div>
          )}

          {/* Downloadable Reports, Manuscript & Google Drive Section */}
          <div className="p-5 bg-[#FAF9F5] border border-zinc-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900">
                  04. Manuscript Downloads, Official Reports &amp; Google Drive Repository
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Download the attached manuscript, generate a printable DepEd/BNHS research report dossier, or open the linked Google Drive repository.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onDownloadAttachedBinary(record)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {record.fileDocId
                    ? `Download Uploaded File (${record.attachmentName})`
                    : 'Download Manuscript (.DOC)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => downloadResearchDossierHtml(record)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-[#6B1420]" />
                <span>Download Official Research Report (HTML/Print)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadManuscriptWordDoc(record)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Export Word Summary (.DOC)</span>
              </button>

              {record.driveUrl && (
                <a
                  href={record.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#6B1420] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Drive</span>
                </a>
              )}

              {embedDriveUrl && (
                <button
                  type="button"
                  onClick={() => setShowDrivePreview((v) => !v)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showDrivePreview ? 'Hide Drive Preview' : 'Preview Drive Document'}</span>
                </button>
              )}
            </div>

            {showDrivePreview && embedDriveUrl && (
              <div className="mt-3 border border-zinc-300 bg-white">
                <iframe
                  src={embedDriveUrl}
                  title="Google Drive Document Preview"
                  className="w-full h-96 border-0"
                />
              </div>
            )}
          </div>

          {/* Committee Evaluation Summary (Read View for Everyone) */}
          <div className="p-5 bg-white border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-700" />
                <span>05. BNHS Research Committee Evaluation &amp; Status Tracking</span>
              </h3>
              <span className="text-xs font-mono text-zinc-700">
                Score:{' '}
                <strong>
                  {record.evaluationScore > 0
                    ? `${record.evaluationScore} / 100`
                    : 'Pending Panel Evaluation'}
                </strong>
              </span>
            </div>
            <p className="text-xs text-zinc-600">
              <strong className="text-zinc-800">Evaluator / Panel:</strong>{' '}
              {record.evaluatedBy || 'Awaiting School Research Committee assignment'}
            </p>
            <p className="text-xs text-zinc-600">
              <strong className="text-zinc-800">Evaluation Remarks:</strong>{' '}
              {record.evaluationRemarks ||
                'This study is queued for review by the Barobo National High School Research Committee.'}
            </p>
          </div>

          {/* 06. Vertical Timeline of Status Changes from Firestore */}
          <ResearchStatusTimeline record={record} />

          {/* 07. Comments & Peer Feedback Section (Triggers Email Alerts to Subscribed Users) */}
          <div className="p-5 bg-[#FAF9F5] border border-zinc-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#6B1420]" />
                  <span>
                    07. Research Comments &amp; Peer Feedback ({comments.length})
                  </span>
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Post questions, peer review notes, or implementation feedback. Subscribed users automatically receive an email alert when a new comment is added.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenNotifyModal(record)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeSubscription
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-[#6B1420] text-white hover:bg-[#520E17]'
                }`}
              >
                {activeSubscription ? (
                  <>
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Subscribed to Alerts</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notify Me of Updates</span>
                  </>
                )}
              </button>
            </div>

            {/* Existing Comments List */}
            {comments.length === 0 ? (
              <div className="text-xs text-zinc-500 py-3">
                No comments posted yet for this research record. Be the first to add peer feedback below.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {comments.map((cmt) => {
                  const canDeleteComment =
                    isAdmin ||
                    (Boolean(currentUserUid) && cmt.authorUid === currentUserUid);
                  return (
                    <div
                      key={cmt.id}
                      className="p-3.5 bg-white border border-zinc-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-900">
                            {cmt.authorName}
                          </span>
                          <span aria-hidden="true" className="text-zinc-400">
                            ·
                          </span>
                          <span className="text-[#6B1420] font-medium">
                            {cmt.authorRole}
                          </span>
                          <span aria-hidden="true" className="text-zinc-400">
                            ·
                          </span>
                          <span className="font-mono text-zinc-500 text-[11px]">
                            {cmt.createdAtIso.slice(0, 10)}
                          </span>
                        </div>
                        {canDeleteComment && !cmt.isBaseline && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(cmt.id)}
                            className="text-[11px] text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-zinc-700 leading-relaxed whitespace-pre-line">
                        {cmt.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-3 pt-2 border-t border-zinc-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={commentAuthorName}
                    onChange={(e) => setCommentAuthorName(e.target.value)}
                    placeholder="e.g., Teacher / Student Name"
                    className="w-full px-3 py-1.5 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Role / Department
                  </label>
                  <input
                    type="text"
                    required
                    value={commentAuthorRole}
                    onChange={(e) => setCommentAuthorRole(e.target.value)}
                    placeholder="e.g., Science Teacher / Grade 12 STEM"
                    className="w-full px-3 py-1.5 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a constructive comment, methodology question, or feedback..."
                  className="flex-1 px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                />
                <button
                  type="submit"
                  disabled={postingComment || !commentContent.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{postingComment ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Administrator Rubric Evaluation & Workflow Approval Form */}
          {isAdmin && (
            <form
              onSubmit={handleSaveEvaluation}
              className="p-5 bg-rose-950/[0.03] border border-[#6B1420]/30 space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-[#6B1420]">
                    Administrator &amp; Research Committee Evaluation Workflow
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Grade this study using the 100-point BNHS Research Rubric and update its official portal status.
                  </p>
                </div>
                <div className="text-sm font-mono font-bold text-[#6B1420]">
                  Computed Rubric Total: {computedTotalScore} / 100
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Rationale &amp; Context (Max 25)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={rubricRationale}
                    onChange={(e) => setRubricRationale(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-zinc-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Methodology &amp; Rigor (Max 25)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={rubricMethod}
                    onChange={(e) => setRubricMethod(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-zinc-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Findings &amp; Impact (Max 30)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={rubricFindings}
                    onChange={(e) => setRubricFindings(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-zinc-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Manuscript Quality (Max 20)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={rubricDoc}
                    onChange={(e) => setRubricDoc(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-zinc-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Workflow Decision / Portal Status
                  </label>
                  <select
                    value={evalStatus}
                    onChange={(e) => setEvalStatus(e.target.value as ResearchStatus)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-zinc-300 bg-white"
                  >
                    <option value="Approved">Approved (Published to Library)</option>
                    <option value="Completed">Completed</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Revision Requested">Revision Requested</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Archived">Archived (Terminal State)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Evaluated By (Committee Member / Panel)
                  </label>
                  <input
                    type="text"
                    value={evaluatedBy}
                    onChange={(e) => setEvaluatedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Official Evaluation Remarks &amp; Recommendations
                </label>
                <textarea
                  rows={2}
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  placeholder="Enter constructive feedback, statistical verification notes, or congress endorsement..."
                  className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                />
              </div>

              {evalSavedMsg && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{evalSavedMsg}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingEval}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
                >
                  {savingEval ? 'Updating Evaluation...' : 'Record Evaluation & Update Status'}
                </button>
              </div>
            </form>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(record);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </button>
              )}
              {canDelete && !confirmingDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
