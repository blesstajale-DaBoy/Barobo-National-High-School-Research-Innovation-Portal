import React, { useState } from 'react';
import {
  LogIn,
  ShieldCheck,
  UserCheck,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResearcherRoleType,
  RESEARCHER_ACCOUNT_CLASSIFICATIONS,
} from '../data/bnhsTaxonomy';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../lib/firebase';

export interface BnhsPortalUserSession {
  uid: string;
  displayName: string;
  email: string;
  accountClassification: ResearcherRoleType | 'Administrator / Research Coordinator';
  departmentOrStrand: string;
  isAdmin: boolean;
  signedInAtIso: string;
}

interface BnhsPortalLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInPortalSession: (session: BnhsPortalUserSession) => void;
  onSignInWithGoogle: () => Promise<void>;
}

export const BnhsPortalLoginModal: React.FC<BnhsPortalLoginModalProps> = ({
  isOpen,
  onClose,
  onSignInPortalSession,
  onSignInWithGoogle,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [accountClassification, setAccountClassification] = useState<
    ResearcherRoleType | 'Administrator / Research Coordinator'
  >('Teacher Researcher');
  const [departmentOrStrand, setDepartmentOrStrand] = useState<string>(
    'Science & Mathematics Department'
  );
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [googleNotice, setGoogleNotice] = useState<string>('');

  if (!isOpen) return null;

  const handleDirectPortalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim() || 'Barobo NHS Researcher';
    const cleanEmail = email.trim().toLowerCase() || 'researcher@bnhs.edu.ph';
    const cleanUid = `bnhs_user_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)}`;

    const isUserAdmin =
      cleanEmail === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ||
      accountClassification === 'Administrator / Research Coordinator' ||
      accountClassification === 'Research Coordinator';

    onSignInPortalSession({
      uid: cleanUid,
      displayName: cleanName,
      email: cleanEmail,
      accountClassification,
      departmentOrStrand: departmentOrStrand.trim() || 'Barobo National High School',
      isAdmin: isUserAdmin,
      signedInAtIso: new Date().toISOString(),
    });
    onClose();
  };

  const handleQuickPreset = (
    presetName: string,
    presetEmail: string,
    presetRole: ResearcherRoleType | 'Administrator / Research Coordinator',
    presetDept: string
  ) => {
    setFullName(presetName);
    setEmail(presetEmail);
    setAccountClassification(presetRole);
    setDepartmentOrStrand(presetDept);
  };

  const handleGoogleSignInClick = async () => {
    setGoogleLoading(true);
    setGoogleNotice('');
    try {
      await onSignInWithGoogle();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('unauthorized-domain') ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('popup-blocked') ||
        msg.includes('cancelled-popup-request')
      ) {
        setGoogleNotice(
          'Google popup closed on this live domain. Please use the Direct BNHS Portal Login form below to sign in immediately (no popup required).'
        );
      } else {
        setGoogleNotice(
          'Google popup sign-in could not complete in this browser window. Use the Direct BNHS Portal Login form below to sign in immediately.'
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bnhs-login-modal-title"
    >
      <div className="bg-white border-2 border-[#6B1420] w-full max-w-xl shadow-xl overflow-hidden my-8">
        {/* Maroon Header */}
        <div className="bg-[#6B1420] text-white px-6 py-4 flex items-center justify-between border-b border-rose-950">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/BNHS_LOGO_animated.gif"
              alt="BNHS Seal"
              className="w-10 h-10 rounded-full bg-white p-0.5 object-contain shrink-0"
            />
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
                Barobo National High School · Official Portal Access
              </div>
              <h2
                id="bnhs-login-modal-title"
                className="text-lg font-display font-bold text-white"
              >
                Barobo NHS (Teacher / Student / Admin Login)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1"
            aria-label="Close login modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Role Presets for Fast 1-Click Fill */}
          <div className="bg-[#FAF9F5] border border-zinc-200 p-3.5 space-y-2">
            <div className="text-[11px] font-semibold text-zinc-700 flex items-center justify-between">
              <span>Quick Account Fill (Click to pre-fill credentials):</span>
              <span className="text-[#6B1420] font-mono">Works on Live URL</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'Bless T. Tajale',
                    BOOTSTRAPPED_ADMIN_EMAIL,
                    'Administrator / Research Coordinator',
                    'BNHS Research & Innovation Center'
                  )
                }
                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors"
              >
                Admin / Coordinator (Bless T. Tajale)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'Master Teacher Researcher',
                    'master.teacher@bnhs.edu.ph',
                    'Master Teacher Researcher',
                    'Science & Mathematics Department'
                  )
                }
                className="px-2.5 py-1 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:border-[#6B1420] transition-colors"
              >
                Master Teacher Researcher
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'BNHS Teacher Researcher',
                    'teacher.researcher@bnhs.edu.ph',
                    'Teacher Researcher',
                    'Junior / Senior High School Faculty'
                  )
                }
                className="px-2.5 py-1 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:border-[#6B1420] transition-colors"
              >
                Teacher Researcher
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'BNHS Student Researcher',
                    'student.researcher@bnhs.edu.ph',
                    'Student Researcher',
                    'SHS STEM / STE Strand'
                  )
                }
                className="px-2.5 py-1 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:border-[#6B1420] transition-colors"
              >
                Student Researcher
              </button>
            </div>
          </div>

          {/* Direct BNHS Portal Sign-In Form (No Popup Required — Never Disappears on Live Published URLs) */}
          <form onSubmit={handleDirectPortalLogin} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Full Name &amp; Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Bless T. Tajale"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., blesstajale@gmail.com"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Account Classification
                </label>
                <select
                  value={accountClassification}
                  onChange={(e) =>
                    setAccountClassification(
                      e.target.value as
                        | ResearcherRoleType
                        | 'Administrator / Research Coordinator'
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                >
                  <option value="Administrator / Research Coordinator">
                    Administrator / Research Coordinator
                  </option>
                  {RESEARCHER_ACCOUNT_CLASSIFICATIONS.map((roleOpt) => (
                    <option key={roleOpt} value={roleOpt}>
                      {roleOpt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Department / Grade &amp; Strand
                </label>
                <input
                  type="text"
                  value={departmentOrStrand}
                  onChange={(e) => setDepartmentOrStrand(e.target.value)}
                  placeholder="e.g., Science Department or Grade 12 STEM"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Persistent session · Works on all live published links</span>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In to BNHS Portal</span>
              </button>
            </div>
          </form>

          {/* Optional Google Cloud Account Sign-In */}
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-600">
                <strong className="text-zinc-800">Optional Google Popup Sign-In:</strong>{' '}
                Connect your Google account if popups are enabled on this domain.
              </div>
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                disabled={googleLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-800 bg-[#FAF9F5] border border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#6B1420]" />
                <span>
                  {googleLoading ? 'Opening Google Sign-In...' : 'Sign In with Google Popup'}
                </span>
              </button>
            </div>

            {googleNotice && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{googleNotice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 flex items-center justify-between text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#6B1420]" />
            <span>Barobo National High School · Research &amp; Innovation Portal</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
