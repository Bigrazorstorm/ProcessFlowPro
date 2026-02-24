# ProcessFlow Pro - Quick Start Guide

## 🚀 One Command Setup

Nach dem Klonen des Repositories benötigen Sie nur **einen Befehl**:

```bash
docker-compose up -d
```

Das war's! Das System führt automatisch aus:
- ✅ PostgreSQL, Redis und MinIO starten
- ✅ Warten bis Datenbank bereit ist
- ✅ Datenbank-Migrationen ausführen
- ✅ Demo-Daten laden (Benutzer, Clients, Templates)
- ✅ Backend-API starten

## 📍 Zugriffspunkte

Nach dem Start sind folgende Services verfügbar:

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Backend API** | http://localhost:3000/api | REST API |
| **API Dokumentation** | http://localhost:3000/api/docs | Interaktive Swagger UI |
| **PostgreSQL** | localhost:5432 | Datenbank |
| **Redis** | localhost:6379 | Cache & Queue |
| **MinIO Console** | http://localhost:9001 | S3-kompatibles Storage |

## 👤 Demo Login-Daten

Nach dem automatischen Seeding können Sie sich einloggen:

```
Email: owner@demo.com
Password: password
```

**Weitere Test-Accounts:**
- `senior@demo.com` / `password` (Senior Accountant)
- `accountant@demo.com` / `password` (Accountant)
- `trainee@demo.com` / `password` (Trainee)

## 🔍 Status prüfen

```bash
# Alle Container-Status anzeigen
docker-compose ps

# Backend-Logs anzeigen
docker-compose logs -f backend

# Datenbank-Status prüfen
docker-compose exec postgres psql -U postgres -d processflowpro -c "\dt"
```

## 🛠️ Verwaltung

### Services stoppen
```bash
docker-compose down
```

### Services neu starten (erhält Daten)
```bash
docker-compose restart
```

### Alles zurücksetzen (⚠️ löscht alle Daten!)
```bash
docker-compose down -v
docker-compose up -d
```

### Frontend auch mit Docker starten
```bash
docker-compose --profile fullstack up -d
```

## 🔧 Konfiguration anpassen

Wenn Sie die Demo-Daten **nicht** automatisch laden möchten, bearbeiten Sie `docker-compose.yml`:

```yaml
environment:
  # ...
  SEED_DEMO_DATA: "false"  # Ändern Sie "true" zu "false"
```

## 📱 API testen

### Mit Swagger UI (empfohlen)
1. Öffnen Sie http://localhost:3000/api/docs
2. Klicken Sie auf "Authorize"
3. Loggen Sie sich über `/auth/login` ein
4. Testen Sie alle Endpoints interaktiv

### Mit curl
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"password"}'

# Template abrufen (ersetzen Sie TOKEN)
curl http://localhost:3000/api/workflow-templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ❓ Troubleshooting

### Backend startet nicht

**Symptom:** Container stoppt immer wieder

**Lösung:**
```bash
# Logs prüfen
docker-compose logs backend

# Häufigste Ursache: Datenbank nicht bereit
# Das System wartet automatisch 30 Sekunden, sollte aber normalerweise schneller connecten
```

### Port bereits belegt

**Symptom:** `Error: bind: address already in use`

**Lösung:**
```bash
# Port 3000 freigeben (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Oder andere Ports in docker-compose.yml verwenden
ports:
  - '3001:3000'  # Externer Port 3001 statt 3000
```

### Datenbank-Fehler

**Symptom:** Migration errors oder Connection refused

**Lösung:**
```bash
# Datenbank und Container neu erstellen
docker-compose down -v
docker-compose up -d

# Der Backend-Container wartet automatisch bis die DB bereit ist
```

### Migrationen manuell ausführen

Falls Sie Migrationen manuell ausführen möchten:

```bash
# In laufendem Container
docker-compose exec backend pnpm run db:migration:run

# Migrationen rückgängig machen
docker-compose exec backend pnpm run db:migration:revert
```

## 🎯 Nächste Schritte

1. **API erkunden**: http://localhost:3000/api/docs
2. **Workflow Template erstellen**
3. **Workflow Instance generieren**
4. **Dashboard ansehen**
5. **Reports generieren**

## 📚 Weitere Dokumentation

- [API Dokumentation](apps/backend/API_DOCUMENTATION.md)
- [Deployment Guide](apps/backend/DEPLOYMENT.md)
- [Backend README](apps/backend/README.md)

## 💡 Development-Workflow

Wenn Sie lokal entwickeln möchten (ohne Docker):

```bash
# Terminal 1: Nur Datenbank-Services
docker-compose up postgres redis minio -d

# Terminal 2: Backend lokal
cd apps/backend
pnpm install
pnpm run db:migration:run
pnpm run seed:demo
pnpm run dev

# Terminal 3: Frontend lokal (wenn vorhanden)
cd apps/frontend
pnpm install
pnpm run dev
```

## 🎉 Fertig!

Sie haben jetzt ein vollständig konfiguriertes Workflow-Management-System mit:
- ✅ Automatischen Migrationen
- ✅ Demo-Daten
- ✅ Interaktiver API-Dokumentation
- ✅ Authentifizierung
- ✅ Multi-Tenancy
- ✅ Rolle-basierter Zugriffskontrolle

Viel Erfolg mit ProcessFlow Pro! 🚀
