import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Search,
  BookOpen,
  FileText,
  Users,
  LayoutDashboard,
  Image as ImageIcon,
  Images,
  Film,
  Link2,
  Upload,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  ResearchDivisionId,
  ResearchRecord,
  PublishedJournalRecord,
  ResearcherProfileRecord,
  OverviewItemRecord,
  ResearchGalleryItemRecord,
  ResearchInformationItemRecord,
} from '../data/bnhsTaxonomy';
import { getDivisionLabel } from '../utils/reportExporter';
import { resolveOverviewImageLink as resolveGoogleDriveImageUrl } from './AdminEvaluationView';
import { DEFAULT_PORTAL_LOGO_URL } from '../utils/portalAuth';

export type UnifiedCrudMode = 'create' | 'edit' | 'delete';

interface UnifiedCrudHubModalProps {
  isOpen: boolean;
  mode: UnifiedCrudMode;
  onModeChange: (mode: UnifiedCrudMode) => void;
  onClose: () => void;
  portalLogoUrl: string;
  onSavePortalLogo: (logoUrl: string, fileName: string, mimeType: string) => Promise<void>;
  onResetPortalLogo: () => Promise<void>;
  researches: ResearchRecord[];
  journals: PublishedJournalRecord[];
  profiles: ResearcherProfileRecord[];
  overviewItems: OverviewItemRecord[];
  galleryItems: ResearchGalleryItemRecord[];
  informationItems: ResearchInformationItemRecord[];
  // Launchers for dedicated modals
  onLaunchCreateResearch: (division: ResearchDivisionId) => void;
  onLaunchEditResearch: (record: ResearchRecord) => void;
  onLaunchEvaluateResearch: (record: ResearchRecord) => void;
  onDeleteResearch: (record: ResearchRecord) => Promise<void>;
  onLaunchCreateJournalLink: () => void;
  onLaunchCreateJournalUpload: () => void;
  onLaunchEditJournal: (journal: PublishedJournalRecord) => void;
  onDeleteJournal: (id: string) => Promise<void>;
  onLaunchCreateProfile: () => void;
  onLaunchEditProfile: (profile: ResearcherProfileRecord) => void;
  onDeleteProfile: (id: string) => Promise<void>;
  // Overview, Gallery, Information handlers
  onSaveOverviewItem: (
    item: Omit<OverviewItemRecord, 'portalId' | 'updatedByUid' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void>;
  onDeleteOverviewItem: (id: string) => Promise<void>;
  onSaveGalleryItem: (
    item: Omit<ResearchGalleryItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void>;
  onBulkSaveGalleryItems: (
    items: Omit<ResearchGalleryItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>[]
  ) => Promise<void>;
  onDeleteGalleryItem: (id: string) => Promise<void>;
  onDeleteAllGalleryItems: () => Promise<void>;
  onSaveInformationItem: (
    item: Omit<ResearchInformationItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void>;
  onDeleteInformationItem: (id: string) => Promise<void>;
}

/**
 * Resize any standard photo to exact 1000x500 canvas for Research Gallery
 */
async function resizeImageTo1000x500(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Invalid image format: ${file.name}`));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        // Center-crop cover into 1000x500
        const targetRatio = 1000 / 500;
        const srcRatio = img.width / img.height;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (srcRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1000, 500);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export const UnifiedCrudHubModal: React.FC<UnifiedCrudHubModalProps> = ({
  isOpen,
  mode,
  onModeChange,
  onClose,
  portalLogoUrl,
  onSavePortalLogo,
  onResetPortalLogo,
  researches,
  journals,
  profiles,
  overviewItems,
  galleryItems,
  informationItems,
  onLaunchCreateResearch,
  onLaunchEditResearch,
  onLaunchEvaluateResearch,
  onDeleteResearch,
  onLaunchCreateJournalLink,
  onLaunchCreateJournalUpload,
  onLaunchEditJournal,
  onDeleteJournal,
  onLaunchCreateProfile,
  onLaunchEditProfile,
  onDeleteProfile,
  onSaveOverviewItem,
  onDeleteOverviewItem,
  onSaveGalleryItem,
  onBulkSaveGalleryItems,
  onDeleteGalleryItem,
  onDeleteAllGalleryItems,
  onSaveInformationItem,
  onDeleteInformationItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEditTab, setActiveEditTab] = useState<
    'logo' | 'researches' | 'journals' | 'profiles' | 'overview' | 'gallery' | 'info'
  >('logo');
  const [activeDeleteTab, setActiveDeleteTab] = useState<
    'researches' | 'journals' | 'profiles' | 'overview' | 'gallery' | 'info'
  >('researches');
  const [activeCreateSubForm, setActiveCreateSubForm] = useState<
    'none' | 'overview' | 'gallery_single' | 'gallery_drive' | 'info'
  >('none');

  // Feedback & Confirm states
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [confirmDeleteAllGallery, setConfirmDeleteAllGallery] = useState(false);

  // Portal Logo GIF Editor State
  const [draftLogoUrl, setDraftLogoUrl] = useState<string>(portalLogoUrl);
  const [draftLogoLinkInput, setDraftLogoLinkInput] = useState<string>('');
  const [draftLogoFileName, setDraftLogoFileName] = useState<string>('BNHS_LOGO_animated.gif');
  const [draftLogoMime, setDraftLogoMime] = useState<string>('image/gif');
  const [savingLogo, setSavingLogo] = useState<boolean>(false);

  // Bulk gallery upload state
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  // Inline Overview Card Editor / Creator
  const [editingOverview, setEditingOverview] = useState<OverviewItemRecord | null>(null);
  const [ovType, setOvType] = useState<'hero' | 'card'>('card');
  const [ovCode, setOvCode] = useState('');
  const [ovTitle, setOvTitle] = useState('');
  const [ovSubtitle, setOvSubtitle] = useState('');
  const [ovDesc, setOvDesc] = useState('');
  const [ovImageUrl, setOvImageUrl] = useState('');
  const [ovLink, setOvLink] = useState<'none' | 'basic' | 'action' | 'tuklas'>('none');

  // Inline Gallery Editor / Creator
  const [editingGallery, setEditingGallery] = useState<ResearchGalleryItemRecord | null>(null);
  const [galTitle, setGalTitle] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galImageUrl, setGalImageUrl] = useState('');
  const [galDriveUrl, setGalDriveUrl] = useState('');

  // Inline Research Info Video Editor / Creator
  const [editingInfo, setEditingInfo] = useState<ResearchInformationItemRecord | null>(null);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoCategory, setInfoCategory] = useState('Institutional Briefing');
  const [infoDesc, setInfoDesc] = useState('');
  const [infoVideoUrl, setInfoVideoUrl] = useState('');
  const [infoVideoSource, setInfoVideoSource] = useState<'youtube' | 'drive' | 'direct' | 'upload'>('youtube');
  const [infoLinkUrl, setInfoLinkUrl] = useState('');

  React.useEffect(() => {
    setDraftLogoUrl(portalLogoUrl);
  }, [portalLogoUrl]);

  const filteredResearches = useMemo(() => {
    if (!searchQuery.trim()) return researches;
    const q = searchQuery.toLowerCase();
    return researches.filter((r) =>
      `${r.title} ${r.authors} ${r.division} ${r.category} ${r.status}`.toLowerCase().includes(q)
    );
  }, [researches, searchQuery]);

  const filteredJournals = useMemo(() => {
    if (!searchQuery.trim()) return journals;
    const q = searchQuery.toLowerCase();
    return journals.filter((j) =>
      `${j.title} ${j.authors} ${j.journalVolume} ${j.issnOrRefCode}`.toLowerCase().includes(q)
    );
  }, [journals, searchQuery]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter((p) =>
      `${p.fullName} ${p.role} ${p.departmentOrStrand}`.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  if (!isOpen) return null;

  // --- Portal Logo (GIF) Upload Handler (NEVER flattens animated GIF via canvas) ---
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setFeedback('');

    const isGif =
      file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (!file.type.startsWith('image/') && !isGif) {
      setErrorMsg('Please select an image file (.gif, .png, .jpg, .webp, or .svg).');
      return;
    }

    if (isGif) {
      if (file.size > 540 * 1024) {
        setErrorMsg(
          `Animated GIF is ${(file.size / 1024).toFixed(0)} KB (cloud limit: 540 KB). Compress the GIF slightly or paste a direct GIF / Google Drive link below.`
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result || '');
        setDraftLogoUrl(dataUrl);
        setDraftLogoFileName(file.name);
        setDraftLogoMime('image/gif');
        setSavingLogo(true);
        try {
          await onSavePortalLogo(dataUrl, file.name, 'image/gif');
          setFeedback(`Animated GIF "${file.name}" auto-saved & synced with full motion preserved!`);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to auto-save animated GIF logo.');
        } finally {
          setSavingLogo(false);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Standard static image (PNG/JPG/WEBP/SVG)
    if (file.size <= 400 * 1024) {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result || '');
        const mime = file.type || 'image/png';
        setDraftLogoUrl(dataUrl);
        setDraftLogoFileName(file.name);
        setDraftLogoMime(mime);
        setSavingLogo(true);
        try {
          await onSavePortalLogo(dataUrl, file.name, mime);
          setFeedback(`Logo image "${file.name}" auto-saved & synced across the portal!`);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to auto-save logo image.');
        } finally {
          setSavingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(360, Math.max(img.width, img.height));
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/png');
            setDraftLogoUrl(dataUrl);
            setDraftLogoFileName(file.name);
            setDraftLogoMime('image/png');
            setSavingLogo(true);
            try {
              await onSavePortalLogo(dataUrl, file.name, 'image/png');
              setFeedback(`Logo image "${file.name}" optimized, auto-saved & synced across the portal!`);
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'Unable to auto-save optimized logo.');
            } finally {
              setSavingLogo(false);
            }
          }
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyLogoLink = async () => {
    const raw = draftLogoLinkInput.trim();
    if (!raw) return;
    const resolved = resolveGoogleDriveImageUrl(raw);
    const fname = raw.toLowerCase().includes('.gif') ? 'external_logo.gif' : 'external_logo_url';
    const mime = raw.toLowerCase().includes('.gif') ? 'image/gif' : 'image/url';
    setDraftLogoUrl(resolved);
    setDraftLogoFileName(fname);
    setDraftLogoMime(mime);
    setErrorMsg('');
    setSavingLogo(true);
    try {
      await onSavePortalLogo(resolved, fname, mime);
      setFeedback('External / Google Drive logo URL auto-saved & applied everywhere!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to auto-save external logo URL.');
    } finally {
      setSavingLogo(false);
    }
  };

  const handleCommitPortalLogo = async () => {
    setSavingLogo(true);
    setErrorMsg('');
    try {
      await onSavePortalLogo(draftLogoUrl, draftLogoFileName, draftLogoMime);
      setFeedback('BNHS Research Portal Logo updated across Header, Overview Hero, Research Journal, Login & Footer!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save portal logo.');
    } finally {
      setSavingLogo(false);
    }
  };

  // --- Bulk Gallery Upload (1000x500 with progress bar) ---
  const handleBulkGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBulkUploading(true);
    setBulkProgress({ current: 0, total: files.length });
    setErrorMsg('');
    setFeedback('');

    try {
      const prepared: Omit<ResearchGalleryItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const dataUrl = await resizeImageTo1000x500(f);
        prepared.push({
          id: `gal_${Date.now()}_${i}`,
          title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          caption: 'Uploaded to BNHS Research Gallery (1000 × 500)',
          imageUrl: dataUrl,
          displayOrder: galleryItems.length + i + 1,
        });
        setBulkProgress({ current: i + 1, total: files.length });
      }
      await onBulkSaveGalleryItems(prepared);
      setFeedback(`Successfully uploaded ${prepared.length} images to the Research Gallery (1000 × 500).`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bulk gallery upload failed.');
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  // --- Single Gallery Save ---
  const handleSaveSingleGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImg =
      activeCreateSubForm === 'gallery_drive'
        ? resolveGoogleDriveImageUrl(galDriveUrl.trim())
        : galImageUrl;
    if (!galTitle.trim() || !finalImg) {
      setErrorMsg('Please provide a slide title and an image.');
      return;
    }
    await onSaveGalleryItem({
      id: editingGallery?.id || `gal_${Date.now()}`,
      title: galTitle.trim(),
      caption: galCaption.trim() || 'BNHS Research Gallery Slide (1000 × 500)',
      imageUrl: finalImg,
      displayOrder: editingGallery?.displayOrder ?? galleryItems.length + 1,
    });
    setFeedback(
      editingGallery
        ? `Updated Research Gallery slide "${galTitle.trim()}".`
        : `Added "${galTitle.trim()}" to Research Gallery (1000 × 500).`
    );
    setEditingGallery(null);
    setActiveCreateSubForm('none');
    setGalTitle('');
    setGalCaption('');
    setGalImageUrl('');
    setGalDriveUrl('');
  };

  // --- Overview Item Save ---
  const handleSaveOverviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ovTitle.trim() || !ovDesc.trim()) {
      setErrorMsg('Please enter Title and Description for the Overview item.');
      return;
    }
    await onSaveOverviewItem({
      id: editingOverview?.id || `ov_${Date.now()}`,
      itemType: editingOverview?.itemType || ovType,
      code: ovCode.trim() || 'HIGHLIGHT · BNHS',
      title: ovTitle.trim(),
      subtitle: ovSubtitle.trim() || 'Barobo National High School',
      description: ovDesc.trim(),
      imageUrl: ovImageUrl.trim(),
      divisionLink: ovLink,
      displayOrder: editingOverview?.displayOrder ?? overviewItems.length + 1,
      isDeleted: false,
    });
    setFeedback(
      editingOverview
        ? `Updated Overview item "${ovTitle.trim()}".`
        : `Created new Overview highlight card "${ovTitle.trim()}".`
    );
    setEditingOverview(null);
    setActiveCreateSubForm('none');
  };

  // --- Research Info Video Save ---
  const handleSaveInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoTitle.trim() || !infoVideoUrl.trim()) {
      setErrorMsg('Please provide a Video Title and YouTube/Google Drive Video URL.');
      return;
    }
    await onSaveInformationItem({
      id: editingInfo?.id || `info_${Date.now()}`,
      title: infoTitle.trim(),
      category: infoCategory.trim() || 'Institutional Briefing',
      description: infoDesc.trim(),
      videoUrl: infoVideoUrl.trim(),
      videoSourceType: infoVideoSource,
      imageUrl: editingInfo?.imageUrl || '',
      linkUrl: infoLinkUrl.trim(),
      displayOrder: editingInfo?.displayOrder ?? informationItems.length + 1,
    });
    setFeedback(
      editingInfo
        ? `Updated Research Information video "${infoTitle.trim()}".`
        : `Added Research Information video "${infoTitle.trim()}".`
    );
    setEditingInfo(null);
    setActiveCreateSubForm('none');
  };

  const openOverviewEditor = (item: OverviewItemRecord) => {
    setEditingOverview(item);
    setOvType(item.itemType);
    setOvCode(item.code);
    setOvTitle(item.title);
    setOvSubtitle(item.subtitle);
    setOvDesc(item.description);
    setOvImageUrl(item.imageUrl || '');
    setOvLink(item.divisionLink);
    setErrorMsg('');
    setFeedback('');
  };

  const openGalleryEditor = (item: ResearchGalleryItemRecord) => {
    setEditingGallery(item);
    setGalTitle(item.title);
    setGalCaption(item.caption);
    setGalImageUrl(item.imageUrl);
    setGalDriveUrl('');
    setErrorMsg('');
    setFeedback('');
  };

  const openInfoEditor = (item: ResearchInformationItemRecord) => {
    setEditingInfo(item);
    setInfoTitle(item.title);
    setInfoCategory(item.category);
    setInfoDesc(item.description);
    setInfoVideoUrl(item.videoUrl);
    setInfoVideoSource(item.videoSourceType || 'youtube');
    setInfoLinkUrl(item.linkUrl || '');
    setErrorMsg('');
    setFeedback('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unified-crud-hub-title"
    >
      <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-5xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="bg-[#6B1420] text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={portalLogoUrl || DEFAULT_PORTAL_LOGO_URL}
              alt="BNHS Official Seal"
              className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shrink-0 border border-amber-300/60"
            />
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-mono text-amber-300 uppercase tracking-wider truncate">
                BNHS Research Portal · Centralized System Control Hub
              </div>
              <h2
                id="unified-crud-hub-title"
                className="text-base sm:text-xl font-display font-semibold text-white truncate"
              >
                {mode === 'create' && 'Unified Add / Create Menu'}
                {mode === 'edit' && 'Unified Edit Menu (All System Records & GIF Logo)'}
                {mode === 'delete' && 'Unified Delete Menu (All System Records)'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-rose-100 hover:text-white transition-colors shrink-0"
            aria-label="Close control hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Bar (Add/Create | Edit | Delete) */}
        <div className="bg-[#520E17] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-rose-950">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onModeChange('create');
                setFeedback('');
                setErrorMsg('');
                setActiveCreateSubForm('none');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-colors ${
                mode === 'create'
                  ? 'bg-amber-400 text-zinc-950'
                  : 'bg-white/10 text-rose-100 hover:bg-white/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add / Create</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onModeChange('edit');
                setFeedback('');
                setErrorMsg('');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-colors ${
                mode === 'edit'
                  ? 'bg-amber-400 text-zinc-950'
                  : 'bg-white/10 text-rose-100 hover:bg-white/20'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onModeChange('delete');
                setFeedback('');
                setErrorMsg('');
                setConfirmDeleteKey(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-colors ${
                mode === 'delete'
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-rose-100 hover:bg-white/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          {mode !== 'create' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-rose-200 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter records..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/10 border border-white/20 text-white placeholder:text-rose-200/80 focus:outline-none focus:bg-white/20"
              />
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF9F5] space-y-5">
          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ==================== MODE 1: UNIFIED ADD / CREATE ==================== */}
          {mode === 'create' && (
            <div className="space-y-6">
              {/* Group A: Research Repository Submissions */}
              <div className="bg-white border border-zinc-200 p-4 sm:p-5 space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B1420] flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>1. Research Repository Entries</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchCreateResearch('basic');
                    }}
                    className="text-left p-4 bg-[#FAF9F5] border border-zinc-200 hover:border-[#6B1420] transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-[#6B1420]">+ Basic Research</div>
                    <p className="text-[11px] text-zinc-600">
                      Submit foundational policy, curriculum, or baseline study.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchCreateResearch('action');
                    }}
                    className="text-left p-4 bg-[#FAF9F5] border border-zinc-200 hover:border-[#6B1420] transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-[#6B1420]">+ Action Research</div>
                    <p className="text-[11px] text-zinc-600">
                      Submit classroom or school intervention across 7 BERA themes.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchCreateResearch('tuklas');
                    }}
                    className="text-left p-4 bg-[#FAF9F5] border border-zinc-200 hover:border-[#6B1420] transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-[#6B1420]">+ TUKLAS Fair Project</div>
                    <p className="text-[11px] text-zinc-600">
                      Register student Life Science, Physical Science, RIM, MCS, or Innovation Expo entry.
                    </p>
                  </button>
                </div>
              </div>

              {/* Group B: Research Journal & Scholar Profiles */}
              <div className="bg-white border border-zinc-200 p-4 sm:p-5 space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B1420] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>2. Research Journal &amp; Researcher Profiles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchCreateJournalLink();
                    }}
                    className="text-left p-4 bg-amber-50/70 border border-amber-300 hover:border-[#6B1420] transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-[#6B1420]" />
                      <span>Published Research (Link &amp; Abstract)</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Add already-published research via link only with full abstract &amp; citation.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchCreateJournalUpload();
                    }}
                    className="text-left p-4 bg-[#FAF9F5] border border-zinc-200 hover:border-[#6B1420] transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#6B1420]" />
                      <span>Upload Full Manuscript (PDF / Drive)</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Publish a full manuscript PDF or Google Drive document into Research Journal.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchCreateProfile();
                    }}
                    className="text-left p-4 bg-[#FAF9F5] border border-zinc-200 hover:border-[#6B1420] transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#6B1420]" />
                      <span>New Researcher Profile</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Register a Teacher, Master Teacher, Adviser, or Student Researcher with photo.
                    </p>
                  </button>
                </div>
              </div>

              {/* Group C: Overview Cards, Research Gallery (Single / Bulk 1000x500 / Drive), Research Information Video */}
              <div className="bg-white border border-zinc-200 p-4 sm:p-5 space-y-4">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B1420] flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>3. Overview Manager, Research Gallery (1000×500) &amp; Research Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOverview(null);
                      setOvType('card');
                      setOvCode(`DIVISION · ${overviewItems.length + 1}`);
                      setOvTitle('');
                      setOvSubtitle('');
                      setOvDesc('');
                      setOvImageUrl('');
                      setOvLink('none');
                      setActiveCreateSubForm('overview');
                    }}
                    className="px-3.5 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] text-left flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Add Overview Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingGallery(null);
                      setGalTitle('');
                      setGalCaption('');
                      setGalImageUrl('');
                      setGalDriveUrl('');
                      setActiveCreateSubForm('gallery_single');
                    }}
                    className="px-3.5 py-2.5 text-xs font-semibold text-white bg-[#520E17] hover:bg-[#3d0a11] text-left flex items-center gap-2"
                  >
                    <ImageIcon className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                    <span>Add Gallery Picture (1000×500)</span>
                  </button>

                  <label className="px-3.5 py-2.5 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 cursor-pointer flex items-center gap-2">
                    <Images className="w-3.5 h-3.5 shrink-0" />
                    <span>Bulk Upload Gallery (1000×500)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBulkGalleryFiles}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingInfo(null);
                      setInfoTitle('');
                      setInfoCategory('Institutional Briefing');
                      setInfoDesc('');
                      setInfoVideoUrl('');
                      setInfoVideoSource('youtube');
                      setInfoLinkUrl('');
                      setActiveCreateSubForm('info');
                    }}
                    className="px-3.5 py-2.5 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-left flex items-center gap-2"
                  >
                    <Film className="w-3.5 h-3.5 shrink-0 text-[#6B1420]" />
                    <span>Add Info Video (YouTube/Drive)</span>
                  </button>
                </div>

                {/* Bulk Upload Progress Bar */}
                {bulkUploading && (
                  <div className="p-3 bg-amber-50 border border-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-950">
                      <span>Processing &amp; resizing to 1000 × 500...</span>
                      <span className="font-mono">
                        {bulkProgress.current} / {bulkProgress.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-amber-200 overflow-hidden">
                      <div
                        className="h-full bg-[#6B1420] transition-all duration-200"
                        style={{
                          width: `${
                            bulkProgress.total > 0
                              ? Math.round((bulkProgress.current / bulkProgress.total) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Inline Sub-Form: Create Overview Card */}
                {activeCreateSubForm === 'overview' && (
                  <form
                    onSubmit={handleSaveOverviewSubmit}
                    className="p-4 bg-[#FAF9F5] border-2 border-[#6B1420] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#6B1420]">
                        Create Overview Highlight Card
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveCreateSubForm('none')}
                        className="text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={ovTitle}
                        onChange={(e) => setOvTitle(e.target.value)}
                        placeholder="Card Title *"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <input
                        type="text"
                        value={ovSubtitle}
                        onChange={(e) => setOvSubtitle(e.target.value)}
                        placeholder="Subtitle / Kicker"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <input
                        type="text"
                        value={ovCode}
                        onChange={(e) => setOvCode(e.target.value)}
                        placeholder="Badge Code (e.g., DIVISION 04)"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <select
                        value={ovLink}
                        onChange={(e) =>
                          setOvLink(e.target.value as 'none' | 'basic' | 'action' | 'tuklas')
                        }
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      >
                        <option value="none">No Division Link</option>
                        <option value="basic">Link to Basic Research</option>
                        <option value="action">Link to Action Research</option>
                        <option value="tuklas">Link to TUKLAS Fair</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={ovDesc}
                      onChange={(e) => setOvDesc(e.target.value)}
                      placeholder="Card Description *"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                    <input
                      type="url"
                      value={ovImageUrl}
                      onChange={(e) => setOvImageUrl(e.target.value)}
                      placeholder="Optional Image URL or Google Drive Photo Link"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                      >
                        Save Overview Card
                      </button>
                    </div>
                  </form>
                )}

                {/* Inline Sub-Form: Create Single Gallery Slide */}
                {(activeCreateSubForm === 'gallery_single' ||
                  activeCreateSubForm === 'gallery_drive') && (
                  <form
                    onSubmit={handleSaveSingleGallery}
                    className="p-4 bg-[#FAF9F5] border-2 border-[#6B1420] space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-[#6B1420]">
                        Add Research Gallery Slide (1000 × 500)
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveCreateSubForm('gallery_single')}
                          className={`px-2.5 py-1 text-[11px] font-semibold ${
                            activeCreateSubForm === 'gallery_single'
                              ? 'bg-[#6B1420] text-white'
                              : 'bg-white border border-zinc-300 text-zinc-700'
                          }`}
                        >
                          Upload Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCreateSubForm('gallery_drive')}
                          className={`px-2.5 py-1 text-[11px] font-semibold ${
                            activeCreateSubForm === 'gallery_drive'
                              ? 'bg-[#6B1420] text-white'
                              : 'bg-white border border-zinc-300 text-zinc-700'
                          }`}
                        >
                          Google Drive / URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCreateSubForm('none')}
                          className="text-xs text-zinc-500 hover:text-zinc-900 ml-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={galTitle}
                        onChange={(e) => setGalTitle(e.target.value)}
                        placeholder="Picture Title *"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <input
                        type="text"
                        value={galCaption}
                        onChange={(e) => setGalCaption(e.target.value)}
                        placeholder="Short Caption"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                    </div>
                    {activeCreateSubForm === 'gallery_single' ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Image (Auto-fits 1000×500)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = await resizeImageTo1000x500(file);
                              setGalImageUrl(url);
                              if (!galTitle) {
                                setGalTitle(file.name.replace(/\.[^.]+$/, ''));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {galImageUrl && (
                          <img
                            src={galImageUrl}
                            alt="Gallery preview"
                            className="h-14 w-28 object-cover border border-zinc-300"
                          />
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        required
                        value={galDriveUrl}
                        onChange={(e) => setGalDriveUrl(e.target.value)}
                        placeholder="Paste Google Drive photo link or direct image URL *"
                        className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                      >
                        Add Gallery Slide
                      </button>
                    </div>
                  </form>
                )}

                {/* Inline Sub-Form: Create Research Information Video */}
                {activeCreateSubForm === 'info' && (
                  <form
                    onSubmit={handleSaveInfoSubmit}
                    className="p-4 bg-[#FAF9F5] border-2 border-[#6B1420] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#6B1420]">
                        Add Research Information Video (1000 × 500)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveCreateSubForm('none')}
                        className="text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={infoTitle}
                        onChange={(e) => setInfoTitle(e.target.value)}
                        placeholder="Video Title *"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <input
                        type="text"
                        value={infoCategory}
                        onChange={(e) => setInfoCategory(e.target.value)}
                        placeholder="Category (e.g., BERA Orientation)"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <select
                        value={infoVideoSource}
                        onChange={(e) =>
                          setInfoVideoSource(e.target.value as 'youtube' | 'drive' | 'direct' | 'upload')
                        }
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      >
                        <option value="youtube">YouTube Video Link</option>
                        <option value="drive">Google Drive Video Link</option>
                        <option value="direct">Direct Video URL</option>
                      </select>
                      <input
                        type="url"
                        required
                        value={infoVideoUrl}
                        onChange={(e) => setInfoVideoUrl(e.target.value)}
                        placeholder="YouTube or Google Drive Video URL *"
                        className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={infoDesc}
                      onChange={(e) => setInfoDesc(e.target.value)}
                      placeholder="Brief description of the video..."
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                      >
                        Save Information Video
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ==================== MODE 2: UNIFIED EDIT ==================== */}
          {mode === 'edit' && (
            <div className="space-y-5">
              {/* Edit Category Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 pb-3">
                {(
                  [
                    { id: 'logo', label: 'Portal Logo (GIF)' },
                    { id: 'researches', label: `Research Entries (${researches.length})` },
                    { id: 'journals', label: `Research Journal (${journals.length})` },
                    { id: 'profiles', label: `Researcher Profiles (${profiles.length})` },
                    { id: 'overview', label: `Overview Cards (${overviewItems.length})` },
                    { id: 'gallery', label: `Gallery 1000×500 (${galleryItems.length})` },
                    { id: 'info', label: `Info Videos (${informationItems.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveEditTab(tab.id);
                      setEditingOverview(null);
                      setEditingGallery(null);
                      setEditingInfo(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeEditTab === tab.id
                        ? 'bg-[#6B1420] text-white'
                        : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* EDIT TAB 1: PORTAL LOGO (GIF FORMAT SUPPORTED) */}
              {activeEditTab === 'logo' && (
                <div className="bg-white border border-zinc-200 p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                    <div>
                      <div className="text-xs font-semibold text-[#6B1420] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Administrator Dashboard · Overview Manager &amp; Evaluation Branding</span>
                      </div>
                      <h3 className="text-lg font-display font-semibold text-zinc-900 mt-0.5">
                        Edit BNHS Research Portal Logo (Animated GIF Supported)
                      </h3>
                      <p className="text-xs text-zinc-600 mt-1">
                        Upload an animated <strong>.GIF</strong> seal (full frame animation preserved) or PNG/JPG/WEBP/SVG, or paste a direct GIF / Google Drive image URL. Updates reflect live in the Header, Overview Hero, Research Journal, Login Modal, and Footer.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Live Animated Preview Card */}
                    <div className="md:col-span-5 bg-[#FAF9F5] border border-zinc-200 p-5 flex flex-col items-center text-center space-y-3">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                        Live Animated Logo Preview
                      </div>
                      <div className="w-32 h-32 rounded-full bg-white border-4 border-[#6B1420]/25 shadow-sm flex items-center justify-center p-2 overflow-hidden">
                        <img
                          src={draftLogoUrl || DEFAULT_PORTAL_LOGO_URL}
                          alt="Live BNHS Research Portal Logo Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                      <div className="text-xs font-mono text-zinc-600 break-all">
                        {draftLogoFileName} ({draftLogoMime})
                      </div>

                      {/* Mini Header Bar Preview */}
                      <div className="w-full bg-[#6B1420] text-white px-3 py-2 flex items-center gap-2 text-left">
                        <img
                          src={draftLogoUrl || DEFAULT_PORTAL_LOGO_URL}
                          alt="Header preview"
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-contain bg-white p-0.5 shrink-0"
                        />
                        <span className="text-xs font-display font-bold truncate">
                          BNHS Research Portal
                        </span>
                      </div>
                    </div>

                    {/* Upload & URL Controls */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="p-4 bg-[#FAF9F5] border border-zinc-200 space-y-2.5">
                        <div className="text-xs font-semibold text-zinc-900">
                          Option A: Upload Animated GIF or Image File from Device
                        </div>
                        <p className="text-[11px] text-zinc-600">
                          Supports animated <strong>.gif</strong> (up to 540 KB for direct cloud sync), <strong>.png</strong>, <strong>.jpg</strong>, <strong>.webp</strong>, and <strong>.svg</strong>.
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-amber-300" />
                          <span>Choose GIF / Logo File</span>
                          <input
                            type="file"
                            accept="image/gif,image/png,image/jpeg,image/webp,image/svg+xml,.gif"
                            onChange={handleLogoFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="p-4 bg-[#FAF9F5] border border-zinc-200 space-y-2.5">
                        <div className="text-xs font-semibold text-zinc-900">
                          Option B: Paste Direct Animated GIF URL or Google Drive Image Link
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="url"
                            value={draftLogoLinkInput}
                            onChange={(e) => setDraftLogoLinkInput(e.target.value)}
                            placeholder="https://example.com/bnhs-seal.gif or Google Drive share link"
                            className="flex-1 px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyLogoLink}
                            className="px-3.5 py-2 text-xs font-semibold text-zinc-900 bg-amber-300 hover:bg-amber-200 whitespace-nowrap"
                          >
                            Preview Link
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onResetPortalLogo();
                            setDraftLogoUrl(DEFAULT_PORTAL_LOGO_URL);
                            setDraftLogoFileName('BNHS_LOGO_animated.gif');
                            setDraftLogoMime('image/gif');
                            setFeedback('Restored official default BNHS animated GIF logo.');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset to Default GIF</span>
                        </button>

                        <button
                          type="button"
                          disabled={savingLogo}
                          onClick={handleCommitPortalLogo}
                          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-60 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 text-amber-300" />
                          <span>{savingLogo ? 'Saving Logo...' : 'Save Portal Logo'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT TAB 2: RESEARCH ENTRIES */}
              {activeEditTab === 'researches' && (
                <div className="space-y-2.5">
                  {filteredResearches.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-[#6B1420] font-semibold">
                          {getDivisionLabel(rec.division)} · {rec.schoolYear} · {rec.status}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                          {rec.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{rec.authors}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onLaunchEvaluateResearch(rec);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Evaluate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onLaunchEditResearch(rec);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EDIT TAB 3: PUBLISHED JOURNAL */}
              {activeEditTab === 'journals' && (
                <div className="space-y-2.5">
                  {filteredJournals.map((j) => (
                    <div
                      key={j.id}
                      className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-[#6B1420] font-semibold">
                          {j.journalVolume} · {j.issnOrRefCode}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                          {j.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{j.authors}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLaunchEditJournal(j);
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] shrink-0 self-start sm:self-center"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Journal Entry</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* EDIT TAB 4: RESEARCHER PROFILES */}
              {activeEditTab === 'profiles' && (
                <div className="space-y-2.5">
                  {filteredProfiles.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-[#6B1420]">
                          {p.role} · {p.departmentOrStrand}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                          {p.fullName}
                        </div>
                        <div className="text-[11px] text-zinc-500">{p.gradeOrPosition}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLaunchEditProfile(p);
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] shrink-0 self-start sm:self-center"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* EDIT TAB 5: OVERVIEW ITEMS */}
              {activeEditTab === 'overview' && (
                <div className="space-y-4">
                  {editingOverview && (
                    <form
                      onSubmit={handleSaveOverviewSubmit}
                      className="bg-white border-2 border-[#6B1420] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#6B1420]">
                          Editing Overview Item: {editingOverview.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingOverview(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-900"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={ovTitle}
                          onChange={(e) => setOvTitle(e.target.value)}
                          placeholder="Title"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                        <input
                          type="text"
                          value={ovSubtitle}
                          onChange={(e) => setOvSubtitle(e.target.value)}
                          placeholder="Subtitle"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                        <input
                          type="text"
                          value={ovCode}
                          onChange={(e) => setOvCode(e.target.value)}
                          placeholder="Code"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                        <input
                          type="url"
                          value={ovImageUrl}
                          onChange={(e) => setOvImageUrl(e.target.value)}
                          placeholder="Image URL or Google Drive link"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={ovDesc}
                        onChange={(e) => setOvDesc(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                        >
                          Save Overview Changes
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {overviewItems.map((ov) => (
                      <div
                        key={ov.id}
                        className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-[#6B1420] uppercase">
                            {ov.itemType === 'hero' ? 'HERO BANNER' : ov.code}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                            {ov.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1">
                            {ov.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openOverviewEditor(ov)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] shrink-0 self-start sm:self-center"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Item</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EDIT TAB 6: GALLERY SLIDES */}
              {activeEditTab === 'gallery' && (
                <div className="space-y-4">
                  {editingGallery && (
                    <form
                      onSubmit={handleSaveSingleGallery}
                      className="bg-white border-2 border-[#6B1420] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#6B1420]">
                          Editing Gallery Slide (1000 × 500)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingGallery(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-900"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={galTitle}
                          onChange={(e) => setGalTitle(e.target.value)}
                          placeholder="Title"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                        <input
                          type="text"
                          value={galCaption}
                          onChange={(e) => setGalCaption(e.target.value)}
                          placeholder="Caption"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace Photo (1000×500)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const url = await resizeImageTo1000x500(f);
                              setGalImageUrl(url);
                            }}
                            className="hidden"
                          />
                        </label>
                        {galImageUrl && (
                          <img
                            src={galImageUrl}
                            alt="Slide preview"
                            className="h-14 w-28 object-cover border border-zinc-300"
                          />
                        )}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                        >
                          Save Gallery Slide
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {galleryItems.map((g) => (
                      <div
                        key={g.id}
                        className="bg-white border border-zinc-200 p-3 flex items-center gap-3"
                      >
                        <img
                          src={resolveGoogleDriveImageUrl(g.imageUrl)}
                          alt={g.title}
                          referrerPolicy="no-referrer"
                          className="w-24 h-12 object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-zinc-900 truncate">
                            {g.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">{g.caption}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openGalleryEditor(g)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EDIT TAB 7: RESEARCH INFO VIDEOS */}
              {activeEditTab === 'info' && (
                <div className="space-y-4">
                  {editingInfo && (
                    <form
                      onSubmit={handleSaveInfoSubmit}
                      className="bg-white border-2 border-[#6B1420] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#6B1420]">
                          Editing Research Information Video
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingInfo(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-900"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={infoTitle}
                          onChange={(e) => setInfoTitle(e.target.value)}
                          placeholder="Title"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                        <input
                          type="text"
                          value={infoCategory}
                          onChange={(e) => setInfoCategory(e.target.value)}
                          placeholder="Category"
                          className="px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                        <input
                          type="url"
                          required
                          value={infoVideoUrl}
                          onChange={(e) => setInfoVideoUrl(e.target.value)}
                          placeholder="YouTube / Google Drive Video URL"
                          className="sm:col-span-2 px-3 py-2 text-xs border border-zinc-300 bg-white"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={infoDesc}
                        onChange={(e) => setInfoDesc(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
                        >
                          Save Video Changes
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {informationItems.map((inf) => (
                      <div
                        key={inf.id}
                        className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-[#6B1420]">
                            {inf.category}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                            {inf.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">{inf.videoUrl}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openInfoEditor(inf)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] shrink-0 self-start sm:self-center"
                        >
                          Edit Video
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== MODE 3: UNIFIED DELETE ==================== */}
          {mode === 'delete' && (
            <div className="space-y-5">
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-700 shrink-0" />
                <span>
                  All system deletions are centralized here with two-step confirmation so records cannot be deleted accidentally from browsing views.
                </span>
              </div>

              {/* Delete Category Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 pb-3">
                {(
                  [
                    { id: 'researches', label: `Research Entries (${researches.length})` },
                    { id: 'journals', label: `Research Journal (${journals.length})` },
                    { id: 'profiles', label: `Researcher Profiles (${profiles.length})` },
                    { id: 'overview', label: `Overview Cards (${overviewItems.length})` },
                    { id: 'gallery', label: `Gallery Slides (${galleryItems.length})` },
                    { id: 'info', label: `Info Videos (${informationItems.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveDeleteTab(tab.id);
                      setConfirmDeleteKey(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeDeleteTab === tab.id
                        ? 'bg-red-700 text-white'
                        : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* DELETE RESEARCHES */}
              {activeDeleteTab === 'researches' && (
                <div className="space-y-2">
                  {filteredResearches.map((rec) => {
                    const key = `res_${rec.id}`;
                    return (
                      <div
                        key={rec.id}
                        className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-zinc-500">
                            {getDivisionLabel(rec.division)} · {rec.schoolYear}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                            {rec.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">{rec.authors}</div>
                        </div>
                        <div className="shrink-0">
                          {confirmDeleteKey === key ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteResearch(rec);
                                  setConfirmDeleteKey(null);
                                  setFeedback(`Deleted research entry "${rec.title}".`);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="px-2.5 py-1.5 text-xs text-zinc-600 bg-zinc-100"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(key)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-700 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DELETE JOURNALS */}
              {activeDeleteTab === 'journals' && (
                <div className="space-y-2">
                  {filteredJournals.map((j) => {
                    const key = `jrn_${j.id}`;
                    return (
                      <div
                        key={j.id}
                        className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-zinc-500">
                            {j.journalVolume} · {j.issnOrRefCode}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                            {j.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">{j.authors}</div>
                        </div>
                        <div className="shrink-0">
                          {confirmDeleteKey === key ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteJournal(j.id);
                                  setConfirmDeleteKey(null);
                                  setFeedback(`Deleted published journal "${j.title}".`);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="px-2.5 py-1.5 text-xs text-zinc-600 bg-zinc-100"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(key)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-700 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DELETE PROFILES */}
              {activeDeleteTab === 'profiles' && (
                <div className="space-y-2">
                  {filteredProfiles.map((p) => {
                    const key = `prof_${p.id}`;
                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] text-zinc-500">
                            {p.role} · {p.departmentOrStrand}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                            {p.fullName}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {confirmDeleteKey === key ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteProfile(p.id);
                                  setConfirmDeleteKey(null);
                                  setFeedback(`Deleted researcher profile "${p.fullName}".`);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="px-2.5 py-1.5 text-xs text-zinc-600 bg-zinc-100"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(key)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-700 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DELETE OVERVIEW CARDS */}
              {activeDeleteTab === 'overview' && (
                <div className="space-y-2">
                  {overviewItems.map((ov) => {
                    const key = `ov_${ov.id}`;
                    return (
                      <div
                        key={ov.id}
                        className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-zinc-500">
                            {ov.itemType === 'hero' ? 'HERO BANNER' : ov.code}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                            {ov.title}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {confirmDeleteKey === key ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteOverviewItem(ov.id);
                                  setConfirmDeleteKey(null);
                                  setFeedback(`Deleted overview item "${ov.title}".`);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="px-2.5 py-1.5 text-xs text-zinc-600 bg-zinc-100"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(key)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-700 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DELETE GALLERY SLIDES */}
              {activeDeleteTab === 'gallery' && (
                <div className="space-y-3">
                  {galleryItems.length > 0 && (
                    <div className="flex justify-end">
                      {confirmDeleteAllGallery ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-300 px-3 py-1.5">
                          <span className="text-xs font-semibold text-red-800">
                            Remove all {galleryItems.length} slides?
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteAllGalleryItems();
                              setConfirmDeleteAllGallery(false);
                              setFeedback('All Research Gallery slides deleted.');
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-red-700"
                          >
                            Confirm Delete All
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAllGallery(false)}
                            className="px-2 py-1 text-xs text-zinc-700 bg-white border border-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAllGallery(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-700 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete All Gallery Slides</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {galleryItems.map((g) => {
                      const key = `gal_${g.id}`;
                      return (
                        <div
                          key={g.id}
                          className="bg-white border border-zinc-200 p-3 flex items-center gap-3"
                        >
                          <img
                            src={resolveGoogleDriveImageUrl(g.imageUrl)}
                            alt={g.title}
                            referrerPolicy="no-referrer"
                            className="w-20 h-10 object-cover border border-zinc-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-zinc-900 truncate">
                              {g.title}
                            </div>
                          </div>
                          {confirmDeleteKey === key ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteGalleryItem(g.id);
                                  setConfirmDeleteKey(null);
                                  setFeedback(`Deleted slide "${g.title}".`);
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-white bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="px-1.5 py-1 text-[11px] text-zinc-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(key)}
                              className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-700 hover:text-white shrink-0"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DELETE INFO VIDEOS */}
              {activeDeleteTab === 'info' && (
                <div className="space-y-2">
                  {informationItems.map((inf) => {
                    const key = `inf_${inf.id}`;
                    return (
                      <div
                        key={inf.id}
                        className="bg-white border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] text-zinc-500">{inf.category}</div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                            {inf.title}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {confirmDeleteKey === key ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteInformationItem(inf.id);
                                  setConfirmDeleteKey(null);
                                  setFeedback(`Deleted info video "${inf.title}".`);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="px-2.5 py-1.5 text-xs text-zinc-600 bg-zinc-100"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(key)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-700 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
