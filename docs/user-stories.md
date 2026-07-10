# DrukSave — User Stories (Phase 1: Authentication & Account Security)

Format: *As a [persona], I want [capability], so that [outcome].* Each story
maps to the Phase 1 API surface in `apps/api/src/modules/auth`.

## Signup

- As a new user, I want to sign up with my Bhutanese phone number and a
  password, so that I can create an account without needing an email
  address. → `POST /api/auth/signup`
- As a new user, I want to receive a 6-digit SMS code to verify my phone
  number, so that the platform knows the number really belongs to me. →
  `POST /api/auth/otp/verify` (purpose `SIGNUP`)
- As a new user, I want a clear cooldown timer before I can request another
  code, so that I understand why the "resend" button is disabled. →
  `POST /api/auth/otp/resend`

## Login

- As a returning user, I want to log in with my phone number and password,
  so that I can access my account. → `POST /api/auth/login`
- As a returning user on a new device, I want to be asked for an OTP in
  addition to my password, so that my account stays protected even if my
  password leaks. → device-binding check inside `AuthService.login`
- As a user, I want my session to stay alive without re-entering my password
  every few minutes, so the app feels seamless. → `POST /api/auth/refresh`
  (rotated refresh tokens)
- As a user, I want to log out of the current device, or all devices at
  once, so that I control where my account is active. →
  `POST /api/auth/logout`, `DELETE /api/auth/sessions`

## Account Recovery

- As a user who forgot their password, I want to reset it using an OTP sent
  to my registered phone, so that I don't get permanently locked out. →
  `POST /api/auth/password/forgot`, `POST /api/auth/password/reset`
- As a security-conscious user, I want to change my password while logged
  in, so that I can rotate it periodically. →
  `POST /api/auth/password/change`
- As a user who changed SIM cards, I want to update my registered phone
  number with OTP verification on the new number, so my account stays
  reachable. → `POST /api/auth/phone/change`,
  `POST /api/auth/phone/change/confirm`

## Device & Session Trust

- As a user, I want to see which devices are logged into my account, so
  that I can spot anything suspicious. → `GET /api/devices`
- As a user, I want to revoke a device I no longer use, so that it can no
  longer access my account. → `DELETE /api/devices/:id`
- As a security team member, I want every login, logout, and password
  change recorded in an audit log, so incidents can be investigated. →
  `AuditLogService`, backing every `auth` and `devices` mutation.

## Abuse Prevention

- As a platform operator, I want repeated failed logins to lock an account
  temporarily, so brute-force attacks don't succeed. → login lockout in
  `AuthService`, backed by Redis counters.
- As a platform operator, I want OTP requests and verification attempts
  rate-limited per phone number and per IP, so the SMS budget can't be
  abused and OTPs can't be brute-forced. → `OtpService` + `@nestjs/throttler`.
