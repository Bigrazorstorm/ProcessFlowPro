# ProcessFlow Pro - Production Deployment

## 🐳 Mit Docker Compose

### Quick Start
```bash
# Mit Demo-Daten
SEED_DEMO_DATA=true docker-compose -f docker-compose.prod.yml up -d

# Ohne Demo-Daten
docker-compose -f docker-compose.prod.yml up -d
```

### Sicherheit

**Wichtig!** Ändern Sie die Secrets in der Produktion:

```bash
# .env.prod erstellen
cat > .env.prod << EOF
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SEED_DEMO_DATA=false
EOF

# Mit eigenen Secrets starten
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 📦 Manuelles Deployment

### 1. Build
```bash
pnpm install
pnpm build
```

### 2. Umgebungsvariablen setzen
```bash
export DATABASE_HOST=your-db-host
export DATABASE_PORT=5432
export DATABASE_NAME=processflowpro
export DATABASE_USER=your-user
export DATABASE_PASSWORD=your-password
export JWT_SECRET=your-secret
export JWT_REFRESH_SECRET=your-refresh-secret
export REDIS_HOST=your-redis-host
export S3_ENDPOINT=your-s3-endpoint
```

### 3. Datenbank einrichten
```bash
cd apps/backend
pnpm run db:migration:run
```

### 4. Optional: Demo-Daten laden
```bash
pnpm run seed:demo
```

### 5. Starten
```bash
pnpm run start:prod
```

## 🔐 Produktion-Checkliste

- [ ] JWT Secrets geändert
- [ ] Datenbank-Passwörter geändert
- [ ] Redis-Passwort gesetzt (falls öffentlich)
- [ ] MinIO-Credentials geändert
- [ ] CORS Origins konfiguriert
- [ ] HTTPS aktiviert
- [ ] Firewall-Regeln gesetzt
- [ ] Backup-Strategie implementiert
- [ ] Monitoring eingerichtet
- [ ] Log-Rotation konfiguriert

## 🔄 Updates

```bash
# Code aktualisieren
git pull

# Dependencies neu installieren
pnpm install

# Neu bauen
pnpm build

# Migrationen ausführen
cd apps/backend
pnpm run db:migration:run

# Services neu starten
docker-compose -f docker-compose.prod.yml restart backend
```

## 📊 Monitoring

### Logs anzeigen
```bash
# Alle Services
docker-compose -f docker-compose.prod.yml logs -f

# Nur Backend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Health Check
```bash
# Backend Health
curl http://localhost:3000/api/health

# API Docs
open http://localhost:3000/api/docs
```

## 🗄️ Backup

### Datenbank Backup
```bash
docker exec processflowpro-postgres pg_dump -U postgres processflowpro > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
docker exec -i processflowpro-postgres psql -U postgres processflowpro < backup_20260224.sql
```
