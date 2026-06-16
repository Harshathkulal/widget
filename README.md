# User Management Widget

embeddable user-management widget built with Angular custom elements, NestJS, PostgreSQL, and Docker.

## Run It

```bash
docker-compose up --build
```

Services:

- Angular widget: `http://localhost:4200`
- NestJS API: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

Load demo data after the containers are running:

```bash
cd widget-server
npm.cmd run db:seed
```

Production widget config:

```html
<script src="https://d6fd9641.widget-a2g.pages.dev/widget.js"></script>

<user-management-widget app-id="5577ff0f-8bb5-4afb-bbf2-367cff369700" client-id="wgt_app_f8e93095642bc63404da54f0"
theme="light" page-size="10">
</user-management-widget>
```

The widget only needs `app-id` and `client-id` attributes.

## Embed Integration

Copy-paste integration for production:

```html
<script src="https://d6fd9641.widget-a2g.pages.dev/widget.js"></script>

<user-management-widget
  app-id="APP_ID"
  client-id="CLIENT_ID"
  theme="light"
  page-size="10">
</user-management-widget>
```
OR

Copy-paste integration widget.js file

```html
<script src="widget.js"></script>

<user-management-widget
  app-id="APP_ID"
  client-id="CLIENT_ID"
  theme="light"
  page-size="10">
</user-management-widget>
```


## Add A Website

A website is stored as an `applications` row. It belongs to a tenant and contains:

- `appName`: friendly name for the website.
- `clientId`: public ID used by the widget.
- `clientSecretHash`: encrypted secret retained for potential future enterprise signed mode (not used during widget init).
- `allowedDomains`: exact origins allowed to embed the widget.

## Create a new website/application:

Register: http://localhost:3000/api/setup/register-app
payload:
```powershell
{
  "email": "angularapp@gmail.com",
  "companyName": "angular app",
  "appName": "Angular Dashboard",
  "allowedDomains": [
    "http://localhost:4201"
  ]
}
```

The script prints the new `app-id`, `client-id`, and embed snippet.

For local development, keep `http://localhost:4200` in `ALLOWED_ORIGINS`. For production, add only the real website origin, for example `https://portal.acme.com`.

## Database Setup

TypeORM runs migrations automatically when the API starts. The main config is:

- Runtime app config: `widget-server/src/app.module.ts`
- CLI migration config: `widget-server/src/database/typeorm.config.ts`
- Initial schema: `widget-server/src/database/migrations/1781433150268-InitialSchema.ts`
- Demo seed: `widget-server/src/database/seeds/seed.ts`
- Add website script: `widget-server/src/database/seeds/create-app.ts`

Core tables:

- `tenants`: customer/account boundary.
- `applications`: one embeddable app per tenant, with `client_id`, encrypted client secret, and allowed origins.
- `users`: managed users, scoped by `tenant_id` and `application_id`.
- `widget_sessions`: short-lived widget sessions, storing token hash for revocation checks.
- `audit_logs`: user create/update/delete history.
- `auth_users`: admin/API users for back-office login.

## ER Diagram

```mermaid
erDiagram
  TENANTS ||--o{ APPLICATIONS : owns
  TENANTS ||--o{ USERS : contains
  APPLICATIONS ||--o{ USERS : scopes
  APPLICATIONS ||--o{ WIDGET_SESSIONS : opens
  USERS ||--o{ AUDIT_LOGS : changes

  TENANTS {
    uuid id PK
    string name
    string contact_email
    string plan
    string status
  }

  APPLICATIONS {
    uuid id PK
    uuid tenant_id FK
    string app_name
    string client_id
    string client_secret_hash
    text[] allowed_domains
    string status
  }

  USERS {
    uuid id PK
    uuid tenant_id FK
    uuid application_id FK
    string first_name
    string last_name
    string email
    string status
    timestamp deleted_at
  }

  WIDGET_SESSIONS {
    uuid id PK
    uuid tenant_id FK
    uuid application_id FK
    string token_hash
    string origin
    boolean is_revoked
    timestamp expires_at
  }

  AUDIT_LOGS {
    uuid id PK
    uuid tenant_id FK
    uuid application_id FK
    string entity_type
    string entity_id
    string action
    jsonb old_value
    jsonb new_value
  }
```

Design choices:

- Every user query includes `tenantId` and `applicationId`, which prevents cross-tenant reads and writes.
- Users are soft-deleted with `deleted_at`.
- User email is unique per tenant and application, not globally.
- Widget session tokens are short lived and stored only as SHA-256 hashes.
- Allowed origins are stored on `applications`, so each client app controls where it may be embedded.

## System Architecture

```mermaid
flowchart LR
  Host[Client host app] --> Widget[Angular custom element]
  Widget --> API[NestJS API]
  API --> DB[(PostgreSQL)]
  API --> Auth[JWT and widget guards]
  API --> Audit[Audit logging]
```

The Angular widget is packaged as a custom element with Shadow DOM isolation. The NestJS API validates widget sessions, applies tenant/application scoping, and writes audit records for mutations.

## Widget Auth Flow

```mermaid
sequenceDiagram
  participant Host as Host Page
  participant Widget as Angular Widget
  participant API as NestJS API
  participant DB as PostgreSQL

  Host->>Widget: app-id, client-id, theme, page-size
  Widget->>API: POST /api/widget/init with appId, clientId
  API->>DB: find active application
  API->>API: validate origin allow-list
  API->>DB: create widget_session with token hash
  API-->>Widget: short-lived widget JWT
  Widget->>API: CRUD /api/widget/users with Bearer token
  API->>DB: verify session, tenant, application, token hash
```

## Security Design

See [SECURITY.md](./SECURITY.md) for the full security design document.

Summary:

- **Domain allow-listing**: `Origin` must exactly match an application allowed origin. Prefix and wildcard matching are intentionally avoided.
- **JWT sessions**: short-lived (15 min) widget tokens stored only as SHA-256 hashes.
- **Rate limiting**: widget init is limited to 5 requests/minute; user APIs to 100 requests/minute.
- **Input validation**: DTOs use `class-validator`; unknown properties are rejected by the global validation pipe.
- **Revocation**: `POST /api/widget/revoke` marks the session revoked.
- **Tenant isolation**: all widget user APIs derive `tenantId` and `applicationId` from the verified widget token, never from client input.
- **Audit logging**: all user mutations are recorded.


## API Documentation

Widget session:

- `POST /api/widget/init`
  Body: `{ appId, clientId }`
  Returns: `{ token }`

- `POST /api/widget/revoke`
  Header: `Authorization: Bearer <widget-token>`
  Returns: `{ success: true }`

Widget users:

- `GET /api/widget/users?page=1&limit=10&search=&sortBy=createdAt&sortOrder=DESC`
- `POST /api/widget/users`
- `GET /api/widget/users/:id`
- `PATCH /api/widget/users/:id`
- `DELETE /api/widget/users/:id`
- `DELETE /api/widget/users/bulk`
- `PATCH /api/widget/users/bulk-status`

User body:

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "status": "ACTIVE"
}
```

## Tests

```bash
cd widget-server
npm.cmd test
npm.cmd test:e2e

cd ../widget-ui
npm.cmd test
```

Recommended coverage areas:

- User CRUD, search, sort, pagination, soft delete.
- Tenant/application isolation.
- Valid widget init, invalid origin, subdomain spoofing rejection.
- Revoked and expired widget tokens.
- Angular loading, empty, error, create, edit, delete, and validation states.
