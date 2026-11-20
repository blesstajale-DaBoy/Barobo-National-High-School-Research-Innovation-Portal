import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Image as ImageIcon,
  Upload,
  Link2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ResearcherProfileRecord } from '../data/bnhsTaxonomy';
import { resolveOverviewImageLink as resolveGoogleDriveImageUrl } from './AdminEvaluationView';

const RESEARCHER_ROLE_OPTIONS: ResearcherProfileRecord['role'][] = [
  'Student Researcher',
  'Teacher Researcher',
  'Master Teacher Researcher',
  'Teacher/Adviser',
  'Master Teacher / Adviser',
  'School Research Grammarian',
  'School Research Statistician',
  'Research Coordinator',
];

interface ResearcherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProfile: ResearcherProfileRecord | null;
  defaultUid?: string;
  defaultName?: string;
  onSaveProfile: (
    profile: Omit<ResearcherProfileRecord, 'id' | 'portalId' | 'uid'>,
    existingProfileId?: string
  ) => Promise<void>;
}

export const ResearcherProfileModal: React.FC<ResearcherProfileModalProps> = ({
  isOpen,
  onClose,
  editingProfile,
  defaultUid = 'local_researcher',
  defaultName = '',
  onSaveProfile,
}) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<ResearcherProfileRecord['role']>('Teacher Researcher');
  const [departmentOrStrand, setDepartmentOrStrand] = useState('');
  const [gradeOrPosition, setGradeOrPosition] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [institutionIdCode, setInstitutionIdCode] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoDriveUrl, setPhotoDriveUrl] = useState('');
  const [photoSourceTab, setPhotoSourceTab] = useState<'local' | 'drive'>('local');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingProfile) {
      setFullName(editingProfile.fullName);
      setRole(editingProfile.role);
      setDepartmentOrStrand(editingProfile.departmentOrStrand);
      setGradeOrPosition(editingProfile.gradeOrPosition);
      setSpecialization(editingProfile.specialization || '');
      setBio(editingProfile.bio || '');
      setInstitutionIdCode(editingProfile.institutionIdCode || '');
      setDriveFolderUrl(editingProfile.driveFolderUrl || '');
      setPhotoUrl(editingProfile.photoUrl || '');
      setPhotoDriveUrl(editingProfile.photoDriveUrl || '');
      setPhotoSourceTab(
        editingProfile.photoDriveUrl && !editingProfile.photoUrl ? 'drive' : 'local'
      );
    } else {
      setFullName(defaultName);
      setRole('Teacher Researcher');
      setDepartmentOrStrand('');
      setGradeOrPosition('');
      setSpecialization('');
      setBio('');
      setInstitutionIdCode(`BNHS-RES-${new Date().getFullYear()}`);
      setDriveFolderUrl('');
      setPhotoUrl('');
      setPhotoDriveUrl('');
      setPhotoSourceTab('local');
    }
  }, [isOpen, editingProfile, defaultName]);

  if (!isOpen) return null;

  const handleLocalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    // Preserve animated GIFs directly without canvas flattening
    if (file.type === 'image/gif') {
      if (file.size > 520 * 1024) {
        setErrorMsg('GIF profile photo exceeds 520 KB cloud limit. Please use a smaller GIF or Google Drive link.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(String(reader.result || ''));
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 360;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.82));
          setErrorMsg('');
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const previewPhoto =
    photoSourceTab === 'drive' && photoDriveUrl.trim()
      ? resolveGoogleDriveImageUrl(photoDriveUrl.trim())
      : photoUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || !departmentOrStrand.trim() || !gradeOrPosition.trim()) {
      setErrorMsg('Please complete Full Name, Department/Strand, and Grade/Position.');
      return;
    }

    setSaving(true);
    try {
      const finalPhotoUrl =
        photoSourceTab === 'drive' && photoDriveUrl.trim()
          ? resolveGoogleDriveImageUrl(photoDriveUrl.trim())
          : photoUrl;
      await onSaveProfile(
        {
          fullName: fullName.trim(),
          role,
          departmentOrStrand: departmentOrStrand.trim(),
          gradeOrPosition: gradeOrPosition.trim(),
          specialization: specialization.trim(),
          bio: bio.trim(),
          institutionIdCode: institutionIdCode.trim() || `BNHS-RES-${new Date().getFullYear()}`,
          driveFolderUrl: driveFolderUrl.trim(),
          photoUrl: finalPhotoUrl,
          photoDriveUrl: photoDriveUrl.trim(),
        },
        editingProfile?.id
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to save researcher profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="researcher-profile-modal-title"
    >
      <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-2xl my-auto overflow-hidden">
        <div className="bg-[#6B1420] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserPlus className="w-5 h-5 text-amber-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-amber-300">
                BNHS Faculty &amp; Student Scholar Registry
              </div>
              <h2
                id="researcher-profile-modal-title"
                className="text-base sm:text-lg font-display font-semibold truncate"
              >
                {editingProfile ? 'Edit Researcher Profile' : 'Create Researcher Profile'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-rose-100 hover:text-white transition-colors"
            aria-label="Close researcher profile form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto space-y-5"
        >
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo Section */}
          <div className="p-4 bg-[#FAF9F5] border border-zinc-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#6B1420] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>Researcher Profile Photo (Local Drive or Google Drive)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPhotoSourceTab('local')}
                  className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    photoSourceTab === 'local'
                      ? 'bg-[#6B1420] text-white'
                      : 'bg-white border border-zinc-300 text-zinc-700'
                  }`}
                >
                  Local Upload
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoSourceTab('drive')}
                  className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    photoSourceTab === 'drive'
                      ? 'bg-[#6B1420] text-white'
                      : 'bg-white border border-zinc-300 text-zinc-700'
                  }`}
                >
                  Google Drive Link
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-[#6B1420]/30 bg-white overflow-hidden flex items-center justify-center shrink-0">
                {previewPhoto ? (
                  <img
                    src={previewPhoto}
                    alt="Profile preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-zinc-400" />
                )}
              </div>

              <div className="flex-1 w-full">
                {photoSourceTab === 'local' ? (
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo (JPG / PNG / GIF)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLocalPhotoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <Link2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={photoDriveUrl}
                      onChange={(e) => setPhotoDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Full Name <span className="text-[#6B1420]">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Elena R. Villanueva, MT-II"
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Institutional Role <span className="text-[#6B1420]">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ResearcherProfileRecord['role'])}
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              >
                {RESEARCHER_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Department or SHS Strand <span className="text-[#6B1420]">*</span>
              </label>
              <input
                type="text"
                required
                value={departmentOrStrand}
                onChange={(e) => setDepartmentOrStrand(e.target.value)}
                placeholder="e.g., Science Department / STEM"
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Position or Grade Level <span className="text-[#6B1420]">*</span>
              </label>
              <input
                type="text"
                required
                value={gradeOrPosition}
                onChange={(e) => setGradeOrPosition(e.target.value)}
                placeholder="e.g., Master Teacher II / Grade 12"
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Institutional ID Code
              </label>
              <input
                type="text"
                value={institutionIdCode}
                onChange={(e) => setInstitutionIdCode(e.target.value)}
                placeholder="BNHS-RES-2026"
                className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Research Portfolio Drive URL
              </label>
              <input
                type="url"
                value={driveFolderUrl}
                onChange={(e) => setDriveFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Research Specialization / Focus Areas
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g., Science Education, Coastal Ecology, Quantitative Methods"
              className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Short Institutional Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief academic background and research focus at Barobo National High School..."
              className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-60 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {saving
                  ? 'Saving...'
                  : editingProfile
                  ? 'Save Profile Updates'
                  : 'Create Researcher Profile'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
