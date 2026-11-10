# BNHS Research & Innovation Portal — Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Portal Scope Invariant**: Every document in `/researches`, `/research_files`, `/researchers`, `/research_comments`, `/research_subscriptions`, and `/overview_items` MUST have `portalId == 'bnhs'`.
2. **Identity Integrity Invariant**:
   - On `create` in `/researches/{researchId}`, `incoming().authorUid == request.auth.uid`.
   - On `create` in `/research_files/{fileId}`, `incoming().uploaderUid == request.auth.uid`.
   - On `create` in `/research_comments/{commentId}`, `incoming().authorUid == request.auth.uid`.
   - On `create` in `/research_subscriptions/{subscriptionId}`, `incoming().subscriberUid == request.auth.uid`.
   - On `create` or `update` in `/overview_items/{itemId}`, only verified Administrators (`isAdmin()`) may write, and `incoming().updatedByUid == request.auth.uid`.
3. **Author Edit & Delete Rights on Submitted Research**:
   - Submitting authors (`existing().authorUid == request.auth.uid`) and Administrators (`isAdmin()`) can edit or delete any research entry they submitted (including already posted/approved entries), while non-owners cannot edit or delete someone else's research entry.
4. **PII Isolation Invariant (`/research_subscriptions`)**:
   - Subscription documents contain `subscriberEmail` (PII). Therefore, `get` and `list` access on `/research_subscriptions/{subscriptionId}` is strictly isolated to the owner (`existing().subscriberUid == request.auth.uid`) or a verified Administrator (`isAdmin()`). Blanket reads are strictly forbidden.
5. **Temporal Integrity Invariant**:
   - All `createdAt` fields must equal `request.time` on creation and remain immutable on update.
   - All `updatedAt` fields must equal `request.time` on creation and update.

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Identity Spoofing on Research Create)**: Authenticated user `user_A` attempts to create `/researches/rec_1` with `authorUid: "user_B"`. -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Admin Spoof)**: User with `email: "blesstajale@gmail.com"` but `email_verified: false` attempts admin evaluation or overview item mutation. -> `PERMISSION_DENIED`.
3. **Payload 3 (Shadow Field Injection on Research Update)**: Author updates `/researches/rec_1` with extra field `"isSuperVerified": true`. -> `PERMISSION_DENIED`.
4. **Payload 4 (Self-Approval Privilege Escalation)**: Non-admin author updates their own research `evaluationScore` to `100` without admin rights. -> `PERMISSION_DENIED`.
5. **Payload 5 (ID Poisoning Attack)**: Attacker attempts to create `/researches/bad..id$$` with invalid characters. -> `PERMISSION_DENIED`.
6. **Payload 6 (Denial of Wallet Oversized Abstract)**: Attacker sends 25,000-character string in `abstract` (exceeds `maxLength: 4000`). -> `PERMISSION_DENIED`.
7. **Payload 7 (PII Leak on Subscriptions)**: Authenticated user `user_B` attempts to `get` or `list` `/research_subscriptions/sub_user_A` belonging to `user_A`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Comment Impersonation)**: User `user_A` attempts to post `/research_comments/cmt_1` with `authorUid: "user_B"`. -> `PERMISSION_DENIED`.
9. **Payload 9 (Unauthorized Overview Section Mutation)**: Non-admin user attempts to `create`, `update`, or `delete` `/overview_items/card_1`. -> `PERMISSION_DENIED`.
10. **Payload 10 (Immutable Field Tampering)**: Author attempts to change `createdAt` or `authorUid` during an update to `/researches/rec_1`. -> `PERMISSION_DENIED`.
11. **Payload 11 (Cross-User Research Deletion)**: User `user_B` attempts to delete `/researches/rec_1` owned by `user_A`. -> `PERMISSION_DENIED`.
12. **Payload 12 (Self-Assigned Admin Role)**: Non-admin user attempts to create `/admins/user_A`. -> `PERMISSION_DENIED`.
