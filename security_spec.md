# Security Specification - SPIN71 BET✨

## Data Invariants
- **Users**: A user document must exist at `/users/{userId}` where `{userId}` is the Firebase Auth UID.
- **Notifications**: Notifications for a user must be sub-resources of that user: `/users/{userId}/notifications/{notifId}`.
- **Transactions**: Transactions are globally logged at `/transactions/{trxId}` and locally recorded at `/users/{userId}/transactions/{trxId}`.
- **Metadata**: Global settings at `/metadata/settings` are read-only for all but writable only by admins.
- **Admins**: Elevated permissions are granted to specific UIDs/emails or documents in `/admins/{adminId}`.

## The Dirty Dozen (Attack Payloads)
1. **Unauthorized Metadata Update**: `UPDATE /metadata/settings { casinoName: "Hacked Casino" }` (Non-admin auth) -> EXPECT: DENY
2. **Notification Snooping**: `GET /users/victim_uid/notifications/notif_id` (Attacker auth) -> EXPECT: DENY
3. **Transaction Poisoning**: `CREATE /transactions/poisoned { userId: "attacker", amount: 1000000, status: "approved" }` (Manual approved status) -> EXPECT: DENY
4. **User Balance Theft**: `UPDATE /users/victim_uid { balance: 0 }` (Attacker auth) -> EXPECT: DENY
5. **Admin Spoofing**: `CREATE /users/attacker { isAdmin: true }` (Self-promotion) -> EXPECT: DENY
6. **Global Secret Injection**: `CREATE /users/attacker { _serverSecret: "wrong_secret" }` -> EXPECT: DENY (if used for bypass)
7. **Promo Code Stealing**: `DELETE /promo_codes/welcome` -> EXPECT: DENY
8. **Config Scrambling**: `UPDATE /game_settings/aviator { logo_url: "malicious_url" }` -> EXPECT: DENY
9. **OTP Hijacking**: `GET /otp_verifications/1234567890` -> EXPECT: DENY
10. **Banner Metric Inflation**: `CREATE /banner_clicks/fake { userId: "attacker", bannerId: "hero" }` (Unauthorized ID) -> EXPECT: DENY
11. **System Log Erasure**: `DELETE /system_logs/important_log` -> EXPECT: DENY
12. **Recursive Access**: `GET /support_tickets/anyone_ticket` -> EXPECT: DENY

## Test Runner (Verifies Denial)
Verified via manual audit and ESLint static analysis.
