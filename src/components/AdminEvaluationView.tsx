import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Search,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Bell,
  Mail,
  Globe,
  ExternalLink,
  Video,
  Film,
  Play,
} from 'lucide-react';
import {
  ResearchRecord,
  ResearchStatus,
  OverviewItemRecord,
  ResearchSubscriptionRecord,
  EmailAlertLogRecord,
  ResearchGalleryItemRecord,
  ResearchInformationItemRecord,
} from '../data/bnhsTaxonomy';
import {
  downloadResearchInventoryCsv,
  downloadStandalonePortalHtml,
  getDivisionLabel,
} from '../utils/reportExporter';
import { parseVideoSource } from '../utils/videoUtils';

/**
 * Converts a Google Drive sharing link (e.g. https://drive.google.com/file/d/FILE_ID/view)
 * or open/uc link into a direct embeddable image URL, and preserves any website image link.
 */
export function resolveOverviewImageLink(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return trimmed;

  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
  }
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1] && trimmed.includes('drive.google.com')) {
    return `https://drive.google.com/thumbnail?id=${idParamMatch[1]}&sz=w1000`;
  }
  return trimmed;
}

interface AdminEvaluationViewProps {
  researches: ResearchRecord[];
  isAdmin: boolean;
  currentUserUid?: string | null;
  currentUserEmail?: string | null;
  onSelectResearch: (record: ResearchRecord) => void;
  onEditResearch: (record: ResearchRecord) => void;
  onDeleteResearch: (record: ResearchRecord) => Promise<void>;
  onAddNewResearch: () => void;
  onQuickStatusUpdate: (record: ResearchRecord, newStatus: ResearchStatus) => Promise<void>;
  onSyncBaselineToCloud: () => Promise<void>;
  onSignInPrompt: () => void;
  overviewItems: OverviewItemRecord[];
  onSaveOverviewItem: (
    item: Omit<OverviewItemRecord, 'portalId' | 'updatedByUid' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void>;
  onDeleteOverviewItem: (itemId: string) => Promise<void>;
  onResetOverviewDefaults: () => Promise<void>;
  subscriptions: ResearchSubscriptionRecord[];
  emailAlertLogs: EmailAlertLogRecord[];
  galleryItems?: ResearchGalleryItemRecord[];
  onSaveGalleryItem?: (
    item: Omit<ResearchGalleryItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void>;
  onDeleteGalleryItem?: (itemId: string) => Promise<void>;
  informationItems?: ResearchInformationItemRecord[];
  onSaveInformationItem?: (
    item: Omit<ResearchInformationItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void>;
  onDeleteInformationItem?: (itemId: string) => Promise<void>;
}

export const AdminEvaluationView: React.FC<AdminEvaluationViewProps> = ({
  researches,
  isAdmin,
  currentUserUid,
  currentUserEmail,
  onSelectResearch,
  onEditResearch,
  onDeleteResearch,
  onAddNewResearch,
  onQuickStatusUpdate,
  onSyncBaselineToCloud,
  onSignInPrompt,
  overviewItems,
  onSaveOverviewItem,
  onDeleteOverviewItem,
  onResetOverviewDefaults,
  subscriptions,
  emailAlertLogs,
  galleryItems = [],
  onSaveGalleryItem,
  onDeleteGalleryItem,
  informationItems = [],
  onSaveInformationItem,
  onDeleteInformationItem,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteResearchId, setConfirmDeleteResearchId] = useState<string | null>(null);

  // Sub-tabs for Overview visual sections: Cards, Gallery (1000x500), Information (1000x500)
  const [activeVisualTab, setActiveVisualTab] = useState<'overview' | 'gallery' | 'information'>('overview');

  // Overview Section Manager State (Add / Edit / Delete / Upload Photo)
  const [isOverviewFormOpen, setIsOverviewFormOpen] = useState<boolean>(false);
  const [editingOverviewId, setEditingOverviewId] = useState<string | null>(null);
  const [ovType, setOvType] = useState<'hero' | 'card'>('card');
  const [ovCode, setOvCode] = useState<string>('DIV-04');
  const [ovTitle, setOvTitle] = useState<string>('');
  const [ovSubtitle, setOvSubtitle] = useState<string>('');
  const [ovDescription, setOvDescription] = useState<string>('');
  const [ovImageUrl, setOvImageUrl] = useState<string>('');
  const [ovWebLinkInput, setOvWebLinkInput] = useState<string>('');
  const [ovDivisionLink, setOvDivisionLink] = useState<'none' | 'basic' | 'action' | 'tuklas'>('none');
  const [ovOrder, setOvOrder] = useState<number>(4);
  const [savingOverview, setSavingOverview] = useState<boolean>(false);
  const [ovFeedback, setOvFeedback] = useState<string>('');
  const [confirmDeleteOvId, setConfirmDeleteOvId] = useState<string | null>(null);

  // Research Gallery Manager State (1000 x 500 Sliding Pictures)
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState<boolean>(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galTitle, setGalTitle] = useState<string>('');
  const [galCaption, setGalCaption] = useState<string>('');
  const [galImageUrl, setGalImageUrl] = useState<string>('');
  const [galWebLinkInput, setGalWebLinkInput] = useState<string>('');
  const [galOrder, setGalOrder] = useState<number>(1);
  const [savingGallery, setSavingGallery] = useState<boolean>(false);
  const [galFeedback, setGalFeedback] = useState<string>('');
  const [confirmDeleteGalId, setConfirmDeleteGalId] = useState<string | null>(null);

  // Research Information Manager State (1000 x 500 Videos - YouTube & Google Drive)
  const [isInfoFormOpen, setIsInfoFormOpen] = useState<boolean>(false);
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [infoTitle, setInfoTitle] = useState<string>('');
  const [infoCategory, setInfoCategory] = useState<string>('Basic Education Research Agenda (BERA)');
  const [infoDescription, setInfoDescription] = useState<string>('');
  const [infoVideoUrl, setInfoVideoUrl] = useState<string>('');
  const [infoVideoSourceType, setInfoVideoSourceType] = useState<'youtube' | 'drive' | 'direct' | 'upload'>('youtube');
  const [infoVideoLinkInput, setInfoVideoLinkInput] = useState<string>('');
  const [infoImageUrl, setInfoImageUrl] = useState<string>('');
  const [infoLinkUrl, setInfoLinkUrl] = useState<string>('');
  const [infoOrder, setInfoOrder] = useState<number>(1);
  const [savingInfo, setSavingInfo] = useState<boolean>(false);
  const [infoFeedback, setInfoFeedback] = useState<string>('');
  const [confirmDeleteInfoId, setConfirmDeleteInfoId] = useState<string | null>(null);

  const pendingCount = researches.filter((r) => r.status === 'Pending Review').length;
  const approvedCount = researches.filter((r) => r.status === 'Approved').length;
  const completedCount = researches.filter((r) => r.status === 'Completed').length;
  const ongoingCount = researches.filter((r) => r.status === 'Ongoing').length;

  const filtered = researches.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !`${r.title} ${r.authors} ${r.category} ${r.departmentOrGrade}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      await onSyncBaselineToCloud();
      setSyncMessage(
        'All Barobo National High School baseline studies and researcher profiles are now synced to Firestore.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const openEditOverviewItem = (item: OverviewItemRecord) => {
    setEditingOverviewId(item.id);
    setOvType(item.itemType);
    setOvCode(item.code);
    setOvTitle(item.title);
    setOvSubtitle(item.subtitle);
    setOvDescription(item.description);
    setOvImageUrl(item.imageUrl);
    setOvWebLinkInput(item.imageUrl.startsWith('data:') ? '' : item.imageUrl);
    setOvDivisionLink(item.divisionLink);
    setOvOrder(item.displayOrder);
    setIsOverviewFormOpen(true);
    setOvFeedback('');
  };

  // Compress & convert uploaded image to DataURL (< 450KB) so it stores cleanly in Firestore & localStorage
  const handleOverviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      if (file.type === 'image/gif' && rawDataUrl.length < 650000) {
        setOvImageUrl(rawDataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 960;
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
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setOvImageUrl(compressed);
        } else {
          setOvImageUrl(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyWebOrGoogleLink = (rawLink: string) => {
    const resolved = resolveOverviewImageLink(rawLink);
    setOvWebLinkInput(rawLink);
    setOvImageUrl(resolved);
  };

  const handleOverviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ovTitle.trim() || !ovDescription.trim()) return;
    setSavingOverview(true);
    setOvFeedback('');
    try {
      const id =
        editingOverviewId || `overview_card_${Date.now()}`;
      const finalImageUrl = resolveOverviewImageLink(
        ovImageUrl || ovWebLinkInput || '/assets/aistudio/BNHS_LOGO_animated.gif'
      );
      await onSaveOverviewItem({
        id,
        itemType: ovType,
        code: ovCode.trim() || 'BNHS-OV',
        title: ovTitle.trim(),
        subtitle: ovSubtitle.trim() || 'BNHS Research Portal',
        description: ovDescription.trim(),
        imageUrl: finalImageUrl,
        divisionLink: ovDivisionLink,
        displayOrder: ovOrder,
        isDeleted: false,
      });
      setIsOverviewFormOpen(false);
      setEditingOverviewId(null);
      setOvFeedback(
        editingOverviewId
          ? 'Overview section item & photo updated on the Overview dashboard.'
          : 'New Overview section item & photo added to the Overview dashboard.'
      );
    } finally {
      setSavingOverview(false);
    }
  };

  // Gallery Manager Handlers (1000 x 500 Sliding Pictures)
  const openAddGalleryItem = () => {
    setEditingGalleryId(null);
    setGalTitle('');
    setGalCaption('');
    setGalImageUrl('');
    setGalWebLinkInput('');
    setGalOrder(galleryItems.length + 1);
    setIsGalleryFormOpen(true);
    setGalFeedback('');
  };

  const openEditGalleryItem = (item: ResearchGalleryItemRecord) => {
    setEditingGalleryId(item.id);
    setGalTitle(item.title);
    setGalCaption(item.caption);
    setGalImageUrl(item.imageUrl);
    setGalWebLinkInput(item.imageUrl.startsWith('data:') ? '' : item.imageUrl);
    setGalOrder(item.displayOrder);
    setIsGalleryFormOpen(true);
    setGalFeedback('');
  };

  const handleGalleryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1000, 500);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setGalImageUrl(compressed);
        } else {
          setGalImageUrl(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galTitle.trim() || !onSaveGalleryItem) return;
    setSavingGallery(true);
    setGalFeedback('');
    try {
      const id = editingGalleryId || `gallery_${Date.now()}`;
      const finalImg = resolveOverviewImageLink(
        galImageUrl || galWebLinkInput || '/src/assets/images/bnhs_gallery_stem_fair_1794325399735.jpg'
      );
      await onSaveGalleryItem({
        id,
        title: galTitle.trim(),
        caption: galCaption.trim(),
        imageUrl: finalImg,
        displayOrder: Number(galOrder || 1),
      });
      setIsGalleryFormOpen(false);
      setEditingGalleryId(null);
      setGalFeedback(
        editingGalleryId
          ? 'Gallery photo and caption updated successfully (1000 × 500).'
          : 'New photo added to the 1000 × 500 Research Gallery.'
      );
    } finally {
      setSavingGallery(false);
    }
  };

  // Information Manager Handlers (1000 x 500 Videos - YouTube & Google Drive Only)
  const openAddInfoItem = () => {
    setEditingInfoId(null);
    setInfoTitle('');
    setInfoCategory('Basic Education Research Agenda (BERA)');
    setInfoDescription('');
    setInfoVideoUrl('https://www.youtube.com/watch?v=ScMzIvxBSi4');
    setInfoVideoSourceType('youtube');
    setInfoVideoLinkInput('https://www.youtube.com/watch?v=ScMzIvxBSi4');
    setInfoImageUrl('');
    setInfoLinkUrl('');
    setInfoOrder(informationItems.length + 1);
    setIsInfoFormOpen(true);
    setInfoFeedback('');
  };

  const openEditInfoItem = (item: ResearchInformationItemRecord) => {
    setEditingInfoId(item.id);
    setInfoTitle(item.title);
    setInfoCategory(item.category);
    setInfoDescription(item.description);
    setInfoVideoUrl(item.videoUrl || '');
    setInfoVideoSourceType(item.videoSourceType || 'youtube');
    setInfoVideoLinkInput(item.videoUrl || '');
    setInfoImageUrl(item.imageUrl || '');
    setInfoLinkUrl(item.linkUrl || '');
    setInfoOrder(item.displayOrder);
    setIsInfoFormOpen(true);
    setInfoFeedback('');
  };

  const handleApplyVideoLink = (rawLink: string) => {
    setInfoVideoLinkInput(rawLink);
    const parsed = parseVideoSource(rawLink);
    setInfoVideoUrl(rawLink);
    setInfoVideoSourceType(
      parsed.type === 'youtube'
        ? 'youtube'
        : parsed.type === 'drive'
        ? 'drive'
        : 'direct'
    );
  };

  const handleInfoVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setInfoFeedback(
        'Video file is larger than 25MB. For fast loading and smooth cross-device streaming, paste a YouTube or Google Drive link instead.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      setInfoVideoUrl(rawDataUrl);
      setInfoVideoSourceType('upload');
      setInfoVideoLinkInput('');
      setInfoFeedback('Local MP4/WebM video loaded for 1000 × 500 Research Information playback.');
    };
    reader.readAsDataURL(file);
  };

  const handleInfoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoTitle.trim() || !onSaveInformationItem) return;
    setSavingInfo(true);
    setInfoFeedback('');
    try {
      const id = editingInfoId || `info_${Date.now()}`;
      const finalVideoUrl =
        infoVideoUrl.trim() ||
        infoVideoLinkInput.trim() ||
        'https://www.youtube.com/watch?v=ScMzIvxBSi4';
      const parsed = parseVideoSource(finalVideoUrl);
      const finalSourceType =
        infoVideoSourceType ||
        (parsed.type === 'youtube'
          ? 'youtube'
          : parsed.type === 'drive'
          ? 'drive'
          : 'direct');

      await onSaveInformationItem({
        id,
        title: infoTitle.trim(),
        category: infoCategory.trim(),
        description: infoDescription.trim(),
        videoUrl: finalVideoUrl,
        videoSourceType: finalSourceType,
        imageUrl: infoImageUrl || '',
        linkUrl: infoLinkUrl.trim(),
        displayOrder: Number(infoOrder || 1),
      });
      setIsInfoFormOpen(false);
      setEditingInfoId(null);
      setInfoFeedback(
        editingInfoId
          ? 'Research Information video updated successfully (1000 × 500).'
          : 'New Research Information video added (1000 × 500).'
      );
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin & Evaluation Header */}
      <div className="bg-white border border-zinc-200 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-xs text-zinc-500 flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#6B1420]" />
            <span>
              BNHS School Research Committee · Evaluation, Overview Customization &amp; Report Exports
            </span>
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900">
            Administrator Dashboard, Overview Manager &amp; Evaluation Workflow
          </h2>
          <p className="text-sm text-zinc-600 mt-1.5">
            Customize the Overview section (Add, Edit, Delete, and Upload Photos), manage all submitted and posted research entries, assign 100-point rubric evaluations, and monitor email alert subscriptions.
          </p>
          <div className="mt-3 text-xs text-zinc-600">
            {currentUserEmail ? (
              <span>
                Signed in as <strong className="font-mono">{currentUserEmail}</strong> ·{' '}
                <strong className="text-[#6B1420]">
                  {isAdmin
                    ? 'Administrator & Coordinator Privileges Active'
                    : 'Researcher Account (Full Edit & Delete on Submitted Research)'}
                </strong>
              </span>
            ) : (
              <span>
                Not signed in ·{' '}
                <button
                  type="button"
                  onClick={onSignInPrompt}
                  className="text-[#6B1420] font-semibold underline"
                >
                  Sign in with Google
                </button>{' '}
                to sync Administrator Evaluation &amp; Cloud Repository changes across devices.
              </span>
            )}
          </div>
        </div>

        {/* Institutional Export & Cloud Sync Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAddNewResearch}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add / Submit Research</span>
          </button>

          <button
            type="button"
            onClick={() => downloadResearchInventoryCsv(researches)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#6B1420]" />
            <span>Export Inventory (.CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => downloadStandalonePortalHtml(researches)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-700" />
            <span>Download BNHS Portal (.HTML)</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#6B1420] bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {syncing ? 'Syncing to Firestore...' : 'Sync Baseline to Cloud DB'}
              </span>
            </button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* ==================== ADMIN OVERVIEW, GALLERY & INFORMATION MANAGER (ADD, EDIT, DELETE & UPLOAD PHOTO) ==================== */}
      <div className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6">
        {/* Visual Content Section Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveVisualTab('overview')}
            className={`px-4 py-2 text-xs font-semibold transition-colors ${
              activeVisualTab === 'overview'
                ? 'bg-[#6B1420] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            01. Overview Division &amp; Hero Cards
          </button>
          <button
            type="button"
            onClick={() => setActiveVisualTab('gallery')}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeVisualTab === 'gallery'
                ? 'bg-[#6B1420] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>02. Research Gallery (1000 × 500 Sliding Pictures · 10s)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveVisualTab('information')}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeVisualTab === 'information'
                ? 'bg-[#6B1420] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>03. Research Information (1000 × 500 Video Only · YouTube &amp; Google Drive)</span>
          </button>
        </div>

        {/* ================= TAB 1: OVERVIEW HERO & DIVISION CARDS ================= */}
        {activeVisualTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <div className="text-xs text-[#6B1420] font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Overview Section Customization &amp; Photo Upload Manager</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-zinc-900 mt-0.5">
                  Manage Overview Section (Add, Edit, Delete &amp; Upload Photo)
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Customize the Overview Hero Banner and Division/Highlight Cards displayed on the Overview page. Upload new photos, edit titles and descriptions, or restore defaults.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setIsOverviewFormOpen(false);
                    setEditingOverviewId(null);
                    setConfirmDeleteOvId(null);
                    await onResetOverviewDefaults();
                    setOvFeedback(
                      'Default Overview Hero Banner and Three Major Research Division cards have been restored.'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Default Overview</span>
                </button>
              </div>
            </div>

            {ovFeedback && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{ovFeedback}</span>
              </div>
            )}

            {/* Edit Overview Item Form with Photo Upload */}
            {isOverviewFormOpen && (
              <form
                onSubmit={handleOverviewFormSubmit}
                className="p-5 bg-[#FAF9F5] border border-[#6B1420]/30 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <h4 className="text-sm font-display font-semibold text-[#6B1420]">
                    Edit Overview Section Item ({ovType === 'hero' ? 'Hero Banner' : 'Overview Card'})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsOverviewFormOpen(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-900"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Overview Section Type
                    </label>
                    <select
                      value={ovType}
                      onChange={(e) => setOvType(e.target.value as 'hero' | 'card')}
                      disabled={editingOverviewId === 'overview_hero_main'}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    >
                      <option value="card">Overview Division / Highlight Card</option>
                      <option value="hero">Main Overview Hero Banner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {ovType === 'hero' ? 'Top Institutional Kicker' : 'Card Code / Badge'}
                    </label>
                    <input
                      type="text"
                      required
                      value={ovCode}
                      onChange={(e) => setOvCode(e.target.value)}
                      placeholder="e.g., DIV-01 or HIGHLIGHT-01"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Target Division Link
                    </label>
                    <select
                      value={ovDivisionLink}
                      onChange={(e) =>
                        setOvDivisionLink(
                          e.target.value as 'none' | 'basic' | 'action' | 'tuklas'
                        )
                      }
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    >
                      <option value="basic">Basic Research</option>
                      <option value="action">Action Research</option>
                      <option value="tuklas">TUKLAS Project Fair</option>
                      <option value="none">General Overview (No Division Jump)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ovTitle}
                      onChange={(e) => setOvTitle(e.target.value)}
                      placeholder="Enter Overview section title..."
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {ovType === 'hero' ? 'Photo Overlay Caption' : 'Subtitle / Theme Focus'}
                    </label>
                    <input
                      type="text"
                      required
                      value={ovSubtitle}
                      onChange={(e) => setOvSubtitle(e.target.value)}
                      placeholder="Enter subtitle or caption..."
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Description / Summary Content <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={ovDescription}
                    onChange={(e) => setOvDescription(e.target.value)}
                    placeholder="Enter detailed overview description..."
                    className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                  />
                </div>

                {/* Photo Upload & Preview */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white border border-zinc-200 p-4">
                  <div className="md:col-span-4">
                    <div className="aspect-[16/10] w-full bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center relative">
                      {ovImageUrl ? (
                        <img
                          src={resolveOverviewImageLink(ovImageUrl)}
                          alt="Overview Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-zinc-400">No photo selected</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-8 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                        Option 1: Upload Photo from Local Computer (JPG, PNG, WEBP, or GIF)
                      </label>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo from Computer</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleOverviewPhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {ovImageUrl.startsWith('data:') && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                            Local Photo Loaded
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100">
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#6B1420]" />
                        <span>
                          Option 2: Upload Photo via Google Drive Link or Any Website Link
                        </span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="url"
                          value={ovWebLinkInput}
                          onChange={(e) => handleApplyWebOrGoogleLink(e.target.value)}
                          placeholder="Paste Google Drive photo link (https://drive.google.com/...) or any website image URL"
                          className="flex-1 px-3 py-2 text-xs border border-zinc-300 bg-[#FAF9F5] focus:outline-none focus:border-[#6B1420]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyWebOrGoogleLink(ovWebLinkInput)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#6B1420] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOverviewFormOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOverview}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50"
                  >
                    {savingOverview ? 'Saving Overview Changes...' : 'Save Overview Changes & Photo'}
                  </button>
                </div>
              </form>
            )}

            {/* Current Overview Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {overviewItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-zinc-200 bg-[#FAF9F5] flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="aspect-[16/10] w-full bg-zinc-200 relative overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={resolveOverviewImageLink(item.imageUrl)}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-xs text-zinc-500">
                          No Photo Uploaded
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#6B1420] text-white text-[10px] font-mono font-semibold">
                        {item.itemType === 'hero' ? 'HERO BANNER' : item.code}
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <div className="text-[11px] text-[#6B1420] font-semibold line-clamp-1">
                        {item.subtitle}
                      </div>
                      <h4 className="text-sm font-display font-semibold text-zinc-900 line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-600 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white border-t border-zinc-200 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openEditOverviewItem(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6B1420] bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit / Photo</span>
                    </button>

                    {confirmDeleteOvId === item.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteOverviewItem(item.id);
                            setConfirmDeleteOvId(null);
                            setOvFeedback(`Deleted "${item.title}" from the Overview section.`);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteOvId(null)}
                          className="px-1.5 py-1 text-[11px] text-zinc-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteOvId(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: RESEARCH GALLERY (1000 × 500 SLIDING PICTURES · 10S) ================= */}
        {activeVisualTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <div className="text-xs text-[#6B1420] font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Research Gallery Manager · 1000 × 500 Dimensions · 10s Slideshow</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-zinc-900 mt-0.5">
                  Research Gallery Pictures (Upload, Edit, Delete &amp; 1000 × 500 Sizing)
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Manage the sliding pictures shown on the Overview page below the Hero Banner and before the Total Indexed Studies section. Automatically changes every 10 seconds with exact 1000 by 500 dimensions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={openAddGalleryItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Picture to Gallery (1000 × 500)</span>
                </button>
              </div>
            </div>

            {galFeedback && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{galFeedback}</span>
              </div>
            )}

            {/* Add / Edit Gallery Item Form (1000 x 500) */}
            {isGalleryFormOpen && (
              <form
                onSubmit={handleGalleryFormSubmit}
                className="p-5 bg-[#FAF9F5] border border-[#6B1420]/30 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <h4 className="text-sm font-display font-semibold text-[#6B1420]">
                    {editingGalleryId ? 'Edit Gallery Picture' : 'Add New Gallery Picture'} (Size: 1000 × 500)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsGalleryFormOpen(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-900"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Picture Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      placeholder="e.g., BNHS Annual Science, Technology & Innovation Fair 2026"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Display Order (Slide Position)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={galOrder}
                      onChange={(e) => setGalOrder(Number(e.target.value || 1))}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Caption / Field Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={galCaption}
                    onChange={(e) => setGalCaption(e.target.value)}
                    placeholder="Provide context on what this research activity, project exhibition, or fieldwork photo represents..."
                    className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                  />
                </div>

                {/* Photo Upload & 1000 x 500 Preview */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white border border-zinc-200 p-4">
                  <div className="md:col-span-6">
                    <div className="w-full aspect-[1000/500] bg-zinc-900 border border-zinc-300 overflow-hidden flex items-center justify-center relative">
                      {galImageUrl ? (
                        <img
                          src={resolveOverviewImageLink(galImageUrl)}
                          alt="1000x500 Gallery Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-zinc-400">
                          1000 × 500 Photo Preview Frame
                        </span>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white font-mono text-[10px]">
                        1000 × 500
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                        Option 1: Upload Photo from Local Computer (Auto-scaled to 1000 × 500)
                      </label>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload &amp; Scale to 1000 × 500</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleGalleryPhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {galImageUrl.startsWith('data:') && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                            Local File Loaded (1000 × 500)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100">
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#6B1420]" />
                        <span>Option 2: Photo via Google Drive or Web Link (1000 × 500)</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="url"
                          value={galWebLinkInput}
                          onChange={(e) => {
                            setGalWebLinkInput(e.target.value);
                            setGalImageUrl(resolveOverviewImageLink(e.target.value));
                          }}
                          placeholder="Paste Google Drive sharing link or direct website image URL"
                          className="flex-1 px-3 py-2 text-xs border border-zinc-300 bg-[#FAF9F5] focus:outline-none focus:border-[#6B1420]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setGalImageUrl(resolveOverviewImageLink(galWebLinkInput));
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#6B1420] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGalleryFormOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingGallery}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50"
                  >
                    {savingGallery ? 'Saving Gallery Picture...' : 'Save Gallery Picture (1000 × 500)'}
                  </button>
                </div>
              </form>
            )}

            {/* Gallery Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="border border-zinc-200 bg-[#FAF9F5] flex flex-col justify-between overflow-hidden shadow-sm"
                >
                  <div>
                    {/* Exact 1000 x 500 aspect ratio box */}
                    <div className="w-full aspect-[1000/500] bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={resolveOverviewImageLink(item.imageUrl)}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-xs text-zinc-400">
                          No Photo Provided
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#6B1420] text-white text-[10px] font-mono font-semibold">
                        Slide {idx + 1} · Order {item.displayOrder}
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-mono">
                        1000 × 500
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h4 className="text-sm font-display font-semibold text-zinc-900 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-600 line-clamp-2">
                        {item.caption}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white border-t border-zinc-200 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openEditGalleryItem(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#6B1420] bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit (1000 × 500)</span>
                    </button>

                    {confirmDeleteGalId === item.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            if (onDeleteGalleryItem) {
                              await onDeleteGalleryItem(item.id);
                              setConfirmDeleteGalId(null);
                              setGalFeedback(`Deleted picture "${item.title}" from Gallery.`);
                            }
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteGalId(null)}
                          className="px-1.5 py-1 text-[11px] text-zinc-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGalId(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: RESEARCH INFORMATION (1000 × 500 VIDEO ONLY · YOUTUBE & GOOGLE DRIVE) ================= */}
        {activeVisualTab === 'information' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <div className="text-xs text-[#6B1420] font-semibold flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#6B1420]" />
                  <span>Research Information Video Manager · 1000 × 500 Dimensions · Video Only</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-zinc-900 mt-0.5">
                  Research Information Videos (YouTube, Google Drive &amp; Video Upload)
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Upload video files or link videos from YouTube and Google Drive. These stream in the dedicated 1000 by 500 Research Information player on the Overview page.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={openAddInfoItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Video to Research Information (1000 × 500)</span>
                </button>
              </div>
            </div>

            {infoFeedback && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{infoFeedback}</span>
              </div>
            )}

            {/* Add / Edit Video Item Form (1000 x 500) */}
            {isInfoFormOpen && (
              <form
                onSubmit={handleInfoFormSubmit}
                className="p-5 bg-[#FAF9F5] border border-[#6B1420]/30 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#6B1420]" />
                    <h4 className="text-sm font-display font-semibold text-[#6B1420]">
                      {editingInfoId
                        ? 'Edit Research Information Video'
                        : 'Add New Research Information Video'}{' '}
                      (Size: 1000 × 500 · Video Only)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInfoFormOpen(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-900"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Video Topic Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={infoTitle}
                      onChange={(e) => setInfoTitle(e.target.value)}
                      placeholder="e.g., BNHS Research Defense & TUKLAS Science Fair Orientation Video"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Category / Topic Focus
                    </label>
                    <input
                      type="text"
                      required
                      value={infoCategory}
                      onChange={(e) => setInfoCategory(e.target.value)}
                      placeholder="e.g., DepEd BERA Video Briefing"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Description &amp; Institutional Guidance <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={infoDescription}
                    onChange={(e) => setInfoDescription(e.target.value)}
                    placeholder="Enter what this video covers: methodology orientation, research defense tips, ethics protocols, or school agenda..."
                    className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      External Reference Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={infoLinkUrl}
                      onChange={(e) => setInfoLinkUrl(e.target.value)}
                      placeholder="https://deped.gov.ph/research-agenda or institutional doc"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Display Order (Video Sequence)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={infoOrder}
                      onChange={(e) => setInfoOrder(Number(e.target.value || 1))}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                {/* Video Upload & Link Controls (YouTube, Google Drive, or Local File) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white border border-zinc-200 p-4">
                  {/* Left Column: 1000 x 500 Video Preview Frame */}
                  <div className="md:col-span-6">
                    <div className="w-full aspect-[1000/500] bg-black border border-zinc-800 overflow-hidden flex items-center justify-center relative">
                      {infoVideoUrl.trim() ? (
                        (() => {
                          const parsed = parseVideoSource(infoVideoUrl);
                          if (parsed.isEmbeddableIframe) {
                            return (
                              <iframe
                                src={parsed.embedUrl}
                                title="Video Preview"
                                className="w-full h-full border-0 bg-black"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          }
                          return (
                            <video
                              controls
                              playsInline
                              src={parsed.embedUrl}
                              className="w-full h-full object-contain bg-black"
                            >
                              Your browser does not support HTML5 video.
                            </video>
                          );
                        })()
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center text-zinc-400">
                          <Film className="w-10 h-10 text-zinc-600 mb-2" />
                          <span className="text-xs text-zinc-300 font-medium">
                            1000 × 500 Video Preview Frame
                          </span>
                          <span className="text-[11px] text-zinc-500 mt-1">
                            Paste a YouTube or Google Drive link, or upload an MP4 video file
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 text-white font-mono text-[10px] pointer-events-none">
                        1000 × 500
                      </div>
                      {infoVideoSourceType && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold text-white pointer-events-none uppercase">
                          {infoVideoSourceType === 'youtube' && (
                            <span className="bg-red-600 px-1.5 py-0.5 rounded-xs">
                              YouTube Video
                            </span>
                          )}
                          {infoVideoSourceType === 'drive' && (
                            <span className="bg-blue-600 px-1.5 py-0.5 rounded-xs">
                              Google Drive Video
                            </span>
                          )}
                          {(infoVideoSourceType === 'upload' ||
                            infoVideoSourceType === 'direct') && (
                            <span className="bg-emerald-600 px-1.5 py-0.5 rounded-xs">
                              MP4 Video
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: YouTube / Google Drive Links + Local Video File Upload */}
                  <div className="md:col-span-6 space-y-4">
                    {/* Option 1: YouTube or Google Drive Video Link */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#6B1420]" />
                        <span>Option 1: Link on YouTube or Google Drive (Recommended)</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="url"
                          value={infoVideoLinkInput}
                          onChange={(e) => handleApplyVideoLink(e.target.value)}
                          placeholder="Paste YouTube (https://youtu.be/... or watch?v=) or Google Drive link (https://drive.google.com/file/d/...)"
                          className="flex-1 px-3 py-2 text-xs border border-zinc-300 bg-[#FAF9F5] focus:outline-none focus:border-[#6B1420]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyVideoLink(infoVideoLinkInput)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#6B1420] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply Video Link</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Supports any YouTube video (watch, share, shorts) and Google Drive videos (set sharing to &ldquo;Anyone with link can view&rdquo;).
                      </p>
                    </div>

                    {/* Option 2: Upload Video File from Computer */}
                    <div className="pt-3 border-t border-zinc-100 space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#6B1420]" />
                        <span>Option 2: Upload Video File from Computer (MP4, WebM, OGG)</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer transition-colors">
                          <Film className="w-3.5 h-3.5" />
                          <span>Choose Video File (.mp4, .webm)</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/*"
                            onChange={handleInfoVideoUpload}
                            className="hidden"
                          />
                        </label>
                        {infoVideoSourceType === 'upload' && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                            Local Video Loaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInfoFormOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50"
                  >
                    {savingInfo ? 'Saving Video...' : 'Save Research Information Video (1000 × 500)'}
                  </button>
                </div>
              </form>
            )}

            {/* Information Videos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {informationItems.map((item, idx) => {
                const itemVideo = parseVideoSource(item.videoUrl || item.linkUrl || '');
                return (
                  <div
                    key={item.id}
                    className="border border-zinc-200 bg-[#FAF9F5] flex flex-col justify-between overflow-hidden shadow-sm"
                  >
                    <div>
                      {/* Exact 1000 x 500 aspect ratio video container */}
                      <div className="w-full aspect-[1000/500] bg-black relative overflow-hidden flex items-center justify-center">
                        {itemVideo.type !== 'none' && itemVideo.embedUrl ? (
                          itemVideo.isEmbeddableIframe ? (
                            <iframe
                              src={itemVideo.embedUrl}
                              title={item.title}
                              className="w-full h-full border-0 bg-black pointer-events-auto"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              controls
                              playsInline
                              src={itemVideo.embedUrl}
                              className="w-full h-full object-contain bg-black"
                            />
                          )
                        ) : (
                          <div className="text-center p-4 text-xs text-zinc-400 flex flex-col items-center">
                            <Film className="w-8 h-8 text-zinc-600 mb-1" />
                            <span>No Video Uploaded</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#6B1420] text-white text-[10px] font-mono font-semibold pointer-events-none">
                          Video {idx + 1} · {item.category}
                        </div>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/75 text-white text-[10px] font-mono pointer-events-none">
                          {itemVideo.type === 'youtube'
                            ? 'YouTube'
                            : itemVideo.type === 'drive'
                            ? 'Google Drive'
                            : '1000 × 500'}
                        </div>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B1420]">
                          <Video className="w-3.5 h-3.5 text-[#6B1420]" />
                          <span>{item.category}</span>
                        </div>
                        <h4 className="text-sm font-display font-semibold text-zinc-900 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-zinc-600 line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white border-t border-zinc-200 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditInfoItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#6B1420] bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Video</span>
                        </button>
                        {itemVideo.originalUrl && (
                          <a
                            href={itemVideo.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                            title="Open video URL in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {confirmDeleteInfoId === item.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              if (onDeleteInformationItem) {
                                await onDeleteInformationItem(item.id);
                                setConfirmDeleteInfoId(null);
                                setInfoFeedback(`Deleted video topic "${item.title}".`);
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteInfoId(null)}
                            className="px-1.5 py-1 text-[11px] text-zinc-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteInfoId(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
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
          </div>
        )}
      </div>

      {/* Workflow KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 p-5">
          <div className="text-xs text-zinc-500">Pending Committee Review</div>
          <div className="text-2xl font-mono font-bold text-amber-700 mt-1 tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Awaiting rubric grading &amp; sign-off
          </div>
        </div>
        <div className="bg-white border border-zinc-200 p-5">
          <div className="text-xs text-zinc-500">Approved &amp; Published</div>
          <div className="text-2xl font-mono font-bold text-[#6B1420] mt-1 tabular-nums">
            {approvedCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Verified in public research library
          </div>
        </div>
        <div className="bg-white border border-zinc-200 p-5">
          <div className="text-xs text-zinc-500">Completed Studies</div>
          <div className="text-2xl font-mono font-bold text-zinc-900 mt-1 tabular-nums">
            {completedCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Final manuscript archived
          </div>
        </div>
        <div className="bg-white border border-zinc-200 p-5">
          <div className="text-xs text-zinc-500">Active Email Alert Subscriptions</div>
          <div className="text-2xl font-mono font-bold text-[#6B1420] mt-1 tabular-nums">
            {subscriptions.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {emailAlertLogs.length} email alerts dispatched
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-zinc-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: `All Posted & Submitted Records (${researches.length})` },
              { id: 'Pending Review', label: `Pending Review (${pendingCount})` },
              { id: 'Approved', label: `Approved (${approvedCount})` },
              { id: 'Completed', label: `Completed (${completedCount})` },
              { id: 'Ongoing', label: `Ongoing (${ongoingCount})` },
              { id: 'Revision Requested', label: 'Revision Requested' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st.id
                  ? 'bg-[#6B1420] text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[250px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter research records to edit, evaluate, or delete..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
          />
        </div>
      </div>

      {/* High-Density Review & Management Table (Edit, Delete, Evaluate, Approve) */}
      <div className="bg-white border border-zinc-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-[#FAF9F5] text-[11px] font-semibold text-zinc-600">
              <th className="py-3 px-4">Research Title &amp; Proponents</th>
              <th className="py-3 px-4">Division &amp; Theme/Category</th>
              <th className="py-3 px-4">SY</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Rubric Score</th>
              <th className="py-3 px-4 text-right">Edit, Delete &amp; Workflow Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-xs">
            {filtered.map((item) => {
              const canModify =
                isAdmin ||
                !currentUserUid ||
                item.authorUid === currentUserUid;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-50/80 transition-colors"
                >
                  <td className="py-3.5 px-4 max-w-md">
                    <button
                      type="button"
                      onClick={() => onSelectResearch(item)}
                      className="text-left font-semibold text-zinc-900 hover:text-[#6B1420] hover:underline line-clamp-2"
                    >
                      {item.title}
                    </button>
                    <div className="text-zinc-500 mt-0.5">
                      {item.authors} · {item.authorRole} · {item.departmentOrGrade}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-700">
                    <div className="font-medium text-zinc-900">
                      {getDivisionLabel(item.division)}
                    </div>
                    <div className="text-zinc-500 line-clamp-1">{item.category}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-600 whitespace-nowrap">
                    {item.schoolYear}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        item.status === 'Approved'
                          ? 'text-emerald-800'
                          : item.status === 'Pending Review'
                          ? 'text-amber-700'
                          : item.status === 'Revision Requested'
                          ? 'text-red-700'
                          : 'text-zinc-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-800 whitespace-nowrap">
                    {item.evaluationScore > 0 ? `${item.evaluationScore}/100` : 'Unrated'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectResearch(item)}
                        className="px-2.5 py-1 text-xs font-medium text-[#6B1420] bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        {isAdmin ? 'Evaluate' : 'Details'}
                      </button>

                      {canModify && (
                        <button
                          type="button"
                          onClick={() => onEditResearch(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-[#6B1420]" />
                          <span>Edit</span>
                        </button>
                      )}

                      {canModify && (
                        <>
                          {confirmDeleteResearchId === item.id ? (
                            <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5">
                              <button
                                type="button"
                                disabled={busyId === item.id}
                                onClick={async () => {
                                  setBusyId(item.id);
                                  try {
                                    await onDeleteResearch(item);
                                    setConfirmDeleteResearchId(null);
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteResearchId(null)}
                                className="px-1.5 py-0.5 text-[11px] text-zinc-600 hover:text-zinc-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteResearchId(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </>
                      )}

                      {isAdmin && item.status !== 'Approved' && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={async () => {
                            setBusyId(item.id);
                            try {
                              await onQuickStatusUpdate(item, 'Approved');
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Email Alert Dispatch Log & Subscriptions Monitor */}
      <div className="bg-white border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <div>
            <div className="text-xs font-semibold text-[#6B1420] flex items-center gap-1.5">
              <Bell className="w-4 h-4" />
              <span>Real-Time Email Alert Dispatch Log</span>
            </div>
            <h3 className="text-base font-display font-semibold text-zinc-900 mt-0.5">
              Recent Status Change &amp; Comment Email Notifications ({emailAlertLogs.length})
            </h3>
          </div>
        </div>

        {emailAlertLogs.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No email alerts dispatched in this session yet. Click &ldquo;Notify Me&rdquo; on any research entry, then change its status or add a comment to trigger an email alert.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {emailAlertLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-[#FAF9F5] border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#6B1420]">
                      To: {log.recipientEmail}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-zinc-900">{log.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {log.dispatchedAtIso.slice(0, 19).replace('T', ' ')}
                    </span>
                  </div>
                  <p className="text-zinc-600">{log.messageBody}</p>
                </div>
                <a
                  href={`mailto:${encodeURIComponent(
                    log.recipientEmail
                  )}?subject=${encodeURIComponent(
                    log.subject
                  )}&body=${encodeURIComponent(log.messageBody)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Email Client</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
