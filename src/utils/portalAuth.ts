import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, serverTimestamp } from '../lib/firebase';

export type BnhsPortalRole =
  | 'Administrator'
  | 'Researcher Coordinator/Adviser'
  | 'Teacher Researcher'
  | 'Master Teacher Researcher'
  | 'School Research Grammarian'
  | 'School Research Statistician'
  | 'Student Researcher';

export interface RoleDefinition {
  role: BnhsPortalRole;
  shortLabel: string;
  description: string;
  defaultPassword: string;
  isAdmin: boolean;
  defaultNamePlaceholder: string;
}

export const BNHS_PORTAL_ROLES: RoleDefinition[] = [
  {
    role: 'Administrator',
    shortLabel: 'Administrator',
    description: 'Full institutional access, overview & branding management, and repository oversight.',
    defaultPassword: 'BNHSAdmin@2026',
    isAdmin: true,
    defaultNamePlaceholder: 'e.g., Bless T. Tajale',
  },
  {
    role: 'Researcher Coordinator/Adviser',
    shortLabel: 'Coordinator / Adviser',
    description: 'Evaluates manuscripts, endorses studies, and guides teacher & student proponents.',
    defaultPassword: 'BNHSCoord@2026',
    isAdmin: true,
    defaultNamePlaceholder: 'e.g., Elena R. Villanueva, MT-II',
  },
  {
    role: 'Teacher Researcher',
    shortLabel: 'Teacher Researcher',
    description: 'Submits Basic Research, Action Research, and Published Journal entries.',
    defaultPassword: 'BNHSTeacher@2026',
    isAdmin: false,
    defaultNamePlaceholder: 'e.g., Mark Anthony D. Reyes, T-III',
  },
  {
    role: 'Master Teacher Researcher',
    shortLabel: 'Master Teacher',
    description: 'Leads flagship BERA studies and mentors classroom action research teams.',
    defaultPassword: 'BNHSMaster@2026',
    isAdmin: false,
    defaultNamePlaceholder: 'e.g., Dr. Maricel G. Bautista, MT-II',
  },
  {
    role: 'School Research Grammarian',
    shortLabel: 'Grammarian',
    description: 'Reviews language clarity, APA 7th formatting, and publication readiness.',
    defaultPassword: 'BNHSGrammar@2026',
    isAdmin: false,
    defaultNamePlaceholder: 'e.g., Clarissa M. Ocampo, T-III',
  },
  {
    role: 'School Research Statistician',
    shortLabel: 'Statistician',
    description: 'Validates quantitative methods, sampling designs, and statistical instruments.',
    defaultPassword: 'BNHSStats@2026',
    isAdmin: false,
    defaultNamePlaceholder: 'e.g., Engr. Roberto L. Mendoza, MT-I',
  },
  {
    role: 'Student Researcher',
    shortLabel: 'Student Researcher',
    description: 'Submits TUKLAS Fair STEM projects and senior high school research outputs.',
    defaultPassword: 'BNHSStudent@2026',
    isAdmin: false,
    defaultNamePlaceholder: 'e.g., Juan Carlo M. Santos (Grade 12 STEM)',
  },
];

export const DEFAULT_PORTAL_LOGO_URL = '/assets/aistudio/BNHS_LOGO_animated.gif';
export const LOCAL_PORTAL_LOGO_KEY = 'bnhs_portal_logo_v1';
const LOCAL_PASSWORD_STORE_KEY = 'bnhs_portal_role_passwords_v2';

export function getRoleDefinition(role: BnhsPortalRole): RoleDefinition {
  return BNHS_PORTAL_ROLES.find((r) => r.role === role) || BNHS_PORTAL_ROLES[2];
}

export function isAdminRole(role: BnhsPortalRole): boolean {
  return getRoleDefinition(role).isAdmin;
}

/**
 * Deterministic lightweight SHA-256 hex digest (falls back to FNV-1a hex if SubtleCrypto unavailable).
 */
export async function sha256Hex(input: string): Promise<string> {
  const normalized = input.trim();
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(normalized);
      const buf = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback below
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i;
    h2 = Math.imul(h2, 0x01000193);
  }
  return `fb_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0)
    .toString(16)
    .padStart(8, '0')}`;
}

export async function buildAccountDocId(role: BnhsPortalRole, email: string): Promise<string> {
  const roleSlug = role.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const emailHash = await sha256Hex(email.trim().toLowerCase());
  return `acct_${roleSlug}_${emailHash.slice(0, 20)}`;
}

interface LocalPasswordEntry {
  passwordHash: string;
  mustChangePassword: boolean;
  updatedAtIso: string;
}

function readLocalPasswordStore(): Record<string, LocalPasswordEntry> {
  try {
    const raw = localStorage.getItem(LOCAL_PASSWORD_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalPasswordStore(store: Record<string, LocalPasswordEntry>) {
  try {
    localStorage.setItem(LOCAL_PASSWORD_STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

export async function verifyPortalPassword(
  role: BnhsPortalRole,
  email: string,
  candidatePassword: string
): Promise<{ valid: boolean; mustChangePassword: boolean; usingDefault: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const accountId = await buildAccountDocId(role, cleanEmail);
  const candidateHash = await sha256Hex(`bnhs:${role}:${candidatePassword}`);

  // 1. Check Firestore account credential first
  try {
    const snap = await getDoc(doc(db, 'portal_accounts', accountId));
    if (snap.exists()) {
      const data = snap.data() as {
        passwordHash?: string;
        mustChangePassword?: boolean;
      };
      if (data.passwordHash) {
        const localStore = readLocalPasswordStore();
        localStore[accountId] = {
          passwordHash: data.passwordHash,
          mustChangePassword: Boolean(data.mustChangePassword),
          updatedAtIso: new Date().toISOString(),
        };
        writeLocalPasswordStore(localStore);
        return {
          valid: data.passwordHash === candidateHash,
          mustChangePassword: Boolean(data.mustChangePassword),
          usingDefault: false,
        };
      }
    }
  } catch {
    // Fallback to local store or default password when offline
  }

  // 2. Check local store override
  const localStore = readLocalPasswordStore();
  if (localStore[accountId]) {
    return {
      valid: localStore[accountId].passwordHash === candidateHash,
      mustChangePassword: localStore[accountId].mustChangePassword,
      usingDefault: false,
    };
  }

  // 3. Fall back to official role default password
  const roleDef = getRoleDefinition(role);
  const valid = candidatePassword === roleDef.defaultPassword;
  return {
    valid,
    mustChangePassword: false,
    usingDefault: true,
  };
}

export async function savePortalPassword(
  role: BnhsPortalRole,
  email: string,
  newPassword: string,
  mustChangePassword = false
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const accountId = await buildAccountDocId(role, cleanEmail);
  const emailHash = await sha256Hex(cleanEmail);
  const passwordHash = await sha256Hex(`bnhs:${role}:${newPassword}`);

  // Persist immediately in localStorage
  const localStore = readLocalPasswordStore();
  localStore[accountId] = {
    passwordHash,
    mustChangePassword,
    updatedAtIso: new Date().toISOString(),
  };
  writeLocalPasswordStore(localStore);

  // Sync to Firestore /portal_accounts/{accountId}
  try {
    const docRef = doc(db, 'portal_accounts', accountId);
    const existing = await getDoc(docRef);
    const createdAtVal = existing.exists()
      ? existing.data().createdAt || serverTimestamp()
      : serverTimestamp();

    await setDoc(docRef, {
      portalId: 'bnhs',
      role,
      emailHash,
      passwordHash,
      mustChangePassword,
      createdAt: createdAtVal,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Local persistence already succeeded
  }
}

export async function changePortalPassword(
  role: BnhsPortalRole,
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (newPassword.trim().length < 6) {
    return { ok: false, error: 'New password must be at least 6 characters long.' };
  }
  const check = await verifyPortalPassword(role, email, currentPassword);
  if (!check.valid) {
    return { ok: false, error: 'Current password is incorrect. Please check and try again.' };
  }
  await savePortalPassword(role, email, newPassword.trim(), false);
  return { ok: true };
}

export function generateSecureTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = (len: number) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      out += chars[idx];
    }
    return out;
  };
  return `BNHS-${pick(4)}-${pick(4)}`;
}

export async function resetForgotPortalPassword(
  role: BnhsPortalRole,
  email: string
): Promise<{
  generatedPassword: string;
  recipientEmail: string;
  subject: string;
  body: string;
  mailtoUrl: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const generatedPassword = generateSecureTemporaryPassword();
  await savePortalPassword(role, cleanEmail, generatedPassword, true);

  const subject = `BNHS Research Portal — Password Reset (${role})`;
  const body = [
    'Barobo National High School — Research and Innovation Portal',
    'Schools Division of Surigao del Sur, Caraga Region',
    '',
    `Account Role: ${role}`,
    `Registered Email: ${cleanEmail}`,
    `Generated Temporary Password: ${generatedPassword}`,
    '',
    'Instructions:',
    '1. Open the BNHS Research Portal and click Login.',
    `2. Select "${role}" and enter your email (${cleanEmail}).`,
    `3. Sign in using your temporary password: ${generatedPassword}`,
    '4. Immediately use "Change Password" to set your personal password.',
  ].join('\n');

  const mailtoUrl = `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  return {
    generatedPassword,
    recipientEmail: cleanEmail,
    subject,
    body,
    mailtoUrl,
  };
}
