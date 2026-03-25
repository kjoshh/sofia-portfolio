# Code-Audit — Sofia Portfolio

Vollständiger Code-Audit aller HTML-Seiten, JS-Dateien und CSS. Geprüft auf: Bugs, toter Code, Redundanzen, Performance, Wartbarkeit, Konsistenz, Accessibility, Sicherheit.

**Datum:** 2026-03-24
**Geprüft:** 5 HTML-Dateien, 9 JS-Dateien, 1 CSS-Datei (2668 Zeilen), ~3661 Zeilen JS

---

# OFFEN

## Bugs & Fehler

| #    | Datei                   | Zeile    | Beschreibung                                                                                                                                                                                                                 |
|------|-------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| B6   | `index.html`            | 27       | ✅ **Nav-Star hat inline `opacity: 0`** — inline style + ID entfernt, nutzt jetzt die Klasse wie alle anderen Seiten. CSS-Fallback gegeben.                                                      |

## Redundanz & Code-Qualität

### Massive Code-Duplikation

| #    | Datei              | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Q1   | `js/index.js`      | **~600 Zeilen duplizierte Physics-Logik.** Desktop (Z.228–727) und Mobile (Z.733–1233) haben nahezu identischen Matter.js-Code: `buildWalls()`, `swapTo()`, flush-Mechanik, resize-Handler. Unterschiede nur in Gravity, Größenverhältnissen und Touch vs. Hover. Sollte zu einer parametrisierten Klasse refactored werden. |
| Q2   | `js/index.js`      | **Resize-Handler dupliziert.** Desktop-Resize (Z.278–359) und Mobile-Resize (Z.1172–1233) haben identische Cleanup-Logik: debris entfernen, fall-pairs entfernen, reveal-pairs entfernen, tweens killen, state resetten. |
| Q3   | Alle HTML-Dateien   | **Nav/Mob-Sheet HTML 5x identisch kopiert.** Die Desktop-Nav (`.main-nav`), Dropdown (`.nav-dropdown`), und Mobile-Sheet (`.mob-sheet`) Block sind in allen 5 HTML-Dateien identisch. Jede Änderung (neues Projekt, neuer Link) muss in 5 Dateien synchron geändert werden. |
| Q4   | `js/project.js` + `js/archive.js` | **Lightbox-Code ist dupliziert.** Gleiche open/close/prev/next/swipe Logik in beiden Dateien. Nur die Quelle der Bild-URLs unterscheidet sich (`data-full` vs. `img.src`). |
| Q5   | CSS                | **Dust/Grain Pseudo-Element dreifach dupliziert.** `.main-nav::before/::after`, `.pro-nav::before/::after`, `.mob-sheet::before/::after`, `.mob-proj-tabs::before/::after` — identisches Styling (dust.jpg + grain.jpg overlays) 4x kopiert. |

### Magic Numbers

| #    | Datei              | Zeilen       | Beschreibung                                                                                             |
|------|--------------------|--------------|---------------------------------------------------------------------------------------------------------|
| Q6   | `js/index.js`      | viele        | **Zahlreiche unbeschriebene Konstanten:** `FLOOR_PAD_RATIO = 0.05` vs. `0.03` (mobile), `sleepThreshold: 300` vs. `30` vs. `60`, `density: 0.004` vs. `0.002` vs. `0.003`, `fr.width * 0.007`, `thick = 80` vs. `60`, Flush-Threshold `40` Swaps. Keine Benennung, schwer nachvollziehbar. |
| Q7   | `js/project.js`    | 15, 31–37    | **Layout-Offsets als Magic Numbers:** `88` (nav height), `110` (pro-nav clearance), `120` (mobile bottom), `89.89px` (padding). Diese sollten benannte Konstanten sein. |
| Q8   | `css/custom.css`   | viele        | **`z-index`-Chaos:** Werte reichen von `-1` bis `2147483647` (INT_MAX). Genutzte Werte: 0, 1, 2, 3, 5, 10, 11, 20, 90, 100, 9996, 9997, 9998, 9999, 9999999, 10001, 10002, 2147483647. Kein System, kein z-index-scale. |

## Konsistenz-Probleme

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| K4   | HTML               | **Body-Klasse inkonsistent.** `index.html` hat `class="landing-page"`, `about.html` hat `class="body about-page"`, `archive.html` hat `class="body archive-page"`, Projektseiten nur `class="body"`. Inkonsistente Benennung. |
| K5   | HTML               | **Lenis wird in `<head>` geladen** (hard-coded.html:21, forgetting-dreams.html:15) aber in `archive.html` und `about.html` vor dem jeweiligen Script im `<body>`. Render-blocking Script im Head ist unnötig. |
| K6   | HTML               | **SplitText wird von einem Drittanbieter-CDN geladen:** `cdn.prod.website-files.com` (Webflow CDN). Dieses CDN ist nicht unter eigener Kontrolle und könnte jederzeit offline gehen oder sich ändern. Alle anderen GSAP-Plugins kommen von `cdnjs.cloudflare.com`. |
| K7   | HTML               | **`index.html` hat nur 1 Logo-Image** in der Nav (Z.24), alle anderen Seiten haben 2 (top + bottom). Der Split-Logo-Effekt in `nav.js` klont `top` als Workaround, aber `bottom` wird auf `display: none` gesetzt, obwohl es gar nicht existiert auf der Index-Seite. |
| K8   | HTML               | **GSAP ScrollTrigger nur auf `archive.html` geladen**, aber `gsap.registerPlugin(ScrollTrigger)` wird nur dort gebraucht. Korrekt, aber im Code nicht kommentiert — sieht aus wie ein Versehen. |
| K9   | JS                 | **`isMobile` wird unterschiedlich definiert:** `index.js`: `window.matchMedia('(max-width: 991px)').matches` (einmalig), `project.js`: `const isMobile = () => window.innerWidth <= 991` (Funktion), `about.js`: `window.innerWidth <= 991` (inline), `archive.js`: `window.matchMedia('(max-width: 991px)').matches` (einmalig). Vier verschiedene Patterns. |

## Performance

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| P1   | `js/index.js`      | **Matter.js Engine läuft permanent.** `Runner.run(runner, engine)` — die Physics-Engine läuft in einer Endlosschleife, auch wenn alle Körper schlafen. Sollte pausiert werden wenn keine aktiven Körper vorhanden sind. |
| P2   | `js/index.js`      | **Dust-Particles Canvas läuft permanent.** 65 Partikel werden jeden Frame gerendert (Desktop), unabhängig davon ob die Landing-Page sichtbar ist. `visibilitychange` pausiert, aber Tab-Wechsel auf andere Pages (about, archive) pausiert nicht — dust canvas existiert nur auf index.html. |
| P3   | `js/index.js`      | **7 separate `resize` Event-Listener** auf `window` (invalidateMetrics, desktop-resize-handler, mobile-resize-handler, dust-canvas-resize, plus project.js adds 2 more). Keine sind debounced (außer die timer-basierten). |
| P5   | `css/custom.css`   | **Grain-Overlay: 300% Breite/Höhe Element.** `.grain::after` hat `width: 300%; height: 300%` — ein riesiges Element, das der Browser rendern muss. Auf Retina-Displays sind das 6x viewport-Pixel. |
| P7   | `js/nav.js`        | **`fullHeight()` erzwingt Reflow.** Z.181–187: `dropdown.style.maxHeight = 'none'; const h = dropdown.scrollHeight; dropdown.style.maxHeight = prev;` — forced layout/reflow bei jedem Dropdown-Open. |

## Accessibility

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A1   | Alle HTML           | **Keine `lang`-Attribute auf Content.** Seiten haben `lang="en"`, aber der About-Text ist Englisch und Ausstellungsorte sind Italienisch. Mixed-language content ohne `lang`-Tags auf Absätzen. |
| A2   | `index.html`        | **Kein `<main>` Landmark.** Kein semantisches `<main>` Element — Screenreader haben keinen primären Content-Bereich. Gleiches Problem auf allen Seiten. |
| A3   | Alle HTML           | **Bilder ohne aussagekräftige `alt`-Texte.** Archive: alle 42 Bilder haben `alt=""`. Projekt-Bilder: alle haben `alt=""`. Frame-Bilder auf Index: `alt=""`. |
| A4   | Lightbox            | **Keine Keyboard-Trap-Prevention.** Lightbox öffnet sich, aber Focus wird nicht in die Lightbox gesetzt. Tab-Taste navigiert zu unsichtbaren Elementen hinter dem Overlay. |
| A5   | `about.html`        | **Akkordeon ohne ARIA.** `.about-section-title` ist ein `<span>` mit Click-Handler — kein `role="button"`, kein `aria-expanded`, kein `aria-controls`. Nicht mit Tastatur bedienbar. |
| A6   | Mob-Sheet           | **Menu-Toggle ohne ARIA.** `#mobSheetToggle` ist ein `<div>` mit Click-Handler — kein `role="button"`, kein `aria-expanded`. |
| A7   | Nav                 | **Projects-Dropdown ohne ARIA.** `.nav-dropdown-wrap` öffnet Dropdown auf Hover — kein `aria-haspopup`, kein `aria-expanded`, nicht per Tastatur erreichbar. |

## Sicherheit & Best Practices

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| S1   | `about.html`       | **Telefonnummer im HTML.** `+39 3356093992` und E-Mail stehen als Klartext im HTML. Spam-Bots können diese scrapen. Üblich bei Portfolio-Seiten, aber erwähnenswert. |
| S3   | Alle HTML           | **CDN-Dependencies ohne `integrity` (SRI).** GSAP, Lenis, Matter.js, SplitText werden von CDNs geladen ohne `integrity`-Hashes. Bei CDN-Compromise könnte Schadcode injiziert werden. |

## HTML-spezifische Probleme

| #    | Datei                     | Beschreibung                                                                                                         |
|------|---------------------------|----------------------------------------------------------------------------------------------------------------------|
| H4   | Projektseiten             | **Seq-Counter Totals hardcoded** — `<span class="seq-counter-total">19</span>` in HTML, obwohl JS den Wert setzt (project.js:724). HTML und JS müssen synchron gehalten werden. |
| H5   | `about.html`              | **Doppeltes `id="italy-time"`.** Desktop hat `id="italy-time"` (Z.137), Mobile hat `id="italy-time-mob"` (Z.158). IDs sind unique, aber die Desktop-Version ist auf Mobile unsichtbar statt nicht vorhanden. |

## CSS-spezifische Probleme

| #    | Zeile(n)        | Beschreibung                                                                                                                                                   |
|------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| C9   | 457–471         | **Lenis CSS-Overrides** für Klassen die Lenis automatisch setzt — korrekt, aber nur auf Seiten mit Lenis relevant. Auf `index.html` (kein Lenis) sind diese Regeln unnötig geladen. |

## Ungenutzter JS-Code

| #    | Datei              | Zeile        | Beschreibung                                                                                             |
|------|--------------------|--------------|---------------------------------------------------------------------------------------------------------|
| D19  | `js/nav.js`        | 124          | **`dropdownItems` werden gequeried und animiert, aber die Klasse `.nav-dropdown-item` existiert in keinem HTML.** Die Arrays `dropdownItems` sind immer leer — die `gsap.to(dropdownItems, ...)` Aufrufe (Z.242, 281) animieren nichts. |

## Architektur-Empfehlungen

| #    | Priorität  | Beschreibung                                                                                                                                                   |
|------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1   | Hoch       | **Nav/Footer als Include-System.** Nav + Mob-Sheet sind in 5 HTML-Dateien identisch kopiert (~70 Zeilen pro Datei). Jedes neue Projekt erfordert 5 manuelle Edits. Ein einfaches JS-Include (`fetch + insertAdjacentHTML`) oder Build-Step würde dies lösen. |
| E2   | Hoch       | **Lightbox als Shared Module.** `project.js` und `archive.js` haben jeweils ~70 Zeilen identischen Lightbox-Code. Sollte ein `js/lightbox.js` werden. |
| E3   | Mittel     | **index.js aufteilen.** 1356 Zeilen mit Desktop + Mobile Physics, Dust-Particles, Hover-Effekte, Reveal-Animation. Schwer wartbar. Mindestens 3 Module: `physics.js`, `dust.js`, `reveal.js`. |
| E5   | Niedrig    | **z-index Scale einführen.** Definiere CSS Custom Properties: `--z-base: 1; --z-nav: 100; --z-overlay: 1000; --z-lightbox: 2000; --z-grain: 3000; --z-transition: 4000`. Aktuell wild verteilt von 1 bis 2147483647. |
| E6   | Niedrig    | **CDN-Dependencies lokal bundlen oder SRI-Hashes hinzufügen.** GSAP, Matter.js, Lenis, SplitText — 4 externe Dependencies ohne Integrity-Checks. |

## Vorherige Issues (noch offen)

| #    | Beschreibung                                                             |
|------|--------------------------------------------------------------------------|
| R9   | Overview-Grid: kein Tablet-Zwischenschritt (5 → 2 Spalten direkt)        |
| I11  | ~400→600 Zeilen duplizierte Physics (Desktop/Mobile) → siehe Q1          |
| I12  | Magic Numbers ohne benannte Konstanten → siehe Q6                        |

---

# ERLEDIGT

## Bugs & Fehler (kritisch)

| #    | Datei                   | Zeile    | Beschreibung                                                                                                                                                                                                                 |
|------|-------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| B1   | `js/transition.js`      | 29–47    | ✅ **Transition-Links werden doppelt gebunden.** |
| B2   | `js/project.js`         | 56       | ✅ **`isMobileLenis` wird einmal beim Laden gesetzt und nie aktualisiert.** (Mitigiert: Variable umbenannt.) |
| B3   | `js/project.js`         | 44       | ✅ **`cursor` Element wird referenziert, existiert aber nicht im HTML.** TypeError bei mouseenter auf `.imgholder`. |
| B4   | `js/index.js`           | 10       | ✅ **`location.reload()` bei Breakpoint-Wechsel.** |
| B5   | `js/about.js`           | 11       | ✅ **WebGL wird auf Touch-Geräten komplett übersprungen.** |

## Bugs & Fehler (hoch)

| #    | Datei                   | Zeile    | Beschreibung                                                                                                                                                                                                                 |
|------|-------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| B7   | `index.html`            | —        | ✅ **Kein Favicon.** |
| B8   | `hard-coded.html`       | 21       | ✅ **Lenis Version 1.1.9** inkonsistent — vereinheitlicht. |
| B9   | `css/custom.css`        | 2017     | ✅ **`transition: all 200ms ease`** auf `.mob-proj-title` — gefixt. |
| B10  | `js/nav.js`             | 326      | ✅ **Navigation delay 1000ms ist zu lang.** |
| B11  | `js/about.js`           | 85–89    | ✅ **WebGL Shader kompiliert ohne Fehlerprüfung.** |

## Toter / Ungenutzter Code

### Ungenutzte JS-Dateien

| #    | Datei              | Beschreibung                                                                                                   |
|------|--------------------|----------------------------------------------------------------------------------------------------------------|
| D1   | `js/cursor.js`     | ✅ Entfernt. |
| D2   | `js/landing.js`    | ✅ Entfernt. |
| D3   | `js/projects.js`   | ✅ Entfernt. |

### Toter CSS-Code

| #    | Datei              | Zeilen       | Beschreibung                          |
|------|--------------------|--------------|-----------------------------------------|
| D4   | `css/custom.css`   | 30–60        | ✅ `.cursor`-Styles entfernt.            |
| D5   | `css/custom.css`   | 658–663      | ✅ `.about-contact` entfernt.            |
| D6   | `css/custom.css`   | 798–800      | ✅ `.mobile-menu-toggle` entfernt.       |
| D7   | `css/custom.css`   | 814–826      | ✅ `.imgbg` + `.sofianamebg` entfernt.   |
| D8   | `css/custom.css`   | 1500–1502    | ✅ `.nav-bg` entfernt.                   |
| D9   | `css/custom.css`   | 1609–1659    | ✅ `.nav-logo-morph` etc. entfernt.      |
| D10  | `css/custom.css`   | 1712–1718    | ✅ `.sofianame` entfernt.                |
| D11  | `css/custom.css`   | 1744–1748    | ✅ `.zzz` entfernt.                      |
| D12  | `css/custom.css`   | 1769–1773    | ✅ `.wrapedu.active` entfernt.           |
| D13  | `css/custom.css`   | 1775–1784    | ✅ `.backdrop` entfernt.                 |
| D14  | `css/custom.css`   | 1803–1816    | ✅ `.arrow-container` entfernt.          |
| D15  | `css/custom.css`   | 1818–1826    | ✅ `.arrow` entfernt.                    |
| D16  | `css/custom.css`   | 1828–1837    | ✅ `.para` entfernt.                     |
| D17  | `css/custom.css`   | 1092–1094    | ✅ `.mob-sheet-dots` entfernt.           |
| D18  | `css/custom.css`   | 1134–1145    | ✅ `.mob-sheet-grid--few` entfernt.      |

### Ungenutzter JS-Code

| #    | Datei              | Zeile        | Beschreibung                          |
|------|--------------------|--------------|-----------------------------------------|
| D20  | `js/project.js`    | 551–564      | ✅ `hoverPreview`-System entfernt.       |
| D21  | `js/project.js`    | 96            | ✅ `isTablet()` entfernt.                |
| D22  | `js/project.js`    | 593–599      | ✅ `clearProNavActive()` entfernt.       |

## Konsistenz-Probleme

| #    | Beschreibung                          |
|------|----------------------------------------|
| K1   | ✅ Lenis-Versionen vereinheitlicht.     |
| K2   | ✅ Favicon auf `index.html` hinzugefügt. |
| K3   | ✅ `view-transition` Meta-Tag ergänzt.  |

## Performance

| #    | Beschreibung                          |
|------|----------------------------------------|
| P4   | ✅ `will-change` auf statischen Elementen entfernt. |
| P6   | ✅ `mousemove` Listener entfernt (mit D20). |

## Sicherheit

| #    | Beschreibung                          |
|------|----------------------------------------|
| S2   | ✅ `navigator.clipboard.writeText()` — Fehlerbehandlung verbessert. |
| S4   | ✅ `window.location = href` zu `window.location.href` korrigiert. |

## HTML-Probleme

| #    | Beschreibung                          |
|------|----------------------------------------|
| H1   | ✅ `<div class="nav-bg">` entfernt.     |
| H2   | ✅ Inline `<style>` nach custom.css verschoben. |
| H3   | ✅ Duplizierter `<style>` Block entfernt. |

## CSS-Probleme

| #    | Beschreibung                          |
|------|----------------------------------------|
| C1   | ✅ `z-index: 2147483647` auf `.cursor` entfernt (mit D4). |
| C2   | ✅ `z-index: 9999999` auf `.lb-overlay` korrigiert. |
| C3   | ✅ `pointer-events: all` → `auto` korrigiert. |
| C4   | ✅ Doppeltes `cursor: pointer` entfernt. |
| C5   | ✅ `89.89px` gerundet. |
| C6   | ✅ `.wrapin.index` mit `!important` entfernt. |
| C7   | ✅ Toter `.mobile-menu-toggle` Selektor entfernt. |
| C8   | ✅ `.main-nav.mobile-open` Block entfernt. |

## Architektur-Empfehlungen

| #    | Beschreibung                          |
|------|----------------------------------------|
| E4   | ✅ Toter Code aufgeräumt (~250 Zeilen CSS, 3 JS-Dateien, tote JS-Referenzen). |

## Vorherige Issues (erledigt)

R10, R11, FD1, HC1, A2, AB1, FD2, HC2, I1, A1, A4, AB3, AB5, I2, I3, I5, AB4, FD3, HC3, G1, G2, A3, A5, A6, A7, AB2, AB6, AB7, AB8, AB9, I4, I6, I7, I8, I9, I10, I13, FD4, FD5, HC4, HC5, HC6.

---

## ZUSAMMENFASSUNG

| Kategorie        | Offen | Erledigt |
|------------------|-------|----------|
| Bugs & Fehler    | 1     | 10       |
| Toter Code       | 1     | 21       |
| Redundanz        | 8     | 0        |
| Konsistenz       | 6     | 3        |
| Performance      | 5     | 2        |
| Accessibility    | 7     | 0        |
| Sicherheit       | 2     | 2        |
| HTML-Probleme    | 2     | 3        |
| CSS-Probleme     | 1     | 8        |
| Architektur      | 5     | 1        |
| Vorherige Issues | 3     | 40+      |
| **Gesamt**       | **~41** | **~90+** |

## 11. LIVE-TEST ERGEBNISSE (Screenshots)

### Desktop (1440×900)

| Seite          | Status | Anmerkungen                                                                                     |
|----------------|--------|-------------------------------------------------------------------------------------------------|
| Landing        | OK     | Frame + Letters rendern korrekt. Nav-Pill sichtbar. Dust-Partikel sichtbar.                      |
| About          | OK     | Hero-Bild + Greeting + Bio laden. WebGL-Effekt nicht getestet (braucht Mouse-Interaction).       |
| Archive        | OK     | 6-Spalten Grid. Bilder laden lazy. Einige Spalten rechts initial leer (lazy-loading sichtbar).   |
| Hard-Coded     | OK     | Film-Roll centered, Bilder clustered. Pro-Nav transparent. Entrance-Reveal funktioniert.          |

### Visuelle Auffälligkeiten

| #    | Seite    | Beschreibung                                                                                     |
|------|----------|--------------------------------------------------------------------------------------------------|
| V1   | Landing  | Letters "CAR" sichtbar oberhalb des Frames — partieller Rain-State im Screenshot (normal, da zeitabhängig). |
| V2   | Archive  | Rechte Spalte hat Lücken — normal bei Masonry-Layout mit unterschiedlichen Bildhöhen.            |
| V3   | Project  | Pro-Nav ist im Screenshot transparent (layout-0 state) — korrekt.                                |
