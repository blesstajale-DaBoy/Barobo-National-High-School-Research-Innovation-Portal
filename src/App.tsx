/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Search,
  Plus,
  Download,
  FileText,
  ExternalLink,
  BookOpen,
  Users,
  ShieldCheck,
  LogIn,
  LogOut,
  FolderOpen,
  ArrowUpRight,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Check,
  Bell,
  BellRing,
  MessageSquare,
  Edit3,
  Trash2,
  Mail,
  Image as ImageIcon,
  CloudCheck,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  db,
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  signInWithGooglePopup,
  signOutUser,
  sanitizeId,
  serverTimestamp,
} from './lib/firebase';
import {
  ResearchDivisionId,
  ResearchRecord,
  ResearchStatus,
  ResearcherProfileRecord,
  ResearchCommentRecord,
  ResearchSubscriptionRecord,
  EmailAlertLogRecord,
  OverviewItemRecord,
  ResearchGalleryItemRecord,
  ResearchInformationItemRecord,
  BASIC_RESEARCH_CATEGORIES,
  ACTION_RESEARCH_THEMES,
  TUKLAS_CATEGORIES,
  INITIAL_BNHS_RESEARCHES,
  INITIAL_BNHS_RESEARCHERS,
  INITIAL_BNHS_COMMENTS,
  INITIAL_OVERVIEW_ITEMS,
  INITIAL_RESEARCH_GALLERY,
  INITIAL_RESEARCH_INFORMATION,
  PORTAL_IMAGES,
  getCategoriesForDivision,
} from './data/bnhsTaxonomy';
import {
  downloadResearchDossierHtml,
  downloadManuscriptWordDoc,
  downloadResearchInventoryCsv,
  downloadStandalonePortalHtml,
  downloadDataUrlFile,
  getDivisionLabel,
} from './utils/reportExporter';
import { ResearchSubmissionModal } from './components/ResearchSubmissionModal';
import { ResearchDetailModal } from './components/ResearchDetailModal';
import { ResearcherProfilesView } from './components/ResearcherProfilesView';
import {
  AdminEvaluationView,
  resolveOverviewImageLink,
} from './components/AdminEvaluationView';
import { ResearchGallerySection } from './components/ResearchGallerySection';
import { ResearchInformationSection } from './components/ResearchInformationSection';
import { LatestAdditionsWidget } from './components/LatestAdditionsWidget';
import { NotifyMeModal } from './components/NotifyMeModal';
import { OverviewAnalyticsSection } from './components/OverviewAnalyticsSection';
import {
  BnhsPortalLoginModal,
  BnhsPortalUserSession,
} from './components/BnhsPortalLoginModal';

type ActiveSection =
  | 'overview'
  | 'basic'
  | 'action'
  | 'tuklas'
  | 'directory';

const LOCAL_SUBSCRIPTIONS_KEY = 'bnhs_notify_subscriptions_v1';
const LOCAL_EMAIL_ALERTS_KEY = 'bnhs_email_alerts_log_v1';
const LOCAL_OVERVIEW_ITEMS_KEY = 'bnhs_overview_items_v1';
const LOCAL_RESEARCH_GALLERY_KEY = 'bnhs_research_gallery_v1';
const LOCAL_DELETED_GALLERY_IDS_KEY = 'bnhs_deleted_gallery_ids_v1';
const LOCAL_RESEARCH_INFO_KEY = 'bnhs_research_info_v1';
const LOCAL_DELETED_INFO_IDS_KEY = 'bnhs_deleted_info_ids_v1';
const LOCAL_RESEARCH_OVERRIDES_KEY = 'bnhs_local_researches_v1';
const LOCAL_DELETED_RESEARCH_IDS_KEY = 'bnhs_deleted_research_ids_v1';
const LOCAL_COMMENTS_KEY = 'bnhs_local_comments_v1';
const LOCAL_PROFILES_KEY = 'bnhs_local_profiles_v1';
const LOCAL_DELETED_PROFILE_IDS_KEY = 'bnhs_deleted_profile_ids_v1';
const LOCAL_PORTAL_SESSION_KEY = 'bnhs_portal_user_session_v1';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [portalSession, setPortalSession] = useState<BnhsPortalUserSession | null>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_PORTAL_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isCustomAdminDoc, setIsCustomAdminDoc] = useState<boolean>(false);

  const [cloudResearches, setCloudResearches] = useState<ResearchRecord[]>([]);
  const [cloudProfiles, setCloudProfiles] = useState<ResearcherProfileRecord[]>([]);
  const [cloudComments, setCloudComments] = useState<ResearchCommentRecord[]>([]);
  const [cloudSubscriptions, setCloudSubscriptions] = useState<ResearchSubscriptionRecord[]>([]);
  const [cloudOverviewItems, setCloudOverviewItems] = useState<OverviewItemRecord[]>([]);
  const [cloudGalleryItems, setCloudGalleryItems] = useState<ResearchGalleryItemRecord[]>([]);
  const [cloudInformationItems, setCloudInformationItems] = useState<ResearchInformationItemRecord[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [initialCloudLoaded, setInitialCloudLoaded] = useState<boolean>(false);
  const hasMountedRef = useRef<boolean>(false);
  const hasBootSyncedRef = useRef<boolean>(false);
  const syncTimerRef = useRef<number | null>(null);

  // Local state mirrors so edits, deletes, comments, overview changes, and Notify Me work seamlessly
  const [localResearches, setLocalResearches] = useState<ResearchRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_RESEARCH_OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [deletedResearchIds, setDeletedResearchIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_DELETED_RESEARCH_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [localComments, setLocalComments] = useState<ResearchCommentRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [localSubscriptions, setLocalSubscriptions] = useState<ResearchSubscriptionRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBSCRIPTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [emailAlertLogs, setEmailAlertLogs] = useState<EmailAlertLogRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_EMAIL_ALERTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [localOverviewItems, setLocalOverviewItems] = useState<OverviewItemRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_OVERVIEW_ITEMS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [localGalleryItems, setLocalGalleryItems] = useState<ResearchGalleryItemRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_RESEARCH_GALLERY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [deletedGalleryIds, setDeletedGalleryIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_DELETED_GALLERY_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [localInformationItems, setLocalInformationItems] = useState<ResearchInformationItemRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_RESEARCH_INFO_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [deletedInformationIds, setDeletedInformationIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_DELETED_INFO_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [localProfiles, setLocalProfiles] = useState<ResearcherProfileRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [deletedProfileIds, setDeletedProfileIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_DELETED_PROFILE_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [directoryTab, setDirectoryTab] = useState<'researchers' | 'admin'>('researchers');

  // Repository Filter States
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<'all' | ResearchDivisionId>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedSchoolYears, setSelectedSchoolYears] = useState<string[]>([]);
  const [uploadDateFrom, setUploadDateFrom] = useState<string>('');
  const [uploadDateTo, setUploadDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Notifications
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [submitModalDivision, setSubmitModalDivision] = useState<ResearchDivisionId>('basic');
  const [editingRecord, setEditingRecord] = useState<ResearchRecord | null>(null);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<ResearchRecord | null>(null);
  const [notifyTargetRecord, setNotifyTargetRecord] = useState<ResearchRecord | null>(null);
  const [confirmDeleteCardId, setConfirmDeleteCardId] = useState<string | null>(null);
  const [toastBanner, setToastBanner] = useState<string>('');
  const [latestEmailAlertBanner, setLatestEmailAlertBanner] = useState<EmailAlertLogRecord | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [cloudSyncState, setCloudSyncState] = useState<'synced' | 'syncing' | 'auto_saved'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const markAutoSynced = () => {
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
    setCloudSyncState('syncing');
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    syncTimerRef.current = window.setTimeout(() => {
      setLastSyncedTime(timeLabel);
      setCloudSyncState('synced');
      syncTimerRef.current = null;
    }, 250);
  };

  // Persist local state mirrors & update Cloud Synced timestamp automatically on any change after mount
  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_RESEARCH_OVERRIDES_KEY, JSON.stringify(localResearches));
      markAutoSynced();
    } catch {
      // ignore storage quota errors
    }
  }, [localResearches]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_DELETED_RESEARCH_IDS_KEY, JSON.stringify(deletedResearchIds));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [deletedResearchIds]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(localComments));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [localComments]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_SUBSCRIPTIONS_KEY, JSON.stringify(localSubscriptions));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [localSubscriptions]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_EMAIL_ALERTS_KEY, JSON.stringify(emailAlertLogs));
    } catch {
      // ignore
    }
  }, [emailAlertLogs]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_OVERVIEW_ITEMS_KEY, JSON.stringify(localOverviewItems));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [localOverviewItems]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_RESEARCH_GALLERY_KEY, JSON.stringify(localGalleryItems));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [localGalleryItems]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_DELETED_GALLERY_IDS_KEY, JSON.stringify(deletedGalleryIds));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [deletedGalleryIds]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_RESEARCH_INFO_KEY, JSON.stringify(localInformationItems));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [localInformationItems]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_DELETED_INFO_IDS_KEY, JSON.stringify(deletedInformationIds));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [deletedInformationIds]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(localProfiles));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [localProfiles]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    try {
      localStorage.setItem(LOCAL_DELETED_PROFILE_IDS_KEY, JSON.stringify(deletedProfileIds));
      markAutoSynced();
    } catch {
      // ignore
    }
  }, [deletedProfileIds]);

  useEffect(() => {
    hasMountedRef.current = true;
    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // Automatically update copyright year on January 1st rollover without requiring page reload
  useEffect(() => {
    const checkYearRollover = () => {
      const latestYear = new Date().getFullYear();
      setCurrentYear((prev) => (prev !== latestYear ? latestYear : prev));
    };
    const intervalId = window.setInterval(checkYearRollover, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const showToast = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((prev) => (prev === msg ? '' : prev));
    }, 5500);
  };

  // Persist BNHS Portal Login Session across reloads & live published links
  useEffect(() => {
    try {
      if (portalSession) {
        localStorage.setItem(LOCAL_PORTAL_SESSION_KEY, JSON.stringify(portalSession));
      } else {
        localStorage.removeItem(LOCAL_PORTAL_SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }, [portalSession]);

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          setIsCustomAdminDoc(adminSnap.exists());
        } catch {
          setIsCustomAdminDoc(false);
        }
      } else {
        setIsCustomAdminDoc(false);
      }
    });
    return () => unsub();
  }, []);

  const currentUser = useMemo(() => {
    if (firebaseUser) {
      return {
        uid: firebaseUser.uid,
        displayName:
          portalSession?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Barobo NHS User',
        email: firebaseUser.email || portalSession?.email || '',
        emailVerified: firebaseUser.emailVerified,
        accountClassification:
          portalSession?.accountClassification ||
          (firebaseUser.email === BOOTSTRAPPED_ADMIN_EMAIL
            ? 'Administrator / Research Coordinator'
            : 'Teacher / Student Account'),
      };
    }
    if (portalSession) {
      return {
        uid: portalSession.uid,
        displayName: portalSession.displayName,
        email: portalSession.email,
        emailVerified: true,
        accountClassification: portalSession.accountClassification,
      };
    }
    return null;
  }, [firebaseUser, portalSession]);

  const isCloudAdmin = useMemo(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) return false;
    return (
      firebaseUser.email === BOOTSTRAPPED_ADMIN_EMAIL || isCustomAdminDoc
    );
  }, [firebaseUser, isCustomAdminDoc]);

  const isAdmin = useMemo(() => {
    if (isCloudAdmin) return true;
    if (portalSession?.isAdmin) return true;
    if (
      currentUser?.email &&
      currentUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
    ) {
      return true;
    }
    return false;
  }, [isCloudAdmin, portalSession, currentUser]);

  // 2. Real-time Firestore Listeners for /researches, /researchers, /research_comments, /overview_items (scoped by portalId == 'bnhs')
  useEffect(() => {
    const researchesPath = 'researches';
    const qResearches = query(
      collection(db, researchesPath),
      where('portalId', '==', 'bnhs')
    );

    const unsubResearches = onSnapshot(
      qResearches,
      (snapshot) => {
        const list: ResearchRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            title: String(d.title || ''),
            division: (d.division as ResearchDivisionId) || 'basic',
            category: String(d.category || ''),
            subcategory: String(d.subcategory || ''),
            abstract: String(d.abstract || ''),
            keywords: String(d.keywords || ''),
            authors: String(d.authors || ''),
            authorRole: (d.authorRole as 'Teacher' | 'Student' | 'Collaborative') || 'Teacher',
            adviser: String(d.adviser || ''),
            departmentOrGrade: String(d.departmentOrGrade || ''),
            schoolYear: String(d.schoolYear || '2026-2027'),
            status: (d.status as ResearchStatus) || 'Pending Review',
            methodology: String(d.methodology || ''),
            keyFindings: String(d.keyFindings || ''),
            attachmentName: String(d.attachmentName || ''),
            attachmentType: String(d.attachmentType || 'application/pdf'),
            attachmentSize: Number(d.attachmentSize || 0),
            fileDocId: String(d.fileDocId || ''),
            driveUrl: String(d.driveUrl || ''),
            evaluationScore: Number(d.evaluationScore || 0),
            evaluationRemarks: String(d.evaluationRemarks || ''),
            evaluatedBy: String(d.evaluatedBy || ''),
            authorUid: String(d.authorUid || ''),
            createdAtIso: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            updatedAtIso: d.updatedAt?.toDate
              ? d.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
            isBaseline: false,
          };
        });
        setCloudResearches(list);
        setLoadingData(false);
        setInitialCloudLoaded(true);
      },
      (error) => {
        setLoadingData(false);
        setInitialCloudLoaded(true);
        handleFirestoreError(error, OperationType.LIST, researchesPath);
      }
    );

    const researchersPath = 'researchers';
    const qResearchers = query(
      collection(db, researchersPath),
      where('portalId', '==', 'bnhs')
    );

    const unsubResearchers = onSnapshot(
      qResearchers,
      (snapshot) => {
        const list: ResearcherProfileRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            uid: String(d.uid || docSnap.id),
            fullName: String(d.fullName || ''),
            role:
              (d.role as ResearcherProfileRecord['role']) || 'Teacher Researcher',
            departmentOrStrand: String(d.departmentOrStrand || ''),
            gradeOrPosition: String(d.gradeOrPosition || ''),
            specialization: String(d.specialization || ''),
            bio: String(d.bio || ''),
            institutionIdCode: String(d.institutionIdCode || ''),
            driveFolderUrl: String(d.driveFolderUrl || ''),
            photoUrl: String(d.photoUrl || ''),
            photoDriveUrl: String(d.photoDriveUrl || ''),
            isBaseline: false,
          };
        });
        setCloudProfiles(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, researchersPath);
      }
    );

    const commentsPath = 'research_comments';
    const qComments = query(
      collection(db, commentsPath),
      where('portalId', '==', 'bnhs')
    );

    const unsubComments = onSnapshot(
      qComments,
      (snapshot) => {
        const list: ResearchCommentRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            researchId: String(d.researchId || ''),
            authorUid: String(d.authorUid || ''),
            authorName: String(d.authorName || ''),
            authorRole: String(d.authorRole || ''),
            content: String(d.content || ''),
            createdAtIso: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            isBaseline: false,
          };
        });
        setCloudComments(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, commentsPath);
      }
    );

    const overviewPath = 'overview_items';
    const qOverview = query(
      collection(db, overviewPath),
      where('portalId', '==', 'bnhs')
    );

    const unsubOverview = onSnapshot(
      qOverview,
      (snapshot) => {
        const list: OverviewItemRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            itemType: (d.itemType as 'hero' | 'card') || 'card',
            code: String(d.code || 'DIV'),
            title: String(d.title || ''),
            subtitle: String(d.subtitle || ''),
            description: String(d.description || ''),
            imageUrl: String(d.imageUrl || ''),
            divisionLink:
              (d.divisionLink as 'none' | 'basic' | 'action' | 'tuklas') || 'none',
            displayOrder: Number(d.displayOrder || 0),
            isDeleted: Boolean(d.isDeleted),
            updatedByUid: String(d.updatedByUid || ''),
            createdAtIso: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            updatedAtIso: d.updatedAt?.toDate
              ? d.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
          };
        });
        setCloudOverviewItems(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, overviewPath);
      }
    );

    const galleryPath = 'research_gallery';
    const qGallery = query(
      collection(db, galleryPath),
      where('portalId', '==', 'bnhs')
    );

    const unsubGallery = onSnapshot(
      qGallery,
      (snapshot) => {
        const list: ResearchGalleryItemRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            title: String(d.title || ''),
            caption: String(d.caption || ''),
            imageUrl: String(d.imageUrl || ''),
            displayOrder: Number(d.displayOrder || 0),
            isDeleted: Boolean(d.isDeleted),
            createdAtIso: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            updatedAtIso: d.updatedAt?.toDate
              ? d.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
          };
        });
        setCloudGalleryItems(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, galleryPath);
      }
    );

    const infoPath = 'research_information';
    const qInfo = query(
      collection(db, infoPath),
      where('portalId', '==', 'bnhs')
    );

    const unsubInfo = onSnapshot(
      qInfo,
      (snapshot) => {
        const list: ResearchInformationItemRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            title: String(d.title || ''),
            category: String(d.category || ''),
            description: String(d.description || ''),
            videoUrl: String(d.videoUrl || d.linkUrl || ''),
            videoSourceType:
              (d.videoSourceType as 'youtube' | 'drive' | 'direct' | 'upload') ||
              'youtube',
            imageUrl: String(d.imageUrl || ''),
            linkUrl: String(d.linkUrl || ''),
            displayOrder: Number(d.displayOrder || 0),
            isDeleted: Boolean(d.isDeleted),
            createdAtIso: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            updatedAtIso: d.updatedAt?.toDate
              ? d.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
          };
        });
        setCloudInformationItems(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, infoPath);
      }
    );

    return () => {
      unsubResearches();
      unsubResearchers();
      unsubComments();
      unsubOverview();
      unsubGallery();
      unsubInfo();
    };
  }, []);

  // 3. Listener for /research_subscriptions
  useEffect(() => {
    const subsPath = 'research_subscriptions';
    const qSubs = query(
      collection(db, subsPath),
      where('portalId', '==', 'bnhs')
    );

    const unsub = onSnapshot(
      qSubs,
      (snapshot) => {
        const list: ResearchSubscriptionRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            portalId: 'bnhs',
            researchId: String(d.researchId || ''),
            researchTitle: String(d.researchTitle || ''),
            subscriberUid: String(d.subscriberUid || ''),
            subscriberEmail: String(d.subscriberEmail || ''),
            notifyOnStatusChange: Boolean(d.notifyOnStatusChange),
            notifyOnComments: Boolean(d.notifyOnComments),
            createdAtIso: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          };
        });
        setCloudSubscriptions(list);
      },
      () => {
        // ignore subscription list errors
      }
    );

    return () => unsub();
  }, []);

  // 4. One-Time Boot Cloud Sync so any un-synced local records are saved to Firestore without looping
  useEffect(() => {
    if (!initialCloudLoaded || hasBootSyncedRef.current) {
      return;
    }
    hasBootSyncedRef.current = true;

    const writerUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'bnhs_portal_admin'
    );
    const timer = window.setTimeout(async () => {
      try {
        // Sync any localResearches not yet in Firestore
        for (const item of localResearches) {
          if (deletedResearchIds.includes(item.id)) continue;
          const cleanId = sanitizeId(item.id);
          const cloudMatch = cloudResearches.find((c) => c.id === cleanId);
          if (!cloudMatch) {
            await setDoc(doc(db, 'researches', cleanId), {
              portalId: 'bnhs',
              title: item.title.slice(0, 300),
              division: item.division,
              category: item.category.slice(0, 120),
              subcategory: (item.subcategory || '').slice(0, 120),
              abstract: item.abstract.slice(0, 4000),
              keywords: (item.keywords || '').slice(0, 300),
              authors: item.authors.slice(0, 300),
              authorRole: item.authorRole,
              adviser: (item.adviser || '').slice(0, 160),
              departmentOrGrade: (item.departmentOrGrade || '').slice(0, 120),
              schoolYear: (item.schoolYear || '2025-2026').slice(0, 20),
              status: item.status,
              methodology: (item.methodology || '').slice(0, 1500),
              keyFindings: (item.keyFindings || '').slice(0, 2000),
              attachmentName: (item.attachmentName || '').slice(0, 260),
              attachmentType: (item.attachmentType || '').slice(0, 100),
              attachmentSize: Number(item.attachmentSize || 0),
              fileDocId: (item.fileDocId || '').slice(0, 128),
              driveUrl: (item.driveUrl || '').slice(0, 500),
              evaluationScore: Number(item.evaluationScore || 0),
              evaluationRemarks: (item.evaluationRemarks || '').slice(0, 1500),
              evaluatedBy: (item.evaluatedBy || '').slice(0, 160),
              authorUid: sanitizeId(item.authorUid || writerUid),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }

        // Sync any localOverviewItems not yet in Firestore
        for (const ov of localOverviewItems) {
          const cleanId = sanitizeId(ov.id);
          const cloudMatch = cloudOverviewItems.find((c) => c.id === cleanId);
          if (!cloudMatch) {
            await setDoc(doc(db, 'overview_items', cleanId), {
              portalId: 'bnhs',
              itemType: ov.itemType,
              code: (ov.code || 'BNHS-OV').slice(0, 40),
              title: (ov.title || 'Barobo National High School').slice(0, 300),
              subtitle: (ov.subtitle || 'BNHS Research Portal').slice(0, 200),
              description: (ov.description || 'Barobo National High School Research Portal').slice(0, 2000),
              imageUrl: (ov.imageUrl || '').slice(0, 750000),
              divisionLink: ov.divisionLink,
              displayOrder: Number(ov.displayOrder || 0),
              isDeleted: Boolean(ov.isDeleted),
              updatedByUid: writerUid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }

        // Sync any localProfiles not yet in Firestore
        for (const prof of localProfiles) {
          if (deletedProfileIds.includes(prof.id)) continue;
          const cleanId = sanitizeId(prof.id);
          const cloudMatch = cloudProfiles.find((p) => p.id === cleanId);
          if (!cloudMatch) {
            await setDoc(doc(db, 'researchers', cleanId), {
              portalId: 'bnhs',
              uid: sanitizeId(prof.uid || writerUid),
              fullName: prof.fullName.slice(0, 160),
              role: prof.role,
              departmentOrStrand: prof.departmentOrStrand.slice(0, 120),
              gradeOrPosition: prof.gradeOrPosition.slice(0, 100),
              specialization: (prof.specialization || '').slice(0, 250),
              bio: (prof.bio || '').slice(0, 1000),
              institutionIdCode: (prof.institutionIdCode || '').slice(0, 60),
              driveFolderUrl: (prof.driveFolderUrl || '').slice(0, 500),
              photoUrl: (prof.photoUrl || '').slice(0, 750000),
              photoDriveUrl: (prof.photoDriveUrl || '').slice(0, 500),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch {
        // background one-time boot sync ignores transient errors
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    initialCloudLoaded,
    currentUser,
    localResearches,
    localOverviewItems,
    localProfiles,
    deletedResearchIds,
    deletedProfileIds,
    cloudResearches,
    cloudOverviewItems,
    cloudProfiles,
  ]);

  // Merge cloud records, local overrides, and baseline records (excluding deleted IDs)
  const allResearches = useMemo(() => {
    const deletedSet = new Set(deletedResearchIds);
    const map = new Map<string, ResearchRecord>();

    INITIAL_BNHS_RESEARCHES.forEach((base) => {
      if (!deletedSet.has(base.id)) {
        map.set(base.id, base);
      }
    });
    cloudResearches.forEach((c) => {
      if (!deletedSet.has(c.id)) {
        map.set(c.id, c);
      }
    });
    localResearches.forEach((loc) => {
      if (!deletedSet.has(loc.id)) {
        const existing = map.get(loc.id);
        if (!existing || loc.updatedAtIso >= existing.updatedAtIso) {
          map.set(loc.id, loc);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      b.updatedAtIso.localeCompare(a.updatedAtIso)
    );
  }, [cloudResearches, localResearches, deletedResearchIds]);

  const allProfiles = useMemo(() => {
    const deletedSet = new Set(deletedProfileIds);
    const map = new Map<string, ResearcherProfileRecord>();
    INITIAL_BNHS_RESEARCHERS.forEach((base) => {
      if (!deletedSet.has(base.id)) {
        map.set(base.id, base);
      }
    });
    cloudProfiles.forEach((p) => {
      if (!deletedSet.has(p.id)) {
        map.set(p.id, p);
      }
    });
    localProfiles.forEach((loc) => {
      if (!deletedSet.has(loc.id)) {
        map.set(loc.id, loc);
      }
    });
    return Array.from(map.values());
  }, [cloudProfiles, localProfiles, deletedProfileIds]);

  const allComments = useMemo(() => {
    const map = new Map<string, ResearchCommentRecord>();
    INITIAL_BNHS_COMMENTS.forEach((c) => map.set(c.id, c));
    localComments.forEach((c) => map.set(c.id, c));
    cloudComments.forEach((c) => map.set(c.id, c));
    return Array.from(map.values()).sort((a, b) =>
      a.createdAtIso.localeCompare(b.createdAtIso)
    );
  }, [cloudComments, localComments]);

  const allSubscriptions = useMemo(() => {
    const map = new Map<string, ResearchSubscriptionRecord>();
    localSubscriptions.forEach((s) => map.set(s.researchId, s));
    cloudSubscriptions.forEach((s) => map.set(s.researchId, s));
    return Array.from(map.values());
  }, [localSubscriptions, cloudSubscriptions]);

  const activeOverviewItems = useMemo(() => {
    const map = new Map<string, OverviewItemRecord>();
    INITIAL_OVERVIEW_ITEMS.forEach((item) => map.set(item.id, item));
    cloudOverviewItems.forEach((item) => map.set(item.id, item));
    localOverviewItems.forEach((item) => {
      const existing = map.get(item.id);
      if (!existing || item.updatedAtIso >= existing.updatedAtIso) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values())
      .filter((item) => !item.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [localOverviewItems, cloudOverviewItems]);

  const heroOverviewItem = useMemo(() => {
    return (
      activeOverviewItems.find((i) => i.itemType === 'hero') ||
      INITIAL_OVERVIEW_ITEMS[0]
    );
  }, [activeOverviewItems]);

  const cardOverviewItems = useMemo(() => {
    return activeOverviewItems.filter((i) => i.itemType === 'card');
  }, [activeOverviewItems]);

  const activeGalleryItems = useMemo(() => {
    const deletedSet = new Set(deletedGalleryIds);
    const map = new Map<string, ResearchGalleryItemRecord>();
    INITIAL_RESEARCH_GALLERY.forEach((g) => {
      if (!deletedSet.has(g.id)) {
        map.set(g.id, g);
      }
    });
    cloudGalleryItems.forEach((g) => {
      if (g.isDeleted || deletedSet.has(g.id)) {
        map.delete(g.id);
      } else {
        map.set(g.id, g);
      }
    });
    localGalleryItems.forEach((g) => {
      if (g.isDeleted || deletedSet.has(g.id)) {
        map.delete(g.id);
      } else {
        const existing = map.get(g.id);
        if (!existing || g.updatedAtIso >= existing.updatedAtIso) {
          map.set(g.id, g);
        }
      }
    });
    return Array.from(map.values())
      .filter((g) => !g.isDeleted && !deletedSet.has(g.id))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [cloudGalleryItems, localGalleryItems, deletedGalleryIds]);

  const activeInformationItems = useMemo(() => {
    const deletedSet = new Set(deletedInformationIds);
    const map = new Map<string, ResearchInformationItemRecord>();
    INITIAL_RESEARCH_INFORMATION.forEach((inf) => {
      if (!deletedSet.has(inf.id)) {
        map.set(inf.id, inf);
      }
    });
    cloudInformationItems.forEach((inf) => {
      if (inf.isDeleted || deletedSet.has(inf.id)) {
        map.delete(inf.id);
      } else {
        map.set(inf.id, inf);
      }
    });
    localInformationItems.forEach((inf) => {
      if (inf.isDeleted || deletedSet.has(inf.id)) {
        map.delete(inf.id);
      } else {
        const existing = map.get(inf.id);
        if (!existing || inf.updatedAtIso >= existing.updatedAtIso) {
          map.set(inf.id, inf);
        }
      }
    });
    return Array.from(map.values())
      .filter((inf) => !inf.isDeleted && !deletedSet.has(inf.id))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [cloudInformationItems, localInformationItems, deletedInformationIds]);

  // Keep detail modal synced if record updates
  useEffect(() => {
    if (selectedDetailRecord) {
      const updated = allResearches.find((r) => r.id === selectedDetailRecord.id);
      if (updated && updated !== selectedDetailRecord) {
        setSelectedDetailRecord(updated);
      }
    }
  }, [allResearches, selectedDetailRecord]);

  // Helper to dispatch email alerts when a research record's status changes or a new comment is added
  const dispatchEmailAlertsForResearch = (
    record: ResearchRecord,
    triggerType: 'status_change' | 'new_comment' | 'subscription_confirmed',
    detailText: string,
    overrideRecipientEmail?: string
  ) => {
    const matchingSubs = overrideRecipientEmail
      ? [
          {
            subscriberEmail: overrideRecipientEmail,
            notifyOnStatusChange: true,
            notifyOnComments: true,
          },
        ]
      : allSubscriptions.filter((s) => {
          if (s.researchId !== record.id) return false;
          if (triggerType === 'status_change') return s.notifyOnStatusChange;
          if (triggerType === 'new_comment') return s.notifyOnComments;
          return true;
        });

    if (matchingSubs.length === 0) return;

    const newLogs: EmailAlertLogRecord[] = matchingSubs.map((sub, idx) => {
      const subject =
        triggerType === 'status_change'
          ? `[BNHS Research Portal] Status Update: "${record.title.slice(0, 60)}"`
          : triggerType === 'new_comment'
          ? `[BNHS Research Portal] New Comment on: "${record.title.slice(0, 60)}"`
          : `[BNHS Research Portal] Email Alerts Activated: "${record.title.slice(0, 60)}"`;

      return {
        id: `alert_${Date.now()}_${idx}`,
        researchId: record.id,
        researchTitle: record.title,
        recipientEmail: sub.subscriberEmail,
        triggerType,
        subject,
        messageBody: detailText,
        dispatchedAtIso: new Date().toISOString(),
      };
    });

    setEmailAlertLogs((prev) => [...newLogs, ...prev]);
    setLatestEmailAlertBanner(newLogs[0]);
  };

  // Save or Update 'Notify Me' Email Subscription
  const handleSaveSubscription = async (
    record: ResearchRecord,
    email: string,
    notifyOnStatusChange: boolean,
    notifyOnComments: boolean
  ) => {
    const subscriberUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'guest_subscriber'
    );
    const subId = sanitizeId(`sub_${subscriberUid}_${record.id}`);
    const newSub: ResearchSubscriptionRecord = {
      id: subId,
      portalId: 'bnhs',
      researchId: record.id,
      researchTitle: record.title.slice(0, 300),
      subscriberUid,
      subscriberEmail: email.slice(0, 200),
      notifyOnStatusChange,
      notifyOnComments,
      createdAtIso: new Date().toISOString(),
    };

    setLocalSubscriptions((prev) => [
      ...prev.filter((s) => s.researchId !== record.id),
      newSub,
    ]);

    const docPath = `research_subscriptions/${subId}`;
    const existsInCloud = cloudSubscriptions.some((s) => s.id === subId);
    try {
      if (existsInCloud) {
        await updateDoc(doc(db, 'research_subscriptions', subId), {
          researchTitle: newSub.researchTitle,
          subscriberEmail: newSub.subscriberEmail,
          notifyOnStatusChange,
          notifyOnComments,
        });
      } else {
        await setDoc(doc(db, 'research_subscriptions', subId), {
          portalId: 'bnhs',
          researchId: record.id,
          researchTitle: newSub.researchTitle,
          subscriberUid,
          subscriberEmail: newSub.subscriberEmail,
          notifyOnStatusChange,
          notifyOnComments,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }

    dispatchEmailAlertsForResearch(
      record,
      'subscription_confirmed',
      `You are now subscribed to email alerts (${email}) for "${record.title}". You will be notified whenever its status changes or a new comment is posted.`,
      email
    );
    showToast(`Email alerts activated for ${email}.`);
  };

  const handleUnsubscribe = async (record: ResearchRecord) => {
    setLocalSubscriptions((prev) =>
      prev.filter((s) => s.researchId !== record.id)
    );
    const subscriberUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'guest_subscriber'
    );
    const subId = sanitizeId(`sub_${subscriberUid}_${record.id}`);
    const existsInCloud = cloudSubscriptions.some((s) => s.id === subId);
    if (existsInCloud) {
      const docPath = `research_subscriptions/${subId}`;
      try {
        await deleteDoc(doc(db, 'research_subscriptions', subId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
    showToast(`Unsubscribed from email alerts for "${record.title.slice(0, 40)}...".`);
  };

  // Add Comment to a Research Entry & Trigger Email Alerts
  const handleAddComment = async (
    record: ResearchRecord,
    authorName: string,
    authorRole: string,
    content: string
  ) => {
    const commentId = sanitizeId(`cmt_${Date.now()}`);
    const authorUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'guest_researcher'
    );
    const newComment: ResearchCommentRecord = {
      id: commentId,
      portalId: 'bnhs',
      researchId: record.id,
      authorUid,
      authorName: authorName.slice(0, 160),
      authorRole: authorRole.slice(0, 60),
      content: content.slice(0, 2000),
      createdAtIso: new Date().toISOString(),
    };

    setLocalComments((prev) => [...prev, newComment]);

    const docPath = `research_comments/${commentId}`;
    try {
      await setDoc(doc(db, 'research_comments', commentId), {
        portalId: 'bnhs',
        researchId: record.id,
        authorUid,
        authorName: newComment.authorName,
        authorRole: newComment.authorRole,
        content: newComment.content,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }

    dispatchEmailAlertsForResearch(
      record,
      'new_comment',
      `New comment posted by ${newComment.authorName} (${newComment.authorRole}) on "${record.title}": "${newComment.content}"`
    );
    showToast('Comment posted to research entry.');
  };

  const handleDeleteComment = async (commentId: string) => {
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    const existsInCloud = cloudComments.some((c) => c.id === commentId);
    if (existsInCloud) {
      const docPath = `research_comments/${commentId}`;
      try {
        await deleteDoc(doc(db, 'research_comments', commentId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
    showToast('Comment removed.');
  };

  // Save / Edit Overview Section Item & Photo (Persists to Cloud Firestore & LocalStorage)
  const handleSaveOverviewItem = async (
    payload: Omit<
      OverviewItemRecord,
      'portalId' | 'updatedByUid' | 'createdAtIso' | 'updatedAtIso'
    >
  ) => {
    const cleanId = sanitizeId(payload.id);
    const nowIso = new Date().toISOString();
    const writerUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'bnhs_portal_admin'
    );
    const record: OverviewItemRecord = {
      ...payload,
      id: cleanId,
      imageUrl: resolveOverviewImageLink(payload.imageUrl),
      portalId: 'bnhs',
      updatedByUid: writerUid,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    setImgErrors((prev) => ({
      ...prev,
      [payload.itemType === 'hero' ? 'hero' : cleanId]: false,
    }));

    setLocalOverviewItems((prev) => [
      ...prev.filter((i) => i.id !== cleanId),
      record,
    ]);

    const docPath = `overview_items/${cleanId}`;
    const existsInCloud = cloudOverviewItems.some((i) => i.id === cleanId);
    try {
      if (existsInCloud) {
        await updateDoc(doc(db, 'overview_items', cleanId), {
          itemType: record.itemType,
          code: record.code.slice(0, 40),
          title: record.title.slice(0, 300),
          subtitle: record.subtitle.slice(0, 200),
          description: record.description.slice(0, 2000),
          imageUrl: record.imageUrl.slice(0, 750000),
          divisionLink: record.divisionLink,
          displayOrder: record.displayOrder,
          isDeleted: record.isDeleted,
          updatedByUid: writerUid,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'overview_items', cleanId), {
          portalId: 'bnhs',
          itemType: record.itemType,
          code: record.code.slice(0, 40),
          title: record.title.slice(0, 300),
          subtitle: record.subtitle.slice(0, 200),
          description: record.description.slice(0, 2000),
          imageUrl: record.imageUrl.slice(0, 750000),
          divisionLink: record.divisionLink,
          displayOrder: record.displayOrder,
          isDeleted: record.isDeleted,
          updatedByUid: writerUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
    showToast('Overview section saved to Cloud Database.');
  };

  const handleDeleteOverviewItem = async (itemId: string) => {
    const target = activeOverviewItems.find((i) => i.id === itemId);
    if (!target) return;
    await handleSaveOverviewItem({
      ...target,
      isDeleted: true,
    });
    showToast(`Deleted "${target.title}" from the Overview section.`);
  };

  const handleResetOverviewDefaults = async () => {
    const nowIso = new Date().toISOString();
    const writerUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'bnhs_portal_admin'
    );
    const baselineIds = new Set(INITIAL_OVERVIEW_ITEMS.map((i) => i.id));
    const restoredLocals: OverviewItemRecord[] = [
      ...INITIAL_OVERVIEW_ITEMS.map((item) => ({
        ...item,
        isDeleted: false,
        updatedAtIso: nowIso,
      })),
      ...cloudOverviewItems
        .filter((c) => !baselineIds.has(c.id))
        .map((c) => ({
          ...c,
          isDeleted: true,
          updatedAtIso: nowIso,
        })),
    ];

    setImgErrors({});
    setLocalOverviewItems(restoredLocals);
    try {
      localStorage.setItem(LOCAL_OVERVIEW_ITEMS_KEY, JSON.stringify(restoredLocals));
    } catch {
      // ignore storage quota errors
    }

    for (const cloudItem of cloudOverviewItems) {
      try {
        await deleteDoc(doc(db, 'overview_items', cloudItem.id));
      } catch {
        // ignore
      }
    }
    for (const baseItem of INITIAL_OVERVIEW_ITEMS) {
      try {
        await setDoc(doc(db, 'overview_items', baseItem.id), {
          portalId: 'bnhs',
          itemType: baseItem.itemType,
          code: baseItem.code,
          title: baseItem.title,
          subtitle: baseItem.subtitle,
          description: baseItem.description,
          imageUrl: baseItem.imageUrl,
          divisionLink: baseItem.divisionLink,
          displayOrder: baseItem.displayOrder,
          isDeleted: false,
          updatedByUid: writerUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }
    showToast('Default Overview restored and saved to Cloud Database.');
  };

  // Research Gallery Handlers (1000 x 500 Sliding Pictures)
  const handleSaveGalleryItem = async (
    payload: Omit<ResearchGalleryItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>
  ) => {
    const cleanId = sanitizeId(payload.id);
    const nowIso = new Date().toISOString();
    const record: ResearchGalleryItemRecord = {
      ...payload,
      id: cleanId,
      portalId: 'bnhs',
      imageUrl: resolveOverviewImageLink(payload.imageUrl),
      isDeleted: false,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    setDeletedGalleryIds((prev) => prev.filter((id) => id !== cleanId && id !== payload.id));
    setLocalGalleryItems((prev) => [
      ...prev.filter((g) => g.id !== cleanId),
      record,
    ]);

    const docPath = `research_gallery/${cleanId}`;
    const exists = cloudGalleryItems.some((g) => g.id === cleanId);
    try {
      if (exists) {
        await updateDoc(doc(db, 'research_gallery', cleanId), {
          title: record.title.slice(0, 300),
          caption: record.caption.slice(0, 1000),
          imageUrl: record.imageUrl.slice(0, 750000),
          displayOrder: record.displayOrder,
          isDeleted: false,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'research_gallery', cleanId), {
          portalId: 'bnhs',
          title: record.title.slice(0, 300),
          caption: record.caption.slice(0, 1000),
          imageUrl: record.imageUrl.slice(0, 750000),
          displayOrder: record.displayOrder,
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
    showToast('Research Gallery picture (1000 × 500) saved to Cloud Database.');
  };

  const handleDeleteGalleryItem = async (itemId: string) => {
    const cleanId = sanitizeId(itemId);
    const target =
      activeGalleryItems.find((g) => g.id === itemId || g.id === cleanId) ||
      INITIAL_RESEARCH_GALLERY.find((g) => g.id === itemId || g.id === cleanId);

    setDeletedGalleryIds((prev) =>
      prev.includes(cleanId) ? prev : [...prev, cleanId, itemId]
    );
    setLocalGalleryItems((prev) => prev.filter((g) => g.id !== cleanId && g.id !== itemId));

    const isBaselineItem = INITIAL_RESEARCH_GALLERY.some(
      (g) => g.id === cleanId || g.id === itemId
    );
    const existsInCloud = cloudGalleryItems.some((g) => g.id === cleanId);
    const docPath = `research_gallery/${cleanId}`;

    try {
      if (isBaselineItem) {
        await setDoc(doc(db, 'research_gallery', cleanId), {
          portalId: 'bnhs',
          title: (target?.title || 'Deleted Gallery Picture').slice(0, 300),
          caption: (target?.caption || '').slice(0, 1000),
          imageUrl: (target?.imageUrl || '').slice(0, 750000),
          displayOrder: Number(target?.displayOrder || 1),
          isDeleted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (existsInCloud) {
        await deleteDoc(doc(db, 'research_gallery', cleanId));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
    showToast('Picture removed from Research Gallery.');
  };

  const handleDeleteAllGalleryItems = async () => {
    const allIds = Array.from(
      new Set([
        ...INITIAL_RESEARCH_GALLERY.map((g) => g.id),
        ...cloudGalleryItems.map((g) => g.id),
        ...localGalleryItems.map((g) => g.id),
        ...activeGalleryItems.map((g) => g.id),
      ])
    );

    setDeletedGalleryIds(allIds);
    setLocalGalleryItems([]);

    for (const baseItem of INITIAL_RESEARCH_GALLERY) {
      const cleanId = sanitizeId(baseItem.id);
      try {
        await setDoc(doc(db, 'research_gallery', cleanId), {
          portalId: 'bnhs',
          title: baseItem.title.slice(0, 300),
          caption: baseItem.caption.slice(0, 1000),
          imageUrl: baseItem.imageUrl.slice(0, 750000),
          displayOrder: baseItem.displayOrder,
          isDeleted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }

    const baselineSet = new Set(INITIAL_RESEARCH_GALLERY.map((g) => sanitizeId(g.id)));
    for (const cloudItem of cloudGalleryItems) {
      if (!baselineSet.has(cloudItem.id)) {
        try {
          await deleteDoc(doc(db, 'research_gallery', cloudItem.id));
        } catch {
          // ignore
        }
      }
    }

    showToast('All pictures deleted from Research Gallery.');
  };

  const handleResetGalleryDefaults = async () => {
    const nowIso = new Date().toISOString();
    setDeletedGalleryIds([]);
    const restored = INITIAL_RESEARCH_GALLERY.map((g) => ({
      ...g,
      isDeleted: false,
      updatedAtIso: nowIso,
    }));
    setLocalGalleryItems(restored);

    const baselineSet = new Set(INITIAL_RESEARCH_GALLERY.map((g) => sanitizeId(g.id)));
    for (const cloudItem of cloudGalleryItems) {
      if (!baselineSet.has(cloudItem.id)) {
        try {
          await deleteDoc(doc(db, 'research_gallery', cloudItem.id));
        } catch {
          // ignore
        }
      }
    }

    for (const baseItem of INITIAL_RESEARCH_GALLERY) {
      const cleanId = sanitizeId(baseItem.id);
      try {
        await setDoc(doc(db, 'research_gallery', cleanId), {
          portalId: 'bnhs',
          title: baseItem.title.slice(0, 300),
          caption: baseItem.caption.slice(0, 1000),
          imageUrl: baseItem.imageUrl.slice(0, 750000),
          displayOrder: baseItem.displayOrder,
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }

    showToast('Default Research Gallery pictures restored.');
  };

  // Research Information Video Handlers (1000 x 500 Videos - YouTube & Google Drive)
  const handleSaveInformationItem = async (
    payload: Omit<ResearchInformationItemRecord, 'portalId' | 'createdAtIso' | 'updatedAtIso'>
  ) => {
    const cleanId = sanitizeId(payload.id);
    const nowIso = new Date().toISOString();
    const record: ResearchInformationItemRecord = {
      ...payload,
      id: cleanId,
      portalId: 'bnhs',
      videoUrl: payload.videoUrl || '',
      videoSourceType: payload.videoSourceType || 'youtube',
      imageUrl: payload.imageUrl || '',
      isDeleted: false,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    setDeletedInformationIds((prev) => prev.filter((id) => id !== cleanId && id !== payload.id));
    setLocalInformationItems((prev) => [
      ...prev.filter((i) => i.id !== cleanId),
      record,
    ]);

    const docPath = `research_information/${cleanId}`;
    const exists = cloudInformationItems.some((i) => i.id === cleanId);
    try {
      if (exists) {
        await updateDoc(doc(db, 'research_information', cleanId), {
          title: record.title.slice(0, 300),
          category: record.category.slice(0, 120),
          description: record.description.slice(0, 3000),
          videoUrl: (record.videoUrl || '').slice(0, 750000),
          videoSourceType: (record.videoSourceType || 'youtube').slice(0, 30),
          imageUrl: (record.imageUrl || '').slice(0, 750000),
          linkUrl: (record.linkUrl || '').slice(0, 500),
          displayOrder: record.displayOrder,
          isDeleted: false,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'research_information', cleanId), {
          portalId: 'bnhs',
          title: record.title.slice(0, 300),
          category: record.category.slice(0, 120),
          description: record.description.slice(0, 3000),
          videoUrl: (record.videoUrl || '').slice(0, 750000),
          videoSourceType: (record.videoSourceType || 'youtube').slice(0, 30),
          imageUrl: (record.imageUrl || '').slice(0, 750000),
          linkUrl: (record.linkUrl || '').slice(0, 500),
          displayOrder: record.displayOrder,
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
    showToast('Research Information video (1000 × 500) saved to Cloud Database.');
  };

  const handleDeleteInformationItem = async (itemId: string) => {
    const cleanId = sanitizeId(itemId);
    const target =
      activeInformationItems.find((i) => i.id === itemId || i.id === cleanId) ||
      INITIAL_RESEARCH_INFORMATION.find((i) => i.id === itemId || i.id === cleanId);

    setDeletedInformationIds((prev) =>
      prev.includes(cleanId) ? prev : [...prev, cleanId, itemId]
    );
    setLocalInformationItems((prev) => prev.filter((i) => i.id !== cleanId && i.id !== itemId));

    const isBaselineItem = INITIAL_RESEARCH_INFORMATION.some(
      (i) => i.id === cleanId || i.id === itemId
    );
    const existsInCloud = cloudInformationItems.some((i) => i.id === cleanId);
    const docPath = `research_information/${cleanId}`;

    try {
      if (isBaselineItem) {
        await setDoc(doc(db, 'research_information', cleanId), {
          portalId: 'bnhs',
          title: (target?.title || 'Deleted Video').slice(0, 300),
          category: (target?.category || '').slice(0, 120),
          description: (target?.description || '').slice(0, 3000),
          videoUrl: (target?.videoUrl || '').slice(0, 750000),
          videoSourceType: (target?.videoSourceType || 'youtube').slice(0, 30),
          imageUrl: (target?.imageUrl || '').slice(0, 750000),
          linkUrl: (target?.linkUrl || '').slice(0, 500),
          displayOrder: Number(target?.displayOrder || 1),
          isDeleted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (existsInCloud) {
        await deleteDoc(doc(db, 'research_information', cleanId));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
    showToast('Topic removed from Research Information.');
  };

  // Navigation helper to switch division view
  const navigateToDivision = (
    div: ResearchDivisionId,
    category: string = 'all',
    subcategory: string = 'all'
  ) => {
    setActiveSection(div);
    setSelectedDivisionFilter(div);
    setSelectedCategoryFilter(category);
    setSelectedSubcategoryFilter(subcategory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSubmitModal = (defaultDiv: ResearchDivisionId = 'basic') => {
    setEditingRecord(null);
    setSubmitModalDivision(defaultDiv);
    setIsSubmitModalOpen(true);
  };

  // Save or Update Research Entry (Persists to Cloud Firestore & LocalStorage)
  const handleCreateOrUpdateResearch = async (
    payload: Omit<
      ResearchRecord,
      'id' | 'portalId' | 'authorUid' | 'createdAtIso' | 'updatedAtIso'
    >,
    uploadedFileData?: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    } | null
  ) => {
    const previousStatus = editingRecord?.status;
    const nowIso = new Date().toISOString();
    const writerUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'bnhs_researcher'
    );
    const recordId = editingRecord
      ? sanitizeId(editingRecord.id)
      : sanitizeId(`bnhs_${payload.division}_${Date.now()}`);

    let fileDocId = payload.fileDocId || '';
    if (uploadedFileData && uploadedFileData.dataUrl) {
      fileDocId = sanitizeId(`file_${Date.now()}_${writerUid.slice(0, 8)}`);
      const filePath = `research_files/${fileDocId}`;
      try {
        await setDoc(doc(db, 'research_files', fileDocId), {
          portalId: 'bnhs',
          fileName: uploadedFileData.fileName.slice(0, 260),
          mimeType: uploadedFileData.mimeType.slice(0, 120),
          sizeBytes: uploadedFileData.sizeBytes,
          dataUrl: uploadedFileData.dataUrl.slice(0, 750000),
          uploaderUid: writerUid,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, filePath);
      }
    }

    const updatedRecord: ResearchRecord = {
      id: recordId,
      portalId: 'bnhs',
      title: payload.title,
      division: payload.division,
      category: payload.category,
      subcategory: payload.subcategory,
      abstract: payload.abstract,
      keywords: payload.keywords,
      authors: payload.authors,
      authorRole: payload.authorRole,
      adviser: payload.adviser,
      departmentOrGrade: payload.departmentOrGrade,
      schoolYear: payload.schoolYear,
      status: payload.status,
      methodology: payload.methodology,
      keyFindings: payload.keyFindings,
      attachmentName: payload.attachmentName,
      attachmentType: payload.attachmentType,
      attachmentSize: payload.attachmentSize,
      fileDocId,
      driveUrl: payload.driveUrl,
      evaluationScore: editingRecord
        ? editingRecord.evaluationScore
        : isAdmin
        ? payload.evaluationScore
        : 0,
      evaluationRemarks: editingRecord
        ? editingRecord.evaluationRemarks
        : isAdmin
        ? payload.evaluationRemarks
        : '',
      evaluatedBy: editingRecord
        ? editingRecord.evaluatedBy
        : isAdmin
        ? payload.evaluatedBy
        : '',
      authorUid: sanitizeId(editingRecord?.authorUid || writerUid),
      createdAtIso: editingRecord?.createdAtIso || nowIso,
      updatedAtIso: nowIso,
      isBaseline: false,
    };

    // Always update localResearches immediately
    setLocalResearches((prev) => [
      ...prev.filter((r) => r.id !== recordId),
      updatedRecord,
    ]);
    setDeletedResearchIds((prev) => prev.filter((id) => id !== recordId));

    const isExistingCloudDoc =
      editingRecord && cloudResearches.some((c) => c.id === recordId);

    if (editingRecord && isExistingCloudDoc) {
      const docPath = `researches/${recordId}`;
      try {
        await updateDoc(doc(db, 'researches', recordId), {
          title: payload.title.slice(0, 300),
          division: payload.division,
          category: payload.category.slice(0, 120),
          subcategory: (payload.subcategory || '').slice(0, 120),
          abstract: payload.abstract.slice(0, 4000),
          keywords: (payload.keywords || '').slice(0, 300),
          authors: payload.authors.slice(0, 300),
          authorRole: payload.authorRole,
          adviser: (payload.adviser || '').slice(0, 160),
          departmentOrGrade: (payload.departmentOrGrade || '').slice(0, 120),
          schoolYear: (payload.schoolYear || '2025-2026').slice(0, 20),
          status: payload.status,
          methodology: (payload.methodology || '').slice(0, 1500),
          keyFindings: (payload.keyFindings || '').slice(0, 2000),
          attachmentName: (payload.attachmentName || '').slice(0, 260),
          attachmentType: (payload.attachmentType || '').slice(0, 100),
          attachmentSize: Number(payload.attachmentSize || 0),
          fileDocId: fileDocId.slice(0, 128),
          driveUrl: (payload.driveUrl || '').slice(0, 500),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
    } else {
      const docPath = `researches/${recordId}`;
      try {
        await setDoc(doc(db, 'researches', recordId), {
          portalId: 'bnhs',
          title: payload.title.slice(0, 300),
          division: payload.division,
          category: payload.category.slice(0, 120),
          subcategory: (payload.subcategory || '').slice(0, 120),
          abstract: payload.abstract.slice(0, 4000),
          keywords: (payload.keywords || '').slice(0, 300),
          authors: payload.authors.slice(0, 300),
          authorRole: payload.authorRole,
          adviser: (payload.adviser || '').slice(0, 160),
          departmentOrGrade: (payload.departmentOrGrade || '').slice(0, 120),
          schoolYear: (payload.schoolYear || '2025-2026').slice(0, 20),
          status: payload.status,
          methodology: (payload.methodology || '').slice(0, 1500),
          keyFindings: (payload.keyFindings || '').slice(0, 2000),
          attachmentName: (payload.attachmentName || '').slice(0, 260),
          attachmentType: (payload.attachmentType || '').slice(0, 100),
          attachmentSize: Number(payload.attachmentSize || 0),
          fileDocId: fileDocId.slice(0, 128),
          driveUrl: (payload.driveUrl || '').slice(0, 500),
          evaluationScore: Number(updatedRecord.evaluationScore || 0),
          evaluationRemarks: (updatedRecord.evaluationRemarks || '').slice(0, 1500),
          evaluatedBy: (updatedRecord.evaluatedBy || '').slice(0, 160),
          authorUid: updatedRecord.authorUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, docPath);
      }
    }

    if (editingRecord && previousStatus && previousStatus !== payload.status) {
      dispatchEmailAlertsForResearch(
        updatedRecord,
        'status_change',
        `Status for "${updatedRecord.title}" changed from "${previousStatus}" to "${payload.status}".`
      );
    }

    showToast(
      editingRecord
        ? 'Research entry updated and saved to Cloud Database.'
        : 'Research entry submitted and saved to Cloud Database.'
    );
  };

  // Admin Evaluation & Status Update (Triggers Email Alerts on Status Change)
  const handleEvaluateResearch = async (
    record: ResearchRecord,
    newStatus: ResearchStatus,
    score: number,
    remarks: string,
    evaluatorName: string
  ) => {
    const previousStatus = record.status;
    const writerUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'bnhs_portal_admin'
    );
    const updatedRecord: ResearchRecord = {
      ...record,
      status: newStatus,
      evaluationScore: score,
      evaluationRemarks: remarks.slice(0, 1500),
      evaluatedBy: evaluatorName.slice(0, 160),
      updatedAtIso: new Date().toISOString(),
    };

    setLocalResearches((prev) => [
      ...prev.filter((r) => r.id !== record.id),
      updatedRecord,
    ]);

    const cleanId = sanitizeId(record.id);
    const existsInCloud = cloudResearches.some((c) => c.id === cleanId);
    const docPath = `researches/${cleanId}`;

    try {
      if (existsInCloud) {
        await updateDoc(doc(db, 'researches', cleanId), {
          status: newStatus,
          evaluationScore: score,
          evaluationRemarks: remarks.slice(0, 1500),
          evaluatedBy: evaluatorName.slice(0, 160),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'researches', cleanId), {
          portalId: 'bnhs',
          title: record.title.slice(0, 300),
          division: record.division,
          category: record.category.slice(0, 120),
          subcategory: (record.subcategory || '').slice(0, 120),
          abstract: record.abstract.slice(0, 4000),
          keywords: (record.keywords || '').slice(0, 300),
          authors: record.authors.slice(0, 300),
          authorRole: record.authorRole,
          adviser: (record.adviser || '').slice(0, 160),
          departmentOrGrade: (record.departmentOrGrade || '').slice(0, 120),
          schoolYear: (record.schoolYear || '2025-2026').slice(0, 20),
          status: newStatus,
          methodology: (record.methodology || '').slice(0, 1500),
          keyFindings: (record.keyFindings || '').slice(0, 2000),
          attachmentName: (record.attachmentName || '').slice(0, 260),
          attachmentType: (record.attachmentType || '').slice(0, 100),
          attachmentSize: Number(record.attachmentSize || 0),
          fileDocId: (record.fileDocId || '').slice(0, 128),
          driveUrl: (record.driveUrl || '').slice(0, 500),
          evaluationScore: score,
          evaluationRemarks: remarks.slice(0, 1500),
          evaluatedBy: evaluatorName.slice(0, 160),
          authorUid: sanitizeId(record.authorUid || writerUid),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }

    // Record timeline milestone entry in 'status_history' collection for vertical timeline visualization
    const historyId = sanitizeId(
      `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    );
    const histPath = `status_history/${historyId}`;
    try {
      await setDoc(doc(db, 'status_history', historyId), {
        portalId: 'bnhs',
        researchId: record.id,
        previousStatus: previousStatus,
        newStatus: newStatus,
        evaluatorName: (evaluatorName || 'School Research Committee').slice(0, 160),
        evaluatorUid: sanitizeId(
          auth.currentUser?.uid || currentUser?.uid || 'bnhs_portal_admin'
        ),
        evaluationScore: Number(score || 0),
        remarks: (remarks || '').slice(0, 1500),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, histPath);
    }

    if (previousStatus !== newStatus) {
      dispatchEmailAlertsForResearch(
        updatedRecord,
        'status_change',
        `Status of "${updatedRecord.title}" was updated from "${previousStatus}" to "${newStatus}" by ${evaluatorName} (Score: ${score}/100). Remarks: ${remarks || 'None'}`
      );
    }

    showToast(
      `Evaluation saved to Cloud DB: "${record.title.slice(0, 42)}..." marked as ${newStatus}.`
    );
  };

  // Delete Research Record (Allows deleting any submitted or posted research entry)
  const handleDeleteResearch = async (record: ResearchRecord) => {
    const cleanId = sanitizeId(record.id);
    setDeletedResearchIds((prev) =>
      prev.includes(record.id) ? prev : [...prev, record.id]
    );
    setLocalResearches((prev) => prev.filter((r) => r.id !== record.id));

    const existsInCloud = cloudResearches.some((c) => c.id === cleanId);
    if (existsInCloud) {
      const docPath = `researches/${cleanId}`;
      try {
        await deleteDoc(doc(db, 'researches', cleanId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
    showToast(`Deleted research entry: "${record.title.slice(0, 45)}...".`);
  };

  // Download Attached PDF/Word Binary or Generate Word Manuscript
  const handleDownloadAttachedBinary = async (record: ResearchRecord) => {
    if (record.fileDocId) {
      const filePath = `research_files/${record.fileDocId}`;
      try {
        const snap = await getDoc(doc(db, 'research_files', record.fileDocId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.dataUrl) {
            downloadDataUrlFile(
              String(data.dataUrl),
              String(data.fileName || record.attachmentName || 'BNHS_Manuscript.pdf')
            );
            return;
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, filePath);
      }
    }
    downloadManuscriptWordDoc(record);
  };

  // Save or Update Researcher Profile (With Local Drive Photo or Google Drive Photo URL)
  const handleSaveResearcherProfile = async (
    payload: Omit<ResearcherProfileRecord, 'id' | 'portalId' | 'uid'>,
    targetProfileId?: string
  ) => {
    const rawId =
      targetProfileId ||
      currentUser?.uid ||
      auth.currentUser?.uid ||
      `profile_${Date.now()}`;
    const cleanId = sanitizeId(rawId);
    const uid = sanitizeId(currentUser?.uid || auth.currentUser?.uid || cleanId);

    const newProfile: ResearcherProfileRecord = {
      id: cleanId,
      portalId: 'bnhs',
      uid,
      fullName: payload.fullName,
      role: payload.role,
      departmentOrStrand: payload.departmentOrStrand,
      gradeOrPosition: payload.gradeOrPosition,
      specialization: payload.specialization,
      bio: payload.bio,
      institutionIdCode: payload.institutionIdCode,
      driveFolderUrl: payload.driveFolderUrl,
      photoUrl: payload.photoUrl || '',
      photoDriveUrl: payload.photoDriveUrl || '',
      isBaseline: false,
    };

    setLocalProfiles((prev) => [
      ...prev.filter((p) => p.id !== cleanId),
      newProfile,
    ]);
    setDeletedProfileIds((prev) => prev.filter((id) => id !== cleanId));

    const docPath = `researchers/${cleanId}`;
    const existsInCloud = cloudProfiles.some((p) => p.id === cleanId);

    try {
      if (existsInCloud) {
        await updateDoc(doc(db, 'researchers', cleanId), {
          fullName: payload.fullName.slice(0, 160),
          role: payload.role,
          departmentOrStrand: payload.departmentOrStrand.slice(0, 120),
          gradeOrPosition: payload.gradeOrPosition.slice(0, 100),
          specialization: (payload.specialization || '').slice(0, 250),
          bio: (payload.bio || '').slice(0, 1000),
          institutionIdCode: (payload.institutionIdCode || '').slice(0, 60),
          driveFolderUrl: (payload.driveFolderUrl || '').slice(0, 500),
          photoUrl: (payload.photoUrl || '').slice(0, 750000),
          photoDriveUrl: (payload.photoDriveUrl || '').slice(0, 500),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'researchers', cleanId), {
          portalId: 'bnhs',
          uid,
          fullName: payload.fullName.slice(0, 160),
          role: payload.role,
          departmentOrStrand: payload.departmentOrStrand.slice(0, 120),
          gradeOrPosition: payload.gradeOrPosition.slice(0, 100),
          specialization: (payload.specialization || '').slice(0, 250),
          bio: (payload.bio || '').slice(0, 1000),
          institutionIdCode: (payload.institutionIdCode || '').slice(0, 60),
          driveFolderUrl: (payload.driveFolderUrl || '').slice(0, 500),
          photoUrl: (payload.photoUrl || '').slice(0, 750000),
          photoDriveUrl: (payload.photoDriveUrl || '').slice(0, 500),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }

    showToast('Official BNHS Researcher Profile and photo saved to Cloud Database.');
  };

  const handleDeleteResearcherProfile = async (profileId: string) => {
    const cleanId = sanitizeId(profileId);
    setDeletedProfileIds((prev) =>
      prev.includes(profileId) ? prev : [...prev, profileId]
    );
    setLocalProfiles((prev) => prev.filter((p) => p.id !== profileId));

    const existsInCloud = cloudProfiles.some((p) => p.id === cleanId);
    if (existsInCloud) {
      const docPath = `researchers/${cleanId}`;
      try {
        await deleteDoc(doc(db, 'researchers', cleanId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
    showToast('Researcher profile removed from directory.');
  };

  // Sync All Local Changes & Baseline Records to Firestore so Published Data is 100% Intact
  const handleSyncBaselineToCloud = async () => {
    setCloudSyncState('syncing');
    const writerUid = sanitizeId(
      auth.currentUser?.uid || currentUser?.uid || 'bnhs_portal_admin'
    );

    // 1. Sync any localResearches created or edited locally
    for (const item of localResearches) {
      if (deletedResearchIds.includes(item.id)) continue;
      const cleanId = sanitizeId(item.id);
      const docPath = `researches/${cleanId}`;
      try {
        await setDoc(doc(db, 'researches', cleanId), {
          portalId: 'bnhs',
          title: item.title.slice(0, 300),
          division: item.division,
          category: item.category.slice(0, 120),
          subcategory: (item.subcategory || '').slice(0, 120),
          abstract: item.abstract.slice(0, 4000),
          keywords: (item.keywords || '').slice(0, 300),
          authors: item.authors.slice(0, 300),
          authorRole: item.authorRole,
          adviser: (item.adviser || '').slice(0, 160),
          departmentOrGrade: (item.departmentOrGrade || '').slice(0, 120),
          schoolYear: (item.schoolYear || '2025-2026').slice(0, 20),
          status: item.status,
          methodology: (item.methodology || '').slice(0, 1500),
          keyFindings: (item.keyFindings || '').slice(0, 2000),
          attachmentName: (item.attachmentName || '').slice(0, 260),
          attachmentType: (item.attachmentType || '').slice(0, 100),
          attachmentSize: Number(item.attachmentSize || 0),
          fileDocId: (item.fileDocId || '').slice(0, 128),
          driveUrl: (item.driveUrl || '').slice(0, 500),
          evaluationScore: Number(item.evaluationScore || 0),
          evaluationRemarks: (item.evaluationRemarks || '').slice(0, 1500),
          evaluatedBy: (item.evaluatedBy || '').slice(0, 160),
          authorUid: sanitizeId(item.authorUid || writerUid),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }

    // 2. Sync baseline research records not yet in Firestore
    for (const item of INITIAL_BNHS_RESEARCHES) {
      if (deletedResearchIds.includes(item.id)) continue;
      const exists = cloudResearches.some((c) => c.id === item.id);
      if (!exists) {
        const docPath = `researches/${item.id}`;
        try {
          await setDoc(doc(db, 'researches', item.id), {
            portalId: 'bnhs',
            title: item.title.slice(0, 300),
            division: item.division,
            category: item.category.slice(0, 120),
            subcategory: (item.subcategory || '').slice(0, 120),
            abstract: item.abstract.slice(0, 4000),
            keywords: (item.keywords || '').slice(0, 300),
            authors: item.authors.slice(0, 300),
            authorRole: item.authorRole,
            adviser: (item.adviser || '').slice(0, 160),
            departmentOrGrade: (item.departmentOrGrade || '').slice(0, 120),
            schoolYear: (item.schoolYear || '2025-2026').slice(0, 20),
            status: item.status,
            methodology: (item.methodology || '').slice(0, 1500),
            keyFindings: (item.keyFindings || '').slice(0, 2000),
            attachmentName: (item.attachmentName || '').slice(0, 260),
            attachmentType: (item.attachmentType || '').slice(0, 100),
            attachmentSize: Number(item.attachmentSize || 0),
            fileDocId: '',
            driveUrl: (item.driveUrl || '').slice(0, 500),
            evaluationScore: Number(item.evaluationScore || 0),
            evaluationRemarks: (item.evaluationRemarks || '').slice(0, 1500),
            evaluatedBy: (item.evaluatedBy || '').slice(0, 160),
            authorUid: writerUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, docPath);
        }
      }
    }

    // 3. Sync researcher profiles
    for (const prof of [...INITIAL_BNHS_RESEARCHERS, ...localProfiles]) {
      if (deletedProfileIds.includes(prof.id)) continue;
      const cleanId = sanitizeId(prof.id);
      const isLocalOverride = localProfiles.some((lp) => sanitizeId(lp.id) === cleanId);
      const exists = cloudProfiles.some((p) => p.id === cleanId);
      if (!exists || isLocalOverride) {
        const docPath = `researchers/${cleanId}`;
        try {
          await setDoc(doc(db, 'researchers', cleanId), {
            portalId: 'bnhs',
            uid: sanitizeId(prof.uid || writerUid),
            fullName: prof.fullName.slice(0, 160),
            role: prof.role,
            departmentOrStrand: prof.departmentOrStrand.slice(0, 120),
            gradeOrPosition: prof.gradeOrPosition.slice(0, 100),
            specialization: (prof.specialization || '').slice(0, 250),
            bio: (prof.bio || '').slice(0, 1000),
            institutionIdCode: (prof.institutionIdCode || '').slice(0, 60),
            driveFolderUrl: (prof.driveFolderUrl || '').slice(0, 500),
            photoUrl: (prof.photoUrl || '').slice(0, 750000),
            photoDriveUrl: (prof.photoDriveUrl || '').slice(0, 500),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, docPath);
        }
      }
    }

    // 4. Sync Overview items
    for (const ov of activeOverviewItems) {
      const cleanId = sanitizeId(ov.id);
      try {
        await setDoc(doc(db, 'overview_items', cleanId), {
          portalId: 'bnhs',
          itemType: ov.itemType,
          code: (ov.code || 'BNHS-OV').slice(0, 40),
          title: (ov.title || 'Barobo National High School').slice(0, 300),
          subtitle: (ov.subtitle || 'BNHS Research Portal').slice(0, 200),
          description: (ov.description || 'Barobo National High School Research Portal').slice(0, 2000),
          imageUrl: (ov.imageUrl || '').slice(0, 750000),
          divisionLink: ov.divisionLink,
          displayOrder: Number(ov.displayOrder || 0),
          isDeleted: Boolean(ov.isDeleted),
          updatedByUid: writerUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }

    // 5. Sync Research Gallery items
    for (const gal of activeGalleryItems) {
      const cleanId = sanitizeId(gal.id);
      try {
        await setDoc(doc(db, 'research_gallery', cleanId), {
          portalId: 'bnhs',
          title: (gal.title || '').slice(0, 300),
          caption: (gal.caption || '').slice(0, 1000),
          imageUrl: (gal.imageUrl || '').slice(0, 750000),
          displayOrder: Number(gal.displayOrder || 1),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }

    // 6. Sync Research Information videos
    for (const info of activeInformationItems) {
      const cleanId = sanitizeId(info.id);
      try {
        await setDoc(doc(db, 'research_information', cleanId), {
          portalId: 'bnhs',
          title: (info.title || '').slice(0, 300),
          category: (info.category || '').slice(0, 120),
          description: (info.description || '').slice(0, 3000),
          videoUrl: (info.videoUrl || '').slice(0, 750000),
          videoSourceType: (info.videoSourceType || 'youtube').slice(0, 30),
          imageUrl: (info.imageUrl || '').slice(0, 750000),
          linkUrl: (info.linkUrl || '').slice(0, 500),
          displayOrder: Number(info.displayOrder || 1),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }

    setLastSyncedTime(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    setCloudSyncState('synced');
    showToast('Cloud Synced: All changes are permanently saved to Cloud Database and intact when published.');
  };

  // Filtered Research Records for the Active View
  const effectiveDivision =
    activeSection === 'basic' ||
    activeSection === 'action' ||
    activeSection === 'tuklas'
      ? activeSection
      : selectedDivisionFilter;

  const availableCategoriesForFilter = useMemo(() => {
    if (effectiveDivision === 'all') return [];
    return getCategoriesForDivision(effectiveDivision);
  }, [effectiveDivision]);

  const availableSubcategoriesForFilter = useMemo(() => {
    if (selectedCategoryFilter === 'all') return [];
    const found = availableCategoriesForFilter.find(
      (c) => c.name === selectedCategoryFilter
    );
    return found ? found.subcategories : [];
  }, [availableCategoriesForFilter, selectedCategoryFilter]);

  const availableSchoolYears = useMemo(() => {
    const yearSet = new Set<string>(['2026-2027', '2025-2026', '2024-2025']);
    allResearches.forEach((r) => {
      if (r.schoolYear && r.schoolYear.trim()) {
        yearSet.add(r.schoolYear.trim());
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [allResearches]);

  const toggleSchoolYearSelection = (sy: string) => {
    setSelectedSchoolYears((prev) =>
      prev.includes(sy) ? prev.filter((y) => y !== sy) : [...prev, sy]
    );
  };

  const filteredResearches = useMemo(() => {
    return allResearches.filter((item) => {
      if (effectiveDivision !== 'all' && item.division !== effectiveDivision) {
        return false;
      }
      if (
        selectedCategoryFilter !== 'all' &&
        item.category !== selectedCategoryFilter
      ) {
        return false;
      }
      if (
        selectedSubcategoryFilter !== 'all' &&
        item.subcategory !== selectedSubcategoryFilter
      ) {
        return false;
      }
      if (
        selectedStatusFilter !== 'all' &&
        item.status !== selectedStatusFilter
      ) {
        return false;
      }
      if (
        selectedRoleFilter !== 'all' &&
        item.authorRole !== selectedRoleFilter
      ) {
        return false;
      }
      // Multi-select School Year filter
      if (
        selectedSchoolYears.length > 0 &&
        !selectedSchoolYears.includes(item.schoolYear)
      ) {
        return false;
      }
      // Upload Date Range filter (YYYY-MM-DD)
      if (uploadDateFrom || uploadDateTo) {
        const rawIso = item.createdAtIso || item.updatedAtIso || '';
        const itemDateStr = rawIso.slice(0, 10); // YYYY-MM-DD
        if (uploadDateFrom && itemDateStr < uploadDateFrom) {
          return false;
        }
        if (uploadDateTo && itemDateStr > uploadDateTo) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${item.title} ${item.abstract} ${item.authors} ${item.adviser} ${item.category} ${item.subcategory} ${item.keywords} ${item.departmentOrGrade} ${item.attachmentName} ${item.schoolYear}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allResearches,
    effectiveDivision,
    selectedCategoryFilter,
    selectedSubcategoryFilter,
    selectedStatusFilter,
    selectedRoleFilter,
    selectedSchoolYears,
    uploadDateFrom,
    uploadDateTo,
    searchQuery,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const basicCount = allResearches.filter((r) => r.division === 'basic').length;
    const actionCount = allResearches.filter((r) => r.division === 'action').length;
    const tuklasCount = allResearches.filter((r) => r.division === 'tuklas').length;
    const approvedOrCompleted = allResearches.filter(
      (r) => r.status === 'Approved' || r.status === 'Completed'
    ).length;
    return {
      total: allResearches.length,
      basicCount,
      actionCount,
      tuklasCount,
      approvedOrCompleted,
    };
  }, [allResearches]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-zinc-900">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-10 py-3.5 bg-[#6B1420] text-white border-b border-rose-950">
        {/* Zone 1: Brand with BNHS GIF Logo beside BNHS Research Portal */}
        <button
          type="button"
          onClick={() => {
            setActiveSection('overview');
            setSelectedDivisionFilter('all');
            setSelectedCategoryFilter('all');
            setSelectedSubcategoryFilter('all');
          }}
          className="inline-flex items-center gap-3 text-lg font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0 text-left"
        >
          <img
            src="/assets/aistudio/BNHS_LOGO_animated.gif"
            alt="Barobo National High School Official Animated Seal (GIF)"
            className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shadow-sm shrink-0 bnhs-logo-animate"
          />
          <span>BNHS Research Portal</span>
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-rose-100">
          <button
            type="button"
            onClick={() => {
              setActiveSection('overview');
              setSelectedDivisionFilter('all');
              setSelectedCategoryFilter('all');
              setSelectedSubcategoryFilter('all');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'overview'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2 font-semibold'
                : ''
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => navigateToDivision('basic')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'basic'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2 font-semibold'
                : ''
            }`}
          >
            Basic Research
          </button>
          <button
            type="button"
            onClick={() => navigateToDivision('action')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'action'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2 font-semibold'
                : ''
            }`}
          >
            Action Research
          </button>
          <button
            type="button"
            onClick={() => navigateToDivision('tuklas')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'tuklas'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2 font-semibold'
                : ''
            }`}
          >
            TUKLAS Fair
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('directory')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'directory'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2 font-semibold'
                : ''
            }`}
          >
            Researchers &amp; Admin
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              handleOpenSubmitModal(
                activeSection === 'basic' ||
                  activeSection === 'action' ||
                  activeSection === 'tuklas'
                  ? activeSection
                  : 'basic'
              )
            }
            className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            Submit Research
          </button>
        </div>
      </header>

      {/* Mobile Navigation Strip */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-[#520E17] text-rose-100 border-b border-rose-950">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'basic', label: 'Basic Research' },
            { id: 'action', label: 'Action Research' },
            { id: 'tuklas', label: 'TUKLAS Fair' },
            { id: 'directory', label: 'Researchers & Admin' },
          ] as const
        ).map((nav) => (
          <button
            key={nav.id}
            type="button"
            onClick={() => {
              if (nav.id === 'basic' || nav.id === 'action' || nav.id === 'tuklas') {
                navigateToDivision(nav.id);
              } else {
                setActiveSection(nav.id);
              }
            }}
            className={`px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 ${
              activeSection === nav.id
                ? 'bg-amber-400 text-zinc-950 font-semibold'
                : 'text-rose-100'
            }`}
          >
            {nav.label}
          </button>
        ))}
      </div>

      {/* Center-Aligned Institutional Sub-Bar in Maroon Color */}
      <div className="bg-[#520E17] text-rose-100 border-b border-rose-950 px-6 lg:px-10 py-3">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-1.5 text-xs">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-semibold text-white">
              Barobo National High School
            </span>
            <span aria-hidden="true" className="text-amber-300">·</span>
            <span>Schools Division of Surigao del Sur, Caraga Region</span>
            <span aria-hidden="true" className="text-amber-300">·</span>
            <span className="text-amber-200 font-medium">Research and Innovation Portal</span>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => downloadStandalonePortalHtml(allResearches)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 hover:underline whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download BNHS Research Portal (HTML)</span>
            </button>

            <span aria-hidden="true" className="text-rose-300/60">|</span>

            <button
              type="button"
              onClick={handleSyncBaselineToCloud}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 whitespace-nowrap shrink-0"
              title="All changes automatically save and sync to the cloud"
            >
              {cloudSyncState === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
              ) : (
                <CloudCheck className="w-3.5 h-3.5 text-emerald-300" />
              )}
              <span>
                {cloudSyncState === 'syncing'
                  ? 'Cloud Syncing...'
                  : `Cloud Synced (Auto-Saved ${lastSyncedTime})`}
              </span>
            </button>

            <span aria-hidden="true" className="text-rose-300/60">|</span>

            {currentUser ? (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="text-rose-100">
                  <strong className="text-white">
                    {currentUser.displayName || 'Barobo NHS'}
                  </strong>{' '}
                  ({currentUser.accountClassification || (isAdmin ? 'Administrator / Coordinator' : 'Teacher / Student Account')})
                </span>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-rose-200 hover:text-white whitespace-nowrap shrink-0"
                >
                  <span>Switch Account</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setPortalSession(null);
                    if (auth.currentUser) {
                      await signOutUser();
                    }
                    showToast('Signed out of Barobo NHS Portal.');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-white whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-amber-300 whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                <span>Barobo NHS (Teacher / Student / Admin Login)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastBanner && (
        <div className="bg-[#6B1420] text-white px-6 py-2.5 text-xs border-b border-rose-950">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{toastBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastBanner('')}
              className="text-rose-200 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Email Alert Dispatched Banner */}
      {latestEmailAlertBanner && (
        <div className="bg-amber-50 border-b border-amber-300 px-6 py-3 text-xs text-zinc-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-[#6B1420] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#6B1420]">
                  Email Alert Dispatched to {latestEmailAlertBanner.recipientEmail} ·{' '}
                  <span className="text-zinc-900">{latestEmailAlertBanner.subject}</span>
                </div>
                <div className="text-zinc-700 mt-0.5">
                  {latestEmailAlertBanner.messageBody}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`mailto:${encodeURIComponent(
                  latestEmailAlertBanner.recipientEmail
                )}?subject=${encodeURIComponent(
                  latestEmailAlertBanner.subject
                )}&body=${encodeURIComponent(latestEmailAlertBanner.messageBody)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17]"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send via Email Client</span>
              </a>
              <button
                type="button"
                onClick={() => setLatestEmailAlertBanner(null)}
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-10 py-8 md:py-10 space-y-12">
        {/* ==================== 1. OVERVIEW / HOME DASHBOARD ==================== */}
        {activeSection === 'overview' && (
          <>
            {/* 2-Column Hero Split with items-stretch (Customizable via Admin Overview Manager) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-zinc-200 p-6 md:p-10">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-xs text-zinc-500">
                    {heroOverviewItem.code}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img
                      src="/assets/aistudio/BNHS_LOGO_animated.gif"
                      alt="Barobo National High School Official Animated Seal (GIF)"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-contain shrink-0 border-2 border-[#6B1420]/20 bg-white p-1 shadow-sm bnhs-logo-animate"
                    />
                    <h1
                      className="text-3xl sm:text-4xl lg:text-[2.45rem] font-display font-semibold text-[#6B1420] leading-[1.15]"
                      style={{ textWrap: 'balance' }}
                    >
                      {heroOverviewItem.title}
                    </h1>
                  </div>
                  <p className="text-base text-zinc-600 leading-relaxed max-w-2xl">
                    {heroOverviewItem.description}
                  </p>
                </div>

                {/* Primary & Secondary Actions */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenSubmitModal('basic')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Submit Research Entry</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadStandalonePortalHtml(allResearches)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-zinc-900 bg-[#FAF9F5] border border-zinc-300 hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Download className="w-4 h-4 text-[#6B1420]" />
                      <span>Download BNHS Research Portal (HTML)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('directory');
                        setDirectoryTab('admin');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Admin &amp; Overview Customization</span>
                    </button>
                  </div>

                  <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                    <strong className="text-zinc-700">Cloud + Offline Hybrid Ready:</strong>{' '}
                    Entries are synchronized across computers via our shared database, or you can download the standalone HTML portal to open directly in Google Chrome or Microsoft Edge.
                  </div>
                </div>
              </div>

              {/* Right Column Hero Visual */}
              <div className="lg:col-span-5 min-h-[280px] relative overflow-hidden bg-[#6B1420]">
                {!imgErrors.hero && (heroOverviewItem.imageUrl || PORTAL_IMAGES.heroCampus) ? (
                  <img
                    src={resolveOverviewImageLink(heroOverviewItem.imageUrl || PORTAL_IMAGES.heroCampus)}
                    alt={heroOverviewItem.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors((p) => ({ ...p, hero: true }))}
                    className="w-full h-full lg:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-rose-100 bg-gradient-to-br from-[#6B1420] to-[#3D0910]">
                    <BookOpen className="w-12 h-12 mb-3 text-amber-400" />
                    <div className="font-display text-lg font-semibold text-white">
                      Barobo National High School
                    </div>
                    <p className="text-xs text-rose-200 mt-1">
                      Center for School-Based Research &amp; TUKLAS Scientific Innovation
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="text-xs text-amber-300 font-medium">
                    Institutional Research Repository · SY 2025–2027
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {heroOverviewItem.subtitle}
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== 1.1 RESEARCH GALLERY (1000 × 500 SLIDING PICTURES · 10S INTERVAL) ==================== */}
            <ResearchGallerySection
              items={activeGalleryItems}
              isAdmin={isAdmin}
              onOpenAdminManager={() => {
                setActiveSection('directory');
                setDirectoryTab('admin');
              }}
            />

            {/* ==================== 1.2 RESEARCH INFORMATION (1000 × 500 TOPICS & AGENDA) ==================== */}
            <ResearchInformationSection
              items={activeInformationItems}
              isAdmin={isAdmin}
              onOpenAdminManager={() => {
                setActiveSection('directory');
                setDirectoryTab('admin');
              }}
            />

            {/* Full-Width 4-Column Institutional Statistics Row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 p-6">
                <div className="text-xs text-zinc-500">Total Indexed Studies</div>
                <div className="text-3xl font-mono font-bold text-zinc-900 mt-1.5 tabular-nums">
                  {stats.total}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {stats.approvedOrCompleted} Approved / Completed · Shared Cloud DB
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateToDivision('basic')}
                className="text-left bg-white border border-zinc-200 hover:border-[#6B1420] p-6 transition-colors group"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>01. Basic Research</span>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#6B1420]" />
                </div>
                <div className="text-3xl font-mono font-bold text-[#6B1420] mt-1.5 tabular-nums">
                  {stats.basicCount}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Completed &amp; ongoing policy &amp; baseline studies
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateToDivision('action')}
                className="text-left bg-white border border-zinc-200 hover:border-[#6B1420] p-6 transition-colors group"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>02. Action Research</span>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#6B1420]" />
                </div>
                <div className="text-3xl font-mono font-bold text-[#6B1420] mt-1.5 tabular-nums">
                  {stats.actionCount}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Organized across all 7 DepEd Themes
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateToDivision('tuklas')}
                className="text-left bg-white border border-zinc-200 hover:border-[#6B1420] p-6 transition-colors group"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>03. TUKLAS Project Fair</span>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#6B1420]" />
                </div>
                <div className="text-3xl font-mono font-bold text-amber-700 mt-1.5 tabular-nums">
                  {stats.tuklasCount}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  5 Major Categories &amp; Innovation Expo
                </div>
              </button>
            </section>

            {/* Data Visualization Section (Recharts Bar Chart per Division & Pie Chart across 7 Action Research Themes + Live Cloud Synced Status) */}
            <OverviewAnalyticsSection
              researches={allResearches}
              cloudSyncState={cloudSyncState}
              lastSyncedTime={lastSyncedTime}
              isAuthenticated={Boolean(currentUser && currentUser.emailVerified)}
              onTriggerCloudSync={handleSyncBaselineToCloud}
              onNavigateDivision={(div, cat, subcat) =>
                navigateToDivision(div, cat || 'all', subcat || 'all')
              }
            />

            {/* Latest Additions Horizontal Scrolling Widget (5 Most Recent Uploads) */}
            <LatestAdditionsWidget
              researches={allResearches}
              onSelectResearch={(rec) => setSelectedDetailRecord(rec)}
              onNavigateDivision={(div) => navigateToDivision(div)}
            />

            {/* Customizable Overview Division Cards Section */}
            <section className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {cardOverviewItems.map((cardItem) => {
                  const targetDiv =
                    cardItem.divisionLink === 'basic' ||
                    cardItem.divisionLink === 'action' ||
                    cardItem.divisionLink === 'tuklas'
                      ? cardItem.divisionLink
                      : null;
                  const count = targetDiv
                    ? allResearches.filter((r) => r.division === targetDiv).length
                    : allResearches.length;

                  return (
                    <div
                      key={cardItem.id}
                      className="bg-white border border-zinc-200 flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        <div className="aspect-[4/3] w-full bg-zinc-100 relative overflow-hidden">
                          {cardItem.imageUrl && !imgErrors[cardItem.id] ? (
                            <img
                              src={resolveOverviewImageLink(cardItem.imageUrl)}
                              alt={cardItem.title}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setImgErrors((p) => ({ ...p, [cardItem.id]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#6B1420] text-white p-6 text-center">
                              <span className="font-display text-lg">
                                {cardItem.title}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                            <span className="text-xs font-mono text-white">
                              {cardItem.code} · {cardItem.subtitle} · {count} Studies
                            </span>
                          </div>
                        </div>

                        <div className="p-6 space-y-2.5">
                          <h3 className="text-xl font-display font-semibold text-zinc-900">
                            {cardItem.title}
                          </h3>
                          <p className="text-xs text-zinc-600 leading-relaxed">
                            {cardItem.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                        {targetDiv ? (
                          <button
                            type="button"
                            onClick={() => navigateToDivision(targetDiv)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B1420] hover:underline"
                          >
                            <span>Explore {cardItem.title}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection('directory');
                              setDirectoryTab('admin');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B1420] hover:underline"
                          >
                            <span>Explore {cardItem.title}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Interactive Overview of Action Research (7 Themes) & TUKLAS (4 Categories) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left 7 Cols: Action Research 7 Official Themes */}
              <div className="lg:col-span-7 bg-white border border-zinc-200 p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                  <div>
                    <div className="text-xs text-zinc-500">
                      Division 02 · Practitioner Inquiry
                    </div>
                    <h2 className="text-xl font-display font-semibold text-zinc-900 mt-0.5">
                      Action Research — Seven Official Themes
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToDivision('action')}
                    className="text-xs font-semibold text-[#6B1420] hover:underline whitespace-nowrap shrink-0"
                  >
                    View All Themes →
                  </button>
                </div>

                <div className="divide-y divide-zinc-200">
                  {ACTION_RESEARCH_THEMES.map((theme) => {
                    const count = allResearches.filter(
                      (r) => r.division === 'action' && r.category === theme.name
                    ).length;
                    return (
                      <div
                        key={theme.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => navigateToDivision('action', theme.name)}
                            className="text-left text-sm font-semibold text-zinc-900 hover:text-[#6B1420] transition-colors"
                          >
                            {theme.name}
                          </button>
                          <p className="text-xs text-zinc-500 line-clamp-1">
                            {theme.subcategories.join(' · ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono text-zinc-600 tabular-nums">
                            {count} {count === 1 ? 'study' : 'studies'}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigateToDivision('action', theme.name)}
                            className="px-2.5 py-1 text-xs font-medium text-[#6B1420] bg-rose-50 hover:bg-rose-100 transition-colors"
                          >
                            Filter
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 5 Cols: TUKLAS 5 Major Categories & Subcategories (including Innovation Expo) */}
              <div className="lg:col-span-5 bg-white border border-zinc-200 p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                  <div>
                    <div className="text-xs text-zinc-500">
                      Division 03 · STEM &amp; Innovation Fair
                    </div>
                    <h2 className="text-xl font-display font-semibold text-zinc-900 mt-0.5">
                      TUKLAS: Five Major Categories &amp; Innovation Expo
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToDivision('tuklas')}
                    className="text-xs font-semibold text-[#6B1420] hover:underline whitespace-nowrap shrink-0"
                  >
                    Open TUKLAS →
                  </button>
                </div>

                <div className="space-y-4">
                  {TUKLAS_CATEGORIES.map((cat) => {
                    const count = allResearches.filter(
                      (r) => r.division === 'tuklas' && r.category === cat.name
                    ).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-4 bg-[#FAF9F5] border border-zinc-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => navigateToDivision('tuklas', cat.name)}
                            className="text-left text-sm font-semibold text-zinc-900 hover:text-[#6B1420]"
                          >
                            {cat.name}
                          </button>
                          <span className="text-xs font-mono text-amber-800 font-semibold tabular-nums">
                            {count} {count === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-600">
                          {cat.subcategories.map((sub, idx) => (
                            <React.Fragment key={sub}>
                              {idx > 0 && <span aria-hidden="true">·</span>}
                              <button
                                type="button"
                                onClick={() =>
                                  navigateToDivision('tuklas', cat.name, sub)
                                }
                                className="hover:text-[#6B1420] hover:underline text-left"
                              >
                                {sub}
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ==================== 2. DEDICATED DIVISION HEADER BANNERS ==================== */}
        {activeSection === 'basic' && (
          <section className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
              <div className="max-w-3xl">
                <div className="text-xs text-zinc-500">
                  Division 01 · Barobo National High School Research Repository
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-zinc-900 mt-1">
                  Basic Research Repository
                </h1>
                <p className="text-sm text-zinc-600 mt-1.5">
                  Completed and ongoing foundational research investigating curriculum alignment, learner socio-demographic profiles across Barobo’s coastal and upland barangays, educational governance, and longitudinal graduate outcomes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenSubmitModal('basic')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Basic Research</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {BASIC_RESEARCH_CATEGORIES.map((focus) => {
                const count = allResearches.filter(
                  (r) => r.division === 'basic' && r.category === focus.name
                ).length;
                const isSelected = selectedCategoryFilter === focus.name;
                return (
                  <button
                    key={focus.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(isSelected ? 'all' : focus.name);
                      setSelectedSubcategoryFilter('all');
                    }}
                    className={`text-left p-4 border transition-colors flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#6B1420] bg-rose-950/5'
                        : 'border-zinc-200 bg-[#FAF9F5] hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono text-zinc-500 tabular-nums">
                        {count} {count === 1 ? 'Study' : 'Studies'}
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 mt-1">
                        {focus.name}
                      </div>
                      <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2">
                        {focus.description}
                      </p>
                    </div>
                    <div className="text-[11px] font-medium text-[#6B1420] mt-3">
                      {isSelected ? 'Showing Focus Area (Click to Reset)' : 'Filter by Focus Area →'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {activeSection === 'action' && (
          <section className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
              <div className="max-w-3xl">
                <div className="text-xs text-zinc-500">
                  Division 02 · Classroom &amp; School-Based Practitioner Research
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-zinc-900 mt-1">
                  Action Research — Seven Official Themes
                </h1>
                <p className="text-sm text-zinc-600 mt-1.5">
                  Organized according to the seven official themes of the Department of Education Basic Education Research Agenda (BERA). Click any theme to filter classroom and school-level interventions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenSubmitModal('action')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Action Research</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {ACTION_RESEARCH_THEMES.map((theme) => {
                const count = allResearches.filter(
                  (r) => r.division === 'action' && r.category === theme.name
                ).length;
                const isSelected = selectedCategoryFilter === theme.name;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(isSelected ? 'all' : theme.name);
                      setSelectedSubcategoryFilter('all');
                    }}
                    className={`text-left p-4 border transition-colors flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#6B1420] bg-rose-950/5'
                        : 'border-zinc-200 bg-[#FAF9F5] hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                        <span>{theme.themeNumber}</span>
                        <span className="tabular-nums">{count} Studies</span>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 mt-1">
                        {theme.name.replace(/^Theme \d+:\s*/, '')}
                      </div>
                      <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2">
                        {theme.description}
                      </p>
                    </div>
                    <div className="text-[11px] font-medium text-[#6B1420] mt-3">
                      {isSelected ? 'Active Theme Filter (Reset)' : 'View Theme Studies →'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {activeSection === 'tuklas' && (
          <section className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
              <div className="max-w-3xl">
                <div className="text-xs text-zinc-500">
                  Division 03 · Student Science, Engineering &amp; Mathematics Exhibition
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-zinc-900 mt-1">
                  TUKLAS: A Research Project Fair
                </h1>
                <p className="text-sm text-zinc-600 mt-1.5">
                  Organized across five major categories — Life Science (LS), Physical Science (PS), Robotics and Intelligent Machines (RIM), Mathematics and Computational Sciences (MCS), and the Innovation Expo — with specialized subcategories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenSubmitModal('tuklas')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Submit TUKLAS Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TUKLAS_CATEGORIES.map((cat) => {
                const count = allResearches.filter(
                  (r) => r.division === 'tuklas' && r.category === cat.name
                ).length;
                const isSelected = selectedCategoryFilter === cat.name;
                return (
                  <div
                    key={cat.id}
                    className={`p-5 border transition-colors space-y-3 ${
                      isSelected
                        ? 'border-[#6B1420] bg-rose-950/5'
                        : 'border-zinc-200 bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-zinc-500">
                          {cat.code}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter(isSelected ? 'all' : cat.name);
                            setSelectedSubcategoryFilter('all');
                          }}
                          className="text-left text-base font-display font-semibold text-zinc-900 hover:text-[#6B1420] mt-0.5"
                        >
                          {cat.name}
                        </button>
                      </div>
                      <span className="text-xs font-mono font-semibold text-amber-800 tabular-nums shrink-0">
                        {count} {count === 1 ? 'Project' : 'Projects'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600">{cat.description}</p>

                    <div className="pt-2 border-t border-zinc-200/80">
                      <div className="text-[11px] font-semibold text-zinc-700 mb-1.5">
                        Subcategories (Click to Filter):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subcategories.map((sub) => {
                          const subActive =
                            selectedCategoryFilter === cat.name &&
                            selectedSubcategoryFilter === sub;
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                setSelectedCategoryFilter(cat.name);
                                setSelectedSubcategoryFilter(
                                  subActive ? 'all' : sub
                                );
                              }}
                              className={`px-2.5 py-1 text-xs transition-colors ${
                                subActive
                                  ? 'bg-[#6B1420] text-white font-semibold'
                                  : 'bg-white border border-zinc-300 text-zinc-700 hover:border-[#6B1420]'
                              }`}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== 3. PUBLIC RESEARCH LIBRARY & FILTERABLE REPOSITORY ==================== */}
        {activeSection !== 'directory' && (
          <section className="space-y-6" id="research-library">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <div className="text-xs text-zinc-500">
                  Public Research Library &amp; Searchable Manuscript Catalog
                </div>
                <h2 className="text-2xl font-display font-semibold text-zinc-900 mt-0.5">
                  {activeSection === 'overview'
                    ? 'Complete BNHS Research & Innovation Library'
                    : `${getDivisionLabel(activeSection)} Entries`}
                </h2>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadResearchInventoryCsv(filteredResearches)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#6B1420]" />
                  <span>Export Filtered CSV ({filteredResearches.length})</span>
                </button>
              </div>
            </div>

            {/* Interactive Search & Multi-Facet Filter Bar */}
            <div className="bg-white border border-zinc-200 p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Search Input */}
                <div className="lg:col-span-5 relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, author, adviser, keyword, or filename..."
                    className="w-full pl-10 pr-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#6B1420]"
                  />
                </div>

                {/* Division Filter (when on overview) */}
                {activeSection === 'overview' && (
                  <div className="lg:col-span-3">
                    <select
                      value={selectedDivisionFilter}
                      onChange={(e) => {
                        setSelectedDivisionFilter(
                          e.target.value as 'all' | ResearchDivisionId
                        );
                        setSelectedCategoryFilter('all');
                        setSelectedSubcategoryFilter('all');
                      }}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-[#6B1420]"
                    >
                      <option value="all">All 3 Major Research Divisions</option>
                      <option value="basic">1. Basic Research</option>
                      <option value="action">2. Action Research (7 Themes)</option>
                      <option value="tuklas">3. TUKLAS Project Fair (4 Categories)</option>
                    </select>
                  </div>
                )}

                {/* Theme / Category Filter */}
                <div
                  className={
                    activeSection === 'overview' ? 'lg:col-span-2' : 'lg:col-span-4'
                  }
                >
                  <select
                    value={selectedCategoryFilter}
                    disabled={effectiveDivision === 'all'}
                    onChange={(e) => {
                      setSelectedCategoryFilter(e.target.value);
                      setSelectedSubcategoryFilter('all');
                    }}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-800 disabled:bg-zinc-50 disabled:text-zinc-400 focus:outline-none focus:border-[#6B1420]"
                  >
                    <option value="all">
                      {effectiveDivision === 'action'
                        ? 'All 7 Action Research Themes'
                        : effectiveDivision === 'tuklas'
                        ? 'All 4 TUKLAS Categories'
                        : effectiveDivision === 'basic'
                        ? 'All Basic Research Focus Areas'
                        : 'Select a Division for Themes/Categories'}
                    </option>
                    {availableCategoriesForFilter.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div
                  className={
                    activeSection === 'overview' ? 'lg:col-span-2' : 'lg:col-span-3'
                  }
                >
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-[#6B1420]"
                  >
                    <option value="all">All Project Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Revision Requested">Revision Requested</option>
                  </select>
                </div>
              </div>

              {/* Secondary Filter Strip: Multi-Select School Years & Upload Date Range Picker */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-zinc-100 text-xs">
                {/* Multi-Select School Years */}
                <div className="lg:col-span-6 flex flex-wrap items-center gap-1.5">
                  <span className="text-zinc-600 font-semibold mr-1">
                    School Years (Multi-Select):
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSchoolYears([])}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedSchoolYears.length === 0
                        ? 'bg-[#6B1420] text-white font-semibold'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    All Years
                  </button>
                  {availableSchoolYears.map((sy) => {
                    const isChecked = selectedSchoolYears.includes(sy);
                    return (
                      <button
                        key={sy}
                        type="button"
                        onClick={() => toggleSchoolYearSelection(sy)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono transition-colors whitespace-nowrap shrink-0 border ${
                          isChecked
                            ? 'bg-[#6B1420] text-white border-[#6B1420] font-semibold'
                            : 'bg-white text-zinc-700 border-zinc-300 hover:border-[#6B1420]'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 inline-flex items-center justify-center border ${
                            isChecked
                              ? 'border-white bg-white/20 text-white'
                              : 'border-zinc-400 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span>SY {sy}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Upload Date Range Picker */}
                <div className="lg:col-span-6 flex flex-wrap items-center lg:justify-end gap-2">
                  <span className="text-zinc-600 font-semibold inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#6B1420]" />
                    <span>Upload Date Range:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <label className="inline-flex items-center gap-1 text-zinc-600">
                      <span className="text-[11px]">From</span>
                      <input
                        type="date"
                        value={uploadDateFrom}
                        onChange={(e) => setUploadDateFrom(e.target.value)}
                        aria-label="Upload date from"
                        className="px-2 py-1 text-xs font-mono border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-[#6B1420]"
                      />
                    </label>
                    <span className="text-zinc-400">—</span>
                    <label className="inline-flex items-center gap-1 text-zinc-600">
                      <span className="text-[11px]">To</span>
                      <input
                        type="date"
                        value={uploadDateTo}
                        onChange={(e) => setUploadDateTo(e.target.value)}
                        aria-label="Upload date to"
                        className="px-2 py-1 text-xs font-mono border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-[#6B1420]"
                      />
                    </label>
                    {(uploadDateFrom || uploadDateTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadDateFrom('');
                          setUploadDateTo('');
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-[#6B1420] bg-rose-50 hover:bg-rose-100 transition-colors whitespace-nowrap"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tertiary Filter Strip: Subcategory, Proponent Role & Active Count */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-500 font-medium">Proponent Type:</span>
                  {(
                    [
                      { id: 'all', label: 'All Proponents' },
                      { id: 'Teacher', label: 'Teacher Research' },
                      { id: 'Student', label: 'Student Research' },
                      { id: 'Collaborative', label: 'Collaborative' },
                    ] as const
                  ).map((roleBtn) => (
                    <button
                      key={roleBtn.id}
                      type="button"
                      onClick={() => setSelectedRoleFilter(roleBtn.id)}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selectedRoleFilter === roleBtn.id
                          ? 'bg-[#6B1420] text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {roleBtn.label}
                    </button>
                  ))}

                  {availableSubcategoriesForFilter.length > 0 && (
                    <select
                      value={selectedSubcategoryFilter}
                      onChange={(e) => setSelectedSubcategoryFilter(e.target.value)}
                      className="ml-2 px-2.5 py-1 text-xs border border-zinc-300 bg-white text-zinc-800"
                    >
                      <option value="all">All Subcategories</option>
                      {availableSubcategoriesForFilter.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono tabular-nums">
                    Showing {filteredResearches.length} of {allResearches.length} records
                  </span>
                  {(selectedDivisionFilter !== 'all' ||
                    selectedCategoryFilter !== 'all' ||
                    selectedSubcategoryFilter !== 'all' ||
                    selectedStatusFilter !== 'all' ||
                    selectedRoleFilter !== 'all' ||
                    selectedSchoolYears.length > 0 ||
                    uploadDateFrom !== '' ||
                    uploadDateTo !== '' ||
                    searchQuery !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSection === 'overview') {
                          setSelectedDivisionFilter('all');
                        }
                        setSelectedCategoryFilter('all');
                        setSelectedSubcategoryFilter('all');
                        setSelectedStatusFilter('all');
                        setSelectedRoleFilter('all');
                        setSelectedSchoolYears([]);
                        setUploadDateFrom('');
                        setUploadDateTo('');
                        setSearchQuery('');
                      }}
                      className="text-xs font-semibold text-[#6B1420] hover:underline"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Loading Skeleton or Populated Research List */}
            {loadingData ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white border border-zinc-200 p-6 animate-pulse space-y-3"
                  >
                    <div className="h-3 bg-zinc-200 w-1/3" />
                    <div className="h-5 bg-zinc-200 w-3/4" />
                    <div className="h-12 bg-zinc-100 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredResearches.length === 0 ? (
              <div className="bg-white border border-zinc-200 p-12 text-center space-y-3">
                <FolderOpen className="w-8 h-8 text-zinc-400 mx-auto" />
                <h3 className="text-base font-display font-semibold text-zinc-900">
                  No Matching Research Entries Found
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  No research records match your current search or filter criteria. Try resetting the filters or submit a new research entry to this division.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenSubmitModal(
                        effectiveDivision === 'all' ? 'basic' : effectiveDivision
                      )
                    }
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors"
                  >
                    + Submit First Entry in Category
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResearches.map((record) => {
                  const isSubscribed = allSubscriptions.some(
                    (s) => s.researchId === record.id
                  );
                  const commentCount = allComments.filter(
                    (c) => c.researchId === record.id
                  ).length;

                  return (
                    <article
                      key={record.id}
                      className="bg-white border border-zinc-200 p-6 hover:border-zinc-300 transition-colors space-y-3"
                    >
                      {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#6B1420]">
                            {getDivisionLabel(record.division)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-zinc-800">
                            {record.category}
                          </span>
                          {record.subcategory && (
                            <>
                              <span aria-hidden="true">/</span>
                              <span>{record.subcategory}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">SY {record.schoolYear}</span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span
                            className={`font-semibold ${
                              record.status === 'Approved'
                                ? 'text-emerald-800'
                                : record.status === 'Pending Review'
                                ? 'text-amber-700'
                                : 'text-zinc-700'
                            }`}
                          >
                            {record.status}
                          </span>
                          {record.evaluationScore > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-800 tabular-nums">
                                Score: {record.evaluationScore}/100
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Study Title */}
                      <h3 className="text-lg font-display font-semibold text-zinc-900 leading-snug">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailRecord(record)}
                          className="text-left hover:text-[#6B1420] transition-colors"
                        >
                          {record.title}
                        </button>
                      </h3>

                      {/* Abstract Excerpt */}
                      <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2">
                        {record.abstract}
                      </p>

                      {/* Bottom Proponents, Recorded Filename & Actions Strip (Including Notify Me, Edit, Delete) */}
                      <div className="pt-3 border-t border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-zinc-600">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>
                            <strong className="text-zinc-900">Authors:</strong>{' '}
                            {record.authors} ({record.authorRole})
                          </span>
                          {record.adviser && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                <strong className="text-zinc-900">Adviser:</strong>{' '}
                                {record.adviser}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-zinc-700">
                            File: {record.attachmentName || 'Unattached'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* Notify Me Button */}
                          <button
                            type="button"
                            onClick={() => setNotifyTargetRecord(record)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
                              isSubscribed
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-[#6B1420] border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {isSubscribed ? (
                              <>
                                <BellRing className="w-3.5 h-3.5" />
                                <span>Alerts On</span>
                              </>
                            ) : (
                              <>
                                <Bell className="w-3.5 h-3.5" />
                                <span>Notify Me</span>
                              </>
                            )}
                          </button>

                          {/* Comments Count Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailRecord(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
                            title="View or post comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#6B1420]" />
                            <span>{commentCount}</span>
                          </button>

                          {/* Edit Button on Every Posted Research */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(record);
                              setSubmitModalDivision(record.division);
                              setIsSubmitModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#6B1420]" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button on Every Posted Research (with inline confirm) */}
                          {confirmDeleteCardId === record.id ? (
                            <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleDeleteResearch(record);
                                  setConfirmDeleteCardId(null);
                                }}
                                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCardId(null)}
                                className="px-1.5 py-0.5 text-[11px] text-zinc-600 hover:text-zinc-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCardId(record.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}

                          {record.driveUrl && (
                            <a
                              href={record.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#6B1420] hover:underline whitespace-nowrap shrink-0"
                            >
                              <span>Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => downloadResearchDossierHtml(record)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 whitespace-nowrap shrink-0"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#6B1420]" />
                            <span>Report</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDetailRecord(record)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors whitespace-nowrap shrink-0"
                          >
                            Research Details →
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ==================== 4. RESEARCHERS & ADMINISTRATOR WORKFLOW VIEW ==================== */}
        {activeSection === 'directory' && (
          <section className="space-y-6">
            {/* Sub-Navigation Switcher between Researcher Profiles & Admin Evaluation Dashboard */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDirectoryTab('researchers')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    directoryTab === 'researchers'
                      ? 'bg-[#6B1420] text-white'
                      : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Teacher &amp; Student Researcher Profiles ({allProfiles.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDirectoryTab('admin')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    directoryTab === 'admin'
                      ? 'bg-[#6B1420] text-white'
                      : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrator Dashboard, Overview Manager &amp; Evaluation</span>
                </button>
              </div>
            </div>

            {directoryTab === 'researchers' ? (
              <ResearcherProfilesView
                profiles={allProfiles}
                researches={allResearches}
                currentUserUid={currentUser?.uid}
                currentUserName={
                  currentUser?.displayName || currentUser?.email?.split('@')[0] || ''
                }
                isAdmin={isAdmin}
                onSelectResearch={(rec) => setSelectedDetailRecord(rec)}
                onSaveProfile={handleSaveResearcherProfile}
                onDeleteProfile={handleDeleteResearcherProfile}
                onSignInPrompt={() => setIsLoginModalOpen(true)}
              />
            ) : (
              <AdminEvaluationView
                researches={allResearches}
                isAdmin={isAdmin}
                currentUserUid={currentUser?.uid}
                currentUserEmail={currentUser?.email}
                onSelectResearch={(rec) => setSelectedDetailRecord(rec)}
                onEditResearch={(rec) => {
                  setEditingRecord(rec);
                  setSubmitModalDivision(rec.division);
                  setIsSubmitModalOpen(true);
                }}
                onDeleteResearch={handleDeleteResearch}
                onAddNewResearch={() => handleOpenSubmitModal('basic')}
                onQuickStatusUpdate={async (rec, newStatus) => {
                  await handleEvaluateResearch(
                    rec,
                    newStatus,
                    rec.evaluationScore > 0 ? rec.evaluationScore : 94,
                    rec.evaluationRemarks ||
                      'Approved for publication in the Barobo National High School Research Library.',
                    currentUser?.displayName || 'BNHS Research Coordinator'
                  );
                }}
                onSyncBaselineToCloud={handleSyncBaselineToCloud}
                onSignInPrompt={() => setIsLoginModalOpen(true)}
                overviewItems={activeOverviewItems}
                onSaveOverviewItem={handleSaveOverviewItem}
                onDeleteOverviewItem={handleDeleteOverviewItem}
                onResetOverviewDefaults={handleResetOverviewDefaults}
                subscriptions={allSubscriptions}
                emailAlertLogs={emailAlertLogs}
                galleryItems={activeGalleryItems}
                onSaveGalleryItem={handleSaveGalleryItem}
                onDeleteGalleryItem={handleDeleteGalleryItem}
                onDeleteAllGalleryItems={handleDeleteAllGalleryItems}
                onResetGalleryDefaults={handleResetGalleryDefaults}
                informationItems={activeInformationItems}
                onSaveInformationItem={handleSaveInformationItem}
                onDeleteInformationItem={handleDeleteInformationItem}
              />
            )}
          </section>
        )}
      </main>

      {/* INSTITUTIONAL FOOTER IN MAROON WITH AUTO-UPDATING YEAR MARQUEE */}
      <footer className="bg-[#6B1420] border-t border-rose-950 mt-16 text-xs text-rose-100">
        <div className="max-w-7xl mx-auto py-7 px-6 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/assets/aistudio/BNHS_LOGO_animated.gif"
              alt="Barobo National High School Official Animated Seal (GIF)"
              className="w-12 h-12 rounded-full object-contain bg-white border-2 border-amber-300/60 p-0.5 shrink-0 bnhs-logo-animate"
            />
            <div>
              <div className="font-semibold text-white text-sm">
                Barobo National High School — Research and Innovation Portal
              </div>
              <div className="mt-0.5 text-rose-100">
                Poblacion, Barobo, Surigao del Sur · Department of Education — Caraga Region · Est. 1978
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => downloadStandalonePortalHtml(allResearches)}
              className="text-amber-300 hover:text-white font-semibold transition-colors"
            >
              Download Portal HTML
            </button>
            <span aria-hidden="true" className="text-rose-300">·</span>
            <button
              type="button"
              onClick={() => downloadResearchInventoryCsv(allResearches)}
              className="text-amber-300 hover:text-white font-semibold transition-colors"
            >
              Export Master Inventory (.CSV)
            </button>
            <span aria-hidden="true" className="text-rose-300">·</span>
            <button
              type="button"
              onClick={() => handleOpenSubmitModal('basic')}
              className="text-amber-300 hover:text-white font-semibold transition-colors"
            >
              Submit Manuscript
            </button>
          </div>
        </div>

        {/* Animated Marquee Copyright Bar with Auto-Updating Year */}
        <div className="bg-[#520E17] text-white py-3 border-t border-rose-950 bnhs-marquee-viewport">
          <div className="bnhs-marquee-belt items-center">
            {[0, 1].map((groupIdx) => (
              <div
                key={groupIdx}
                aria-hidden={groupIdx === 1 ? 'true' : undefined}
                className="flex items-center shrink-0"
              >
                {[0, 1, 2].map((itemIdx) => (
                  <span
                    key={itemIdx}
                    className="mx-10 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide bnhs-animated-copyright-text"
                  >
                    <span>
                      Copyright ©Barobo National High School Research and Innovation Portal{' '}
                      <span className="font-mono font-bold tabular-nums underline decoration-amber-400/70 underline-offset-4">
                        {currentYear}
                      </span>{' '}
                      developed by: Bless T. Tajale.
                    </span>
                    <span className="text-amber-300 ml-6" aria-hidden="true">
                      ✦
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* SUBMISSION / EDIT MODAL */}
      <ResearchSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setEditingRecord(null);
        }}
        initialDivision={submitModalDivision}
        editingRecord={editingRecord}
        isAdmin={isAdmin}
        currentUserName={
          currentUser?.displayName || currentUser?.email?.split('@')[0] || ''
        }
        onSubmit={handleCreateOrUpdateResearch}
      />

      {/* RESEARCH DETAILS, COMMENTS & EVALUATION MODAL */}
      <ResearchDetailModal
        record={selectedDetailRecord}
        onClose={() => setSelectedDetailRecord(null)}
        isAdmin={isAdmin}
        currentUserUid={currentUser?.uid || 'local_researcher'}
        currentUserName={
          currentUser?.displayName || currentUser?.email?.split('@')[0] || ''
        }
        onEdit={(rec) => {
          setEditingRecord(rec);
          setSubmitModalDivision(rec.division);
          setIsSubmitModalOpen(true);
        }}
        onDelete={handleDeleteResearch}
        onDownloadAttachedBinary={handleDownloadAttachedBinary}
        onEvaluate={handleEvaluateResearch}
        evaluatorDefaultName={
          currentUser?.displayName || 'BNHS Research Committee'
        }
        comments={
          selectedDetailRecord
            ? allComments.filter((c) => c.researchId === selectedDetailRecord.id)
            : []
        }
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        activeSubscription={
          selectedDetailRecord
            ? allSubscriptions.find(
                (s) => s.researchId === selectedDetailRecord.id
              ) || null
            : null
        }
        onOpenNotifyModal={(rec) => setNotifyTargetRecord(rec)}
      />

      {/* NOTIFY ME EMAIL ALERT SUBSCRIPTION MODAL */}
      <NotifyMeModal
        isOpen={Boolean(notifyTargetRecord)}
        record={notifyTargetRecord}
        existingSubscription={
          notifyTargetRecord
            ? allSubscriptions.find(
                (s) => s.researchId === notifyTargetRecord.id
              ) || null
            : null
        }
        defaultEmail={currentUser?.email || ''}
        onClose={() => setNotifyTargetRecord(null)}
        onSaveSubscription={handleSaveSubscription}
        onUnsubscribe={handleUnsubscribe}
      />

      {/* BAROBO NHS (TEACHER / STUDENT / ADMIN LOGIN) PERSISTENT MODAL */}
      <BnhsPortalLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSignInPortalSession={(session) => {
          setPortalSession(session);
          showToast(
            `Signed in as ${session.displayName} (${session.accountClassification}).`
          );
        }}
        onSignInWithGoogle={async () => {
          await signInWithGooglePopup();
          showToast('Signed in with Google Account.');
        }}
      />
    </div>
  );
}
