import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAIL = 'blesstajale@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Notice: ', JSON.stringify(errInfo));
}

export async function signInWithGooglePopup() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return signOut(auth);
}

// Validation & Sanitization Constraints Synchronized with firebase-blueprint.json
export const BLUEPRINT_LIMITS = {
  ID_REGEX: /^[a-zA-Z0-9_\-]+$/,
  TITLE_MIN: 3,
  TITLE_MAX: 300,
  CATEGORY_MIN: 2,
  CATEGORY_MAX: 120,
  SUBCATEGORY_MAX: 120,
  ABSTRACT_MIN: 10,
  ABSTRACT_MAX: 4000,
  KEYWORDS_MAX: 300,
  AUTHORS_MIN: 2,
  AUTHORS_MAX: 300,
  ADVISER_MAX: 160,
  DEPT_MAX: 120,
  SCHOOL_YEAR_MAX: 20,
  METHODOLOGY_MAX: 1500,
  FINDINGS_MAX: 2000,
  ATTACHMENT_NAME_MAX: 260,
  ATTACHMENT_TYPE_MAX: 100,
  DRIVE_URL_MAX: 500,
  EVAL_REMARKS_MAX: 1500,
  EVALUATED_BY_MAX: 160,
  FILE_DATA_URL_MAX: 750000,
};

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

export { serverTimestamp };
