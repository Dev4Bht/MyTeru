# DrukSave — User Stories (Phase 1: Authentication & Account Security)

Format: *As a [persona], I want [capability], so that [outcome].* Each story
maps to the Phase 1 API surface in `apps/api/src/modules/auth`.

## Sign-In & Account Creation

- As a new user, I want to sign in with my Google account, so that I can
  start using DrukSave without creating and remembering a new password. →
  `POST /api/auth/google`
- As a new user, I want my account to be created automatically the first
  time I sign in with Google, so there's no separate signup step. →
  `UsersService.findOrCreateFromGoogle`
- As a returning user, I want signing in with the same Google account to
  return me to my existing account rather than creating a duplicate, so my
  data is always in one place. → `UsersService.findByGoogleId`

## Session Management

- As a user, I want my session to stay alive without signing in again every
  few minutes, so the app feels seamless. → `POST /api/auth/refresh`
  (rotated refresh tokens)
- As a user, I want to log out of the current device, or all devices at
  once, so that I control where my account is active. →
  `POST /api/auth/logout`, `DELETE /api/auth/sessions`

## Device & Session Trust

- As a user, I want to see which devices are logged into my account, so
  that I can spot anything suspicious. → `GET /api/devices`
- As a user, I want to revoke a device I no longer use, so that it can no
  longer access my account. → `DELETE /api/devices/:id`
- As a security team member, I want every login and logout recorded in an
  audit log, so incidents can be investigated. → `AuditLogService`, backing
  every `auth` and `devices` mutation.

## Trust Model

- As a platform operator, I want to trust Google's own verification of the
  user's identity (a signed ID token, checked against Google's public keys
  and our OAuth Client ID) rather than maintaining our own password/OTP
  security surface, so there's less to get wrong and no SMS delivery
  dependency. → `GoogleAuthService.verifyIdToken`
