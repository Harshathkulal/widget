-- =============================================================================
-- Widget Server — manual schema + demo seed
-- =============================================================================
--
-- Use this when TypeORM migrations fail or you want a one-shot bootstrap.
--
-- Prerequisites:
--   - PostgreSQL 18+ database already exists (docker-compose creates widget_db)
--   - Default JWT_SECRET must match for client secret decryption:
--       super-secret-jwt-change-me-in-production
--
-- Run (from repo root, postgres container running):
--   docker exec -i widget-postgres psql -U postgres -d widget_db < widget-server/src/widget/schema-and-seed.sql
--
-- Or locally:
--   psql -U postgres -d widget_db -f widget-server/src/widget/schema-and-seed.sql
--
-- Demo credentials (after seed):
--   Admin login : admin@demo.com / admin123456
--   Widget      : app-id 00000000-0000-0000-0000-000000000002
--                 client-id wgt_demo_client_01
--                 client-secret wgt_secret_k8s9m2n4p6q1r3t5
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Schema (matches migration InitialSchema1781433150268)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "name" character varying NOT NULL,
  "contact_email" character varying,
  "plan" character varying NOT NULL DEFAULT 'free',
  "status" character varying NOT NULL DEFAULT 'ACTIVE',
  "deleted_at" TIMESTAMP,
  CONSTRAINT "UQ_32731f181236a46182a38c992a8" UNIQUE ("name"),
  CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "applications" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "tenant_id" uuid NOT NULL,
  "app_name" character varying NOT NULL,
  "client_id" character varying NOT NULL,
  "client_secret_hash" character varying NOT NULL,
  "allowed_domains" text[] NOT NULL DEFAULT '{}',
  "status" character varying NOT NULL DEFAULT 'ACTIVE',
  "deleted_at" TIMESTAMP,
  CONSTRAINT "UQ_19b187ccdbeb753c44a3a0be30c" UNIQUE ("client_id"),
  CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_applications_tenant" ON "applications" ("tenant_id");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "tenant_id" uuid NOT NULL,
  "application_id" uuid NOT NULL,
  "entity_type" character varying NOT NULL,
  "entity_id" character varying NOT NULL,
  "action" character varying NOT NULL,
  "old_value" jsonb,
  "new_value" jsonb,
  "performed_by" character varying NOT NULL,
  "ip_address" character varying,
  CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_audit_tenant" ON "audit_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_audit_tenant_entity" ON "audit_logs" ("tenant_id", "entity_type", "entity_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_users_role_enum') THEN
    CREATE TYPE "public"."auth_users_role_enum" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "auth_users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "tenant_id" uuid NOT NULL,
  "application_id" uuid,
  "email" character varying NOT NULL,
  "password_hash" character varying NOT NULL,
  "role" "public"."auth_users_role_enum" NOT NULL DEFAULT 'VIEWER',
  "is_active" boolean NOT NULL DEFAULT true,
  CONSTRAINT "UQ_13d8b49e55a8b06bee6bbc828fb" UNIQUE ("email"),
  CONSTRAINT "PK_c88cc8077366b470dafc2917366" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_auth_users_tenant" ON "auth_users" ("tenant_id");

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "tenant_id" uuid NOT NULL,
  "application_id" uuid NOT NULL,
  "first_name" character varying NOT NULL,
  "last_name" character varying NOT NULL,
  "email" character varying NOT NULL,
  "status" character varying NOT NULL DEFAULT 'ACTIVE',
  "deleted_at" TIMESTAMP,
  CONSTRAINT "uq_users_tenant_app_email" UNIQUE ("tenant_id", "application_id", "email"),
  CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_users_tenant_app" ON "users" ("tenant_id", "application_id");

CREATE TABLE IF NOT EXISTS "widget_sessions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "tenant_id" uuid NOT NULL,
  "application_id" uuid NOT NULL,
  "token_hash" character varying NOT NULL,
  "origin" character varying NOT NULL,
  "is_revoked" boolean NOT NULL DEFAULT false,
  "user_agent" character varying,
  "ip_address" character varying,
  "expires_at" TIMESTAMP NOT NULL,
  CONSTRAINT "PK_6071d01fbee6f7e8118ed9c8d9d" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_widget_sessions_app" ON "widget_sessions" ("application_id");
CREATE INDEX IF NOT EXISTS "idx_widget_sessions_token" ON "widget_sessions" ("token_hash");

-- ---------------------------------------------------------------------------
-- TypeORM migration tracking (keeps ORM from re-running schema on startup)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "migrations" (
  "id" SERIAL NOT NULL,
  "timestamp" bigint NOT NULL,
  "name" character varying NOT NULL,
  CONSTRAINT "PK_8c82c7f526334ab95fc8806619" PRIMARY KEY ("id")
);

INSERT INTO "migrations" ("timestamp", "name")
SELECT 1781433150268, 'InitialSchema1781433150268'
WHERE NOT EXISTS (
  SELECT 1 FROM "migrations" WHERE "name" = 'InitialSchema1781433150268'
);

-- ---------------------------------------------------------------------------
-- Demo seed (matches src/database/seeds/seed.ts)
-- ---------------------------------------------------------------------------
INSERT INTO "tenants" ("id", "name", "contact_email", "plan", "status")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Tenant',
  'admin@demo.com',
  'pro',
  'ACTIVE'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "applications" (
  "id",
  "tenant_id",
  "app_name",
  "client_id",
  "client_secret_hash",
  "allowed_domains",
  "status"
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Demo Widget App',
  'wgt_demo_client_01',
  '2e666eff68216eae4ef907ae413a12a7:00a9ef7b71d4c42823ba0a02d2c9c59bf674716cdd2e4f5295712ee7be0b4e8c',
  ARRAY[
    'http://localhost:4200',
    'http://localhost:5500',
    'http://localhost:8080',
    'http://127.0.0.1:5500'
  ],
  'ACTIVE'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "auth_users" (
  "id",
  "tenant_id",
  "application_id",
  "email",
  "password_hash",
  "role",
  "is_active"
)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'admin@demo.com',
  '$2b$10$EWJqe7fdWYxfeck3JJrOleP7gfE3BvdRgZZdz8rfooQ.zDLxitSYW',
  'ADMIN',
  true
)
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "users" ("id", "tenant_id", "application_id", "first_name", "last_name", "email", "status")
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Ada', 'Lovelace', 'ada.lovelace@demo.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Grace', 'Hopper', 'grace.hopper@demo.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Linus', 'Torvalds', 'linus.torvalds@demo.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Margaret', 'Hamilton', 'margaret.hamilton@demo.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Alan', 'Turing', 'alan.turing@demo.com', 'INACTIVE'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Katherine', 'Johnson', 'katherine.johnson@demo.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Tim', 'Berners-Lee', 'tim.bernerslee@demo.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Barbara', 'Liskov', 'barbara.liskov@demo.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Donald', 'Knuth', 'donald.knuth@demo.com', 'INACTIVE'),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Radia', 'Perlman', 'radia.perlman@demo.com', 'ACTIVE')
ON CONFLICT ("tenant_id", "application_id", "email") DO NOTHING;

COMMIT;
