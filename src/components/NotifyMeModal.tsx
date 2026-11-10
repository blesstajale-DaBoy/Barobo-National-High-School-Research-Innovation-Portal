import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellOff,
  Mail,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import {
  ResearchRecord,
  ResearchSubscriptionRecord,
} from '../data/bnhsTaxonomy';

interface NotifyMeModalProps {
  isOpen: boolean;
  record: ResearchRecord | null;
  existingSubscription?: ResearchSubscriptionRecord | null;
  defaultEmail: string;
  onClose: () => void;
  onSaveSubscription: (
    record: ResearchRecord,
    email: string,
    notifyOnStatusChange: boolean,
    notifyOnComments: boolean
  ) => Promise<void>;
  onUnsubscribe: (record: ResearchRecord) => Promise<void>;
}

export const NotifyMeModal: React.FC<NotifyMeModalProps> = ({
  isOpen,
  record,
  existingSubscription,
  defaultEmail,
  onClose,
  onSaveSubscription,
  onUnsubscribe,
}) => {
  const [email, setEmail] = useState<string>('');
  const [notifyStatus, setNotifyStatus] = useState<boolean>(true);
  const [notifyComments, setNotifyComments] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (record && isOpen) {
      setEmail(existingSubscription?.subscriberEmail || defaultEmail || '');
      setNotifyStatus(
        existingSubscription ? existingSubscription.notifyOnStatusChange : true
      );
      setNotifyComments(
        existingSubscription ? existingSubscription.notifyOnComments : true
      );
      setErrorMsg('');
    }
  }, [record, isOpen, existingSubscription, defaultEmail]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address to receive alerts.');
      return;
    }
    if (!notifyStatus && !notifyComments) {
      setErrorMsg('Please select at least one alert trigger.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      await onSaveSubscription(
        record,
        trimmedEmail,
        notifyStatus,
        notifyComments
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not save subscription. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await onUnsubscribe(record);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-modal-title"
    >
      <div className="bg-white border border-zinc-200 w-full max-w-lg overflow-hidden shadow-xl">
        {/* Maroon Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#6B1420] text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Bell className="w-4 h-4" />
            <span>BNHS Research Email Alert Subscription</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-rose-100 hover:text-white transition-colors"
            aria-label="Close email alert subscription modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <h2
              id="notify-modal-title"
              className="text-lg font-display font-semibold text-zinc-900"
            >
              {existingSubscription
                ? 'Manage Email Alert Subscription'
                : 'Notify Me of Updates & Comments'}
            </h2>
            <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
              <strong className="text-[#6B1420]">Study:</strong> {record.title}
            </p>
            <div className="text-[11px] font-mono text-zinc-500 mt-1">
              Current Status: <strong className="text-zinc-800">{record.status}</strong> · ID: {record.id}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Recipient Email Address <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher.researcher@deped.gov.ph"
                className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Automated email alerts will be dispatched to this address whenever the selected events occur on this research record.
            </p>
          </div>

          <div className="space-y-2.5 bg-[#FAF9F5] border border-zinc-200 p-4">
            <div className="text-xs font-semibold text-zinc-800">
              Alert Triggers
            </div>

            <label className="flex items-start gap-2.5 text-xs text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyStatus}
                onChange={(e) => setNotifyStatus(e.target.checked)}
                className="mt-0.5 accent-[#6B1420]"
              />
              <div>
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#6B1420]" />
                  <span>Record Status Changes</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Receive an email alert when this study transitions between Pending Review, Ongoing, Completed, Approved, or Revision Requested.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-zinc-700 cursor-pointer pt-2 border-t border-zinc-200/70">
              <input
                type="checkbox"
                checked={notifyComments}
                onChange={(e) => setNotifyComments(e.target.checked)}
                className="mt-0.5 accent-[#6B1420]"
              />
              <div>
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#6B1420]" />
                  <span>New Comments &amp; Peer Feedback</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Receive an email alert whenever a researcher, adviser, or committee reviewer posts a new comment on this entry.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-200">
            <div>
              {existingSubscription && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Unsubscribe</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {saving
                    ? 'Saving...'
                    : existingSubscription
                    ? 'Update Alert Preferences'
                    : 'Activate Email Alerts'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
