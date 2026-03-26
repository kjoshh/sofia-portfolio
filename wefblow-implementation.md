# Webflow Migration Guide — Sofia Portfolio

## Ziel

Die Seite auf Webflow hosten mit CMS, damit Sofia selbst Content pflegen kann.
Alle Custom-Animationen (GSAP, Matter.js, WebGL, Canvas) bleiben erhalten.

---

## CMS-Anforderungen

| Was | Sofia kann... |
|-----|---------------|
| **Projektseiten** | Neue Projekte erstellen (Bilder, Titel, Info-Text) |
| **Archive** | Bilder hinzufuegen/loeschen/tauschen + angeben ob BW oder Farbe |
| **Index** | Die beiden Hauptbilder austauschen |
| **About** | Greeting-Text bearbeiten |

---

## Phase 1: CMS Collections anlegen

### Collection: "Projects"
| Feld | Typ | Zweck |
|------|-----|-------|
| Name | Plain Text | Projekttitel (z.B. "Forgetting Dreams") |
| Slug | Auto-generated | URL-Pfad |
| Thumbnail | Image | Vorschaubild fuer Nav-Dropdown + Mobile Sheet |
| Hero Image | Image | Layout-0 Hauptbild |
| Film Roll Image | Image | `#img100` Filmrolle (optional) |
| Gallery Images | Multi-Image | Alle Projektbilder (Reihenfolge wichtig!) |
| Info Text | Rich Text | 3 Absaetze Projektbeschreibung |

### Collection: "Archive Images"
| Feld | Typ | Zweck |
|------|-----|-------|
| Image | Image | Das Archivbild |
| Full Resolution | Image | Lightbox-Version (`data-full`) |
| Is BW | Switch (Boolean) | Steuert ob `.bw` Klasse gesetzt wird |
| Sort Order | Number | Reihenfolge im Grid |

### Collection: "Site Settings" (Singleton / 1 Item)
| Feld | Typ | Zweck |
|------|-----|-------|
| Index Hero 1 | Image | `#bg` — Sofia Hauptbild |
| Index Hero 2 | Image | `#bgSybil` — Sybil Hauptbild |
| About Greeting Line 1 | Plain Text | `.greet-line1` Text |
| About Greeting Line 2 | Plain Text | `.greet-line2` Text |

---

## Phase 2: Seiten im Designer aufbauen

### Wichtig: Klassen-Namen muessen EXAKT uebereinstimmen!

Alle CSS und JS referenzieren bestehende Klassen. Im Webflow Designer die
selben Klassen vergeben, damit `custom.css` und alle JS-Dateien greifen.

### Seiten-Struktur

**index.html → Home Page**
```
body.landing-page
  .page-transition
  .scene
    .frame-wrap#frameWrap
      img#bg (CMS: Site Settings → Index Hero 1)
      img#bgSybil (CMS: Site Settings → Index Hero 2)
      img#bgHover
      .frame-border
      .frame-border-hover#frameBorderHover
    #letterField
    canvas#dustCanvas
  .vignette
  .dusti
  .grain
  nav.main-nav (statisch, nicht CMS)
  .mob-sheet (statisch)
```

**archive.html → Archive Page**
```
body.archive-page
  .page-transition
  .archive-grid
    CMS Collection List → Archive Images (sortiert nach Sort Order)
      .archive-grid-item [data-full="{Full Resolution URL}"]
        [Conditional: wenn Is BW → Klasse .bw hinzufuegen]
        img (CMS: Image)
  .lb-overlay (Lightbox — statisch)
  .dusti / .grain
  nav + .mob-sheet
```

**Project Template → CMS Template Page**
```
body
  .page-transition
  .gall3ry-container
    nav.main-nav
    .pro-nav (Links: Sequence, Overview, Info)
    .gall3ry.layout-0-gall3ry
      CMS Collection List → Gallery Images
        .imgholder
          img.pro-img (CMS: jedes Galeriebild)
      #img100 (CMS: Film Roll Image, falls vorhanden)
    .text-container
      CMS Rich Text → Info Text (mit Klasse .info-para pro Absatz)
    .seq-counter
    .mob-proj-tabs
  .lb-overlay
  .dusti / .grain
  .mob-sheet
```

**about.html → About Page**
```
body.about-page
  .page-transition
  .about-hero-mobile
    .about-bg (statisches Bild, kein CMS)
    .about-greeting
      .greet-line1 (CMS: Site Settings → Greeting Line 1)
      .greet-line2 (CMS: Site Settings → Greeting Line 2)
    .about-scroll-hint
  .about-content-mobile
    .about-right (statisch — Bio, Exhibitions, Publications)
  .dusti / .grain
  nav + .mob-sheet
```

---

## Phase 3: Code-Aenderungen vor Migration

### KRITISCH — Muss geaendert werden

#### 1. `transition.js` — Entfernen oder ersetzen
Webflow hat eigene Page Transitions. Euer Script faengt ALLE internen
Link-Klicks ab (`e.preventDefault()`) und wuerde Webflow's Navigation brechen.

**Loesung:** `transition.js` nicht in Webflow einbinden. Stattdessen:
- Page-Transition Overlay ueber Webflow IX2 Interactions bauen
- Oder: Script anpassen, sodass es nur den Fade-Overlay steuert aber
  `window.location.href` nicht selbst setzt

#### 2. `nav.js` — w-mod Klassen entfernen
```javascript
// DIESE ZEILEN ENTFERNEN:
html.classList.add('w-mod-js');
if ('ontouchstart' in window) html.classList.add('w-mod-touch');
html.classList.add('w-mod-ix3');
```
Webflow setzt diese Klassen selbst. Doppeltes Setzen verursacht Race Conditions.

#### 3. Lenis Smooth Scroll — Entfernen
Lenis hijackt `window.scroll` und bricht Webflow's eigenes Scroll-Handling.
Aus diesen Dateien entfernen:
- `about.js` — Lenis Init + RAF Loop
- `archive.js` — Lenis Init + RAF Loop
- `project.js` — Lenis Init + `lenis.scrollTo()` + `lenis.start()/stop()`

Webflow's natives Scrolling ist fluessig genug. Falls Smooth Scroll gewuenscht:
Webflow hat eine eingebaute Option unter Site Settings → General → Smooth Scroll.

#### 4. `custom.css` — w-mod Selektor vereinfachen
```css
/* VORHER: */
html.w-mod-js:not(.w-mod-ix3) :is(.info-para) {
  visibility: hidden !important;
}

/* NACHHER: */
.info-para {
  visibility: hidden;
}
```
Das `!important` und die w-mod Abhaengigkeit entfernen — Webflow
kontrolliert diese Klassen selbst.

### EMPFOHLEN — Sollte geaendert werden

#### 5. Element-Guards hinzufuegen
Alle Scripts gehen davon aus, dass DOM-Elemente existieren. In Webflow
koennte die Reihenfolge anders sein. Absichern:
```javascript
// Am Anfang jeder Script-Datei:
const frameWrap = document.getElementById('frameWrap');
if (!frameWrap) return; // Nicht auf dieser Seite
```

#### 6. ScrollTrigger testen
`archive.js` nutzt `ScrollTrigger.batch()` fuer gestaffeltes Einblenden.
Das sollte mit Webflow funktionieren, aber gruendlich testen — Webflow's
eigene Scroll-Interactions koennten kollidieren wenn ihr im Designer
auch Scroll-Animationen setzt.

---

## Phase 4: Custom Code in Webflow einbinden

### Im Head (Project Settings → Custom Code → Head)
```html
<!-- Fonts -->
<style>
  @font-face {
    font-family: 'Post';
    src: url('WEBFLOW_ASSET_URL/Post.otf') format('opentype');
    font-display: swap;
  }
</style>

<!-- Custom CSS -->
<link rel="stylesheet" href="WEBFLOW_ASSET_URL/custom.css">
```

### Im Footer (Project Settings → Custom Code → Footer)
```html
<!-- Libraries -->
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js"></script>

<!-- GSAP Club Plugins (benoetigen eigenen Hosting / CDN) -->
<script defer src="WEBFLOW_ASSET_URL/SplitText.min.js"></script>

<!-- Shared Scripts (alle Seiten) -->
<script defer src="WEBFLOW_ASSET_URL/nav.js"></script>
<script defer src="WEBFLOW_ASSET_URL/cursor.js"></script>
<script defer src="WEBFLOW_ASSET_URL/mob-sheet.js"></script>
<script defer src="WEBFLOW_ASSET_URL/lightbox.js"></script>
```

### Per-Page Custom Code (Page Settings → Custom Code)

**Home:**
```html
<script defer src="WEBFLOW_ASSET_URL/index.js"></script>
```

**Archive:**
```html
<script defer src="WEBFLOW_ASSET_URL/archive.js"></script>
```

**Project Template:**
```html
<script defer src="WEBFLOW_ASSET_URL/project.js"></script>
```

**About:**
```html
<script defer src="WEBFLOW_ASSET_URL/about.js"></script>
```

### Assets hochladen
Webflow erlaubt File-Uploads unter Assets. Dort hochladen:
- `custom.css`
- Alle JS-Dateien (nach Bereinigung)
- `Post.otf` Font
- `dust.jpg`, `noise.png` (Texturen)
- Buchstaben-PNGs (`s.png`, `o.png`, etc.) fuer Landing-Physik
- `frame-desk.png`, `frame-mobile.png`
- Alle Projekt-/Archivbilder (oder ueber CMS hochladen)

---

## Phase 5: CMS Dynamic Bindings

### Archive — BW/Farbe Switch
Im Designer: Collection List Item bekommt Conditional Visibility NICHT,
sondern ein **Custom Attribute** via Webflow:

1. Archive Grid Item → Custom Attributes → `data-full` → binden an "Full Resolution" Feld
2. Fuer BW-Klasse: Conditional Class `.bw` kann nicht direkt ueber CMS gesteuert werden

**Workaround fuer .bw Klasse:**
```javascript
// Am Anfang von archive.js hinzufuegen:
document.querySelectorAll('.archive-grid-item').forEach(item => {
  if (item.dataset.bw === 'true') {
    item.classList.add('bw');
  }
});
```
Im Designer: Custom Attribute `data-bw` an CMS-Feld "Is BW" binden.

### Project Template — Dynamische Bilder
Die Gallery Images aus dem CMS werden als Collection List gerendert.
`project.js` zaehlt die `.imgholder` Elemente dynamisch — das funktioniert
automatisch mit beliebig vielen Bildern.

### Index — Hero-Bilder aus CMS
`#bg` und `#bgSybil` src-Attribute an Site Settings Collection binden.
Problem: Webflow kann keine Singleton-Collection direkt auf normalen Seiten binden.

**Workaround:**
Entweder:
- Die Bilder manuell im Designer aendern (kein CMS noetig, Sofia tauscht sie im Designer)
- Oder: Ein kleines Script das die Bilder aus einer API/JSON laedt

### About — Greeting Text
`.greet-line1` und `.greet-line2` Textinhalt an Site Settings binden.
Gleicher Singleton-Workaround wie oben.

---

## Phase 6: Testen

### Checkliste
- [ ] Landing: Buchstaben-Regen funktioniert, Hover/Tap swappt Namen
- [ ] Landing: Dust-Partikel auf Canvas sichtbar
- [ ] Landing: Frame-Wipe bei Hover (Desktop)
- [ ] Nav: Font-Stagger Animation auf Logo + Links
- [ ] Nav: Dropdown oeffnet mit Overshoot-Ease
- [ ] Nav: Mobile Sheet toggle + drag-to-scroll
- [ ] Archive: Film-Negativ Canvas-Wipe auf Hover
- [ ] Archive: BW-Items haben korrekten Filter
- [ ] Archive: Lightbox oeffnet, Pfeile + Swipe + Keyboard funktionieren
- [ ] Archive: ScrollTrigger staggered reveal
- [ ] Projekt: Layout-Switch (0→1→2→3) mit Flip-Animation
- [ ] Projekt: Sequence Counter aktualisiert
- [ ] Projekt: Info-Text SplitText Reveal
- [ ] Projekt: Lightbox in Overview-Layout
- [ ] About: WebGL Shader Graustufen-Maske (Desktop)
- [ ] About: Greeting reveal Animation
- [ ] About: Accordion Sections expand/collapse
- [ ] About: Copy-to-Clipboard auf Kontaktdaten
- [ ] About: Italy Time Clock
- [ ] Cursor: Custom Cursor folgt Maus, vergroessert auf Links
- [ ] Grain/Dust Overlays auf allen Seiten
- [ ] Page Transitions zwischen Seiten
- [ ] Mobile: Alle Breakpoints (991px, 767px)
- [ ] Performance: Keine doppelten jQuery/Webflow.js Konflikte
- [ ] CMS: Neues Projekt anlegen → Template rendert korrekt
- [ ] CMS: Archivbild hinzufuegen mit BW-Toggle
- [ ] CMS: Hero-Bilder tauschen

---

## Zusammenfassung Aufwand

| Phase | Was | Aufwand |
|-------|-----|--------|
| 1 | CMS Collections | Klein |
| 2 | Designer Layout-Aufbau | **Gross** — alle Seiten nachbauen mit exakten Klassen |
| 3 | Code bereinigen | Mittel — 4 kritische Aenderungen |
| 4 | Custom Code einbinden | Klein — Copy-paste + Asset Upload |
| 5 | CMS Bindings | Mittel — besonders der BW-Switch Workaround |
| 6 | Testen | **Gross** — viele Interaktionen die brechen koennen |

**Groesster Aufwand:** Phase 2 (Designer) und Phase 6 (Testen).
Die Animationen selbst bleiben alle erhalten — sie laufen als Custom Code.
