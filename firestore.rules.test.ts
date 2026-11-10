/**
 * Phase 0 Security Rules Verification Suite (Dirty Dozen Payloads)
 * Verifies that all 12 adversarial payloads against BNHS Research Portal rules return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Research Create',
    collection: 'researches',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { portalId: 'bnhs', authorUid: 'spoofed_uid_999' },
  },
  {
    id: 2,
    name: 'Unverified Email Admin Spoof',
    collection: 'overview_items',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { portalId: 'bnhs', email: 'blesstajale@gmail.com', email_verified: false },
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Research Update',
    collection: 'researches',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { portalId: 'bnhs', ghostField: true },
  },
  {
    id: 4,
    name: 'Self-Approval Score Escalation by Non-Admin',
    collection: 'researches',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { evaluationScore: 100, evaluatedBy: 'Self' },
  },
  {
    id: 5,
    name: 'ID Poisoning Attack with Special Characters',
    collection: 'researches',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { docId: 'invalid/id$#!' },
  },
  {
    id: 6,
    name: 'Denial of Wallet Oversized Abstract (>4000 chars)',
    collection: 'researches',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { abstractLength: 10000 },
  },
  {
    id: 7,
    name: 'PII Leak on Research Subscriptions by Non-Owner',
    collection: 'research_subscriptions',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Comment Author UID Impersonation',
    collection: 'research_comments',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { authorUid: 'another_user_uid' },
  },
  {
    id: 9,
    name: 'Unauthorized Overview Item Edit by Non-Admin',
    collection: 'overview_items',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable Field Tampering (createdAt / authorUid)',
    collection: 'researches',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Cross-User Research Deletion by Non-Owner',
    collection: 'researches',
    operation: 'delete',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Assigned Admin Document Creation',
    collection: 'admins',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
];
