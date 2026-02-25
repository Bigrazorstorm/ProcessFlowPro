# DSGVO & GoBD Compliance Documentation

## ProcessFlow Pro - Datenschutz & Steuerrecht-Compliance

---

## 1. Übersicht

ProcessFlow Pro implementiert umfassende Datenschutz- und Compliance-Maßnahmen gemäß der Datenschutz-Grundverordnung (DSGVO) und den Grundsätzen zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff (GoBD).

---

## 2. DSGVO-Compliance

### 2.1 Rechtsgrundlagen

ProcessFlow Pro verarbeitet personenbezogene Daten auf Basis von:
- **Art. 6 Abs. 1 lit. b DSGVO**: Vertragserfüllung (Workflow-Verwaltung für Mandanten)
- **Art. 6 Abs. 1 lit. c DSGVO**: Rechtliche Verpflichtung (steuerrechtliche Fristen)
- **Art. 6 Abs. 1 lit. f DSGVO**: Berechtigtes Interesse (Audit-Logging)

### 2.2 Betroffenenrechte (Art. 15-22 DSGVO)

#### Art. 15 - Auskunftsrecht
- Benutzer können über den Admin alle sie betreffenden gespeicherten Daten abfragen
- API-Endpoint: `GET /api/compliance/export-data/:userId`

#### Art. 17 - Recht auf Löschung ("Recht auf Vergessenwerden")
- Benutzer können ihre personenbezogenen Daten anonymisieren lassen
- Die Anonymisierung ersetzt Name, E-Mail und Passwort durch Platzhalterdaten
- Audit-Logs bleiben für GoBD-Konformität erhalten, werden aber anonymisiert
- API-Endpoint: `POST /api/compliance/anonymize/:userId`
- **Erforderliche Rolle**: Owner

#### Art. 20 - Recht auf Datenportabilität
- Export aller benutzerbezogenen Daten im JSON-Format
- Enthält: Benutzerprofil, Audit-Logs, Workflow-Schritte, Kommentare
- API-Endpoint: `GET /api/compliance/export-data/:userId`
- **Erforderliche Rolle**: Owner oder Senior

### 2.3 Datensparsamkeit (Art. 5 Abs. 1 lit. c DSGVO)

ProcessFlow Pro erfasst nur die für den Betrieb notwendigen Daten:
- **Benutzer**: Name, E-Mail, Rolle, Kapazitätspunkte
- **Mandanten**: Geschäftliche Kontaktdaten, Branche
- **Workflow-Daten**: Status, Fristen, Kommentare
- **Audit-Logs**: Aktion, Entität, Zeitstempel, IP-Adresse (für Sicherheit)

### 2.4 Datensicherheit (Art. 32 DSGVO)

- **Passwörter**: bcrypt-Hashing (Kostenfaktor 10)
- **Authentifizierung**: JWT mit kurzer Ablaufzeit + Refresh-Token
- **Transport**: TLS/HTTPS in Produktion
- **Multi-Tenancy**: Strikte Datentrennung durch `tenantId` in allen Queries
- **Zugriffssteuerung**: Role-Based Access Control (RBAC)

---

## 3. GoBD-Compliance

### 3.1 Anforderungen der GoBD

Die GoBD schreibt für steuerlich relevante elektronische Bücher und Aufzeichnungen vor:

#### Unveränderbarkeit (§ 146 AO)
- Alle Workflow-Aktionen werden im Audit-Log unveränderlich gespeichert
- Keine Löschung von Audit-Log-Einträgen möglich
- Zeitstempel sind systemseitig gesetzt (nicht manipulierbar)

#### Vollständigkeit
- Jede Statusänderung an Workflow-Instanzen und Steps wird protokolliert
- Benutzer-Aktionen (create, update, delete, complete, assign) werden erfasst
- IP-Adresse und User-Agent werden gespeichert

#### Richtigkeit
- Validierung aller Eingabedaten via Class-Validator
- Transaktionale Datenbankoperationen für Konsistenz

#### Zeitgerechtigkeit
- Zeitstempel werden automatisch bei Erstellung/Änderung gesetzt
- Deadline-Berechnung berücksichtigt gesetzliche Fristen und Feiertage

#### Ordnung
- Daten sind nach Tenant, Entitätstyp und Zeitraum geordnet und filterbar
- Hierarchische Struktur: Tenant → Client → Workflow Instance → Steps

#### Nachvollziehbarkeit
- Vollständige Audit-Trail für alle Geschäftsvorfälle
- Alte und neue Werte werden im Audit-Log gespeichert (`oldValue`, `newValue`)
- Benutzer-Zuordnung zu allen Aktionen

### 3.2 Aufbewahrungsfristen

| Datenart | Aufbewahrungsfrist | Rechtsgrundlage |
|----------|-------------------|-----------------|
| Audit-Logs | 10 Jahre | § 147 AO |
| Workflow-Instanzen | 10 Jahre | § 147 AO |
| Lohn-Workflows | 6 Jahre | § 147 AO |
| Benutzerdaten (inaktiv) | 3 Jahre | DSGVO + AO |
| Mandantendaten | 10 Jahre | § 147 AO |

### 3.3 GoBD-Report

Der GoBD-Report gibt einen Überblick über die Compliance-Situation für ein Geschäftsjahr:
- Gesamtanzahl Audit-Einträge
- Verteilung nach Aktionstypen
- Verteilung nach Entitätstypen
- Abgeschlossene Workflows
- Compliance-Status-Zusammenfassung

**API-Endpoint**: `GET /api/compliance/gobd-report?year=2024`
**Erforderliche Rolle**: Owner oder Senior

---

## 4. Datenhaltungs-Richtlinie (Data Retention Policy)

### 4.1 Aktive Daten

Aktive Daten werden so lange gespeichert, wie sie für den Betrieb benötigt werden:
- Aktive Benutzer: Unbegrenzt (solange im Dienst)
- Aktive Mandanten: Unbegrenzt (solange Geschäftsbeziehung besteht)
- Offene Workflow-Instanzen: Unbegrenzt (bis Abschluss)

### 4.2 Archivierung

Abgeschlossene Workflows und inaktive Daten werden archiviert, aber nicht gelöscht.

### 4.3 Löschung

Eine vollständige Löschung ist nur für nicht-steuerrelevante personenbezogene Daten möglich:
- Benutzer-Profildaten (Name, E-Mail): Anonymisierung nach DSGVO Art. 17
- Audit-Logs: **Keine Löschung** (GoBD-Pflicht)
- Workflow-Daten: **Keine Löschung** für steuerrelevante Zeiträume

---

## 5. Compliance-Endpoints

### Verwendung der API

Alle Compliance-Endpoints erfordern JWT-Authentifizierung und spezifische Rollen.

#### Export aller Benutzerdaten
```http
GET /api/compliance/export-data/{userId}
Authorization: Bearer {jwt-token}
```
**Antwort**: JSON-Datei mit allen benutzerbezogenen Daten

#### Benutzer anonymisieren
```http
POST /api/compliance/anonymize/{userId}
Authorization: Bearer {jwt-token}
```
**Erforderliche Rolle**: Owner
**Antwort**: `{ "success": true, "message": "..." }`

#### Aufbewahrungsbericht
```http
GET /api/compliance/retention-report
Authorization: Bearer {jwt-token}
```
**Erforderliche Rolle**: Owner
**Antwort**: Übersicht aller Datenbestände und deren Aufbewahrungsstatus

#### GoBD-Bericht
```http
GET /api/compliance/gobd-report?year=2024
Authorization: Bearer {jwt-token}
```
**Erforderliche Rolle**: Owner oder Senior
**Antwort**: GoBD-Compliance-Bericht für das angegebene Jahr

---

## 6. Anonymisierungsprozess

### 6.1 Was wird anonymisiert?

Bei der Anonymisierung eines Benutzers werden folgende Felder überschrieben:
- `name` → "Gelöschter Benutzer"
- `email` → `anonymized-{userId}@deleted.processflowpro.internal`
- `passwordHash` → "ANONYMIZED"
- `isActive` → `false`

### 6.2 Was bleibt erhalten?

- Audit-Log-Einträge (ohne Personenbezug nach Anonymisierung)
- Workflow-Step-Zuweisungen (mit anonymisierter userId-Referenz)
- Alle geschäftsprozessrelevanten Daten

### 6.3 Audit-Trail der Anonymisierung

Die Anonymisierungsaktion selbst wird im Audit-Log protokolliert:
```json
{
  "action": "anonymize",
  "entityType": "user",
  "entityId": "{userId}",
  "reason": "DSGVO Art. 17 - Recht auf Löschung"
}
```

---

## 7. Technische Maßnahmen (TOMs)

### 7.1 Zutrittskontrolle
- Server-Infrastruktur in gesichertem Rechenzentrum
- Kubernetes-Cluster mit Netzwerk-Policies

### 7.2 Zugangskontrolle
- JWT-basierte Authentifizierung
- Passwort-Hashing mit bcrypt
- Automatischer Token-Ablauf

### 7.3 Zugriffskontrolle
- Role-Based Access Control (RBAC)
- Multi-Tenancy mit strikter Datentrennung
- Tenant-Guard für alle API-Endpoints

### 7.4 Trennbarkeit
- Mandantendaten strikt durch `tenantId` getrennt
- Keine Cross-Tenant-Datenzugriffe möglich

### 7.5 Pseudonymisierung
- UserIDs als UUIDs (nicht sprechend)
- Audit-Logs referenzieren nur UUIDs

### 7.6 Verfügbarkeit
- Kubernetes-Deployment mit Replikation
- Automatische Backups (scripts/backup.sh)
- Monitoring mit Prometheus/Grafana

### 7.7 Belastbarkeit
- Horizontal Scalable via Kubernetes HPA
- PostgreSQL Read Replicas für Leseanfragen
- Redis Sentinel für Hochverfügbarkeit

---

## 8. Datenschutzbeauftragter

Bei Datenschutzanfragen wenden Sie sich an den zuständigen Datenschutzbeauftragten Ihrer Organisation. ProcessFlow Pro stellt die technische Infrastruktur bereit, um Datenschutzanfragen effizient zu bearbeiten.

---

## 9. Änderungshistorie

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-03 | Initiale DSGVO/GoBD-Dokumentation |
