import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileCheck,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ResearchRecord,
  ResearchStatus,
  ResearchStatusHistoryRecord,
  INITIAL_STATUS_HISTORY,
} from '../data/bnhsTaxonomy';

interface ResearchStatusTimelineProps {
  record: ResearchRecord;
  localHistoryOverrides?: ResearchStatusHistoryRecord[];
}

function getStatusBadgeStyle(status: ResearchStatus | string) {
  switch (status) {
    case 'Approved':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-600 ring-emerald-200',
        icon: CheckCircle2,
      };
    case 'Completed':
      return {
        bg: 'bg-teal-50 text-teal-800 border-teal-300',
        dot: 'bg-teal-600 ring-teal-200',
        icon: Award,
      };
    case 'Ongoing':
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-300',
        dot: 'bg-blue-600 ring-blue-200',
        icon: RefreshCw,
      };
    case 'Pending Review':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        dot: 'bg-amber-600 ring-amber-200',
        icon: Clock,
      };
    case 'Revision Requested':
      return {
        bg: 'bg-orange-50 text-orange-800 border-orange-300',
        dot: 'bg-orange-600 ring-orange-200',
        icon: AlertCircle,
      };
    case 'Archived':
      return {
        bg: 'bg-zinc-100 text-zinc-700 border-zinc-300',
        dot: 'bg-zinc-500 ring-zinc-200',
        icon: Archive,
      };
    default:
      return {
        bg: 'bg-zinc-50 text-zinc-800 border-zinc-300',
        dot: 'bg-zinc-600 ring-zinc-200',
        icon: FileCheck,
      };
  }
}

function formatTimelineDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export const ResearchStatusTimeline: React.FC<ResearchStatusTimelineProps> = ({
  record,
  localHistoryOverrides = [],
}) => {
  const [cloudHistory, setCloudHistory] = useState<ResearchStatusHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch real-time status change history from 'status_history' collection in Firestore
  useEffect(() => {
    if (!record?.id) return;

    const collectionPath = 'status_history';
    const q = query(
      collection(db, collectionPath),
      where('portalId', '==', 'bnhs'),
      where('researchId', '==', record.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const historyList: ResearchStatusHistoryRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            researchId: String(d.researchId || record.id),
            previousStatus: String(d.previousStatus || 'Initial Submission'),
            newStatus: (d.newStatus as ResearchStatus) || 'Pending Review',
            evaluatorName: String(d.evaluatorName || 'BNHS Research Committee'),
            evaluatorUid: String(d.evaluatorUid || ''),
            evaluationScore: Number(d.evaluationScore || 0),
            remarks: String(d.remarks || ''),
            createdAtIso: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          };
        });
        setCloudHistory(historyList);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [record.id]);

  // 2. Synthesize & merge chronological timeline
  const timelineEntries = React.useMemo(() => {
    const map = new Map<string, ResearchStatusHistoryRecord>();

    // Baseline historical records
    INITIAL_STATUS_HISTORY.filter((h) => h.researchId === record.id).forEach((h) => {
      map.set(h.id, h);
    });

    // Local in-memory overrides
    localHistoryOverrides
      .filter((h) => h.researchId === record.id)
      .forEach((h) => map.set(h.id, h));

    // Live cloud records
    cloudHistory.forEach((h) => map.set(h.id, h));

    let list = Array.from(map.values());

    // If no entries exist yet, synthesize intelligent baseline milestones
    if (list.length === 0) {
      const submissionMilestone: ResearchStatusHistoryRecord = {
        id: `synth_sub_${record.id}`,
        portalId: 'bnhs',
        researchId: record.id,
        previousStatus: 'Author Submission',
        newStatus: 'Pending Review',
        evaluatorName: `${record.authors} (${record.authorRole})`,
        evaluatorUid: record.authorUid || 'submitting_author',
        evaluationScore: 0,
        remarks: `Research manuscript submitted to the ${record.division.toUpperCase()} division (${record.category}). Queued for BNHS technical evaluation.`,
        createdAtIso: record.createdAtIso || new Date().toISOString(),
      };

      list.push(submissionMilestone);

      if (record.status !== 'Pending Review' || record.evaluationScore > 0) {
        const evaluationMilestone: ResearchStatusHistoryRecord = {
          id: `synth_eval_${record.id}`,
          portalId: 'bnhs',
          researchId: record.id,
          previousStatus: 'Pending Review',
          newStatus: record.status,
          evaluatorName: record.evaluatedBy || 'BNHS Research Committee',
          evaluatorUid: 'bnhs_evaluator',
          evaluationScore: record.evaluationScore,
          remarks:
            record.evaluationRemarks ||
            `Official status updated to "${record.status}" by the Barobo NHS Research Committee.`,
          createdAtIso: record.updatedAtIso || new Date().toISOString(),
        };
        list.push(evaluationMilestone);
      }
    }

    // Sort chronologically ascending so the timeline flows from earliest submission to current status
    return list.sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
  }, [record, cloudHistory, localHistoryOverrides]);

  return (
    <div className="p-5 bg-white border border-zinc-200 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6B1420]" />
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Research Status History &amp; Workflow Timeline
            </h3>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            Real-time audit log of committee evaluations, workflow stage progressions, and evaluator notes.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-zinc-500">
            {timelineEntries.length} {timelineEntries.length === 1 ? 'milestone' : 'milestones'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 font-semibold text-xs border bg-zinc-50 text-zinc-800 border-zinc-300">
            Current: <strong className="text-[#6B1420] ml-1">{record.status}</strong>
          </span>
        </div>
      </div>

      {loading && timelineEntries.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-500 animate-pulse">
          Loading status history from Firestore...
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 pt-2">
          {/* Vertical Connecting Line */}
          <div
            className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-0.5 bg-zinc-200"
            aria-hidden="true"
          />

          {timelineEntries.map((entry, idx) => {
            const badgeStyle = getStatusBadgeStyle(entry.newStatus);
            const StatusIcon = badgeStyle.icon;
            const isLatest = idx === timelineEntries.length - 1;

            return (
              <div key={entry.id} className="relative group">
                {/* Node Milestone Circle */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${
                    isLatest
                      ? 'border-[#6B1420] ring-4 ring-rose-100 text-[#6B1420]'
                      : 'border-zinc-400 text-zinc-600'
                  }`}
                  aria-hidden="true"
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                </div>

                {/* Milestone Content Card */}
                <div
                  className={`p-4 border transition-colors ${
                    isLatest
                      ? 'bg-rose-950/[0.02] border-[#6B1420]/30 shadow-xs'
                      : 'bg-[#FAF9F5] border-zinc-200'
                  }`}
                >
                  {/* Row 1: Status Badges and Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.previousStatus && entry.previousStatus !== entry.newStatus && (
                        <>
                          <span className="text-xs font-medium text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5">
                            {entry.previousStatus}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                        </>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold border ${badgeStyle.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                        <span>{entry.newStatus}</span>
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B1420] font-bold bg-amber-100 px-1.5 py-0.5">
                          Active State
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-zinc-500">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatTimelineDate(entry.createdAtIso)}</span>
                    </div>
                  </div>

                  {/* Row 2: Evaluator & Rubric Score */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-zinc-700">
                      <span className="font-semibold text-zinc-900">Evaluated / Updated by: </span>
                      <span className="font-medium text-[#6B1420]">{entry.evaluatorName}</span>
                    </div>

                    {entry.evaluationScore > 0 && (
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Score: {entry.evaluationScore}/100</span>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Official Remarks / Feedback Notes */}
                  {entry.remarks && (
                    <div className="mt-2.5 text-xs text-zinc-700 bg-white border-l-2 border-[#6B1420] p-2.5 rounded-none font-sans italic leading-relaxed">
                      &ldquo;{entry.remarks}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
