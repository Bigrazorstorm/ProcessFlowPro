# ProcessFlow Pro – Architecture Documentation

## Project Status: Phase 1 (Fundament) – In Progress

### Completed Packages

#### ✅ PAKET 1.1 – Projektstruktur & Monorepo-Setup
**Status**: Complete

**Deliverables:**
- Monorepo with pnpm workspaces (`apps/backend`, `apps/frontend`, `packages/shared-types`)
- NestJS backend scaffold with proper configuration
- React + Vite + TailwindCSS frontend setup
- Docker Compose with PostgreSQL, Redis, MinIO for local development
- ESLint + Prettier configuration (global, applied to all packages)
- GitHub Actions CI/CD pipeline (lint, build, test)
- Comprehensive README with setup instructions
- `.env.example` for backend configuration
- ~1051 npm packages installed and configured

**Key Files:**
- `pnpm-workspace.yaml` – Workspace configuration
- `docker-compose.yml` – Local infrastructure (PostgreSQL 15, Redis 7, MinIO)
- `.eslintrc.json`, `.prettierrc.json` – Shared linting/formatting rules
- `apps/backend/package.json`, `apps/frontend/package.json` – Workspace packages

**Tech Stack Locked:**
- Frontend: React 18, Vite, TailwindCSS, Recharts, ReactFlow, Zustand
- Backend: NestJS 10, TypeORM 0.3, PostgreSQL 15, Bull 4, Redis 7, Passport JWT
- Testing: Jest, Supertest, Playwright (configured, not yet used)

---

#### ✅ PAKET 1.2 – Datenbankschema: Kern-Entities
**Status**: Complete

**Deliverables:**

##### TypeORM Entities (All 10 Core Entities)
1. **`Tenant`** – Multi-tenant isolation root
   - Fields: id, name, plan, settings (JSONB), isActive, timestamps
   - Relations: 1→N Users, Clients, WorkflowTemplates, AuditLogs

2. **`User`** – Team members with roles
   - Fields: id, tenantId, name, email, passwordHash, role, capacityPointsLimit, primarySubstituteId, secondarySubstituteId, isActive
   - Roles enum: SUPER_ADMIN, OWNER, SENIOR, ACCOUNTANT, TRAINEE

3. **`Client`** – Mandanten (customers)
   - Fields: id, tenantId, name, address, taxNumber, companyNumber, industry, employeeCount, reliabilityFactor
   - Relations: primaryUserId, secondaryUserId (assigns accountants to clients)
   - JSONB fields: specialties, contacts, taxAdvisorContact

4. **`WorkflowTemplate`** – Reusable process templates
   - Fields: id, tenantId, name, industry, description, isActive
   - Relations: 1→N TemplateSteps

5. **`TemplateStep`** – Steps within a template
   - Fields: id, templateId, type (enum), name, order, description, checklist (JSONB), tips, errors (JSONB), deadlineRule (JSONB), assignedRole, estimationAllowed, blocksNext
   - StepType enum: START, END, TASK, DECISION, PARALLEL_GATEWAY, SYNC_GATEWAY, EVENT, SUBPROCESS, FORM_INPUT, NOTIFICATION, APPROVAL

6. **`WorkflowInstance`** – Monthly execution of a workflow for a client
   - Fields: id, tenantId, clientId, templateId, periodYear, periodMonth, status
   - Status enum: ACTIVE, DELAYED, CRITICAL, COMPLETED, ARCHIVED
   - UNIQUE constraint: (tenantId, clientId, periodYear, periodMonth)

7. **`WorkflowStep`** – Individual step execution
   - Fields: id, instanceId, templateStepId, status, assignedUserId, dueDate, completedAt, isEstimation, estimationValue, estimationReason, checklistProgress (JSONB)
   - Status enum: OPEN, IN_PROGRESS, PENDING_APPROVAL, DONE, SHIFTED, SKIPPED, REJECTED

8. **`StepComment`** – Thread discussions on steps
   - Fields: id, stepId, userId, content, createdAt
   - Used for communication between team members

9. **`Attachment`** – Files attached to steps/tickets/comments
   - Fields: id, referenceType, referenceId, filename, storagePath, uploadedByUserId, fileSize, mimeType, checksum, uploadedAt
   - Polymorphic reference (can attach to steps, tickets, comments)

10. **`AuditLog`** – Immutable append-only change tracking
    - Fields: id, tenantId, userId, action, entityType, entityId, oldValue (JSONB), newValue (JSONB), reason, ipAddress, userAgent, createdAt
    - **APPEND-ONLY**: PostgreSQL RULE prevents DELETE operations
    - Indexed: (tenantId, createdAt), (entityType, entityId), (userId)

##### Database Configuration
- **File**: `apps/backend/src/database/data-source.ts`
- **Connection**: PostgreSQL 15 via TypeORM
- **Synchronize**: Disabled (migrations-driven)
- **Logging**: Enabled in development mode

##### Migrations
- **File**: `apps/backend/src/database/migrations/1708700000001-CreateCoreEntities.ts`
- **Creates**: All tables, ENUMs, indexes, foreign keys, and the immutable audit log rule
- **Down**: Safely reverses all changes

##### Row-Level Security (RLS)
- **Strategy**: Application-level filtering via `TenantContextService`
- **Implementation**: All queries filter by `tenantId` from JWT context
- **Service**: `apps/backend/src/common/services/tenant-context.service.ts`
  - Injected as REQUEST-scoped service
  - Extracts `tenantId`, `userId`, `roles` from JWT payload
  - Provides `getTenantId()`, `getUserId()`, `getRoles()`, `hasRole()` methods

##### Demo Data Seeding
- **File**: `apps/backend/src/database/seeders/demo.seeder.ts`
- **Command**: `pnpm seed:demo` (from backend directory)
- **Seeds**:
  - 1 Demo Tenant (name: "Demo Tenant", plan: "professional")
  - 3 Demo Users (Owner, Senior, Accountant) with email login credentials
  - 2 Demo Clients (manufacturing & gastronomy industries)
  - 1 Workflow Template with 5 steps (standard payroll process)
- **Idempotent**: Only seeds if demo tenant doesn't already exist

##### Database Indexes (for Performance)
- `IDX_users_tenantId` – All user lookups filtered by tenant
- `IDX_clients_tenantId`, `IDX_clients_primaryUserId` – Client management
- `IDX_workflow_templates_tenantId` – Template lookup
- `IDX_template_steps_templateId` – Step ordering
- `IDX_workflow_instances_tenantId_status` – Dashboard queries
- `IDX_workflow_steps_instanceId_status`, `IDX_workflow_steps_assignedUserId` – Step assignment & filtering
- `IDX_attachments_referenceType_referenceId` – Polymorphic attachment lookup
- `IDX_audit_logs_tenantId_createdAt`, `IDX_audit_logs_entityType_entityId`, `IDX_audit_logs_userId` – Audit trail queries

##### Shared Types (TypeScript)
- **File**: `packages/shared-types/src/index.ts`
- **Exports**: All enums, DTOs, interfaces used across backend & frontend
- **Enums**: UserRole, WorkflowInstanceStatus, WorkflowStepStatus, WorkflowStepType, TicketType, TicketStatus, TicketPriority, DeadlineRuleType
- **Interfaces**: UserDto, TenantDto, ClientDto, WorkflowTemplateDto, TemplateStepDto, WorkflowInstanceDto, WorkflowStepDto, LoginRequest/Response, JwtPayload, ApiResponse, PaginatedResponse

---

### Next Packages (Planned)

#### 🔜 PAKET 1.3 – Authentifizierung & Tenant-Kontext
- JWT strategy with Passport
- Login endpoint (POST /auth/login)
- Token refresh endpoint
- TenantGuard & RolesGuard
- Protected routes
- Frontend login UI

#### 🔜 PAKET 1.4 – Benutzerverwaltung
- CRUD endpoints for users
- Role assignment
- Substitute management
- Frontend users list page

#### 🔜 PAKET 1.5 – Mandantenverwaltung
- CRUD endpoints for clients
- Specialties & monthly hints
- Frontend client list & cockpit

---

## Architecture Decisions

### Multitenancy Pattern
- **Isolation Level**: Row-level via `tenant_id` column (not schema-isolation)
- **Advantages**: Simpler migrations, easier data export, faster tenant switching
- **Disadvantage**: Larger tables, more complex queries (but indexed)
- **Implementation**: `TenantContextService` provides context; all queries must filter by tenant_id

### Authentication
- **Method**: JWT (self-managed, not Auth0 yet)
- **Token Payload**: `{ userId, tenantId, email, roles[], iat, exp }`
- **Scope**: REQUEST-scoped service extracts from JWT automatically
- **Future**: Can migrate to Auth0/Cognito in production

### Database Design
- **ENUM Types**: Stored as PostgreSQL ENUMs for type safety
- **JSONB Fields**: For flexible data (checklist, specialties, deadline rules)
- **Append-Only Audit**: PostgreSQL RULE prevents accidental deletion
- **Foreign Keys**: Strict constraints prevent orphaned records
- **Indexes**: All filtering columns indexed for performance

### File Storage
- **Strategy**: S3-compatible (MinIO local, AWS S3 production)
- **Metadata**: Stored in DB, files in object storage
- **Signed URLs**: For secure, time-limited downloads

### Step Status Flow
```
OPEN → IN_PROGRESS → PENDING_APPROVAL → DONE
     ↘ REJECTED     (creates problem ticket)
     ↘ SHIFTED      (moves to next month)
     ↘ SKIPPED
```

---

## Development Commands

```bash
# Setup
pnpm install                          # Install all dependencies
docker-compose up -d                  # Start services (PostgreSQL, Redis, MinIO)
cd apps/backend && pnpm run db:migration:run  # Run migrations

# Seed demo data
pnpm seed:demo

# Development
pnpm dev                              # Start both frontend & backend in watch mode
pnpm lint                             # Lint all packages
pnpm format                           # Format with Prettier
pnpm test                             # Run all tests

# Database
cd apps/backend
pnpm typeorm migration:generate       # Generate migration from entities
pnpm typeorm migration:run            # Apply migrations
pnpm typeorm migration:revert         # Rollback last migration
```

---

## Known Limitations & Future Improvements

1. **WebSockets**: Not yet implemented (polling sufficient for MVP)
2. **Full-Text Search**: Not yet implemented (will add in Phase 3)
3. **File Versioning**: Implemented via sequential naming (future: git-like versioning)
4. **Multi-Region Support**: Not yet implemented (DB in single region)
5. **Caching**: Not yet implemented (Redis available but unused)
6. **Rate Limiting**: Not yet implemented (Bull queues handle concurrency)

---

## Testing Strategy

- **Unit Tests**: Service logic (deadline calculations, capacity formulas)
- **Integration Tests**: API endpoints with database
- **E2E Tests**: Critical user flows (login → create workflow → complete step)
- **Test Database**: Separate PostgreSQL instance, reset before each test

*Tests to be implemented in Packages 1.3+*

---

**Last Updated**: February 24, 2026  
**Phase**: 1 – Fundament (Packages 1.1–1.2 Complete)
**Timeline**: 2/12 packages complete (Phase 1 is 12 packages)
