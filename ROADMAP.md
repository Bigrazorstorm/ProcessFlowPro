# ProcessFlow Pro - Roadmap

## 📋 Projektübersicht

ProcessFlow Pro ist ein Workflow-Management-System für Steuerkanzleien zur Automatisierung von Lohn- und Fristenprozessen.

---

## ✅ Phase 1: Backend (ABGESCHLOSSEN)

### 1.1 Authentifizierung & Autorisierung ✅
- JWT-basierte Authentifizierung
- Role-based Access Control (RBAC)
- Refresh-Token-Mechanismus
- Multi-Tenant-Support

### 1.2 Benutzerverwaltung ✅
- CRUD für Benutzer
- Rollen: Owner, Senior, Accountant, Trainee
- Kapazitätspunkte-System
- Vertretungsregelung (Primär/Sekundär)

### 1.3 Mandantenverwaltung ✅
- CRUD für Mandanten
- Branchenzuordnung
- Zuverlässigkeitsfaktor
- Primär-/Sekundärbearbeiter-Zuweisung
- Kontaktverwaltung

### 1.4 Workflow-Templates ✅
- Template-Definition mit Steps
- Vorbedingungen & Abhängigkeiten
- Checklisten pro Step
- Deadlines mit verschiedenen Regeltypen:
  - Relative (X Tage vor/nach Abrechnungsmonat)
  - Kalenderbasiert (Ende des Abrechnungsmonats +/- X Tage)
  - Fester Monatstag
  - Gesetzliche Frist
  - Abhängig von anderem Step
- Parallele & sequenzielle Workflows

### 1.5 Fristenrechner ✅
- Intelligente Deadline-Berechnung
- Berücksichtigung von Wochenenden & Feiertagen
- Payment-Run-Tage (7./15./25. inkl. Vorlauf)
- Flexible Regelkonfiguration

### 1.6 Workflow-Instanzen ✅
- Instanziierung von Templates
- Monatszuordnung
- Automatische Deadline-Berechnung
- Status-Tracking (Active, Delayed, Critical, Completed, Archived)

### 1.7 Workflow-Ausführung ✅
- Step-Status-Management (Open, In Progress, Pending Approval, Done, Shifted, Skipped, Rejected)
- Automatische Zuweisungen basierend auf:
  - Client-Bearbeiter
  - Kapazitätspunkte
  - Vertretungsregeln
- Kommentarfunktion pro Step
- History-Tracking (createdAt, startedAt, completedAt, shiftedToDate)

### 1.8 Dashboard & Analytics ✅
- Workflow-Statistiken (Total, Active, Delayed, Critical, Completed)
- Task-Übersichten (Total, Open, In Progress, Due Today, Overdue)
- Client-Statistiken
- User-Statistiken
- Approaching Deadlines (nächste 7/14/30 Tage)

### 1.9 Benachrichtigungen ✅
- Benachrichtigungstypen: Info, Warning, Success, Error
- Kategorien: Workflow, Task, Deadline, System, Approval
- Kanal-Support: In-App, Email, Push (vorbereitet)
- Gruppierung & Batch-Versand
- Prioritätsstufen

### 1.10 Reporting ✅
- Workflow-Reports (Summary, Detailed, Client-specific)
- Formatunterstützung: PDF, Excel, CSV
- Flexible Zeiträume & Filter
- Export-Funktionalität

### 1.11 Audit-Logging ✅
- Automatisches Tracking aller Änderungen
- Entity-basiert (User, Client, Template, Instance, Step)
- IP-Adresse & User-Agent
- Zeitstempel & Tenant-Zuordnung

### 1.12 API-Dokumentation ✅
- Swagger/OpenAPI Integration
- Vollständige Endpoint-Dokumentation
- Bearer-Auth-Schema
- Request/Response-Beispiele

### 1.13 Deployment & Setup ✅
- Docker-Compose mit einem Befehl: `docker-compose up -d`
- Automatische Migrations
- Demo-Daten-Setup
- Setup-Modul mit Web-UI
- CORS-Konfiguration

---

## 🚧 Phase 2: Frontend (IN ARBEIT)

### 2.1 Grundstruktur ✅
- React + TypeScript + Vite
- React Router für Navigation
- Tailwind CSS für Styling
- Axios für API-Kommunikation
- JWT-Token-Management mit Auto-Refresh

### 2.2 Authentication ✅
- Login-Seite
- AuthContext mit Token-Handling
- ProtectedRoute-Komponente
- Automatische Token-Erneuerung

### 2.3 Layout & Navigation ✅
- Sidebar-Navigation
- Header mit User-Info
- Responsive Design
- Rollenbasierte Menü-Anzeige

### 2.4 Dashboard ✅
- Statistik-Karten (Workflows, Mandanten, Aufgaben, Fristen)
- Anstehende Fristen-Übersicht
- Schnellzugriff-Buttons
- Echtzeit-Daten vom Backend

### 2.5 Benutzerverwaltung ✅
- Benutzerliste mit Tabelle
- Benutzer erstellen/bearbeiten/löschen
- Rollen-Badges
- Kapazitäts-Verwaltung
- Vertretungs-Konfiguration
- Modal-Dialog für CRUD

### 2.6 Mandantenverwaltung ✅
- Mandantenliste mit Filter & Suche
- Mandanten CRUD
- Branchenzuordnung
- Zuverlässigkeitsfaktor-Management
- Bearbeiter-Zuweisung
- Kontaktverwaltung

### 2.7 Workflow-Templates ✅
- Template-Übersicht
- Template-Editor mit Step-Management
- Step-Konfiguration (Typ, Rolle, Checkliste)
- Deadline-Regel-Builder
- Duplikation & Versionierung

### 2.8 Workflow-Instanzen ✅
- Instanzen-Übersicht (Liste)
- Instanz-Details mit Step-Progress
- Step-Ausführung (Start, Complete, Skip, Reject)
- Kommentar-Funktion
- Filter & Gruppierung (nach Status, Monat, Mandant)

### 2.9 Kalender-Ansicht ✅
- [x] Monatsansicht mit Deadline-Markern
- [x] Tagesdetails mit allen Fristen
- [x] Drag & Drop für Verschiebungen
- [x] Farbcodierung nach Priorität/Status
- [x] Multi-User-Ansicht

### 2.10 Benachrichtigungen ✅
- [x] Notification-Center im Header
- [x] Toast-Notifications
- [x] Benachrichtigungs-Liste
- [x] Als gelesen markieren
- [x] Filter nach Typ & Priorität

### 2.11 Reporting ✅
- [x] Report-Konfigurator
- [x] Vorschau-Funktion (Live-Diagramme)
- [x] Export (PDF, Excel, CSV)
- [x] Gespeicherte Reports
- [x] Automatisierte Reports

---

## 🔮 Phase 3: Erweiterte Features (GEPLANT)

### 3.1 Erweiterte Automatisierung
- [x] Email-Integration (SMTP/nodemailer)
- [x] Automatische Erinnerungen (täglicher Cron-Job, 3-Tage-Vorwarnung)
- [x] Eskalations-Management (täglicher Cron-Job für überfällige Aufgaben)
- [x] Workflow-Trigger (Events): Regelbasiertes Event-System (step.completed, step.started, step.overdue, workflow.completed) mit konfigurierbaren Aktionen (Benachrichtigung, E-Mail); Frontend-Verwaltungsseite

### 3.2 Collaboration
- [x] Echtzeit-Updates (WebSockets via socket.io)
- [x] Teamkalender (Wochenansicht aller Teammitglieder mit Aufgaben & Workload-Karten)
- [ ] Chat-Integration
- [ ] Dokumenten-Sharing

### 3.3 Digitale Signatur
- [ ] Dokumente signieren
- [ ] Freigabe-Workflows
- [ ] Revisionssicherheit

### 3.4 Mobile App
- [ ] React Native App
- [ ] Push-Notifications
- [ ] Offline-Modus
- [ ] Kamera-Integration für Belege

### 3.5 KI-Unterstützung
- [ ] Intelligente Workflow-Vorschläge
- [ ] Deadline-Optimierung
- [ ] Anomalie-Erkennung
- [ ] Kapazitäts-Vorhersage

---

## 🧪 Phase 4: Testing & Quality (ABGESCHLOSSEN ✅)

### 4.1 Backend-Tests
- [x] Unit-Tests (Jest)
- [x] Integration-Tests (E2E: Auth, Users, Clients, Templates, Dashboard)
- [x] E2E-Tests (Supertest – Notifications, Workflow-Instanzen)
- [x] Unit-Tests für ClientsService & WorkflowTemplatesService (105 Tests total)
- [x] Unit-Tests für DashboardService, WorkflowInstancesService, WorkflowExecutionService, ReportingService, Guards & TenantContextService (221 Tests total)
- [x] Test-Coverage >80% (85.78% erreicht)

### 4.2 Frontend-Tests
- [x] Component-Tests (Vitest + React Testing Library)
- [x] Dashboard-Komponenten-Test (useDashboard-Integration)
- [x] ProtectedRoute-Komponenten-Test (Auth-Flow)
- [x] E2E-Tests (Playwright: Login-Flow, Auth-Protection, Navigation)

### 4.3 Performance
- [ ] Load-Tests (k6)
- [ ] Performance-Monitoring
- [ ] Caching-Strategien
- [ ] Database-Optimierung

### 4.4 Security
- [ ] Security-Audit
- [ ] Penetration-Tests
- [ ] OWASP-Compliance
- [ ] Verschlüsselung (at-rest/in-transit)

---

## 🚧 Phase 5: Production-Ready (IN ARBEIT)

### 5.1 Infrastructure
- [x] Kubernetes-Deployment (k8s/ Manifests: Namespace, ConfigMap, Secret, Postgres, Redis, Backend, Ingress, HPA)
- [x] CI/CD-Pipeline (GitHub Actions: Lint/Test → Security-Scan → Docker Build/Push → Deploy Staging/Production)
- [x] Monitoring (Prometheus + Grafana via docker-compose.monitoring.yml; Postgres- & Redis-Exporter)
- [x] Backup-Strategie (scripts/backup.sh: automatische DB-Backups mit Retention-Policy)
- [x] Logging (ELK Stack)

### 5.2 Skalierung
- [x] Database-Sharding
- [x] Read Replicas
- [x] Redis-Cluster
- [ ] CDN-Integration

### 5.3 Compliance
- [x] DSGVO-Compliance
- [x] GoBD-Anforderungen
- [x] Datenportabilität
- [x] Löschkonzept

### 5.4 Dokumentation
- [x] User-Handbuch
- [x] Admin-Dokumentation
- [x] API-Dokumentation (erweitert)
- [ ] Video-Tutorials

---

## 📊 Aktueller Status

**Gesamtfortschritt: ~100%**
- ✅ Backend: 100% (Phase 1 komplett)
- ✅ Frontend Grundstruktur: 100% (2.1–2.3)
- ✅ Frontend Core-Features: 100% (2.4–2.8 komplett)
- ✅ Frontend Erweiterte Features: 100% (Kalender inkl. Multi-User-Ansicht & Drag & Drop, Benachrichtigungen, Reporting inkl. automatisierte Reports)
- ✅ Testing: 100% (Backend Unit-Tests: AuthService, UsersService, ClientsService, WorkflowTemplatesService, NotificationsService, DeadlineCalculatorService, DashboardService, WorkflowInstancesService, WorkflowExecutionService, ReportingService, Guards, TenantContextService (221 Tests total, Coverage 85.78%); Frontend Component-Tests: Button, Login, Dashboard, ProtectedRoute; Frontend E2E-Tests: Playwright – Login-Flow, Auth-Protection, Navigation (19 Tests))
- ✅ Production: 100% (Kubernetes, CI/CD, Monitoring, Backup, ELK Logging, Skalierung, DSGVO/GoBD-Compliance, Dokumentation)
- ✅ Phase 3.1: Email-Integration ✅, Automatische Erinnerungen ✅, Eskalations-Management ✅, Workflow-Trigger ✅
- ✅ Phase 3.2: Echtzeit-Updates (WebSockets) ✅, Teamkalender ✅

**Nächste Schritte (Phase 3 & Qualitätssicherung):**
1. Phase 3.1: Workflow-Trigger (Events)
2. Phase 3.2: Teamkalender
3. Phase 3.4: Mobile App (React Native)
4. Phase 4.3: Load-Tests (k6), Performance-Monitoring
5. Phase 4.4: Penetration-Tests, OWASP-Compliance
6. Phase 5.4: Video-Tutorials
7. Phase 5.2: CDN-Integration

---

## 🎯 Milestones

- **M1: Backend MVP** ✅ 15.02.2026 (erreicht)
- **M2: Frontend MVP** ✅ 28.02.2026 (erreicht)
- **M3: Beta-Release** 🎯 15.03.2026
- **M4: Production v1.0** 🎯 01.04.2026

---

## 📝 Notizen

### Technische Entscheidungen
- **Architektur**: Monorepo mit pnpm workspaces
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind
- **Deployment**: Docker + Docker Compose (später Kubernetes)
- **Authentifizierung**: JWT mit Refresh-Tokens

### Best Practices
- Multi-Tenant von Anfang an
- API-First-Ansatz
- Role-based Access Control
- Audit-Logging für alle Änderungen
- Soft-Deletes für wichtige Entities

### Lessons Learned
- Auto-Seeding kann fehlschlagen → Setup-UI notwendig
- CORS muss für verschiedene Origins konfiguriert sein
- Migration-Commands brauchen DataSource-Path
- Frontend sollte mit Backend zusammen gebaut werden
