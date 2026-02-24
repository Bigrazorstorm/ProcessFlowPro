# ProcessFlow Pro - Backend API

A comprehensive workflow management system designed for automating payroll and statutory deadline workflows with multi-tenancy and role-based access control.

## 🚀 Features

- **Multi-tenant Architecture**: Complete data isolation per organization
- **Role-Based Access Control**: 5 permission levels (SUPER_ADMIN, OWNER, SENIOR, ACCOUNTANT, TRAINEE)
- **Workflow Management**: Template-based workflow creation and instance tracking
- **Deadline Calculator**: 5 rule types including German statutory deadlines
- **Real-time Notifications**: In-memory notification system with user preferences
- **Advanced Reporting**: 6 report types with JSON/CSV/PDF export
- **Dashboard Analytics**: Real-time metrics, workload tracking, and progress monitoring
- **Comprehensive API**: RESTful endpoints with Swagger documentation
- **Step Execution Tracking**: Time logging, approvals, comments, and status transitions

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ⚡ Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Run with Docker Compose

```bash
# From project root
docker-compose up -d

# Backend will be available at http://localhost:3000
# API docs at http://localhost:3000/api/docs
```

### Run Locally

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm run db:migration:run

# Seed demo data (optional)
pnpm run seed:demo

# Start development server
pnpm run dev

# API available at http://localhost:3000
```

## 💻 Installation

### Development Setup

```bash
# Clone repository
git clone https://github.com/processflowpro/backend.git
cd ProcessFlowPro

# Install dependencies (from project root)
pnpm install

# Navigate to backend
cd apps/backend

# Copy environment template
cp .env.example .env
```

### Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Run migrations
pnpm run db:migration:run

# Seed a simple user (for quick testing)
pnpm run seed:user

# OR seed full demo data
pnpm run seed:demo
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in `apps/backend/`:

```bash
# Application
NODE_ENV=development
API_PORT=3000
API_PREFIX=api
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=processflowpro
DATABASE_USER=processflowpro
DATABASE_PASSWORD=your-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Storage (MinIO/S3)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=processflowpro-attachments
S3_REGION=us-east-1

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@processflowpro.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=ProcessFlow Pro <notifications@processflowpro.com>

# Demo Data
SEED_DEMO_DATA=true
```

## 🗄️ Database

### Migrations

```bash
# Run migrations
pnpm run db:migration:run

# Generate new migration
pnpm run db:migration:generate src/database/migrations/MigrationName

# Revert last migration
pnpm run db:migration:revert
```

### Seeding

```bash
# Seed simple user (email: user@example.com, password: password)
pnpm run seed:user

# Seed comprehensive demo data
pnpm run seed:demo
```

### Schema Overview

**Core Entities:**
- `Tenant` - Organization isolation
- `User` - User accounts with roles
- `Client` - Customers/clients
- `WorkflowTemplate` - Reusable workflow definitions
- `TemplateStep` - Steps within templates
- `WorkflowInstance` - Active workflows for specific periods
- `WorkflowStep` - Instance-specific step tracking
- `StepComment` - Audit trail comments
- `Attachment` - File attachments
- `AuditLog` - System audit trail

## 📚 API Documentation

### Interactive Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick API Overview

**Authentication:**
```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Get profile
GET /api/auth/me
Authorization: Bearer <token>
```

**Workflow Management:**
```bash
# List templates
GET /api/workflow-templates

# Create instance
POST /api/workflow-instances
{
  "templateId": "uuid",
  "clientId": "uuid",
  "periodYear": 2026,
  "periodMonth": 2
}

# Start step
POST /api/workflow-execution/instances/:id/steps/:stepId/start
```

**Reporting:**
```bash
# Generate report
POST /api/reports/generate
{
  "type": "WORKFLOW_SUMMARY",
  "dateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  }
}

# Export to CSV
POST /api/reports/export
{
  "type": "USER_WORKLOAD",
  "format": "csv"
}
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS 10.2
- **Language**: TypeScript 5.2
- **ORM**: TypeORM 0.3.16
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: Bull (Redis-based)
- **Storage**: MinIO/S3
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

### Module Structure

```
src/
├── auth/                   # Authentication & authorization
├── users/                  # User management
├── clients/                # Client management
├── workflow-templates/     # Template CRUD
├── workflow-instances/     # Instance lifecycle
├── workflow-execution/     # Step execution & tracking
├── deadline-calculator/    # Deadline rule engine
├── dashboard/              # Analytics & metrics
├── notifications/          # Notification system
├── reporting/              # Report generation
├── database/
│   ├── entities/          # TypeORM entities
│   ├── migrations/        # Database migrations
│   └── seeders/           # Data seeders
└── common/
    ├── guards/            # Auth guards
    └── decorators/        # Custom decorators
```

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **Guard Pattern**: Authorization enforcement
- **DTO Pattern**: Request/response transformation
- **Dependency Injection**: NestJS built-in DI

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm run dev              # Start with hot-reload
pnpm run start:debug      # Start with debugger

# Building
pnpm run build            # Build for production
pnpm run format           # Format code with Prettier

# Testing
pnpm run test             # Run unit tests
pnpm run test:watch       # Run tests in watch mode
pnpm run test:cov         # Run with coverage
pnpm run test:e2e         # Run E2E tests

# Database
pnpm run db:migration:run      # Run migrations
pnpm run db:migration:revert   # Revert migration
pnpm run seed:demo             # Seed demo data

# Linting
pnpm run lint             # Lint and fix
```

### Code Style

This project uses:
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript Strict Mode**: Type safety

### Adding a New Module

```bash
# Generate module with NestJS CLI
nest generate module feature-name
nest generate controller feature-name
nest generate service feature-name
```

### Database Development Workflow

1. Create/modify entity in `src/database/entities/`
2. Generate migration: `pnpm run db:migration:generate src/database/migrations/FeatureName`
3. Review generated migration
4. Run migration: `pnpm run db:migration:run`
5. Update seeders if needed

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm run test

# Run specific test file
pnpm run test user.service.spec.ts

# Coverage report
pnpm run test:cov
```

### E2E Tests

```bash
# Run E2E tests
pnpm run test:e2e

# Test specific module
pnpm run test:e2e -- auth.e2e-spec.ts
```

### Manual Testing

Use the Swagger UI at http://localhost:3000/api/docs for interactive testing.

**Demo Credentials (after seeding):**
- Email: `owner@demo.com`
- Password: `password`

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Production Build

```bash
# Build Docker image
docker build -t processflowpro-backend:latest .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend pnpm run db:migration:run
```

### Environment Checklist

Before deploying to production:

- [ ] Update all environment variables
- [ ] Generate secure JWT secrets
- [ ] Configure SSL/TLS
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Run security audit
- [ ] Load testing completed
- [ ] Disable demo data seeding

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Database connection
curl http://localhost:3000/api/auth/health
```

### Logs

```bash
# Docker logs
docker-compose logs -f backend

# PM2 logs (if using PM2)
pm2 logs processflowpro-backend
```

## 🔐 Security

### Best Practices

- JWT tokens with short expiration (15 minutes)
- Refresh token rotation
- Password hashing with bcrypt
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- Rate limiting (planned)
- CORS configuration
- Environment variable security

### Role Permissions

| Role | Access Level |
|------|-------------|
| SUPER_ADMIN | Full system access |
| OWNER | Full tenant access |
| SENIOR | Management operations |
| ACCOUNTANT | Standard user operations |
| TRAINEE | Read-only access |

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and test thoroughly
3. Update documentation if needed
4. Run linting: `pnpm run lint`
5. Run tests: `pnpm run test`
6. Commit with clear message: `git commit -m 'Add amazing feature'`
7. Push branch: `git push origin feature/amazing-feature`
8. Open Pull Request

### Commit Convention

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Testing
- `chore:` - Maintenance

## 📝 License

This project is proprietary software. All rights reserved.

## 📧 Support

- **Documentation**: http://localhost:3000/api/docs
- **GitHub Issues**: https://github.com/processflowpro/backend/issues
- **Email**: support@processflowpro.com

## 🎯 Roadmap

### Phase 2 (Planned)
- [ ] Email notification delivery
- [ ] Advanced workflow analytics
- [ ] Workflow version control
- [ ] Custom deadline rule builder
- [ ] Real-time WebSocket updates
- [ ] Advanced reporting scheduler
- [ ] Export to Excel format
- [ ] Bulk operations API

### Phase 3 (Future)
- [ ] Mobile app API enhancements
- [ ] Third-party integrations (DATEV, etc.)
- [ ] AI-powered workflow suggestions
- [ ] Advanced forecasting
- [ ] Multi-language support
- [ ] Advanced audit trail

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeORM](https://typeorm.io/) - ORM for TypeScript
- [PostgreSQL](https://www.postgresql.org/) - Advanced database
- [Redis](https://redis.io/) - In-memory data store
- [Bull](https://github.com/OptimalBits/bull) - Job queue

---

**ProcessFlow Pro** - Streamlining workflow management for accounting professionals.
