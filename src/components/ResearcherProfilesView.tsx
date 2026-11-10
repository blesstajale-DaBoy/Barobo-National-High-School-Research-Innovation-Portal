import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResearcherProfileRecord,
  ResearchRecord,
} from '../data/bnhsTaxonomy';

interface ResearcherProfilesViewProps {
  profiles: ResearcherProfileRecord[];
  researches: ResearchRecord[];
  currentUserUid?: string | null;
  currentUserName: string;
  isAdmin: boolean;
  onSelectResearch: (record: ResearchRecord) => void;
  onSaveProfile: (
    payload: Omit<ResearcherProfileRecord, 'id' | 'portalId' | 'uid'>
  ) => Promise<void>;
  onSignInPrompt: () => void;
}

export const ResearcherProfilesView: React.FC<ResearcherProfilesViewProps> = ({
  profiles,
  researches,
  currentUserUid,
  currentUserName,
  isAdmin,
  onSelectResearch,
  onSaveProfile,
  onSignInPrompt,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showProfileForm, setShowProfileForm] = useState<boolean>(false);

  const existingMyProfile = profiles.find((p) => p.uid === currentUserUid);

  const [fullName, setFullName] = useState<string>(
    existingMyProfile?.fullName || currentUserName || ''
  );
  const [role, setRole] = useState<
    | 'Student Researcher'
    | 'Teacher Researcher'
    | 'Master Teacher / Adviser'
    | 'Research Coordinator'
  >(existingMyProfile?.role || 'Teacher Researcher');
  const [departmentOrStrand, setDepartmentOrStrand] = useState<string>(
    existingMyProfile?.departmentOrStrand || 'Science Department'
  );
  const [gradeOrPosition, setGradeOrPosition] = useState<string>(
    existingMyProfile?.gradeOrPosition || 'Teacher III'
  );
  const [specialization, setSpecialization] = useState<string>(
    existingMyProfile?.specialization || ''
  );
  const [bio, setBio] = useState<string>(existingMyProfile?.bio || '');
  const [institutionIdCode, setInstitutionIdCode] = useState<string>(
    existingMyProfile?.institutionIdCode || 'BNHS-FAC-2026'
  );
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>(
    existingMyProfile?.driveFolderUrl || ''
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  const openMyProfileEditor = () => {
    if (!currentUserUid) {
      onSignInPrompt();
      return;
    }
    const mine = profiles.find((p) => p.uid === currentUserUid);
    if (mine) {
      setFullName(mine.fullName);
      setRole(mine.role);
      setDepartmentOrStrand(mine.departmentOrStrand);
      setGradeOrPosition(mine.gradeOrPosition);
      setSpecialization(mine.specialization);
      setBio(mine.bio);
      setInstitutionIdCode(mine.institutionIdCode);
      setDriveFolderUrl(mine.driveFolderUrl);
    } else {
      setFullName(currentUserName || '');
    }
    setShowProfileForm(true);
    setSaveSuccess('');
    setSaveError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await onSaveProfile({
        fullName: fullName.trim().slice(0, 160),
        role: !isAdmin && role === 'Research Coordinator' ? 'Teacher Researcher' : role,
        departmentOrStrand: departmentOrStrand.trim().slice(0, 120),
        gradeOrPosition: gradeOrPosition.trim().slice(0, 100),
        specialization: specialization.trim().slice(0, 250),
        bio: bio.trim().slice(0, 1000),
        institutionIdCode: institutionIdCode.trim().slice(0, 60),
        driveFolderUrl: driveFolderUrl.trim().slice(0, 500),
      });
      setSaveSuccess('Your BNHS Researcher Profile has been saved to the portal directory.');
      setShowProfileForm(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Could not save researcher profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay =
        `${p.fullName} ${p.role} ${p.departmentOrStrand} ${p.specialization} ${p.institutionIdCode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header & Account Profile Registration Banner */}
      <div className="bg-white border border-zinc-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-xs text-zinc-500 mb-1">
            Barobo National High School · Faculty & Student Scholar Registry
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900">
            Teacher & Student Researcher Profiles
          </h2>
          <p className="text-sm text-zinc-600 mt-1.5">
            Browse institutional profiles of BNHS Teacher Researchers, Master Teacher Advisers, and Student Proponents across STEM, STE, HUMSS, ABM, and TVL strands.
          </p>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={openMyProfileEditor}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {existingMyProfile
                ? 'Edit My Researcher Profile'
                : 'Register Teacher / Student Profile'}
            </span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Profile Editor Form */}
      {showProfileForm && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#6B1420] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
              <h3 className="text-base font-display font-semibold text-zinc-900">
                {existingMyProfile
                  ? 'Update My BNHS Researcher Profile'
                  : 'Create Official BNHS Researcher Profile'}
              </h3>
              <p className="text-xs text-zinc-500">
                Linked to your authenticated account for research authorship & Google Drive portfolio integration.
              </p>
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Full Name & Academic Title
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Maria Clara S. Santos"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Account Classification
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value as
                      | 'Student Researcher'
                      | 'Teacher Researcher'
                      | 'Master Teacher / Adviser'
                      | 'Research Coordinator'
                  )
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white"
              >
                <option value="Teacher Researcher">Teacher Researcher</option>
                <option value="Student Researcher">Student Researcher</option>
                <option value="Master Teacher / Adviser">Master Teacher / Adviser</option>
                {isAdmin && (
                  <option value="Research Coordinator">Research Coordinator</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Institutional ID Code (Non-PII)
              </label>
              <input
                type="text"
                value={institutionIdCode}
                onChange={(e) => setInstitutionIdCode(e.target.value)}
                placeholder="e.g., BNHS-FAC-028 or BNHS-STU-114"
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Department or SHS Strand
              </label>
              <input
                type="text"
                required
                value={departmentOrStrand}
                onChange={(e) => setDepartmentOrStrand(e.target.value)}
                placeholder="e.g., Science Department or SHS STEM"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Grade Level or Faculty Position
              </label>
              <input
                type="text"
                required
                value={gradeOrPosition}
                onChange={(e) => setGradeOrPosition(e.target.value)}
                placeholder="e.g., Teacher III or Grade 12 STEM"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Research Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g., Action Research in Reading, Marine Botany"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Scholarly Biography & Research Interests
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your research focus at Barobo National High School..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Google Drive Research Portfolio Folder URL
              </label>
              <input
                type="url"
                value={driveFolderUrl}
                onChange={(e) => setDriveFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowProfileForm(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
            >
              {saving ? 'Saving Profile...' : 'Save Researcher Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-zinc-200 p-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: 'All Researchers' },
              { id: 'Teacher Researcher', label: 'Teacher Researchers' },
              { id: 'Student Researcher', label: 'Student Researchers' },
              { id: 'Master Teacher / Adviser', label: 'Master Teachers & Advisers' },
              { id: 'Research Coordinator', label: 'Coordinators' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                roleFilter === tab.id
                  ? 'bg-[#6B1420] text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search researcher, strand, or specialization..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
          />
        </div>
      </div>

      {/* Researcher Profile Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProfiles.map((prof) => {
          const authoredStudies = researches.filter(
            (r) =>
              r.authorUid === prof.uid ||
              r.authors.toLowerCase().includes(prof.fullName.toLowerCase().split(' ').slice(-1)[0]) ||
              r.adviser.toLowerCase().includes(prof.fullName.toLowerCase().split(' ').slice(-1)[0])
          );

          return (
            <div
              key={prof.id}
              className="bg-white border border-zinc-200 p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Clean unboxed metadata header */}
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    <strong className="text-[#6B1420]">{prof.role}</strong>
                    <span aria-hidden="true"> · </span>
                    <span>{prof.departmentOrStrand}</span>
                  </span>
                  <span className="font-mono text-zinc-600">{prof.institutionIdCode}</span>
                </div>

                <div>
                  <h3 className="text-lg font-display font-semibold text-zinc-900">
                    {prof.fullName}
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5">{prof.gradeOrPosition}</p>
                </div>

                <p className="text-xs text-zinc-700 leading-relaxed">{prof.bio}</p>

                {prof.specialization && (
                  <div className="text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-800">Specialization: </span>
                    <span>{prof.specialization}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#6B1420]" />
                    <span className="tabular-nums">
                      Linked BNHS Studies ({authoredStudies.length})
                    </span>
                  </span>
                  {prof.driveFolderUrl && (
                    <a
                      href={prof.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#6B1420] hover:underline"
                    >
                      <span>Google Drive Portfolio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {authoredStudies.length > 0 ? (
                  <ul className="space-y-1">
                    {authoredStudies.slice(0, 3).map((st) => (
                      <li key={st.id}>
                        <button
                          type="button"
                          onClick={() => onSelectResearch(st)}
                          className="text-left text-xs text-zinc-700 hover:text-[#6B1420] hover:underline line-clamp-1"
                        >
                          · {st.title} ({st.schoolYear})
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-400">
                    No indexed manuscripts linked yet.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
