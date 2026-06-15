# Security Design

This document describes the security model for the User Management Widget.

## Authentication Model

### Application Registration

Each embeddable widget is backed by an `applications` row:

- `appId` (UUID) — public application identifier
- `clientId` — public client identifier used by the widget
- `allowedDomains` — exact origins permitted to embed the widget
- `status` — must be `ACTIVE` for init to succeed

The `clientSecretHash` column is retained for potential future enterprise signed mode but is **not** used during widget initialization.

### Widget Initialization

```text
Host Page
   ↓
Widget
   ↓
POST /widget/init
   ↓
Validate Application
   ↓
Validate Allowed Origin
   ↓
Create Widget Session
   ↓
Return Widget JWT
   ↓
CRUD APIs
```

Request body:

```json
{
  "appId": "UUID",
  "clientId": "CLIENT_ID"
}
```

The server reads the `Origin` header and validates it against `allowedDomains` using **exact origin matching only**. Wildcard, prefix, and partial domain matching are intentionally not supported.

Examples:

| Origin | Allowed list | Result |
|--------|--------------|--------|
| `https://portal.acme.com` | `https://portal.acme.com` | Allowed |
| `https://admin.acme.com` | `https://admin.acme.com` | Allowed |
| `https://evil.com` | `https://portal.acme.com` | Rejected |
| `https://portal.acme.com.evil.com` | `https://portal.acme.com` | Rejected |

In non-production environments, standard localhost dev origins are also permitted to simplify local development.

## Domain Allow-Listing

Domain allow-listing is enforced at two layers:

1. **CORS** — dynamic origin validation at the HTTP layer; only origins belonging to active applications (plus dev origins in non-production) receive CORS headers.
2. **Widget init** — per-application origin check against the requesting application's own `allowedDomains`.

Both layers use exact origin matching via URL normalization (`new URL(value).origin`).

## JWT Sessions

After successful validation, the server creates a `widget_sessions` row:

| Field | Purpose |
|-------|---------|
| `tenantId` | Tenant scope |
| `applicationId` | Application scope |
| `origin` | Origin that initiated the session |
| `tokenHash` | SHA-256 hash of the issued JWT |
| `expiresAt` | Session expiry (15 minutes) |
| `isRevoked` | Revocation flag |

The JWT payload:

```json
{
  "sub": "<session-id>",
  "tenantId": "<tenant-id>",
  "applicationId": "<application-id>"
}
```

Only the SHA-256 hash of the token is stored. Raw JWTs are never persisted.

All widget CRUD APIs require `Authorization: Bearer <widget-jwt>` and validate:

- JWT signature and expiry
- Session exists and is not revoked
- Token hash matches the stored hash
- Session has not expired

## Rate Limiting

| Endpoint group | Limit |
|----------------|-------|
| `POST /api/widget/init` | 5 requests/minute |
| Widget user CRUD APIs | 100 requests/minute |

Rate limiting is enforced globally via NestJS Throttler.

## Tenant Isolation

`tenantId` and `applicationId` are always derived from the verified widget JWT. They are never read from client request payloads. All user queries include both identifiers to prevent cross-tenant reads and writes.

## Session Revocation

`POST /api/widget/revoke` marks the current session as revoked. Subsequent API calls with that token are rejected even if the JWT has not yet expired.

## Input Validation

All DTOs use `class-validator`. The global validation pipe rejects unknown properties (`forbidNonWhitelisted: true`) and strips undeclared fields (`whitelist: true`).

## Audit Logging

All user mutations (create, update, delete, bulk operations) write audit log entries scoped by `tenantId` and `applicationId`.

## Soft Delete

Users are soft-deleted via `deleted_at`. Deleted users are excluded from queries but retained for audit history.

## CORS

Widget API access is restricted to origins registered on active applications. CORS validation is dynamic — when applications are added or their allowed domains change, the permitted origins update accordingly.

## Flow

Security is now provided through application registration, strict domain allow-listing, short-lived widget sessions, rate limiting, and tenant isolation.
