import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1781433150268 implements MigrationInterface {
  name = 'InitialSchema1781433150268';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE "applications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "app_name" character varying NOT NULL,
        "client_id" character varying NOT NULL,
        "client_secret_hash" character varying NOT NULL,
        "allowed_domains" text array NOT NULL DEFAULT '{}',
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_19b187ccdbeb753c44a3a0be30c" UNIQUE ("client_id"),
        CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_applications_tenant" ON "applications" ("tenant_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
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
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_audit_tenant" ON "audit_logs" ("tenant_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_audit_tenant_entity" ON "audit_logs" ("tenant_id", "entity_type", "entity_id")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."auth_users_role_enum" AS ENUM('ADMIN', 'MANAGER', 'VIEWER')`,
    );

    await queryRunner.query(
      `CREATE TABLE "auth_users" (
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
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_auth_users_tenant" ON "auth_users" ("tenant_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "users" (
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
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_users_tenant_app" ON "users" ("tenant_id", "application_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "widget_sessions" (
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
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_widget_sessions_app" ON "widget_sessions" ("application_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_widget_sessions_token" ON "widget_sessions" ("token_hash")`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenants" (
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
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP INDEX "public"."idx_widget_sessions_token"`);
    await queryRunner.query(`DROP INDEX "public"."idx_widget_sessions_app"`);
    await queryRunner.query(`DROP TABLE "widget_sessions"`);

    await queryRunner.query(`DROP INDEX "public"."idx_users_tenant_app"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP INDEX "public"."idx_auth_users_tenant"`);
    await queryRunner.query(`DROP TABLE "auth_users"`);

    await queryRunner.query(`DROP TYPE "public"."auth_users_role_enum"`);

    await queryRunner.query(`DROP INDEX "public"."idx_audit_tenant_entity"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_tenant"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);

    await queryRunner.query(`DROP INDEX "public"."idx_applications_tenant"`);
    await queryRunner.query(`DROP TABLE "applications"`);
  }
}
