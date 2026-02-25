# ProcessFlow Pro - Administratordokumentation

## System-Handbuch für Kanzlei-Administratoren und IT-Verantwortliche

**Version**: 1.0  
**Stand**: März 2026

---

## Inhaltsverzeichnis

1. [Systemanforderungen](#1-systemanforderungen)
2. [Installation und Setup](#2-installation-und-setup)
3. [Benutzerverwaltung](#3-benutzerverwaltung)
4. [Workflow-Template-Verwaltung](#4-workflow-template-verwaltung)
5. [Systemkonfiguration](#5-systemkonfiguration)
6. [Backup und Wiederherstellung](#6-backup-und-wiederherstellung)
7. [Monitoring mit Prometheus/Grafana](#7-monitoring-mit-prometheusgrafana)
8. [ELK Stack - Log-Management](#8-elk-stack---log-management)
9. [Skalierung](#9-skalierung)
10. [Sicherheit](#10-sicherheit)
11. [DSGVO/GoBD-Compliance-Administration](#11-dsgvogobd-compliance-administration)
12. [Fehlerbehebung](#12-fehlerbehebung)

---

## 1. Systemanforderungen

### 1.1 Minimale Hardwareanforderungen (Produktion)

| Komponente | Minimum | Empfohlen |
|-----------|---------|-----------|
| CPU | 4 Kerne | 8 Kerne |
| RAM | 8 GB | 16 GB |
| Festplatte | 50 GB SSD | 200 GB SSD |
| Netzwerk | 100 Mbit/s | 1 Gbit/s |

### 1.2 Softwareanforderungen

- **Betriebssystem**: Linux (Ubuntu 22.04 LTS oder Debian 12 empfohlen)
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.20+
- **Kubernetes**: Version 1.27+ (für Produktionsdeployment)
- **Node.js**: Version 20 LTS (für lokale Entwicklung)

### 1.3 Externe Dienste

- **PostgreSQL**: Version 15+ (in Docker enthalten)
- **Redis**: Version 7+ (in Docker enthalten)
- **SMTP-Server**: Für E-Mail-Benachrichtigungen

---

## 2. Installation und Setup

### 2.1 Schnellstart mit Docker Compose

```bash
# Repository klonen
git clone https://github.com/ihre-org/ProcessFlowPro.git
cd ProcessFlowPro

# Umgebungsvariablen konfigurieren
cp .env.example .env
nano .env  # Anpassen an Ihre Umgebung

# Anwendung starten
docker-compose up -d

# Datenbank migrieren und Demo-Daten laden
docker-compose exec backend pnpm run db:migration:run
docker-compose exec backend pnpm run seed:demo
```

### 2.2 Wichtige Umgebungsvariablen (.env)

```env
# Datenbank
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=processflowpro
DATABASE_PASSWORD=sicheres-passwort
DATABASE_NAME=processflowpro

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET=mindestens-32-zeichen-langer-geheimer-schluessel
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# API
API_PORT=3000
API_PREFIX=api

# ELK Logging (optional)
LOGSTASH_HOST=logstash
LOGSTASH_PORT=5000

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@ihre-kanzlei.de
SMTP_PASS=smtp-passwort
```

### 2.3 Ersteinrichtung über Web-UI

1. Öffnen Sie `http://ihre-server-ip:3000/setup`
2. Folgen Sie dem Setup-Assistenten:
   - Kanzlei-Details eingeben
   - Administrator-Account anlegen
   - Initiale Workflow-Templates importieren
3. Melden Sie sich mit dem erstellten Admin-Account an

### 2.4 Produktions-Deployment mit Kubernetes

```bash
# Namespace erstellen
kubectl apply -f k8s/namespace.yaml

# ConfigMap und Secrets konfigurieren
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml  # Vorher editieren!

# Infrastruktur deployen
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Anwendung deployen
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/ingress.yaml

# Autoscaling aktivieren
kubectl apply -f k8s/hpa.yaml
```

---

## 3. Benutzerverwaltung (Benutzerverwaltung)

### 3.1 Benutzerrollen

ProcessFlow Pro kennt vier Hauptrollen:

| Rolle | Beschreibung | Typische Berechtigungen |
|-------|-------------|------------------------|
| **Owner** | Kanzleiinhaber | Alle Rechte, Compliance, Systemkonfiguration |
| **Senior** | Leitender Mitarbeiter | Benutzerverwaltung, alle Mandanten, Reports |
| **Accountant** | Buchhalter | Zugewiesene Mandanten, Workflow-Ausführung |
| **Trainee** | Auszubildender | Eingeschränkter Lese-/Schreibzugriff |

### 3.2 Benutzer anlegen

**Via Web-Interface** (empfohlen):
1. Navigieren Sie zu **"Benutzer"** (nur Owner/Senior)
2. Klicken Sie auf **"+ Neuer Benutzer"**
3. Füllen Sie aus:
   - Name, E-Mail, Passwort
   - Rolle auswählen
   - Kapazitätspunkte-Limit setzen
   - Vertretungsregelung konfigurieren
4. Klicken Sie auf **"Benutzer anlegen"**

**Via API**:
```http
POST /api/users
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "name": "Max Mustermann",
  "email": "max.mustermann@kanzlei.de",
  "password": "sicheres-passwort",
  "role": "accountant",
  "capacityPointsLimit": 100
}
```

### 3.3 Kapazitätspunkte

Das Kapazitätspunkte-System verwaltet die Arbeitsauslastung:
- Jeder Workflow-Step hat einen Punktewert
- Mitarbeiter haben ein Punkte-Limit pro Periode
- Das System warnt, wenn das Limit erreicht wird

**Empfohlene Limits:**
- Owner: 200 Punkte
- Senior: 150 Punkte
- Accountant: 100 Punkte
- Trainee: 50 Punkte

### 3.4 Vertretungsregelung

Für jeden Benutzer können konfiguriert werden:
- **Primärvertretung**: Hauptvertretung bei Abwesenheit
- **Sekundärvertretung**: Fallback wenn Primärvertretung nicht verfügbar

---

## 4. Workflow-Template-Verwaltung

### 4.1 Template-Konzept

Templates sind wiederverwendbare Workflow-Definitionen. Für jede Workflow-Art (z.B. "Lohnabrechnung Standard") wird ein Template definiert. Daraus werden monatlich Instanzen für jeden Mandanten erstellt.

### 4.2 Neues Template erstellen

1. Navigieren Sie zu **"Workflow-Templates"**
2. Klicken Sie auf **"+ Neues Template"**
3. Geben Sie Template-Details ein:
   - Name und Beschreibung
   - Ziel-Abrechnungsmonat-Typ
4. Fügen Sie Schritte hinzu:
   - Step-Name und Beschreibung
   - Typ (Standard, Qualitätsprüfung, Freigabe)
   - Zuständige Rolle
   - Frist-Regel konfigurieren
   - Checkliste definieren

### 4.3 Deadline-Regeln

ProcessFlow Pro unterstützt verschiedene Frist-Typen:

| Regeltyp | Beispiel | Beschreibung |
|----------|---------|-------------|
| Relativ | -5 Tage | X Tage vor/nach Abrechnungsmonat |
| Kalenderbasiert | Ende des Monats +3 | Ende des Abrechnungsmonats +/- X Tage |
| Fester Monatstag | 15. des Monats | Immer am gleichen Tag |
| Gesetzliche Frist | Lohnsteuer-Anmeldung | Vordefinierte gesetzliche Termine |
| Step-abhängig | Nach Step "Datenerfassung" | X Tage nach Abschluss eines anderen Steps |

### 4.4 Template-Versionierung

Beim Bearbeiten eines aktiven Templates:
1. Bestehende Instanzen bleiben auf der alten Version
2. Neue Instanzen nutzen die neue Version
3. Eine Versionshistorie wird automatisch geführt

---

## 5. Systemkonfiguration

### 5.1 Umgebungskonfiguration prüfen

```bash
# Docker Compose Status
docker-compose ps

# Logs anzeigen
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Backend-Gesundheit prüfen
curl http://localhost:3000/api/health
```

### 5.2 Datenbank-Verwaltung

```bash
# Migrationen ausführen
docker-compose exec backend pnpm run db:migration:run

# In PostgreSQL-Shell
docker-compose exec postgres psql -U processflowpro -d processflowpro

# Datenbankgröße prüfen
docker-compose exec postgres psql -U processflowpro -d processflowpro -c "\l+"
```

### 5.3 Redis-Verwaltung

```bash
# Redis CLI
docker-compose exec redis redis-cli

# Queue-Status prüfen
docker-compose exec redis redis-cli INFO keyspace

# Alle Keys anzeigen
docker-compose exec redis redis-cli KEYS "*"
```

---

## 6. Backup und Wiederherstellung

### 6.1 Automatische Backups

Das mitgelieferte Backup-Skript (`scripts/backup.sh`) erstellt automatisch:
- PostgreSQL-Dumps
- Komprimierte Archivierung
- Automatische Bereinigung alter Backups

**Einrichten als Cron-Job:**
```bash
# Täglich um 2:00 Uhr
0 2 * * * /pfad/zu/ProcessFlowPro/scripts/backup.sh >> /var/log/processflowpro-backup.log 2>&1
```

### 6.2 Manuelles Backup

```bash
# Datenbank-Backup
docker-compose exec postgres pg_dump -U processflowpro processflowpro | gzip > backup-$(date +%Y%m%d).sql.gz

# Redis-Backup (RDB-Datei)
docker-compose exec redis redis-cli BGSAVE
docker cp processflowpro-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### 6.3 Wiederherstellung

```bash
# Datenbank wiederherstellen
gunzip -c backup-YYYYMMDD.sql.gz | docker-compose exec -T postgres psql -U processflowpro processflowpro

# Redis wiederherstellen
docker-compose stop redis
docker cp redis-backup-YYYYMMDD.rdb processflowpro-redis:/data/dump.rdb
docker-compose start redis
```

### 6.4 Backup-Retention

Empfohlene Aufbewahrungszeiten:
- Tägliche Backups: 30 Tage
- Wöchentliche Backups: 12 Wochen
- Monatliche Backups: 10 Jahre (GoBD-Pflicht)

---

## 7. Monitoring mit Prometheus/Grafana

### 7.1 Monitoring-Stack starten

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Erreichbar unter:
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### 7.2 Wichtige Metriken

**Backend-Metriken:**
- `http_requests_total`: Gesamtanzahl HTTP-Anfragen
- `http_request_duration_seconds`: Antwortzeiten
- `process_cpu_usage`: CPU-Auslastung
- `process_heap_bytes`: Speichernutzung

**PostgreSQL-Metriken:**
- `pg_stat_database_numbackends`: Aktive Verbindungen
- `pg_stat_bgwriter_checkpoints_timed`: Checkpoints
- `pg_database_size_bytes`: Datenbankgröße

**Redis-Metriken:**
- `redis_connected_clients`: Aktive Redis-Verbindungen
- `redis_used_memory_bytes`: Redis-Speichernutzung
- `redis_commands_total`: Verarbeitete Befehle

### 7.3 Alerts konfigurieren

Grafana-Alerts einrichten:
1. Öffnen Sie Grafana → **"Alerting"** → **"Alert Rules"**
2. Erstellen Sie Alert-Regeln für:
   - Backend nicht erreichbar (>30 Sekunden)
   - Hohe Fehlerrate (>5% der Anfragen)
   - Datenbankverbindungen erschöpft (>90%)
   - Festplattennutzung kritisch (>85%)

---

## 8. ELK Stack - Log-Management

### 8.1 ELK-Stack starten

```bash
docker-compose -f docker-compose.elk.yml up -d
```

Warten Sie ca. 60 Sekunden auf den Elasticsearch-Start.

Erreichbar unter:
- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200

### 8.2 Backend-Logs konfigurieren

Setzen Sie in der `.env` Datei:
```env
LOGSTASH_HOST=logstash
LOGSTASH_PORT=5000
```

Starten Sie den Backend-Container neu:
```bash
docker-compose restart backend
```

### 8.3 Kibana-Einrichtung

1. Öffnen Sie Kibana unter http://localhost:5601
2. Navigieren Sie zu **"Stack Management"** → **"Index Patterns"**
3. Erstellen Sie ein Index-Pattern: `processflowpro-logs-*`
4. Wählen Sie `@timestamp` als Zeitfeld
5. Klicken Sie auf **"Discover"** um Logs zu durchsuchen

### 8.4 Wichtige Log-Abfragen (KQL)

```kql
# Fehler-Logs
level: "error"

# Logs nach Kontext
context: "ComplianceController"

# Logs der letzten Stunde mit Fehler
level: "error" AND @timestamp > now-1h

# Spezifische Request-Logs
message: "POST /api/compliance/anonymize"
```

### 8.5 Log-Aufbewahrung

Konfigurieren Sie Index Lifecycle Management (ILM) in Elasticsearch:
- **Hot Phase**: 7 Tage (schneller Zugriff)
- **Warm Phase**: 30 Tage (optimiert für Lesen)
- **Cold Phase**: 6 Monate (kostengünstige Speicherung)
- **Delete Phase**: Nach 10 Jahren (GoBD-konform)

---

## 9. Skalierung

### 9.1 Horizontale Backend-Skalierung

```bash
# Docker Compose: Mehrere Backend-Instanzen
docker-compose up -d --scale backend=3

# Kubernetes: HPA nutzen
kubectl apply -f k8s/hpa.yaml
# Das HPA skaliert automatisch basierend auf CPU/RAM
```

### 9.2 PostgreSQL Read Replicas

Für erhöhte Leselast:
```bash
docker-compose -f docker-compose.scaling.yml up -d postgres-primary postgres-replica
```

Konfiguration in `.env`:
```env
DATABASE_READ_HOST=postgres-replica
DATABASE_READ_PORT=5433
```

### 9.3 Redis Sentinel

Für Redis-Hochverfügbarkeit:
```bash
docker-compose -f docker-compose.scaling.yml up -d redis-master redis-sentinel-1 redis-sentinel-2 redis-sentinel-3
```

### 9.4 Kubernetes-Deployment mit Read Replicas

```bash
kubectl apply -f k8s/postgres-replica.yaml
kubectl apply -f k8s/redis-sentinel.yaml
```

---

## 10. Sicherheit

### 10.1 Passwort-Richtlinien

Empfohlene Passwort-Policy:
- Mindestlänge: 12 Zeichen
- Mindestens: 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl, 1 Sonderzeichen
- Gültigkeitsdauer: 90 Tage
- Keine Wiederverwendung der letzten 5 Passwörter

### 10.2 JWT-Konfiguration

```env
# Kurze Ablaufzeit für Access-Token
JWT_EXPIRATION=15m
# Längere Ablaufzeit für Refresh-Token
JWT_REFRESH_EXPIRATION=7d
# Mindestens 32 Zeichen, zufällig generiert
JWT_SECRET=$(openssl rand -hex 32)
```

### 10.3 Netzwerk-Sicherheit

```bash
# Firewall-Regeln (UFW)
ufw allow 443/tcp    # HTTPS
ufw allow 80/tcp     # HTTP (Redirect auf HTTPS)
ufw deny 3000        # Backend nicht direkt zugänglich
ufw deny 5432        # PostgreSQL nicht öffentlich
ufw deny 6379        # Redis nicht öffentlich
```

### 10.4 SSL/TLS-Konfiguration

Verwenden Sie Let's Encrypt mit Certbot:
```bash
certbot certonly --webroot -w /var/www/html -d ihre-domain.de
```

Konfigurieren Sie den Ingress in Kubernetes entsprechend.

### 10.5 Sicherheits-Checkliste

- [ ] JWT_SECRET ist mindestens 32 Zeichen lang und zufällig
- [ ] Datenbankpasswörter sind sicher und einzigartig
- [ ] HTTPS ist für alle externen Verbindungen konfiguriert
- [ ] Firewall-Regeln sind aktiv
- [ ] Regelmäßige Sicherheitsupdates sind geplant
- [ ] Audit-Logging ist aktiviert
- [ ] Backup-Verschlüsselung ist konfiguriert

---

## 11. DSGVO/GoBD-Compliance-Administration

### 11.1 Compliance-Endpoints

Als Owner können Sie auf alle Compliance-Funktionen zugreifen:

**Benutzerdaten exportieren** (DSGVO Art. 20):
```bash
curl -H "Authorization: Bearer {token}" \
  https://ihre-domain.de/api/compliance/export-data/{userId}
```

**Benutzer anonymisieren** (DSGVO Art. 17):
```bash
curl -X POST -H "Authorization: Bearer {token}" \
  https://ihre-domain.de/api/compliance/anonymize/{userId}
```

**Aufbewahrungsbericht**:
```bash
curl -H "Authorization: Bearer {token}" \
  https://ihre-domain.de/api/compliance/retention-report
```

**GoBD-Bericht**:
```bash
curl -H "Authorization: Bearer {token}" \
  "https://ihre-domain.de/api/compliance/gobd-report?year=2024"
```

### 11.2 Jährliche GoBD-Prüfung

Führen Sie jährlich durch:
1. GoBD-Bericht für das Vorjahr generieren
2. Prüfen ob alle Audit-Einträge vollständig sind
3. Backup der Audit-Logs für die nächsten 10 Jahre sicherstellen
4. Dokumentation aktualisieren

### 11.3 DSGVO-Auskunftsersuchen bearbeiten

Bei einer Anfrage nach Art. 15 DSGVO:
1. Identität der anfragenden Person verifizieren
2. `GET /api/compliance/export-data/{userId}` aufrufen
3. Export-JSON als sichere Datei an Antragsteller übermitteln
4. Vorgang im Audit-Log dokumentieren

### 11.4 Löschanträge (Art. 17 DSGVO)

1. Rechtsgrundlage prüfen (Aufbewahrungspflichten vs. Löschrecht)
2. Falls Löschung zulässig: `POST /api/compliance/anonymize/{userId}`
3. Bestätigung dokumentieren und an Antragsteller senden

Detaillierte Dokumentation: siehe [DSGVO-COMPLIANCE.md](./DSGVO-COMPLIANCE.md)

---

## 12. Fehlerbehebung

### 12.1 Backend startet nicht

```bash
# Logs prüfen
docker-compose logs backend

# Häufige Ursachen:
# 1. Datenbankverbindung fehlgeschlagen
docker-compose logs postgres

# 2. Redis nicht erreichbar
docker-compose logs redis

# 3. Umgebungsvariablen fehlen
docker-compose exec backend env | grep DATABASE
```

### 12.2 Datenbank-Verbindungsfehler

```bash
# PostgreSQL-Status prüfen
docker-compose exec postgres pg_isready -U processflowpro

# Verbindungstest
docker-compose exec postgres psql -U processflowpro -d processflowpro -c "SELECT 1"
```

### 12.3 Login schlägt fehl

Häufige Ursachen:
1. Benutzer existiert nicht in der Datenbank
2. Passwort ist falsch
3. Benutzer ist deaktiviert (`isActive = false`)
4. JWT_SECRET hat sich geändert (alle Tokens werden ungültig)

```bash
# Benutzer in DB prüfen
docker-compose exec postgres psql -U processflowpro -d processflowpro \
  -c "SELECT id, email, role, \"isActive\" FROM users WHERE email='email@beispiel.de';"
```

### 12.4 Performance-Probleme

```bash
# Langsame Queries finden
docker-compose exec postgres psql -U processflowpro -d processflowpro \
  -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Redis-Latenz messen
docker-compose exec redis redis-cli --latency
```

### 12.5 Disk Space erschöpft

```bash
# Disk-Nutzung analysieren
df -h
docker system df

# Alte Docker-Ressourcen aufräumen
docker system prune -a --volumes  # VORSICHT: löscht ungenutzte Volumes!

# Log-Rotation prüfen
ls -lh /var/log/processflowpro/
```

---

## Anhang

### A. Alle Service-Ports

| Service | Port | Beschreibung |
|---------|------|-------------|
| Frontend | 80/443 | Web-Interface |
| Backend | 3000 | REST API |
| PostgreSQL | 5432 | Datenbank |
| Redis | 6379 | Cache/Queue |
| Elasticsearch | 9200 | Log-Index |
| Logstash | 5000/5044 | Log-Ingestion |
| Kibana | 5601 | Log-UI |
| Prometheus | 9090 | Metriken |
| Grafana | 3001 | Monitoring-UI |

### B. Wichtige Dateipfade

| Pfad | Inhalt |
|------|--------|
| `.env` | Umgebungsvariablen |
| `docker-compose.yml` | Haupt-Stack |
| `docker-compose.monitoring.yml` | Monitoring-Stack |
| `docker-compose.elk.yml` | ELK-Stack |
| `docker-compose.scaling.yml` | Skalierungs-Demo |
| `k8s/` | Kubernetes-Manifeste |
| `scripts/backup.sh` | Backup-Skript |
| `monitoring/` | Monitoring-Konfiguration |

### C. Support-Kontakt

Bei technischen Problemen:
- **GitHub Issues**: https://github.com/ihre-org/ProcessFlowPro/issues
- **Dokumentation**: Dieses Dokument und [README.md](./README.md)
- **DSGVO-Fragen**: Siehe [DSGVO-COMPLIANCE.md](./DSGVO-COMPLIANCE.md)

---

*ProcessFlow Pro - Administratordokumentation v1.0*
