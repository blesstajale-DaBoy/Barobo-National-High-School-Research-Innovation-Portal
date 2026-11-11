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
  Images,
  Check,
  X,
  Sparkles,
  Layers,
  FolderUp,
  HardDrive,
  Link2,
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
import { parseVideoSource, extractGoogleDriveFileId } from '../utils/videoUtils';

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
  if (trimmed.match(/^[a-zA-Z0-9_-]{28,45}$/)) {
    return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1000`;
  }
  return trimmed;
}

/**
 * Extracts multiple Google Drive file IDs and direct high-resolution 1000px thumbnail URLs
 * from a raw block of text (supporting newlines, commas, whitespace, or full URLs).
 */
export function extractGoogleDriveLinks(
  text: string
): Array<{ id: string; url: string; directThumbnailUrl: string }> {
  if (!text) return [];
  const lines = text.split(/[\r\n,]+/).map((l) => l.trim()).filter(Boolean);
  const results: Array<{ id: string; url: string; directThumbnailUrl: string }> = [];
  const seenIds = new Set<string>();

  for (const line of lines) {
    const fileId = extractGoogleDriveFileId(line);
    if (fileId && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      results.push({
        id: fileId,
        url: line,
        directThumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      });
    } else if (line.match(/^[a-zA-Z0-9_-]{25,45}$/) && !seenIds.has(line)) {
      seenIds.add(line);
      results.push({
        id: line,
        url: `https://drive.google.com/file/d/${line}/view`,
        directThumbnailUrl: `https://drive.google.com/thumbnail?id=${line}&sz=w1000`,
      });
    }
  }

  // Also catch any embedded /file/d/ links in raw pasted text blocks
  const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const fileId = match[1];
    if (!seenIds.has(fileId)) {
      seenIds.add(fileId);
      results.push({
        id: fileId,
        url: `https://drive.google.com/file/d/${fileId}/view`,
        directThumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      });
    }
  }

  return results;
}

/**
 * Takes an image URL (such as a Google Drive high-resolution thumbnail or web link),
 * loads it into an off-screen canvas, center-crops and scales it to the required 1000 × 500 dimensions (2:1).
 * If browser CORS prevents canvas reading, it safely resolves the direct 1000px wide URL.
 */
export function cropAndScaleImageUrlTo1000x500(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve('');
    if (imageUrl.startsWith('data:')) return resolve(imageUrl);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const targetWidth = 1000;
        const targetHeight = 500;
        const targetAspect = targetWidth / targetHeight; // 2.0 (1000x500)
        const imgAspect = img.width / img.height;

        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (imgAspect > targetAspect) {
          sw = Math.round(img.height * targetAspect);
          sx = Math.round((img.width - sw) / 2);
        } else {
          sh = Math.round(img.width / targetAspect);
          sy = Math.round((img.height - sh) / 2);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          return resolve(compressed);
        }
        resolve(imageUrl);
      } catch {
        // Fall back gracefully to direct 1000px thumbnail URL if CORS restriction triggers
        resolve(imageUrl);
      }
    };
    img.onerror = () => {
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
}

/**
 * Automatically scales and center-crops any selected image file to the exact
 * 1000 × 500 aspect ratio (2:1). Returns a high-quality JPEG DataURL.
 */
export function cropAndScaleTo1000x500(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      const img = new Image();
      img.onload = () => {
        const targetWidth = 1000;
        const targetHeight = 500;
        const targetAspect = targetWidth / targetHeight; // 2.0 (1000x500)
        const imgAspect = img.width / img.height;

        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (imgAspect > targetAspect) {
          // Source image is wider than 2:1 -> center-crop horizontally
          sw = Math.round(img.height * targetAspect);
          sx = Math.round((img.width - sw) / 2);
        } else {
          // Source image is taller than 2:1 -> center-crop vertically
          sh = Math.round(img.width / targetAspect);
          sy = Math.round((img.height - sh) / 2);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressed);
        } else {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Formats a clean, readable exhibition title from the raw uploaded image filename.
 */
export function formatTitleFromFileName(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return 'BNHS Research Exhibition';
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  onBulkSaveGalleryItems?: (
    items: Omit<ResearchGalleryItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>[]
  ) => Promise<void>;
  onDeleteGalleryItem?: (itemId: string) => Promise<void>;
  onDeleteAllGalleryItems?: () => Promise<void>;
  onResetGalleryDefaults?: () => Promise<void>;
  informationItems?: ResearchInformationItemRecord[];
  onSaveInformationItem?: (
    item: Omit<ResearchInformationItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>
  ) => Promise<void>;
  onDeleteInformationItem?: (itemId: string) => Promise<void>;
}

export interface BulkUploadProgress {
  total: number;
  current: number;
  percentage: number;
  currentFileName: string;
  status: 'processing' | 'saving' | 'complete';
}

export interface BulkUploadSummary {
  count: number;
  timestamp: string;
  titles: string[];
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
  onBulkSaveGalleryItems,
  onDeleteGalleryItem,
  onDeleteAllGalleryItems,
  onResetGalleryDefaults,
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
  const [confirmDeleteAllGal, setConfirmDeleteAllGal] = useState<boolean>(false);
  const [deletingGalleryBusy, setDeletingGalleryBusy] = useState<boolean>(false);

  // Bulk Image Upload Progress & Summary Notification State (1000 x 500)
  const [bulkProgress, setBulkProgress] = useState<BulkUploadProgress | null>(null);
  const [bulkSummaryNotification, setBulkSummaryNotification] = useState<BulkUploadSummary | null>(null);

  // Gallery Upload Mode ('local' = Local Device Files, 'gdrive' = Google Drive Importer)
  const [galleryUploadMode, setGalleryUploadMode] = useState<'local' | 'gdrive'>('local');
  const [gdriveBulkInput, setGdriveBulkInput] = useState<string>('');
  const [gdriveCustomTitle, setGdriveCustomTitle] = useState<string>('');
  const [isProcessingGDrive, setIsProcessingGDrive] = useState<boolean>(false);

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
    setOvCode(
      item.code === 'DepEd Caraga · Division of Surigao del S'
        ? 'DepEd Caraga · Division of Surigao del Sur'
        : item.code
    );
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

  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await cropAndScaleTo1000x500(file);
      setGalImageUrl(compressed);
      if (!galTitle.trim()) {
        setGalTitle(formatTitleFromFileName(file.name));
      }
    } catch {
      // Fallback in case of processing error
      const reader = new FileReader();
      reader.onload = (event) => {
        setGalImageUrl(String(event.target?.result || ''));
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Bulk Upload: processes multiple selected image files, scaling each to 1000 × 500,
   * showing visual progress, and issuing a summary notification upon completion.
   */
  const handleBulkGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    // Reset file input so user can re-select the same files if desired
    e.target.value = '';

    setGalFeedback('');
    setBulkSummaryNotification(null);

    const highestOrder = galleryItems.reduce(
      (max, item) => Math.max(max, item.displayOrder || 0),
      0
    );
    const processedItems: Omit<
      ResearchGalleryItemRecord,
      'portalId' | 'createdAtIso' | 'updatedAtIso'
    >[] = [];

    setBulkProgress({
      total: files.length,
      current: 0,
      percentage: 5,
      currentFileName: files[0].name,
      status: 'processing',
    });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setBulkProgress({
          total: files.length,
          current: i,
          percentage: Math.round((i / files.length) * 85) + 5,
          currentFileName: file.name,
          status: 'processing',
        });

        // Guaranteed exact 1000x500 aspect ratio conversion
        const dataUrl = await cropAndScaleTo1000x500(file);
        const title = formatTitleFromFileName(file.name);
        const order = highestOrder + i + 1;
        const id = `gallery_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;

        const itemPayload: Omit<
          ResearchGalleryItemRecord,
          'portalId' | 'createdAtIso' | 'updatedAtIso'
        > = {
          id,
          title,
          caption: `Research activity and scientific exhibition documentation at Barobo National High School (1000 × 500).`,
          imageUrl: dataUrl,
          displayOrder: order,
          isDeleted: false,
        };

        processedItems.push(itemPayload);

        // If no batch save handler provided, save individual item
        if (!onBulkSaveGalleryItems && onSaveGalleryItem) {
          await onSaveGalleryItem(itemPayload);
        }

        // Brief delay for smooth visual progress bar animation
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      setBulkProgress({
        total: files.length,
        current: files.length,
        percentage: 95,
        currentFileName: 'Saving to Gallery Database...',
        status: 'saving',
      });

      if (onBulkSaveGalleryItems) {
        await onBulkSaveGalleryItems(processedItems);
      }

      setBulkProgress({
        total: files.length,
        current: files.length,
        percentage: 100,
        currentFileName: 'Completed!',
        status: 'complete',
      });

      const summary: BulkUploadSummary = {
        count: files.length,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        titles: processedItems.map((p) => p.title),
      };

      setBulkSummaryNotification(summary);
      setGalFeedback(
        `Successfully uploaded ${files.length} images to the Research Gallery (all defaulted to 1000 × 500 aspect ratio).`
      );
    } catch (err) {
      setGalFeedback(
        `Error during bulk image upload: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setTimeout(() => {
        setBulkProgress(null);
      }, 3000);
    }
  };

  const handleBulkGoogleDriveUpload = async () => {
    const detectedLinks = extractGoogleDriveLinks(gdriveBulkInput);
    if (detectedLinks.length === 0) {
      setGalFeedback(
        'No valid Google Drive image links detected. Please paste one or more Google Drive sharing links (e.g., https://drive.google.com/file/d/.../view).'
      );
      return;
    }

    setIsProcessingGDrive(true);
    setGalFeedback('');
    setBulkSummaryNotification(null);

    const total = detectedLinks.length;
    setBulkProgress({
      total,
      current: 0,
      percentage: 5,
      currentFileName: 'Connecting to Google Drive...',
      status: 'processing',
    });

    try {
      const processedItems: Omit<
        ResearchGalleryItemRecord,
        'portalId' | 'createdAtIso' | 'updatedAtIso'
      >[] = [];

      for (let i = 0; i < total; i++) {
        const link = detectedLinks[i];
        const currentNum = i + 1;
        const progressPct = Math.min(92, Math.round(((i + 1) / total) * 90));

        setBulkProgress({
          total,
          current: i,
          percentage: progressPct,
          currentFileName: `Google Drive Photo #${currentNum} (ID: ${link.id.slice(0, 8)}...)`,
          status: 'processing',
        });

        // Center-crop and scale to 1000 × 500 (or resolve direct high-res 1000px thumbnail)
        const finalImageUrl = await cropAndScaleImageUrlTo1000x500(link.directThumbnailUrl);

        const cleanTitle = gdriveCustomTitle.trim()
          ? `${gdriveCustomTitle.trim()} - Exhibit ${currentNum}`
          : `BNHS Research Exhibition - Google Drive Photo ${currentNum}`;

        const itemPayload: Omit<
          ResearchGalleryItemRecord,
          'portalId' | 'createdAtIso' | 'updatedAtIso'
        > = {
          id: `gal_gdrive_${Date.now()}_${i}_${link.id.slice(0, 8)}`,
          title: cleanTitle,
          caption: `Barobo National High School Research Gallery - Imported from Google Drive (Formatted to 1000 × 500 Aspect Ratio).`,
          imageUrl: finalImageUrl,
          displayOrder: (galleryItems.length || 0) + i + 1,
          isDeleted: false,
        };

        processedItems.push(itemPayload);

        // If no batch save handler provided, save individual item
        if (!onBulkSaveGalleryItems && onSaveGalleryItem) {
          await onSaveGalleryItem(itemPayload);
        }

        // Brief delay for smooth visual progress bar animation
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      setBulkProgress({
        total,
        current: total,
        percentage: 95,
        currentFileName: 'Saving Google Drive Images to Database...',
        status: 'saving',
      });

      if (onBulkSaveGalleryItems) {
        await onBulkSaveGalleryItems(processedItems);
      }

      setBulkProgress({
        total,
        current: total,
        percentage: 100,
        currentFileName: 'Completed!',
        status: 'complete',
      });

      const summary: BulkUploadSummary = {
        count: total,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        titles: processedItems.map((p) => p.title),
      };

      setBulkSummaryNotification(summary);
      setGalFeedback(
        `Successfully uploaded ${total} images from Google Drive to the Research Gallery (all defaulted to 1000 × 500 aspect ratio).`
      );
      setGdriveBulkInput('');
    } catch (err) {
      setGalFeedback(
        `Error during Google Drive bulk import: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsProcessingGDrive(false);
      setTimeout(() => {
        setBulkProgress(null);
      }, 3500);
    }
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

  const detectedGDriveLinks = extractGoogleDriveLinks(gdriveBulkInput);

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
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-zinc-200 pb-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="text-xs text-[#6B1420] font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Research Gallery Manager · 1000 × 500 Dimensions · 10s Slideshow</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-zinc-900">
                  Research Gallery Pictures (Upload, Edit, Delete &amp; 1000 × 500 Sizing)
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Manage the sliding pictures shown on the Overview page below the Hero Banner and before the Total Indexed Studies section. Automatically changes every 10 seconds with exact 1000 by 500 dimensions.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-[#6B1420] font-semibold">
                    Current Active Pictures: {galleryItems.length}
                  </span>
                  <span>·</span>
                  <span>1000 × 500 Canvas Enforced</span>
                </div>
              </div>

              {/* Button Menu Arranged in a Clean Column */}
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-72 lg:w-80 bg-[#FAF9F5] border border-zinc-200 p-3 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-200">
                  <span>Gallery Menu Actions</span>
                  <span className="font-mono text-[10px] text-zinc-400">1000 × 500</span>
                </div>

                <button
                  type="button"
                  onClick={openAddGalleryItem}
                  className="inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors shadow-xs w-full text-left"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Single Picture (1000 × 500)</span>
                  </span>
                </button>

                <label className="inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 cursor-pointer transition-colors shadow-xs w-full text-left">
                  <span className="flex items-center gap-2">
                    <Images className="w-3.5 h-3.5" />
                    <span>Bulk Upload Pictures (Device)</span>
                  </span>
                  <span className="text-[10px] bg-amber-900/40 px-1.5 py-0.5 rounded-xs font-mono">1000×500</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBulkGalleryUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setGalleryUploadMode('gdrive');
                    setIsGalleryFormOpen(false);
                  }}
                  className={`inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold border transition-colors shadow-xs w-full text-left ${
                    galleryUploadMode === 'gdrive'
                      ? 'bg-emerald-800 text-white border-emerald-900 ring-1 ring-emerald-500'
                      : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Upload in Google Drive (Bulk / Link)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-xs font-mono">Drive</span>
                </button>

                {onResetGalleryDefaults && (
                  <button
                    type="button"
                    disabled={deletingGalleryBusy}
                    onClick={async () => {
                      setDeletingGalleryBusy(true);
                      setConfirmDeleteAllGal(false);
                      setConfirmDeleteGalId(null);
                      try {
                        await onResetGalleryDefaults();
                        setGalFeedback('Default Research Gallery pictures (1000 × 500) have been restored.');
                      } finally {
                        setDeletingGalleryBusy(false);
                      }
                    }}
                    className="inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 transition-colors w-full text-left"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Restore Default Pictures</span>
                    </span>
                  </button>
                )}

                {onDeleteAllGalleryItems && galleryItems.length > 0 && (
                  confirmDeleteAllGal ? (
                    <div className="flex flex-col gap-1.5 bg-red-50 border border-red-200 p-2.5 w-full">
                      <span className="text-[11px] font-semibold text-red-800 text-center">
                        Delete all {galleryItems.length} pictures?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={deletingGalleryBusy}
                          onClick={async () => {
                            setDeletingGalleryBusy(true);
                            try {
                              await onDeleteAllGalleryItems();
                              setConfirmDeleteAllGal(false);
                              setConfirmDeleteGalId(null);
                              setGalFeedback('All Research Gallery pictures have been deleted.');
                            } finally {
                              setDeletingGalleryBusy(false);
                            }
                          }}
                          className="flex-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 text-center"
                        >
                          {deletingGalleryBusy ? 'Deleting...' : 'Yes, Delete All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAllGal(false)}
                          className="px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-300 bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={deletingGalleryBusy}
                      onClick={() => setConfirmDeleteAllGal(true)}
                      className="inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors w-full text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete All Pictures ({galleryItems.length})</span>
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Visual Progress Bar for Bulk Upload */}
            {bulkProgress && (
              <div className="p-4 bg-white border border-[#6B1420]/30 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900">
                    {bulkProgress.status === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#6B1420] animate-pulse" />
                    )}
                    <span>
                      {bulkProgress.status === 'complete'
                        ? `Bulk Upload Completed (${bulkProgress.total} of ${bulkProgress.total} images)`
                        : bulkProgress.status === 'saving'
                        ? `Saving Images to Database (${bulkProgress.total} images)...`
                        : `Processing & Scaling Images (${bulkProgress.current + 1} of ${bulkProgress.total})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-50 border border-rose-200 text-[#6B1420] font-semibold">
                      1000 × 500 Aspect Ratio Guaranteed
                    </span>
                    <span className="font-mono font-bold text-xs text-zinc-800">
                      {bulkProgress.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div
                    className={`h-full transition-all duration-300 ease-out rounded-full ${
                      bulkProgress.status === 'complete'
                        ? 'bg-emerald-600'
                        : 'bg-gradient-to-r from-[#6B1420] via-rose-700 to-amber-500'
                    }`}
                    style={{ width: `${bulkProgress.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="truncate max-w-md">
                    {bulkProgress.status === 'complete' ? (
                      <span className="text-emerald-700 font-medium">
                        All photos scaled to 1000 × 500 and saved.
                      </span>
                    ) : (
                      <span>
                        Currently processing:{' '}
                        <strong className="text-zinc-700">
                          {bulkProgress.currentFileName}
                        </strong>
                      </span>
                    )}
                  </span>
                  <span>
                    {bulkProgress.current} / {bulkProgress.total} photos
                  </span>
                </div>
              </div>
            )}

            {/* 'Successfully uploaded X images' Summary Notification */}
            {bulkSummaryNotification && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold flex items-center flex-wrap gap-2 text-emerald-900">
                      <span>
                        Successfully uploaded {bulkSummaryNotification.count} images
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-200/60 text-emerald-900 rounded-xs font-semibold">
                        1000 × 500 Aspect Ratio
                      </span>
                      <span className="text-[11px] text-emerald-700 font-normal">
                        at {bulkSummaryNotification.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      All {bulkSummaryNotification.count} images were automatically center-cropped and scaled to the required 1000 × 500 dimensions and added to the Research Gallery slideshow.
                    </p>
                    {bulkSummaryNotification.titles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {bulkSummaryNotification.titles.slice(0, 8).map((title, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] bg-white border border-emerald-200 px-2 py-0.5 text-emerald-900 font-medium rounded-xs"
                          >
                            <span>{title}</span>
                          </span>
                        ))}
                        {bulkSummaryNotification.titles.length > 8 && (
                          <span className="text-[10px] text-emerald-700 font-semibold self-center">
                            +{bulkSummaryNotification.titles.length - 8} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkSummaryNotification(null)}
                  className="self-start md:self-center px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-950 bg-emerald-200/60 hover:bg-emerald-200 transition-colors shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {galFeedback && !bulkSummaryNotification && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{galFeedback}</span>
              </div>
            )}

            {/* Gallery Upload Methods: Local Files vs Google Drive Importer */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-2.5">
                <div className="inline-flex rounded-xs border border-zinc-300 p-0.5 bg-zinc-100">
                  <button
                    type="button"
                    onClick={() => setGalleryUploadMode('local')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                      galleryUploadMode === 'local'
                        ? 'bg-white text-[#6B1420] shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Method 1: Local Device Files (Bulk 1000 × 500)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryUploadMode('gdrive')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                      galleryUploadMode === 'gdrive'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-zinc-700 hover:text-emerald-800'
                    }`}
                  >
                    <FolderUp className="w-3.5 h-3.5 text-amber-300" />
                    <span>Method 2: Upload in Google Drive (Bulk / Link)</span>
                    <span className="text-[10px] bg-amber-400 text-zinc-950 font-bold px-1.5 py-0.2 rounded-xs">
                      NEW
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-[#6B1420] font-semibold">
                    1000 × 500 Aspect Ratio Guaranteed
                  </span>
                </div>
              </div>

              {/* METHOD 1: Local Device Bulk Image Selection Card */}
              {galleryUploadMode === 'local' && (
                <div className="bg-[#FAF9F5] border border-dashed border-zinc-300 p-5 text-center hover:border-[#6B1420] transition-colors">
                  <div className="max-w-xl mx-auto space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-[#6B1420] mx-auto flex items-center justify-center">
                      <Images className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-semibold text-zinc-900">
                        Bulk Image Selection &amp; Auto-1000×500 Sizing
                      </h4>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Select multiple research exhibition photos, fieldwork snapshots, or STEM project images from your computer. Every photo will default to the required 1000 × 500 aspect ratio with real-time progress.
                      </p>
                    </div>
                    <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                      <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Multiple Images to Upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleBulkGalleryUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setGalleryUploadMode('gdrive')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                      >
                        <FolderUp className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Or Import from Google Drive</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 2: Google Drive Bulk Image Importer (Auto 1000 x 500 Sizing) */}
              {galleryUploadMode === 'gdrive' && (
                <div className="bg-emerald-50/40 border border-emerald-300 p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
                        <FolderUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-display font-semibold text-emerald-950">
                            Upload &amp; Import from Google Drive (Auto-1000×500 Sizing)
                          </h4>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xs">
                            1000 × 500 Aspect Ratio
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Paste Google Drive photo sharing links. Our processor automatically crops and scales each picture to the exact 1000 × 500 aspect ratio with real-time visual progress.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-100/80 transition-colors shadow-xs shrink-0 self-start sm:self-center"
                      title="Open Google Drive to upload photos or copy links"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Open Google Drive (drive.google.com)</span>
                    </a>
                  </div>

                  {/* 3 Quick Steps Guidance */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-emerald-900 bg-white/90 border border-emerald-200 p-3">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">1</span>
                      <span>Upload photos to your Google Drive folder</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">2</span>
                      <span>Set link sharing to <strong>Anyone with the link can view</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">3</span>
                      <span>Paste link(s) below — single or multiple photos at once</span>
                    </div>
                  </div>

                  {/* Textarea for Multi-Link Paste */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-emerald-950 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Paste Google Drive Image Links (Single or Multiple)</span>
                      </label>
                      <div>
                        {detectedGDriveLinks.length > 0 ? (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 border border-emerald-300">
                            ✓ {detectedGDriveLinks.length} Google Drive photo{detectedGDriveLinks.length > 1 ? 's' : ''} detected &amp; ready
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">
                            Paste links separated by line breaks or commas
                          </span>
                        )}
                      </div>
                    </div>

                    <textarea
                      rows={4}
                      value={gdriveBulkInput}
                      onChange={(e) => setGdriveBulkInput(e.target.value)}
                      placeholder={`https://drive.google.com/file/d/1A2B3C4D5E.../view?usp=sharing\nhttps://drive.google.com/file/d/2F3G4H5J6K.../view?usp=sharing\nhttps://drive.google.com/open?id=3L4M5N6P7Q...`}
                      className="w-full px-3 py-2 text-xs font-mono border border-emerald-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Optional Custom Title and Import Button */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-7">
                      <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                        Custom Exhibition Title Prefix (Optional)
                      </label>
                      <input
                        type="text"
                        value={gdriveCustomTitle}
                        onChange={(e) => setGdriveCustomTitle(e.target.value)}
                        placeholder="e.g., BNHS Science &amp; Innovation Expo 2026"
                        className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white"
                      />
                    </div>
                    <div className="md:col-span-5 flex items-end">
                      <button
                        type="button"
                        disabled={detectedGDriveLinks.length === 0 || isProcessingGDrive}
                        onClick={handleBulkGoogleDriveUpload}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                      >
                        <FolderUp className="w-3.5 h-3.5" />
                        <span>
                          {isProcessingGDrive
                            ? 'Processing & Scaling to 1000 × 500...'
                            : detectedGDriveLinks.length > 0
                            ? `Import ${detectedGDriveLinks.length} Google Drive Photos (1000 × 500)`
                            : 'Import Google Drive Photos (1000 × 500)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Instant 1000 x 500 Preview Grid for Detected Google Drive Links */}
                  {detectedGDriveLinks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-emerald-200">
                      <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                        <span>Instant 1000 × 500 Preview of Detected Photos:</span>
                        <span className="font-mono text-emerald-800">
                          {detectedGDriveLinks.length} ready to format &amp; import
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1 bg-white border border-emerald-200">
                        {detectedGDriveLinks.map((item, idx) => (
                          <div
                            key={item.id + idx}
                            className="border border-emerald-100 bg-[#FAF9F5] p-1.5 space-y-1 shadow-2xs"
                          >
                            <div className="w-full aspect-[1000/500] bg-zinc-900 overflow-hidden relative">
                              <img
                                src={item.directThumbnailUrl}
                                alt={`Google Drive photo ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-1 right-1 text-[9px] font-mono px-1 py-0.2 bg-black/75 text-white">
                                1000 × 500
                              </span>
                            </div>
                            <div className="text-[10px] font-semibold text-zinc-800 truncate">
                              {gdriveCustomTitle.trim()
                                ? `${gdriveCustomTitle.trim()} - #${idx + 1}`
                                : `Drive Photo #${idx + 1}`}
                            </div>
                            <div className="text-[9px] font-mono text-zinc-500 truncate">
                              ID: {item.id.slice(0, 14)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                          <span>Upload &amp; Scale to 1000 × 500 (or select multiple)</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 1) {
                                setIsGalleryFormOpen(false);
                                handleBulkGalleryUpload(e);
                              } else {
                                handleGalleryPhotoUpload(e);
                              }
                            }}
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

                    <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                          <FolderUp className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Option 2: Google Drive Photo Sharing Link (Auto 1000 × 500 Sizing)</span>
                        </label>
                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-800 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Drive</span>
                        </a>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="url"
                          value={galWebLinkInput}
                          onChange={(e) => {
                            setGalWebLinkInput(e.target.value);
                            setGalImageUrl(resolveOverviewImageLink(e.target.value));
                          }}
                          placeholder="Paste Google Drive link (https://drive.google.com/file/d/...) or web image URL"
                          className="flex-1 px-3 py-2 text-xs border border-zinc-300 bg-[#FAF9F5] focus:outline-none focus:border-emerald-700"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const resolved = resolveOverviewImageLink(galWebLinkInput);
                            setGalImageUrl(resolved);
                            try {
                              const scaled = await cropAndScaleImageUrlTo1000x500(resolved);
                              if (scaled) setGalImageUrl(scaled);
                            } catch {
                              // ignore
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply &amp; Scale (1000 × 500)</span>
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
            {galleryItems.length === 0 ? (
              <div className="p-8 bg-[#FAF9F5] border border-dashed border-zinc-300 text-center space-y-3">
                <ImageIcon className="w-8 h-8 text-zinc-400 mx-auto" />
                <div className="text-sm font-display font-semibold text-zinc-800">
                  No Pictures in Research Gallery
                </div>
                <p className="text-xs text-zinc-600 max-w-md mx-auto">
                  All gallery pictures have been removed. Click &ldquo;Add Picture to Gallery (1000 × 500)&rdquo; to upload new sliding photos, or click &ldquo;Restore Default Pictures&rdquo; above.
                </p>
              </div>
            ) : (
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
                            disabled={deletingGalleryBusy}
                            onClick={async () => {
                              if (onDeleteGalleryItem) {
                                setDeletingGalleryBusy(true);
                                try {
                                  await onDeleteGalleryItem(item.id);
                                  setConfirmDeleteGalId(null);
                                  setGalFeedback(`Deleted picture "${item.title}" from Gallery.`);
                                } finally {
                                  setDeletingGalleryBusy(false);
                                }
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50"
                          >
                            {deletingGalleryBusy ? 'Deleting...' : 'Confirm'}
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
                          disabled={deletingGalleryBusy}
                          onClick={() => setConfirmDeleteGalId(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
