import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  ResearcherProfileRecord,
  ResearcherRoleType,
  RESEARCHER_ACCOUNT_CLASSIFICATIONS,
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
    payload: Omit<ResearcherProfileRecord, 'id' | 'portalId' | 'uid'>,
    targetProfileId?: string
  ) => Promise<void>;
  onDeleteProfile?: (profileId: string) => Promise<void>;
  onSignInPrompt: () => void;
}

/**
 * Converts a Google Drive sharing link (e.g. https://drive.google.com/file/d/FILE_ID/view)
 * into a direct embeddable thumbnail image URL so Google Drive photos render cleanly.
 */
export function resolveGoogleDriveImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w600`;
  }
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1] && trimmed.includes('drive.google.com')) {
    return `https://drive.google.com/thumbnail?id=${idParamMatch[1]}&sz=w600`;
  }
  return trimmed;
}

function getInitials(name: string): string {
  const parts = name
    .replace(/^(Dr\.|Engr\.|Master Teacher II|Master Teacher I)\s+/i, '')
    .trim()
    .split(/\s+/);
  if (parts.length === 0) return 'BN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

export const ResearcherProfilesView: React.FC<ResearcherProfilesViewProps> = ({
  profiles,
  researches,
  currentUserUid,
  currentUserName,
  isAdmin,
  onSelectResearch,
  onSaveProfile,
  onDeleteProfile,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showProfileForm, setShowProfileForm] = useState<boolean>(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const existingMyProfile = profiles.find((p) => p.uid === currentUserUid);

  const [fullName, setFullName] = useState<string>(
    existingMyProfile?.fullName || currentUserName || ''
  );
  const [role, setRole] = useState<ResearcherRoleType>(
    existingMyProfile?.role || 'Teacher Researcher'
  );
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
  // Photo upload fields (Local Drive DataURL + Google Drive URL)
  const [photoUrl, setPhotoUrl] = useState<string>(
    existingMyProfile?.photoUrl || ''
  );
  const [photoDriveUrl, setPhotoDriveUrl] = useState<string>(
    existingMyProfile?.photoDriveUrl || ''
  );
  const [localPhotoFileName, setLocalPhotoFileName] = useState<string>('');
  const [photoLoadErrors, setPhotoLoadErrors] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  const openCreateNewProfile = () => {
    setEditingProfileId(null);
    setFullName(currentUserName || '');
    setRole('Teacher Researcher');
    setDepartmentOrStrand('Science Department');
    setGradeOrPosition('Teacher III');
    setSpecialization('');
    setBio('');
    setInstitutionIdCode(`BNHS-RES-${Math.floor(100 + Math.random() * 900)}`);
    setDriveFolderUrl('');
    setPhotoUrl('');
    setPhotoDriveUrl('');
    setLocalPhotoFileName('');
    setShowProfileForm(true);
    setSaveSuccess('');
    setSaveError('');
  };

  const openEditProfile = (prof: ResearcherProfileRecord) => {
    setEditingProfileId(prof.id);
    setFullName(prof.fullName);
    setRole(prof.role);
    setDepartmentOrStrand(prof.departmentOrStrand);
    setGradeOrPosition(prof.gradeOrPosition);
    setSpecialization(prof.specialization);
    setBio(prof.bio);
    setInstitutionIdCode(prof.institutionIdCode);
    setDriveFolderUrl(prof.driveFolderUrl);
    setPhotoUrl(prof.photoUrl || '');
    setPhotoDriveUrl(prof.photoDriveUrl || '');
    setLocalPhotoFileName(
      prof.photoUrl?.startsWith('data:') ? 'Uploaded Local Photo' : ''
    );
    setShowProfileForm(true);
    setSaveSuccess('');
    setSaveError('');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Handle Local Drive Photo Upload (compresses to <= 450KB Data URL for fast Firestore & offline storage)
  const handleLocalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      if (file.type === 'image/gif' && rawDataUrl.length < 600000) {
        setPhotoUrl(rawDataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressed);
        } else {
          setPhotoUrl(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Google Drive Photo URL input
  const handleDrivePhotoUrlChange = (val: string) => {
    setPhotoDriveUrl(val);
    if (val.trim()) {
      const resolved = resolveGoogleDriveImageUrl(val);
      if (!photoUrl || !photoUrl.startsWith('data:')) {
        setPhotoUrl(resolved);
      }
    } else if (!photoUrl.startsWith('data:')) {
      setPhotoUrl('');
    }
  };

  const effectivePreviewPhoto =
    photoUrl ||
    (photoDriveUrl ? resolveGoogleDriveImageUrl(photoDriveUrl) : '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const finalPhotoUrl =
        photoUrl.trim() ||
        (photoDriveUrl.trim()
          ? resolveGoogleDriveImageUrl(photoDriveUrl.trim())
          : '');
      await onSaveProfile(
        {
          fullName: fullName.trim().slice(0, 160),
          role:
            !isAdmin && role === 'Research Coordinator'
              ? 'Teacher Researcher'
              : role,
          departmentOrStrand: departmentOrStrand.trim().slice(0, 120),
          gradeOrPosition: gradeOrPosition.trim().slice(0, 100),
          specialization: specialization.trim().slice(0, 250),
          bio: bio.trim().slice(0, 1000),
          institutionIdCode: institutionIdCode.trim().slice(0, 60),
          driveFolderUrl: driveFolderUrl.trim().slice(0, 500),
          photoUrl: finalPhotoUrl.slice(0, 750000),
          photoDriveUrl: photoDriveUrl.trim().slice(0, 500),
        },
        editingProfileId || undefined
      );
      setSaveSuccess(
        editingProfileId
          ? 'BNHS Researcher Profile and photo updated in the portal directory.'
          : 'Official BNHS Researcher Profile and photo saved to the portal directory.'
      );
      setShowProfileForm(false);
      setEditingProfileId(null);
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
            Barobo National High School · Faculty &amp; Student Scholar Registry
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900">
            Teacher &amp; Student Researcher Profiles
          </h2>
          <p className="text-sm text-zinc-600 mt-1.5">
            Browse institutional profiles of BNHS Teacher Researchers, Master Teacher Advisers, and Student Proponents across STEM, STE, HUMSS, ABM, and TVL strands. Create or edit a profile to upload a researcher photo from your Local Drive or Google Drive.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {existingMyProfile && (
            <button
              type="button"
              onClick={() => openEditProfile(existingMyProfile)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#6B1420] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit My Researcher Profile</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateNewProfile}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Official BNHS Researcher Profile</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Create / Update Official BNHS Researcher Profile Form with Local Drive & Google Drive Photo Upload */}
      {showProfileForm && (
        <form
          onSubmit={handleSave}
          className="bg-white border-2 border-[#6B1420] p-6 md:p-8 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <h3 className="text-lg font-display font-semibold text-[#6B1420]">
                {editingProfileId
                  ? 'Update Official BNHS Researcher Profile & Photo'
                  : 'Create Official BNHS Researcher Profile'}
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5">
                Upload a profile photo from your Local Drive or link a photo from Google Drive, and connect your research portfolio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowProfileForm(false);
                setEditingProfileId(null);
              }}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Close
            </button>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* ==================== RESEARCHER PHOTO UPLOAD SECTION (LOCAL DRIVE OR GOOGLE DRIVE) ==================== */}
          <div className="p-5 bg-[#FAF9F5] border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-semibold text-[#6B1420] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>
                    Researcher Profile Photo — Upload from Local Drive or Google Drive
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Choose a photo from your computer/device (Local Drive) or paste a shareable Google Drive photo link.
                </p>
              </div>
              {(photoUrl || photoDriveUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl('');
                    setPhotoDriveUrl('');
                    setLocalPhotoFileName('');
                  }}
                  className="text-xs font-medium text-red-700 hover:underline"
                >
                  Clear Photo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Live Avatar Preview */}
              <div className="md:col-span-3 flex flex-col items-center justify-center p-3 bg-white border border-zinc-200">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#6B1420] bg-rose-50 flex items-center justify-center">
                  {effectivePreviewPhoto ? (
                    <img
                      src={effectivePreviewPhoto}
                      alt="Researcher Profile Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-display font-bold text-[#6B1420]">
                      {getInitials(fullName || 'BNHS')}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 mt-2 text-center truncate max-w-full">
                  {localPhotoFileName
                    ? localPhotoFileName
                    : photoDriveUrl
                    ? 'Google Drive Photo Linked'
                    : 'No Photo Uploaded Yet'}
                </span>
              </div>

              {/* Option 1: Local Drive Upload & Option 2: Google Drive Photo Link */}
              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Local Drive Photo Upload */}
                <div className="p-4 bg-white border border-zinc-200 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#6B1420]" />
                      <span>1. Upload Photo from Local Drive</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Select a JPG, PNG, WEBP, or GIF portrait photo stored on your computer or phone.
                    </p>
                  </div>
                  <div className="pt-1">
                    <label className="inline-flex items-center justify-center gap-2 w-full px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Local Drive Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Option 2: Google Drive Photo Link */}
                <div className="p-4 bg-white border border-zinc-200 space-y-2 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-[#6B1420]" />
                      <span>2. Or Link Photo from Google Drive</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Paste a Google Drive image link (set to &ldquo;Anyone with the link can view&rdquo;) or direct photo URL.
                    </p>
                  </div>
                  <input
                    type="url"
                    value={photoDriveUrl}
                    onChange={(e) => handleDrivePhotoUrlChange(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Full Name &amp; Academic Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Maria Clara S. Santos"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Account Classification
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ResearcherRoleType)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              >
                {RESEARCHER_ACCOUNT_CLASSIFICATIONS.map((classification) => (
                  <option key={classification} value={classification}>
                    {classification}
                  </option>
                ))}
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
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Department or SHS Strand <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={departmentOrStrand}
                onChange={(e) => setDepartmentOrStrand(e.target.value)}
                placeholder="e.g., Science Department or SHS STEM"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Grade Level or Faculty Position <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={gradeOrPosition}
                onChange={(e) => setGradeOrPosition(e.target.value)}
                placeholder="e.g., Teacher III or Grade 12 STEM"
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
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
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Scholarly Biography &amp; Research Interests
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your research focus at Barobo National High School..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
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
                className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => {
                setShowProfileForm(false);
                setEditingProfileId(null);
              }}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50"
            >
              {saving
                ? 'Saving Profile...'
                : editingProfileId
                ? 'Update Researcher Profile & Photo'
                : 'Save Researcher Profile'}
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
              { id: 'Teacher Researcher', label: 'Teacher Researcher' },
              { id: 'Master Teacher Researcher', label: 'Master Teacher Researcher' },
              { id: 'Teacher/Adviser', label: 'Teacher/Adviser' },
              { id: 'School Research Grammarian', label: 'School Research Grammarian' },
              { id: 'School Research Statistician', label: 'School Research Statistician' },
              { id: 'Student Researcher', label: 'Student Researcher' },
              { id: 'Research Coordinator', label: 'Research Coordinator' },
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
              r.authors
                .toLowerCase()
                .includes(prof.fullName.toLowerCase().split(' ').slice(-1)[0]) ||
              r.adviser
                .toLowerCase()
                .includes(prof.fullName.toLowerCase().split(' ').slice(-1)[0])
          );

          const displayPhoto =
            prof.photoUrl ||
            (prof.photoDriveUrl
              ? resolveGoogleDriveImageUrl(prof.photoDriveUrl)
              : '');

          return (
            <div
              key={prof.id}
              className="bg-white border border-zinc-200 p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Clean unboxed metadata header + Edit/Photo actions */}
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 flex-wrap">
                  <span>
                    <strong className="text-[#6B1420]">{prof.role}</strong>
                    <span aria-hidden="true"> · </span>
                    <span>{prof.departmentOrStrand}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-600">
                      {prof.institutionIdCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditProfile(prof)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#6B1420] bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit / Photo</span>
                    </button>
                    {onDeleteProfile && (
                      <>
                        {confirmDeleteId === prof.id ? (
                          <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteProfile(prof.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[10px] font-semibold text-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[10px] text-zinc-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(prof.id)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Researcher Avatar + Name & Position */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#6B1420]/30 bg-rose-50 flex items-center justify-center shrink-0">
                    {displayPhoto && !photoLoadErrors[prof.id] ? (
                      <img
                        src={displayPhoto}
                        alt={prof.fullName}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setPhotoLoadErrors((prev) => ({
                            ...prev,
                            [prof.id]: true,
                          }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-display font-bold text-[#6B1420]">
                        {getInitials(prof.fullName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-display font-semibold text-zinc-900 truncate">
                      {prof.fullName}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {prof.gradeOrPosition}
                    </p>
                    {prof.photoDriveUrl && (
                      <a
                        href={prof.photoDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B1420] hover:underline mt-0.5"
                      >
                        <span>View Photo on Google Drive</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
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
