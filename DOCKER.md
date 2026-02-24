# Docker Compose Modi

## 🏗️ Infrastruktur-Only (Standard)

Nur PostgreSQL, Redis und MinIO - Backend und Frontend laufen lokal für schnellere Entwicklung.

```bash
# Services starten
docker-compose up -d

# Prüfen
docker-compose ps

# Logs
docker-compose logs -f

# Stoppen
docker-compose down
```

**Dann lokal starten:**
```bash
# Terminal 1: Backend
cd apps/backend
pnpm run dev

# Terminal 2: Frontend
cd apps/frontend
pnpm run dev
```

---

## 🚀 Full-Stack Development (alles in Docker)

Alle Services inklusive Backend + Frontend in Docker.

```bash
# Mit fullstack profile starten
docker-compose --profile fullstack up -d

# Oder mit Build
docker-compose --profile fullstack up -d --build

# Logs ansehen
docker-compose --profile fullstack logs -f backend
docker-compose --profile fullstack logs -f frontend

# Stoppen
docker-compose --profile fullstack down
```

**Services verfügbar:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api
- API Docs: http://localhost:3000/api/docs
- MinIO: http://localhost:9001

---

## 🔧 Gemischter Modus

Infrastruktur + Backend in Docker, Frontend lokal:

```bash
# Backend in Docker starten
docker-compose --profile fullstack up -d postgres redis minio backend

# Frontend lokal
cd apps/frontend
pnpm run dev
```

---

## 📦 Einzelne Services

```bash
# Nur Datenbank
docker-compose up -d postgres

# Nur Redis
docker-compose up -d redis

# MinIO
docker-compose up -d minio

# Backend (benötigt Infrastruktur)
docker-compose --profile fullstack up -d backend

# Frontend (benötigt Backend)
docker-compose --profile fullstack up -d frontend
```

---

## 🔍 Nützliche Befehle

```bash
# Status prüfen
docker-compose ps

# In Container zugreifen
docker exec -it processflowpro-postgres psql -U postgres -d processflowpro
docker exec -it processflowpro-backend sh
docker exec -it processflowpro-frontend sh

# Volumes löschen (ACHTUNG: Daten gehen verloren!)
docker-compose down -v

# Alles neu bauen
docker-compose --profile fullstack up -d --build --force-recreate

# Logs filtern
docker-compose logs -f postgres
docker-compose logs --tail=100 backend
```

---

## 🆚 Vergleich

| Modus | Backend | Frontend | Vorteile | Nachteile |
|-------|---------|----------|----------|-----------|
| **Infrastruktur-Only** | Lokal | Lokal | Schnell, Hot Reload | Manuelle Terminal-Verwaltung |
| **Full-Stack** | Docker | Docker | Alles in einem, Konsistent | Langsamerer Start |
| **Gemischt** | Docker | Lokal | Backend isoliert, Frontend schnell | Komplexer |

---

## ⚡ Empfehlung

**Entwicklung:** Infrastruktur-Only (Standard)
```bash
docker-compose up -d
pnpm dev  # in root für beide parallel
```

**Testing/Demo:** Full-Stack
```bash
docker-compose --profile fullstack up -d --build
```

**Production:** Siehe [DEPLOYMENT.md](DEPLOYMENT.md)
