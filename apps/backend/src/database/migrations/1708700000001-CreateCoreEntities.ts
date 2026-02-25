import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreEntities1708700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM('super_admin', 'owner', 'senior', 'accountant', 'trainee')`,
    );
    await queryRunner.query(
      `CREATE TYPE "workflow_step_type_enum" AS ENUM('start', 'end', 'task', 'decision', 'parallel_gateway', 'sync_gateway', 'event', 'subprocess', 'form_input', 'notification', 'approval')`,
    );
    await queryRunner.query(
      `CREATE TYPE "workflow_step_status_enum" AS ENUM('open', 'in_progress', 'pending_approval', 'done', 'shifted', 'skipped', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "workflow_instance_status_enum" AS ENUM('active', 'delayed', 'critical', 'completed', 'archived')`,
    );

    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL UNIQUE,
        "plan" varchar(50) NOT NULL DEFAULT 'standard',
        "settings" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid,
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "passwordHash" text NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'accountant',
        "capacityPointsLimit" integer NOT NULL DEFAULT 100,
        "isActive" boolean NOT NULL DEFAULT true,
        "primarySubstituteId" uuid,
        "secondarySubstituteId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_tenantId" ON "users"("tenantId")`);

    // Create clients table
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "address" text,
        "taxNumber" varchar(50),
        "companyNumber" varchar(50),
        "industry" varchar(100),
        "employeeCount" integer NOT NULL DEFAULT 1,
        "reliabilityFactor" numeric(3,2) NOT NULL DEFAULT 1.0,
        "primaryUserId" uuid,
        "secondaryUserId" uuid,
        "specialties" jsonb NOT NULL DEFAULT '[]',
        "contacts" jsonb NOT NULL DEFAULT '[]',
        "taxAdvisorContact" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        FOREIGN KEY ("primaryUserId") REFERENCES "users"("id") ON DELETE SET NULL,
        FOREIGN KEY ("secondaryUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_clients_tenantId" ON "clients"("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_clients_primaryUserId" ON "clients"("primaryUserId")`);

    // Create workflow_templates table
    await queryRunner.query(`
      CREATE TABLE "workflow_templates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "industry" varchar(100),
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_workflow_templates_tenantId" ON "workflow_templates"("tenantId")`);

    // Create template_steps table
    await queryRunner.query(`
      CREATE TABLE "template_steps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "templateId" uuid NOT NULL,
        "type" "workflow_step_type_enum" NOT NULL DEFAULT 'task',
        "name" varchar(255) NOT NULL,
        "order" integer NOT NULL,
        "description" text,
        "checklist" jsonb NOT NULL DEFAULT '[]',
        "tips" text,
        "errors" jsonb NOT NULL DEFAULT '[]',
        "deadlineRule" jsonb,
        "assignedRole" "user_role_enum",
        "estimationAllowed" boolean NOT NULL DEFAULT false,
        "blocksNext" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("templateId") REFERENCES "workflow_templates"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_template_steps_templateId" ON "template_steps"("templateId")`);

    // Create workflow_instances table
    await queryRunner.query(`
      CREATE TABLE "workflow_instances" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "clientId" uuid NOT NULL,
        "templateId" uuid NOT NULL,
        "periodYear" integer NOT NULL,
        "periodMonth" integer NOT NULL,
        "status" "workflow_instance_status_enum" NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
        FOREIGN KEY ("templateId") REFERENCES "workflow_templates"("id") ON DELETE RESTRICT,
        UNIQUE("tenantId", "clientId", "periodYear", "periodMonth")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_workflow_instances_tenantId_status" ON "workflow_instances"("tenantId", "status")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_workflow_instances_clientId" ON "workflow_instances"("clientId")`);

    // Create workflow_steps table
    await queryRunner.query(`
      CREATE TABLE "workflow_steps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "instanceId" uuid NOT NULL,
        "templateStepId" uuid NOT NULL,
        "status" "workflow_step_status_enum" NOT NULL DEFAULT 'open',
        "assignedUserId" uuid,
        "dueDate" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "isEstimation" boolean NOT NULL DEFAULT false,
        "estimationValue" numeric,
        "estimationReason" text,
        "checklistProgress" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE,
        FOREIGN KEY ("templateStepId") REFERENCES "template_steps"("id") ON DELETE RESTRICT,
        FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_workflow_steps_instanceId_status" ON "workflow_steps"("instanceId", "status")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_workflow_steps_assignedUserId" ON "workflow_steps"("assignedUserId")`);

    // Create step_comments table
    await queryRunner.query(`
      CREATE TABLE "step_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "stepId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("stepId") REFERENCES "workflow_steps"("id") ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_step_comments_stepId" ON "step_comments"("stepId")`);

    // Create attachments table
    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "referenceType" varchar(50) NOT NULL,
        "referenceId" uuid NOT NULL,
        "filename" varchar(255) NOT NULL,
        "storagePath" varchar(500) NOT NULL,
        "uploadedByUserId" uuid,
        "fileSize" integer NOT NULL,
        "mimeType" varchar(100) NOT NULL,
        "checksum" varchar(40),
        "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL,
        FOREIGN KEY ("referenceId") REFERENCES "workflow_steps"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_attachments_referenceType_referenceId" ON "attachments"("referenceType", "referenceId")`,
    );

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "userId" uuid,
        "action" varchar(100) NOT NULL,
        "entityType" varchar(50) NOT NULL,
        "entityId" uuid NOT NULL,
        "oldValue" jsonb,
        "newValue" jsonb,
        "reason" text,
        "ipAddress" varchar(50),
        "userAgent" varchar(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tenantId_createdAt" ON "audit_logs"("tenantId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entityType_entityId" ON "audit_logs"("entityType", "entityId")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs"("userId")`);

    // Add constraint to make audit logs immutable
    await queryRunner.query(`
      CREATE RULE "audit_logs_no_delete" AS 
        ON DELETE TO "audit_logs" DO INSTEAD NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP RULE IF EXISTS "audit_logs_no_delete" ON "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attachments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "step_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_steps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_instances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "template_steps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS "workflow_instance_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workflow_step_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workflow_step_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
