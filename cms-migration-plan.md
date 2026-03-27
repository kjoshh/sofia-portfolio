# CMS Migration Plan — Netlify + Decap CMS + Cloudinary

## Ziel

Sofia soll selbst Content pflegen koennen (Projekte, Archivbilder, About-Text),
ohne dass der bestehende Code angefasst werden muss. Alle Animationen und
Interaktionen bleiben 1:1 erhalten.

---

## Stack

| Dienst | Zweck | Kosten |
|--------|-------|--------|
| **Netlify** | Hosting, auto-deploy von GitHub, HTTPS, CDN | Free (100GB/Monat) |
| **Decap CMS** | Admin-Panel unter `/admin`, Git-basiert | Free (Open Source) |
| **Cloudinary** | Responsive Bilder (auto srcset), CDN | Free (25GB Storage, 25GB Bandwidth/Monat) |

---

## Was Sofia pflegen kann

| Was | Wie |
|-----|-----|
| Neues Projekt anlegen | Titel, Slug, Thumbnail, Galerie-Bilder, Info-Text |
| Projekt loeschen/bearbeiten | Bilder hinzufuegen/entfernen, Text aendern |
| Archivbilder | Hinzufuegen/entfernen, BW-Flag setzen, Reihenfolge aendern |
| About-Seite | Greeting-Text bearbeiten |
| Index-Bilder | Die beiden Hauptbilder tauschen |
- sort order von projects im nav dropdown

---

## Phase 1: Cloudinary Setup
                                  


### 1.1 Account erstellen ---- done
- Cloudinary Free Account unter cloudinary.com
- "Cloud Name" notieren (z.B. `sofia-portfolio`)

### 1.2 Bilder hochladen ---- done
- Alle 103 Bilder aus `images/` (59MB) nach Cloudinary hochladen


### 1.3 Responsive Bilder
Cloudinary generiert automatisch responsive Varianten ueber URL-Transformation:
```html
<!-- Vorher (lokal, keine responsive Varianten): -->
<img src="images-neu/hard-coded-1.jpg">

<!-- Nachher (Cloudinary, automatische srcset): -->
<img src="https://res.cloudinary.com/CLOUD/image/upload/w_800,f_auto,q_auto/projects/hard-coded/1.jpg"
     srcset="https://res.cloudinary.com/CLOUD/image/upload/w_500,f_auto,q_auto/projects/hard-coded/1.jpg 500w,
             https://res.cloudinary.com/CLOUD/image/upload/w_800,f_auto,q_auto/projects/hard-coded/1.jpg 800w,
             https://res.cloudinary.com/CLOUD/image/upload/w_1200,f_auto,q_auto/projects/hard-coded/1.jpg 1200w,
             https://res.cloudinary.com/CLOUD/image/upload/w_1600,f_auto,q_auto/projects/hard-coded/1.jpg 1600w,
             https://res.cloudinary.com/CLOUD/image/upload/w_2400,f_auto,q_auto/projects/hard-coded/1.jpg 2400w"
     sizes="100vw" loading="lazy" alt="">
```
- `f_auto` = automatisches Format (WebP/AVIF wenn Browser unterstuetzt)
- `q_auto` = automatische Qualitaet (spart ~40-60% Dateigröße)
- `w_XXX` = Breite in Pixeln

---

## Phase 2: Decap CMS Setup

### 2.1 Admin-Seite erstellen
Neue Datei `admin/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sofia Portfolio — Admin</title>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</head>
<body></body>
</html>
```

### 2.2 CMS-Konfiguration
Neue Datei `admin/config.yml`:
```yaml
backend:
  name: github
  repo: kjoshh/sofia-portfolio
  branch: main

media_library:
  name: cloudinary
  config:
    cloud_name: CLOUD_NAME
    api_key: API_KEY

collections:
  # ── Projekte ──
  - name: projects
    label: Projects
    folder: _data/projects
    create: true
    slug: "{{slug}}"
    fields:
      - { name: title, label: Title, widget: string }
      - { name: slug, label: Slug, widget: string }
      - { name: thumbnail, label: Thumbnail, widget: image }
      - { name: gallery, label: Gallery Images, widget: list,
          field: { name: image, label: Image, widget: image } }
      - { name: info_text, label: Info Text, widget: markdown }
      - { name: sort_order, label: Sort Order, widget: number, default: 0 }

  # ── Archiv ──
  - name: archive
    label: Archive Images
    folder: _data/archive
    create: true
    slug: "{{slug}}"
    fields:
      - { name: image, label: Image, widget: image }
      - { name: is_bw, label: Black & White, widget: boolean, default: false }
      - { name: sort_order, label: Sort Order, widget: number, default: 0 }

  # ── Site Settings ──
  - name: settings
    label: Site Settings
    files:
      - name: general
        label: General
        file: _data/settings.json
        fields:
          - { name: greeting_line1, label: Greeting Line 1, widget: string }
          - { name: greeting_line2, label: Greeting Line 2, widget: string }
          - { name: index_hero1, label: "Index Hero (Sofia)", widget: image }
          - { name: index_hero2, label: "Index Hero (Sybil)", widget: image }
```

### 2.3 Datenstruktur
Decap CMS speichert Daten als JSON/Markdown im Repo:
```
_data/
  projects/
    hard-coded.json
    forgetting-dreams.json
  archive/
    archive-01.json
    archive-02.json
    ...
  settings.json
```

Beispiel `_data/projects/hard-coded.json`:
```json
{
  "title": "Hard-Coded",
  "slug": "hard-coded",
  "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
  "gallery": [
    "https://res.cloudinary.com/.../1.jpg",
    "https://res.cloudinary.com/.../2.jpg"
  ],
  "info_text": "Hard-coded investigates the intersection...",
  "sort_order": 1
}
```

---

## Phase 3: Build-Script

Da die Seite statisch ist (kein Framework), brauchen wir ein kleines
Build-Script das die JSON-Daten in die HTML-Templates einsetzt.

### 3.1 Template-Dateien
Die bestehenden HTML-Dateien werden zu Templates mit Platzhaltern:
- `templates/project.html` — Vorlage fuer alle Projektseiten
- `templates/archive.html` — Vorlage fuer die Archivseite
- `templates/about.html` — Vorlage fuer die About-Seite
- `index.html` — bleibt fast unveraendert (nur Hero-Bilder dynamisch)

### 3.2 Build-Script (`build.js`)
Ein Node.js Script das:
1. `_data/projects/*.json` liest
2. Fuer jedes Projekt `templates/project.html` kopiert und Platzhalter ersetzt
   (Titel, Galerie-Bilder, Info-Text, Nav-Dropdown)
3. `_data/archive/*.json` liest und `templates/archive.html` befuellt
4. `_data/settings.json` liest und About/Index aktualisiert
5. Cloudinary-URLs mit srcset generiert
6. Nav-Dropdown auf allen Seiten aktualisiert (Projektliste)
7. Fertiges HTML nach `dist/` oder Root schreibt

### 3.3 Netlify Build Command
In `netlify.toml`:
```toml
[build]
  command = "node build.js"
  publish = "dist"
```

Ablauf bei jedem Push (auch von Decap CMS):
```
GitHub Push → Netlify Build → build.js → Statische Seite live
```

---

## Phase 4: Netlify Deploy

### 4.1 Netlify Account + Repo verbinden
- Netlify Free Account
- GitHub Repo `kjoshh/sofia-portfolio` verbinden
- Build Command: `node build.js`
- Publish Directory: `dist`

### 4.2 Custom Domain
- `sofiacartuccia.com` als Custom Domain in Netlify eintragen
- DNS umstellen (A-Record oder CNAME)
- Automatisches HTTPS via Let's Encrypt

### 4.3 Decap CMS OAuth
- In Netlify: Identity aktivieren (free, bis 1000 User)
- Oder: GitHub OAuth App erstellen
- Sofia bekommt Login unter `sofiacartuccia.com/admin`

---

## Phase 5: Migration

### 5.1 Initiale Daten
- Bestehende Projektdaten aus HTML extrahieren → JSON-Dateien erstellen
- Alle Bilder nach Cloudinary hochladen
- Build-Script schreiben und testen

### 5.2 Testen
- [ ] Build generiert korrekte HTML-Dateien
- [ ] Alle Bilder laden von Cloudinary
- [ ] Responsive srcset funktioniert (verschiedene Bildschirmgroessen)
- [ ] Alle Animationen funktionieren wie vorher
- [ ] Sofia kann ueber /admin einloggen
- [ ] Sofia kann Projekt anlegen → Build triggert → Seite aktualisiert
- [ ] Sofia kann Archivbild hinzufuegen mit BW-Toggle
- [ ] Sofia kann Greeting-Text aendern
- [ ] Performance: Lighthouse Score >= 90

### 5.3 Go Live
- DNS umstellen
- Webflow-Seite abschalten

---

## Aufwand

| Phase | Was | Aufwand |
|-------|-----|--------|
| 1 | Cloudinary Setup + Bilder hochladen | Klein (~1h) |
| 2 | Decap CMS Config | Klein (~1h) |
| 3 | Build-Script + Templates | **Mittel** (~3-4h) |
| 4 | Netlify Deploy + Domain | Klein (~30min) |
| 5 | Migration + Testing | Mittel (~2h) |

**Gesamtaufwand: ~7-8h**

---

## Vorteile gegenueber Webflow

- **Kein Vendor Lock-in** — alles austauschbar
- **Code bleibt wie er ist** — keine Workarounds noetig
- **Kostenlos** — kein Webflow-Abo noetig
- **Responsive Bilder** — Cloudinary macht das gleiche wie Webflow, plus WebP/AVIF
- **Schneller** — statische Seite ohne Webflow-Runtime JS
- **Sicher** — kein Server, keine Datenbank, nichts zu hacken
- **Zukunftssicher** — Standard HTML/CSS/JS, jederzeit woanders hostbar
