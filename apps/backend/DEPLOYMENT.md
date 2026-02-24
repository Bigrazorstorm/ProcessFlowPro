# ProcessFlow Pro - Deployment Guide

## Overview

This guide covers deploying the ProcessFlow Pro backend application to production environments.

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- MinIO or S3-compatible storage (if not using Docker)

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the backend root directory:

```bash
# Application
NODE_ENV=production
API_PORT=3000
API_PREFIX=api
API_URL=https://api.processflowpro.com
FRONTEND_URL=https://app.processflowpro.com

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=processflowpro
DATABASE_USER=processflowpro
DATABASE_PASSWORD=<secure-password>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-different-secure-string>
JWT_REFRESH_EXPIRES_IN=7d

# Storage (MinIO/S3)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=<minio-access-key>
S3_SECRET_KEY=<minio-secret-key>
S3_BUCKET=processflowpro-attachments
S3_REGION=us-east-1

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@processflowpro.com
SMTP_PASSWORD=<email-password>
SMTP_FROM=ProcessFlow Pro <notifications@processflowpro.com>

# Demo Data (set to false in production)
SEED_DEMO_DATA=false
```

### Generating Secrets

```bash
# Generate JWT secrets using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

**Step 1: Build the Docker image**
```bash
cd apps/backend
docker build -t processflowpro-backend:latest .
```

**Step 2: Start all services**
```bash
# From project root
docker-compose up -d
```

**Step 3: Run database migrations**
```bash
docker-compose exec backend pnpm run db:migration:run
```

**Step 4: (Optional) Seed demo data**
```bash
# Only for testing/staging environments
docker-compose exec backend pnpm run seed:demo
```

**Services started:**
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO: http://localhost:9000

### Option 2: Kubernetes

**Prerequisites:**
- kubectl configured
- Kubernetes cluster access
- Helm 3+ installed

**Step 1: Create namespace**
```bash
kubectl create namespace processflowpro
```

**Step 2: Create secrets**
```bash
kubectl create secret generic backend-secrets \
  --from-literal=database-password=<db-password> \
  --from-literal=jwt-secret=<jwt-secret> \
  --from-literal=jwt-refresh-secret=<refresh-secret> \
  -n processflowpro
```

**Step 3: Deploy using Helm (future)**
```bash
helm install processflowpro ./helm/processflowpro \
  --namespace processflowpro \
  --values values.production.yaml
```

### Option 3: Manual Deployment

**Step 1: Install dependencies**
```bash
cd apps/backend
pnpm install --prod
```

**Step 2: Build application**
```bash
pnpm run build
```

**Step 3: Run migrations**
```bash
pnpm run db:migration:run
```

**Step 4: Start application**
```bash
pnpm run start:prod
```

**Step 5: Process manager (PM2)**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/startup.mjs --name processflowpro-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Database Management

### Running Migrations

**Development:**
```bash
pnpm run db:migration:run
```

**Production (Docker):**
```bash
docker-compose exec backend pnpm run db:migration:run
```

### Generating New Migrations

```bash
pnpm run db:migration:generate src/database/migrations/MigrationName
```

### Reverting Migrations

```bash
pnpm run db:migration:revert
```

### Database Backups

**PostgreSQL backup:**
```bash
# Backup
docker-compose exec postgres pg_dump -U processflowpro processflowpro > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose exec -T postgres psql -U processflowpro processflowpro < backup_20260224_120000.sql
```

## Monitoring & Logging

### Application Logs

**Docker Compose:**
```bash
# View logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

**PM2:**
```bash
# View logs
pm2 logs processflowpro-backend

# Error logs only
pm2 logs processflowpro-backend --err
```

### Health Checks

The application provides health check endpoints:

```bash
curl http://localhost:3000/api/health
```

### Monitoring Tools (Recommended)

- **APM**: New Relic, Datadog, or Elastic APM
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Metrics**: Prometheus + Grafana
- **Uptime**: UptimeRobot, Pingdom

## Performance Optimization

### Database Indexing

All critical queries have indexes defined in entities. Monitor slow queries:

```sql
-- PostgreSQL slow query log
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Redis Caching

Configure Redis maxmemory policy:

```bash
# In redis.conf or docker-compose.yml
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Connection Pooling

TypeORM connection pool (configured in app.module.ts):
- Max connections: 10
- Min connections: 2

## Security Best Practices

### SSL/TLS Configuration

**Nginx reverse proxy:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.processflowpro.com;

    ssl_certificate /etc/ssl/certs/processflowpro.crt;
    ssl_certificate_key /etc/ssl/private/processflowpro.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Environment Security

- Never commit `.env` files
- Rotate JWT secrets regularly
- Use strong database passwords
- Enable SSL for database connections
- Implement rate limiting (future)

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

```bash
# Docker Compose scale
docker-compose up -d --scale backend=3
```

**Load balancer required** (Nginx, HAProxy, or cloud load balancer)

### Database Scaling

- **Read replicas**: Configure TypeORM read/write splitting
- **Connection pooling**: Adjust pool size based on load
- **Query optimization**: Monitor slow queries

### Redis Cluster (High Availability)

For production, consider Redis Sentinel or Redis Cluster for HA.

## Backup Strategy

### Automated Backups

**Daily database backups:**
```bash
# Cron job (daily at 2 AM)
0 2 * * * docker-compose exec -T postgres pg_dump -U processflowpro processflowpro | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

**Backup retention:**
- Daily: Keep 7 days
- Weekly: Keep 4 weeks
- Monthly: Keep 12 months

### MinIO/S3 Backups

Enable versioning and lifecycle policies in MinIO/S3 console.

## Disaster Recovery

### Recovery Time Objective (RTO)
Target: 1 hour

### Recovery Point Objective (RPO)
Target: 24 hours (daily backups)

### Recovery Steps

1. **Restore database:**
   ```bash
   gunzip < backup_20260224.sql.gz | docker-compose exec -T postgres psql -U processflowpro processflowpro
   ```

2. **Restart services:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Verify application:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## Troubleshooting

### Common Issues

**Issue: Database connection failed**
```bash
# Check database is running
docker-compose ps postgres

# Check connection from backend
docker-compose exec backend nc -zv postgres 5432
```

**Issue: Redis connection failed**
```bash
# Check Redis
docker-compose exec redis redis-cli ping
```

**Issue: Migration errors**
```bash
# Revert and re-run
pnpm run db:migration:revert
pnpm run db:migration:run
```

### Debug Mode

Enable debug logging:
```bash
# .env
NODE_ENV=development
LOG_LEVEL=debug
```

## Maintenance

### Regular Tasks

**Weekly:**
- Review application logs
- Check disk space usage
- Monitor database size

**Monthly:**
- Update dependencies (security patches)
- Review and optimize slow queries
- Rotate logs

**Quarterly:**
- Full security audit
- Performance testing
- Capacity planning review

### Updating the Application

**Zero-downtime deployment:**

1. Build new Docker image with version tag
2. Update docker-compose.yml with new tag
3. Run migrations (if any)
4. Rolling restart:
   ```bash
   docker-compose up -d --no-deps --build backend
   ```

## Support

For deployment issues:
- Check logs first
- Review this guide
- GitHub Issues: https://github.com/processflowpro/backend/issues
- Email: devops@processflowpro.com

## Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] API documentation published
- [ ] Disaster recovery plan documented
