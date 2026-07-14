# DrukSave — User Stories (Phase 1: Authentication & Account Security)

Format: *As a [persona], I want [capability], so that [outcome].* Each story
maps to the Phase 1 API surface in `apps/api/src/modules/auth`.

## Sign-In & Account Creation

- As a new user, I want to create an account with my email and a password,
  so that I can start using DrukSave. → `POST /api/auth/signup`
- As a returning user, I want to log in with my email and password, so that
  I can access my existing account and data. → `POST /api/auth/login`
- As a user, I want a clear error if I try to sign up with an email that's
  already registered, so I know to log in instead. →
  `AuthService.signup` (409 Conflict)
- As a user, I want repeated failed login attempts on my account to trigger
  a temporary lockout, so that my account is protected from brute-force
  password guessing. → `UsersService.recordFailedLogin`

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

- As a platform operator, I want passwords hashed with Argon2id (never
  stored or logged in plaintext) and never returned in any API response, so
  that a database leak doesn't expose usable credentials. →
  `AuthService.hashPassword`
