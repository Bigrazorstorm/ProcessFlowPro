# 🚀 Schnellstart-Anleitung

## Problem: "Login fehlgeschlagen"

Das bedeutet, dass Backend und/oder Datenbank nicht laufen.

## ✅ Lösung in 3 Schritten:

### 1. Docker Desktop starten
- Öffnen Sie Docker Desktop
- Warten Sie, bis es vollständig gestartet ist

### 2. Services starten

Öffnen Sie ein Terminal im Projekt-Root:

```powershell
# Docker Compose starten (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Warten bis Services bereit sind (ca. 10-30 Sekunden)
Start-Sleep -Seconds 15

# Prüfen ob alles läuft
docker ps
```

### 3. Datenbank einrichten & Backend starten

**Terminal 1 - Demo-Daten laden:**
```powershell
cd apps\backend
pnpm run setup
```

Warten Sie, bis Sie diese Ausgabe sehen:
```
✅ Created demo tenant
✅ Created 3 demo users (owner, senior, accountant)
...
Login credentials:
  Owner: owner@example.com / password123
  Senior: senior@example.com / password123
  Accountant: accountant@example.com / password123
```

**Terminal 2 - Backend starten:**
```powershell
cd apps\backend
pnpm run dev
```

Warten Sie auf:
```
✅ ProcessFlow Pro Backend running on http://localhost:3000
📚 API Docs available at http://localhost:3000/api/docs
```

**Terminal 3 - Frontend starten:**
```powershell
cd apps\frontend
pnpm run dev
```

### 4. Login testen

Öffnen Sie: http://localhost:5173

Klicken Sie auf einen der Demo-Buttons oder geben Sie ein:
- **Email:** owner@example.com
- **Passwort:** password123

---

## 🔍 Fehlersuche

### Backend startet nicht?

```powershell
# Prüfen ob Port 5432 (PostgreSQL) erreichbar ist
Test-NetConnection localhost -Port 5432
```

Wenn `False`: Docker Compose läuft nicht → Schritt 2 wiederholen

### "Connection refused" beim Setup?

```powershell
# PostgreSQL-Logs ansehen
docker logs processflowpro-postgres

# Neu starten
docker-compose restart postgres
Start-Sleep -Seconds 10
cd apps\backend
pnpm run setup
```

### Frontend zeigt "Network Error"?

```powershell
# Prüfen ob Backend läuft
Test-NetConnection localhost -Port 3000
```

Wenn `False`: Backend nicht gestartet → Terminal 2 prüfen

### Demo-Daten schon vorhanden?

Wenn Sie `⚠️ Demo data already exists` sehen:
```powershell
# Option 1: Ist OK, einfach Backend starten
cd apps\backend
pnpm run dev

# Option 2: Von vorne beginnen
docker-compose down -v
docker-compose up -d
Start-Sleep -Seconds 15
cd apps\backend
pnpm run setup
```

---

## 📊 Status überprüfen

```powershell
# Alle Services prüfen
"=== Docker Services ===" ; docker ps --format "table {{.Names}}\t{{.Status}}"
"=== Backend (Port 3000) ===" ; Test-NetConnection localhost -Port 3000 -InformationLevel Quiet
"=== Frontend (Port 5173) ===" ; Test-NetConnection localhost -Port 5173 -InformationLevel Quiet
"=== PostgreSQL (Port 5432) ===" ; Test-NetConnection localhost -Port 5432 -InformationLevel Quiet
```

Alle sollten `True` sein (außer Docker-Befehl, der eine Tabelle zeigt).
