# ProcessFlow Pro - Setup Guide

## 🚀 Schnellstart

### 1. Docker Compose starten
```bash
docker-compose up -d
```

### 2. Abhängigkeiten installieren
```bash
pnpm install
```

### 3. Datenbank einrichten mit Demo-Daten
```bash
pnpm setup
```

Dieser Befehl führt automatisch aus:
- ✅ Datenbank-Migrationen
- ✅ Demo-Daten (3 Benutzer + Clients + Workflow-Templates)

### 4. Anwendung starten
```bash
pnpm dev
```

**Frontend:** http://localhost:5173  
**Backend API:** http://localhost:3000/api  
**API Docs:** http://localhost:3000/api/docs

---

## 🔐 Login-Daten

Nach `pnpm setup`:

| Rolle | Email | Passwort | Beschreibung |
|-------|-------|----------|--------------|
| **Owner** | owner@example.com | password123 | Vollzugriff |
| **Senior** | senior@example.com | password123 | Senior-Rechte |
| **Accountant** | accountant@example.com | password123 | Buchhaltung |

---

## 🛠️ Setup-Varianten

### Vollständige Demo-Daten
```bash
pnpm setup
```
Erstellt:
- 3 Benutzer (Owner, Senior, Accountant)
- 2 Demo-Clients
- Workflow-Templates
- Beispiel-Daten

### Nur Admin-Benutzer
```bash
pnpm setup:quick
```
Erstellt nur:
- 1 Admin-Benutzer: `admin@example.com` / `password123`

### Manuell
```bash
# Nur Migrationen
cd apps/backend
pnpm run db:migration:run

# Optional: Demo-Daten hinzufügen
pnpm run seed:demo
```

---

## 📦 Production Build

```bash
# Build
pnpm build

# Migrationen ausführen
cd apps/backend
pnpm run db:migration:run

# Starten mit optionalem Auto-Seeding
SEED_DEMO_DATA=true pnpm run start:prod
# oder ohne Seeding:
pnpm run start:prod
```

---

## 🐳 Docker Services

| Service | Port | Login | Zweck |
|---------|------|-------|-------|
| PostgreSQL | 5432 | postgres/postgres | Hauptdatenbank |
| Redis | 6379 | - | Job Queue & Cache |
| MinIO | 9000<br>9001 | minioadmin/minioadmin | S3-Speicher<br>Web-Konsole |

---

## 🔧 Häufige Probleme

### Datenbank-Verbindung fehlgeschlagen
```bash
# Prüfen, ob Docker läuft
docker ps

# Services neu starten
docker-compose down
docker-compose up -d
```

### bcrypt Build-Fehler
```bash
# Abhängigkeiten neu installieren
pnpm install --force
```

### Demo-Daten bereits vorhanden
Der Seeder prüft automatisch und überspringt vorhandene Daten. Um neu zu beginnen:
```bash
docker-compose down -v
docker-compose up -d
pnpm setup
```
