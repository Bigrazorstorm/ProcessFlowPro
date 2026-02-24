# ProcessFlow Pro

KI-optimierte Workflow-Automatisierung für Lohnabrechnung und Personalabteilungen.

## Tech Stack

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS + React Flow
- **Infrastructure**: Docker Compose (PostgreSQL, Redis, MinIO)
- **Messaging**: Bull (Redis-based job queue)
- **File Storage**: S3-compatible (MinIO local, AWS S3 production)
- **Authentication**: JWT

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/processflowpro.git
   cd ProcessFlowPro
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start infrastructure (PostgreSQL, Redis, MinIO)**
   ```bash
   docker-compose up -d
   ```

4. **Setup environment files**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   # Edit .env if needed (defaults work with docker-compose)
   ```

5. **Setup database (migrations + demo data)**
   ```bash
   # From root: Run migrations and seed demo data
   pnpm setup
   
   # Or: Quick setup with single admin user only
   pnpm setup:quick
   ```

6. **Start development servers**
   ```bash
   # Option 1: Run both in parallel (from root)
   pnpm dev

   # Option 2: Run separately
   # Terminal 1: Backend
   cd apps/backend && pnpm run dev

   # Terminal 2: Frontend
   cd apps/frontend && pnpm run dev
   ```

### Demo Login Credentials

After running `pnpm setup`, you can login with:

- **Owner**: `owner@example.com` / `password123`
- **Senior**: `senior@example.com` / `password123`
- **Accountant**: `accountant@example.com` / `password123`

Or with `pnpm setup:quick`:
- **Admin**: `admin@example.com` / `password123`

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Documentation (Swagger)**: http://localhost:3000/api/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Project Structure

```
ProcessFlowPro/
├── apps/
│   ├── backend/                 # NestJS application
│   │   ├── src/
│   │   │   ├── main.ts         # Entry point
│   │   │   ├── app.module.ts   # Root module
│   │   │   └── ...
│   │   └── package.json
│   └── frontend/                # React + Vite application
│       ├── src/
│       │   ├── main.tsx        # Entry point
│       │   ├── App.tsx         # Root component
│       │   └── ...
│       └── package.json
├── packages/
│   └── shared-types/            # Shared TypeScript interfaces & enums
│       └── src/
│           └── index.ts
├── docker-compose.yml           # Local dev infrastructure
├── pnpm-workspace.yaml          # Monorepo configuration
├── .eslintrc.json              # Shared lint config
├── .prettierrc.json            # Shared format config
└── README.md
```

## Development Commands

```bash
# Root level commands
pnpm dev              # Start all apps in development
pnpm build            # Build all packages
pnpm setup            # Run migrations + seed demo data
pnpm setup:quick      # Run migrations + seed admin user only
pnpm seed:demo        # Seed demo data only
pnpm lint             # Lint all packages
pnpm format           # Format all code with Prettier
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode

# Backend specific (from apps/backend)
pnpm run dev                   # Start backend development server
pnpm run build                 # Build backend
pnpm run test                  # Run backend tests
pnpm run setup                 # Run migrations + seed demo data
pnpm run setup:quick           # Run migrations + seed admin user
pnpm run db:migration:generate # Generate new migration
pnpm run db:migration:run      # Run migrations
pnpm run db:migration:revert   # Revert last migration
pnpm run seed:demo             # Seed database with demo data
pnpm run seed:user             # Seed single admin user
pnpm run start:prod            # Start production server
pnpm run start:prod:seed       # Start production with auto-seeding

# Frontend specific (from apps/frontend)
pnpm run dev           # Start frontend dev server
pnpm run build         # Build frontend for production
pnpm run lint          # Lint frontend code
pnpm run preview       # Preview production build
```

## Docker Services

The `docker-compose.yml` provides three services:

| Service | Port | Credentials | Purpose |
|---------|------|-------------|---------|
| **PostgreSQL** | 5432 | postgres/postgres | Main database |
| **Redis** | 6379 | - | Job queue (Bull) & caching |
| **MinIO** | 9000/9001 | minioadmin/minioadmin | S3-compatible file storage |

**Start/Stop services**:
```bash
docker-compose up -d    # Start in background
docker-compose down     # Stop and remove containers
docker-compose logs -f  # Stream logs
```

## Database Migrations

Migrations are managed with TypeORM:

```bash
cd apps/backend

# Generate migration from entity changes
pnpm typeorm migration:generate src/database/migrations/CreateUsersTable

# Run pending migrations
pnpm run db:migration:run

# Revert last migration
pnpm run db:migration:revert

# Show migration status
pnpm typeorm migration:show
```

## Testing

```bash
# Backend unit tests
pnpm --filter backend test

# Backend with coverage
pnpm --filter backend test:cov

# Watch mode
pnpm test:watch

# E2E tests (once implemented)
pnpm --filter backend test:e2e
```

## Deployment

> Deployment instructions coming in Phase 4

## Architecture Decisions

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed information on:
- Multitenancy isolation pattern
- Data model design
- Service architecture
- Integration points

## Contributing

1. Create a feature branch (`git checkout -b feature/feature-name`)
2. Follow the ESLint & Prettier rules (auto-run on commit)
3. Write tests for new functionality
4. Ensure all tests pass (`pnpm test`)
5. Commit with meaningful messages
6. Push and create a Pull Request

## License

UNLICENSED (Internal Use Only)

## Support

For questions or issues, please create a GitHub issue or contact the development team.

---

**Last Updated**: February 2026
**Phase**: 1 – Fundament (In Progress)
