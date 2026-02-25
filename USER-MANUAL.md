# ProcessFlow Pro - Benutzerhandbuch

## Workflow-Management-System für Steuerkanzleien

**Version**: 1.0  
**Stand**: März 2026

---

## Inhaltsverzeichnis

1. [Erste Schritte / Anmeldung](#1-erste-schritte--anmeldung)
2. [Dashboard-Übersicht](#2-dashboard-übersicht)
3. [Mandantenverwaltung](#3-mandantenverwaltung)
4. [Workflow-Instanzen verwalten](#4-workflow-instanzen-verwalten)
5. [Kalenderansicht](#5-kalenderansicht)
6. [Benachrichtigungen](#6-benachrichtigungen)
7. [Berichte und Export](#7-berichte-und-export)
8. [Häufig gestellte Fragen](#8-häufig-gestellte-fragen)

---

## 1. Erste Schritte / Anmeldung

### 1.1 Systemanforderungen

- Moderner Webbrowser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Internetverbindung (oder lokales Netzwerk zum Server)
- JavaScript muss aktiviert sein

### 1.2 Anmeldung

1. Öffnen Sie die Anwendung in Ihrem Browser (z.B. `https://processflowpro.ihre-kanzlei.de`)
2. Geben Sie Ihre **E-Mail-Adresse** und Ihr **Passwort** ein
3. Klicken Sie auf **"Anmelden"**

> **Hinweis**: Falls Sie Ihr Passwort vergessen haben, wenden Sie sich an Ihren Kanzlei-Administrator.

### 1.3 Rollen und Berechtigungen

| Rolle | Beschreibung | Berechtigungen |
|-------|-------------|----------------|
| **Owner** | Kanzleiinhaber | Vollzugriff, Benutzerverwaltung, Compliance |
| **Senior** | Leitender Mitarbeiter | Benutzerverwaltung, alle Mandanten |
| **Accountant** | Buchhalter/Steuerberater | Eigene und zugewiesene Mandanten |
| **Trainee** | Auszubildender | Eingeschränkter Zugriff |

### 1.4 Abmelden

Klicken Sie oben rechts auf Ihren **Benutzernamen** → **"Abmelden"**.

---

## 2. Dashboard-Übersicht

Das Dashboard ist Ihre zentrale Anlaufstelle nach der Anmeldung.

### 2.1 Statistik-Karten

Oben auf dem Dashboard sehen Sie vier Übersichtskarten:

- **Workflows**: Gesamtanzahl aktiver Workflow-Instanzen
- **Mandanten**: Anzahl der betreuten Mandanten
- **Aufgaben**: Offene Aufgaben für Sie persönlich
- **Anstehende Fristen**: Fristen in den nächsten 7 Tagen

### 2.2 Anstehende Fristen

Die Fristenliste zeigt Ihnen die nächsten Deadlines:
- 🟢 Grün: Frist in mehr als 7 Tagen
- 🟡 Gelb: Frist in 3-7 Tagen
- 🔴 Rot: Frist in weniger als 3 Tagen oder überfällig

### 2.3 Schnellzugriff

Über die Schnellzugriff-Buttons können Sie direkt:
- Einen neuen Mandanten anlegen
- Eine neue Workflow-Instanz erstellen
- Berichte generieren

---

## 3. Mandantenverwaltung

### 3.1 Mandantenliste anzeigen

1. Klicken Sie in der linken Navigation auf **"Mandanten"**
2. Die Liste zeigt alle Mandanten Ihrer Kanzlei
3. Nutzen Sie das **Suchfeld** oben rechts, um nach Name oder Steuernummer zu suchen
4. Verwenden Sie die **Filter** um nach Branche oder Status zu filtern

### 3.2 Neuen Mandanten anlegen

1. Klicken Sie auf **"+ Neuer Mandant"**
2. Füllen Sie das Formular aus:
   - **Firmenname**: Vollständiger Unternehmensname (Pflichtfeld)
   - **Steuernummer**: Finanzamt-Steuernummer
   - **Branche**: Auswahl aus vordefinierten Branchen
   - **Zuverlässigkeitsfaktor**: 1 (unzuverlässig) bis 5 (sehr zuverlässig)
   - **Primärbearbeiter**: Hauptverantwortlicher Mitarbeiter
   - **Sekundärbearbeiter**: Stellvertretung
3. Klicken Sie auf **"Mandant anlegen"**

### 3.3 Mandanten bearbeiten

1. Klicken Sie in der Liste auf den Mandanten oder auf das **Bearbeiten-Symbol** (✏️)
2. Ändern Sie die gewünschten Felder
3. Klicken Sie auf **"Speichern"**

### 3.4 Mandanten-Detailansicht

In der Detailansicht sehen Sie:
- Alle Stammdaten des Mandanten
- Aktive Workflow-Instanzen
- Kontaktpersonen
- Bearbeitungs-Historie

### 3.5 Mandanten löschen

> **Achtung**: Das Löschen eines Mandanten ist irreversibel und löscht alle verknüpften Daten.

1. Öffnen Sie den Mandanten
2. Klicken Sie auf **"Löschen"** (nur für Owner/Senior sichtbar)
3. Bestätigen Sie den Löschvorgang im Dialog

---

## 4. Workflow-Instanzen verwalten

### 4.1 Workflow-Übersicht

Unter **"Workflows"** sehen Sie alle Workflow-Instanzen:
- Filtern nach Status: Aktiv, Verzögert, Kritisch, Abgeschlossen
- Filtern nach Monat: Abrechnungsmonat der Workflows
- Filtern nach Mandant: Nur Workflows eines bestimmten Mandanten

### 4.2 Neue Workflow-Instanz erstellen

1. Klicken Sie auf **"+ Neue Instanz"**
2. Wählen Sie das **Workflow-Template** (z.B. "Lohnbuchhaltung Standard")
3. Wählen Sie den **Mandanten**
4. Wählen Sie den **Abrechnungsmonat** (z.B. "2024-03" für März 2024)
5. Das System berechnet automatisch alle Fristen
6. Klicken Sie auf **"Instanz erstellen"**

### 4.3 Workflow-Schritte ausführen

1. Öffnen Sie eine Workflow-Instanz
2. Sehen Sie alle Schritte mit ihrem Status und Frist
3. Klicken Sie auf einen Schritt, um die Detailansicht zu öffnen

**Mögliche Aktionen pro Schritt:**
- **▶ Starten**: Schritt als "In Bearbeitung" markieren
- **✅ Abschließen**: Schritt als "Erledigt" markieren
- **↪ Verschieben**: Schritt auf ein anderes Datum verschieben
- **⏭ Überspringen**: Schritt als nicht relevant markieren
- **❌ Ablehnen**: Schritt zurückweisen (mit Begründung)

### 4.4 Kommentare hinzufügen

1. Öffnen Sie einen Workflow-Schritt
2. Scrollen Sie zum Bereich **"Kommentare"**
3. Tippen Sie Ihren Kommentar in das Textfeld
4. Drücken Sie **Enter** oder klicken Sie auf **"Senden"**

### 4.5 Checkliste bearbeiten

Viele Schritte haben eine integrierte Checkliste:
1. Öffnen Sie den Schritt
2. Haken Sie erledigte Punkte ab
3. Die Checkliste wird automatisch gespeichert

### 4.6 Status-Bedeutungen

| Status | Symbol | Bedeutung |
|--------|--------|-----------|
| Offen | ⬜ | Noch nicht begonnen |
| In Bearbeitung | 🔵 | Wird aktuell bearbeitet |
| Warten auf Freigabe | 🟡 | Wartet auf Genehmigung |
| Erledigt | ✅ | Erfolgreich abgeschlossen |
| Verschoben | ↪ | Auf neues Datum verschoben |
| Übersprungen | ⏭ | Nicht relevant, übersprungen |
| Abgelehnt | ❌ | Zurückgewiesen |

---

## 5. Kalenderansicht

### 5.1 Kalender öffnen

Klicken Sie in der Navigation auf **"Kalender"**.

### 5.2 Monatsnavigation

- Klicken Sie auf **"<"** oder **">"** um zwischen Monaten zu navigieren
- Klicken Sie auf **"Heute"** um zum aktuellen Monat zurückzukehren

### 5.3 Fristen im Kalender

Farbige Punkte auf Kalendertagen zeigen anstehende Fristen:
- 🔴 Rot: Überfällige oder kritische Fristen
- 🟡 Gelb: Fristen innerhalb von 7 Tagen
- 🟢 Grün: Fristen mit ausreichend Zeit

### 5.4 Tagesdetails

Klicken Sie auf einen Kalendertag, um alle Fristen dieses Tages zu sehen:
- Workflow-Name und Mandant
- Step-Bezeichnung
- Zugewiesener Mitarbeiter
- Aktueller Status

### 5.5 Termine verschieben (Drag & Drop)

1. Klicken Sie auf einen Fristeneintrag und halten Sie die Maustaste gedrückt
2. Ziehen Sie den Eintrag auf das neue Datum
3. Lassen Sie die Maustaste los
4. Bestätigen Sie die Verschiebung im Dialog

### 5.6 Multi-User-Ansicht

Für Teamleiter:
1. Klicken Sie auf **"Mitarbeiter auswählen"**
2. Wählen Sie die anzuzeigenden Mitarbeiter aus
3. Der Kalender zeigt nun farbcodiert die Fristen aller ausgewählten Mitarbeiter

---

## 6. Benachrichtigungen

### 6.1 Benachrichtigungszentrum

Die Glocke 🔔 oben rechts zeigt die Anzahl ungelesener Benachrichtigungen.

Klicken Sie auf die Glocke, um das **Benachrichtigungszentrum** zu öffnen.

### 6.2 Benachrichtigungstypen

| Typ | Symbol | Bedeutung |
|-----|--------|-----------|
| Info | ℹ️ | Allgemeine Information |
| Warnung | ⚠️ | Handlungsbedarf |
| Erfolg | ✅ | Erfolgreich abgeschlossene Aktion |
| Fehler | ❌ | Fehler aufgetreten |

### 6.3 Benachrichtigungen verwalten

- **Als gelesen markieren**: Klicken Sie auf eine einzelne Benachrichtigung
- **Alle als gelesen markieren**: Klicken Sie auf **"Alle gelesen"**
- **Filtern**: Wählen Sie nach Typ oder Kategorie
- **Löschen**: Klicken Sie auf das X-Symbol

### 6.4 Toast-Benachrichtigungen

Sofortige Aktionen (z.B. Schritt abgeschlossen) erscheinen kurz als Toast-Meldung unten rechts auf dem Bildschirm und verschwinden nach einigen Sekunden automatisch.

---

## 7. Berichte und Export

### 7.1 Berichtsübersicht

Unter **"Berichte"** können Sie verschiedene Auswertungen generieren.

### 7.2 Bericht erstellen

1. Klicken Sie auf **"+ Neuer Bericht"**
2. Wählen Sie den **Berichtstyp**:
   - **Workflow-Zusammenfassung**: Überblick über alle Workflows
   - **Detailbericht**: Detaillierte Step-Informationen
   - **Mandantenbericht**: Bericht für einen spezifischen Mandanten
3. Wählen Sie den **Zeitraum** (Von / Bis)
4. Optional: Wählen Sie spezifische **Mandanten** oder **Benutzer**
5. Klicken Sie auf **"Vorschau"** um den Bericht anzuzeigen

### 7.3 Bericht exportieren

Nach der Vorschau können Sie den Bericht exportieren:
- **📄 PDF**: Druckfähiges Dokument
- **📊 Excel**: Für weitere Auswertungen in Excel
- **📋 CSV**: Für Datenimport in andere Systeme

### 7.4 Automatisierte Berichte

1. Klicken Sie auf **"Automatisierung"**
2. Legen Sie einen **Zeitplan** fest (täglich, wöchentlich, monatlich)
3. Geben Sie **E-Mail-Empfänger** an
4. Klicken Sie auf **"Speichern"**

---

## 8. Häufig gestellte Fragen

### F: Ich sehe bestimmte Menüpunkte nicht. Warum?
**A:** Die Anzeige von Menüpunkten hängt von Ihrer Rolle ab. Wenden Sie sich an Ihren Administrator, wenn Sie Zugriff auf bestimmte Bereiche benötigen.

### F: Wie berechnet das System Fristen?
**A:** Das System berücksichtigt Wochenenden, gesetzliche Feiertage (bundeslandspezifisch) und konfigurierten Payment-Run-Tage. Die genaue Berechnung hängt von den im Workflow-Template konfigurierten Regeln ab.

### F: Kann ich einen abgeschlossenen Schritt wieder öffnen?
**A:** Nein, abgeschlossene Schritte können nicht direkt zurückgesetzt werden. Wenden Sie sich an einen Senior oder Owner.

### F: Was passiert, wenn eine Frist überschritten wird?
**A:** Das System ändert den Status des Workflows auf "Verzögert" oder "Kritisch" und sendet automatische Benachrichtigungen an den zugewiesenen Mitarbeiter und den Senior.

### F: Wie exportiere ich alle meine persönlichen Daten (DSGVO)?
**A:** Wenden Sie sich an Ihren Kanzlei-Owner. Er kann einen vollständigen Datenexport über den Compliance-Bereich durchführen.

### F: Wo finde ich Hilfe, wenn etwas nicht funktioniert?
**A:** 
1. Prüfen Sie zunächst dieses Handbuch
2. Wenden Sie sich an Ihren Kanzlei-Administrator
3. Kontaktieren Sie den ProcessFlow Pro Support

---

*ProcessFlow Pro - Effiziente Workflow-Verwaltung für Steuerkanzleien*
