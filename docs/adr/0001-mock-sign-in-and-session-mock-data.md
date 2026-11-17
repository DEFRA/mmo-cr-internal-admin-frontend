# 0001. Mock sign-in and session-scoped mock data for the admin UI walkthrough

- Status: Accepted (frontend walkthrough only)
- Date: 2026-11-16

## Context

The Web Administration Portal UI is being built from the prototype screenshots in
`design/admin-screens/` before any backend APIs, identity provider or database exist
(see `design/plans/admin-ui-implementation-brief.md`). Pages still need a signed-in
user, role details in the header and data that changes when a user is created,
amended, deactivated or linked to a vessel.

## Decision

1. **Mock sign-in.** `/sign-in` accepts any non-empty email address and password and
   stores a fixed mock identity (`Sam Smith`, `preview@example.test`, role
   `Service Manager`) in the `@hapi/yar` session. The `admin-auth` plugin
   (`src/server/plugins/admin-auth.js`) redirects every non-public route to
   `/sign-in` when there is no signed-in user. `/sign-out` resets the session.
2. **Role preview.** `/role-preview/{role}` only changes the role name shown in the
   header. Per-role permissions are not implemented until they are agreed.
3. **Session-scoped mock data.** Seed data lives in
   `src/server/common/mock-data/admin/*.json`. On the first change, a copy is stored
   in the user's session (`admin-store` helper). Each session starts from the seed
   data, changes never leak between users, and `/clear-data` resets it.
4. All data access goes through helpers in `src/server/common/helpers/`, so
   controllers do not change when the mock store is replaced by API clients.

## Consequences

- This is **not** a security control. It must be replaced by the real identity
  provider and authorisation before the service handles real data.
- The session holds fictional mock data only. Real personal data must not be put in
  the session when the mock store is replaced.
- Session size grows with mock data, so the session is stored server-side (Catbox
  memory locally, Redis when deployed), as the template already configures.
