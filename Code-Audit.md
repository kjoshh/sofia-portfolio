# Code-Audit — Sofia Portfolio

Vollständiger Code-Audit aller HTML-Seiten, JS-Dateien und CSS. Geprüft auf: Bugs, toter Code, Redundanzen, Performance, Wartbarkeit, Konsistenz, Accessibility, Sicherheit.

**Datum:** 2026-03-24
**Geprüft:** 5 HTML-Dateien, 9 JS-Dateien, 1 CSS-Datei (2668 Zeilen), ~3661 Zeilen JS

---

## 1. BUGS & FEHLER

### 1.1 Kritisch (Funktionsfehler)

| #    | Datei                   | Zeile    | Beschreibung                                                                                                                                                                                                                 |
|------|-------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| B1   | `js/transition.js`      | 29–47    | **Transition-Links werden doppelt gebunden.** `transition.js` bindet `click` auf *alle* `<a>` Elemente. `nav.js` bindet ebenfalls `click` auf Dropdown-Zellen (Z.308–329) mit eigenem `e.preventDefault()` + `setTimeout`. Bei Klick auf einen Dropdown-Link feuern BEIDE Handler — der `transition.js`-Handler navigiert nach 1000ms, der `nav.js`-Handler ebenfalls nach 1000ms → Race Condition, doppelte Navigation. |
| B2   | `js/project.js`         | 56       | **`isMobileLenis` wird einmal beim Laden gesetzt und nie aktualisiert.** `const isMobileLenis = window.matchMedia('(max-width: 991px)').matches;` — bei Resize über den Breakpoint bleibt Lenis im falschen Modus. Gleiches Problem in `archive.js:2` (`const isMobile`). |
| B3   | `js/project.js`         | 44       | **`cursor` Element wird referenziert, existiert aber nicht im HTML.** `const cursor = document.getElementById("cursor");` — kein Element mit `id="cursor"` in `hard-coded.html` oder `forgetting-dreams.html`. `cursor.classList.add("hover")` wirft TypeError bei mouseenter auf `.imgholder`. |
| B4   | `js/index.js`           | 10       | **`location.reload()` bei Breakpoint-Wechsel.** `mobileQuery.addEventListener('change', () => { location.reload(); })` — forcierter Page-Reload wenn Nutzer das Fenster über 991px resized. Disruptiv und unnötig, wenn stattdessen Layout angepasst wird. |
| B5   | `js/about.js`           | 11       | **WebGL wird auf Touch-Geräten komplett übersprungen.** `if ('ontouchstart' in window || window.innerWidth < 768) return;` — viele Laptops mit Touchscreen (Surface, MacBook) haben `ontouchstart` → kein WebGL-Effekt trotz Desktop. |

### 1.2 Hoch (Visuell / UX-relevant)

| #    | Datei                   | Zeile    | Beschreibung                                                                                                                                                                                                                 |
|------|-------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| B6   | `index.html`            | 27       | **Nav-Star hat inline `opacity: 0`** aber wird nur auf Desktop via JS animiert (`navStarSep`). Wenn JS fehlschlägt, ist der Star permanent unsichtbar. Kein CSS-Fallback.                                                      |
| B7   | `index.html`            | —        | **Kein Favicon.** `index.html` hat keine `<link rel="shortcut icon">` — alle anderen Seiten haben Favicon-Links. Browser zeigt 404 für `/favicon.ico`.                                                                        |
| B8   | `hard-coded.html`       | 21       | **Lenis Version 1.1.9** geladen, aber `archive.html` und `about.html` nutzen **1.1.14**. Inkonsistente Library-Versionen können zu unterschiedlichem Scroll-Verhalten führen. Betrifft auch `forgetting-dreams.html:15`.        |
| B9   | `css/custom.css`        | 2017     | **`transition: all 200ms ease`** auf `.mob-proj-title` — verstößt gegen die eigene Regel "Never `transition-all`". Animiert potentiell Layout-Properties.                                                                      |
| B10  | `js/nav.js`             | 326      | **Navigation delay 1000ms ist zu lang.** User klickt einen Dropdown-Link und wartet 1 volle Sekunde bevor navigiert wird. Der Transition-Overlay braucht nur 500ms — 500ms wären ausreichend.                                    |
| B11  | `js/about.js`           | 85–89    | **WebGL Shader kompiliert ohne Fehlerprüfung.** `compileShader()` prüft nicht `gl.getShaderParameter(s, gl.COMPILE_STATUS)` — bei Shader-Fehler gibt es keinen Hinweis, nur ein schwarzes Bild.                                  |

---

## 2. TOTER / UNGENUTZTER CODE

### 2.1 Ungenutzte JS-Dateien

| #    | Datei              | Beschreibung                                                                                                   |
|------|--------------------|----------------------------------------------------------------------------------------------------------------|
| D1   | `js/cursor.js`     | **Existiert als Datei, wird von keiner HTML-Seite eingebunden.** CSS für `.cursor` (custom.css:30–60) existiert noch, aber kein `<div id="cursor">` im HTML und kein `<script src="js/cursor.js">`. Komplett tot. |
| D2   | `js/landing.js`    | **Existiert als Datei, wird von keiner HTML-Seite eingebunden.** Referenziert `#landingName` — Element existiert in keiner HTML. War vermutlich ein Experiment (CLAUDE.md erwähnt "landing page experiments"). |
| D3   | `js/projects.js`   | **Existiert als Datei, wird von keiner HTML-Seite eingebunden.** Referenziert `#proj-list`, `.proj-item`, `.proj-img-wrap` — keine dieser Klassen/IDs existiert im aktuellen HTML. |

### 2.2 Toter CSS-Code

| #    | Datei              | Zeilen       | Beschreibung                                                                                             |
|------|--------------------|--------------|---------------------------------------------------------------------------------------------------------|
| D4   | `css/custom.css`   | 30–60        | **`.cursor`-Styles** — kein cursor-Element im HTML, cursor.js nicht eingebunden. 30 Zeilen toter CSS.    |
| D5   | `css/custom.css`   | 658–663      | **`.about-contact`** — Klasse existiert in keiner HTML-Datei. Toter Selektor.                            |
| D6   | `css/custom.css`   | 798–800      | **`.mobile-menu-toggle`** — Klasse existiert in keiner HTML-Datei. Desktop-Hide + Mobile-Show-Styles (880–888) ebenfalls tot. |
| D7   | `css/custom.css`   | 814–826      | **`.imgbg` + `.sofianamebg`** innerhalb Mobile-Block — diese Klassen werden in keiner HTML verwendet. Auch Desktop-Versionen (1698–1710) sind tot. |
| D8   | `css/custom.css`   | 1500–1502    | **`.nav-bg { display: none; }`** — kein `.nav-bg` Element existiert (wurde wohl mal entfernt). Nur in `index.html:20` vorhanden, aber das Element ist leer und unsichtbar. |
| D9   | `css/custom.css`   | 1609–1659    | **`.nav-logo-morph`, `.nl-tile`, `.nl-front`, `.nl-back`** — 50 Zeilen CSS für einen Morph-Effekt, der nicht mehr verwendet wird. Keine dieser Klassen existiert im HTML. |
| D10  | `css/custom.css`   | 1712–1718    | **`.sofianame`** — toter Selektor, nicht im HTML.                                                        |
| D11  | `css/custom.css`   | 1744–1748    | **`.zzz`** — toter Selektor, nicht im HTML.                                                              |
| D12  | `css/custom.css`   | 1769–1773    | **`.wrapedu.active`** — toter Selektor, diese Klasse wird nie per JS hinzugefügt.                        |
| D13  | `css/custom.css`   | 1775–1784    | **`.backdrop`** — Element existiert in keiner HTML-Datei. Auch der zugehörige Mobile-Override (1849–1854) ist tot. |
| D14  | `css/custom.css`   | 1803–1816    | **`.arrow-container`** — toter Selektor, nicht im HTML.                                                  |
| D15  | `css/custom.css`   | 1818–1826    | **`.arrow`** — toter Selektor, nicht im HTML.                                                            |
| D16  | `css/custom.css`   | 1828–1837    | **`.para`** — toter Selektor, nicht im HTML.                                                             |
| D17  | `css/custom.css`   | 1092–1094    | **`.mob-sheet.is-open .mob-sheet-dots`** — `.mob-sheet-dots` existiert nicht im HTML.                     |
| D18  | `css/custom.css`   | 1134–1145    | **`.mob-sheet-grid--few`** — Klasse wird nie angewendet (weder im HTML noch per JS).                     |

### 2.3 Ungenutzter JS-Code

| #    | Datei              | Zeile        | Beschreibung                                                                                             |
|------|--------------------|--------------|---------------------------------------------------------------------------------------------------------|
| D19  | `js/nav.js`        | 124          | **`dropdownItems` werden gequeried und animiert, aber die Klasse `.nav-dropdown-item` existiert in keinem HTML.** Die Arrays `dropdownItems` sind immer leer — die `gsap.to(dropdownItems, ...)` Aufrufe (Z.242, 281) animieren nichts. |
| D20  | `js/project.js`    | 551–564      | **`hoverPreview`-System** — `#hover-preview` wird positioniert und `mousemove` verfolgt, aber `hoverPreviewImg.src` wird nie gesetzt und `visibility` nie auf `visible` gesetzt. Das gesamte Hover-Preview-System ist nicht funktional. |
| D21  | `js/project.js`    | 96            | **`isTablet()` gibt immer `false` zurück.** `const isTablet = () => false;` — der Kommentar sagt "tablet now uses mobile nav", aber die Funktion wird noch in Bedingungen aufgerufen (Z.329). |
| D22  | `js/project.js`    | 593–599      | **`clearProNavActive()` wird nie aufgerufen.** Definiert aber nie verwendet.                               |

---

## 3. REDUNDANZ & CODE-QUALITÄT

### 3.1 Massive Code-Duplikation

| #    | Datei              | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Q1   | `js/index.js`      | **~600 Zeilen duplizierte Physics-Logik.** Desktop (Z.228–727) und Mobile (Z.733–1233) haben nahezu identischen Matter.js-Code: `buildWalls()`, `swapTo()`, flush-Mechanik, resize-Handler. Unterschiede nur in Gravity, Größenverhältnissen und Touch vs. Hover. Sollte zu einer parametrisierten Klasse refactored werden. |
| Q2   | `js/index.js`      | **Resize-Handler dupliziert.** Desktop-Resize (Z.278–359) und Mobile-Resize (Z.1172–1233) haben identische Cleanup-Logik: debris entfernen, fall-pairs entfernen, reveal-pairs entfernen, tweens killen, state resetten. |
| Q3   | Alle HTML-Dateien   | **Nav/Mob-Sheet HTML 5x identisch kopiert.** Die Desktop-Nav (`.main-nav`), Dropdown (`.nav-dropdown`), und Mobile-Sheet (`.mob-sheet`) Block sind in allen 5 HTML-Dateien identisch. Jede Änderung (neues Projekt, neuer Link) muss in 5 Dateien synchron geändert werden. |
| Q4   | `js/project.js` + `js/archive.js` | **Lightbox-Code ist dupliziert.** Gleiche open/close/prev/next/swipe Logik in beiden Dateien. Nur die Quelle der Bild-URLs unterscheidet sich (`data-full` vs. `img.src`). |
| Q5   | CSS                | **Dust/Grain Pseudo-Element dreifach dupliziert.** `.main-nav::before/::after`, `.pro-nav::before/::after`, `.mob-sheet::before/::after`, `.mob-proj-tabs::before/::after` — identisches Styling (dust.jpg + grain.jpg overlays) 4x kopiert. |

### 3.2 Magic Numbers

| #    | Datei              | Zeilen       | Beschreibung                                                                                             |
|------|--------------------|--------------|---------------------------------------------------------------------------------------------------------|
| Q6   | `js/index.js`      | viele        | **Zahlreiche unbeschriebene Konstanten:** `FLOOR_PAD_RATIO = 0.05` vs. `0.03` (mobile), `sleepThreshold: 300` vs. `30` vs. `60`, `density: 0.004` vs. `0.002` vs. `0.003`, `fr.width * 0.007`, `thick = 80` vs. `60`, Flush-Threshold `40` Swaps. Keine Benennung, schwer nachvollziehbar. |
| Q7   | `js/project.js`    | 15, 31–37    | **Layout-Offsets als Magic Numbers:** `88` (nav height), `110` (pro-nav clearance), `120` (mobile bottom), `89.89px` (padding). Diese sollten benannte Konstanten sein. |
| Q8   | `css/custom.css`   | viele        | **`z-index`-Chaos:** Werte reichen von `-1` bis `2147483647` (INT_MAX). Genutzte Werte: 0, 1, 2, 3, 5, 10, 11, 20, 90, 100, 9996, 9997, 9998, 9999, 9999999, 10001, 10002, 2147483647. Kein System, kein z-index-scale. |

---

## 4. KONSISTENZ-PROBLEME

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| K1   | HTML               | **Lenis-Versionen inkonsistent.** `hard-coded.html` + `forgetting-dreams.html` laden `lenis@1.1.9`, `archive.html` + `about.html` laden `lenis@1.1.14`. Sollte einheitlich die neueste Version sein. |
| K2   | HTML               | **Favicon fehlt auf `index.html`.** Alle anderen 4 Seiten haben `<link href="favicon/favicon.ico">` — nur `index.html` nicht. |
| K3   | HTML               | **`view-transition` Meta-Tag fehlt** auf `hard-coded.html` und `forgetting-dreams.html`. Ist auf `index.html`, `about.html`, `archive.html` vorhanden. |
| K4   | HTML               | **Body-Klasse inkonsistent.** `index.html` hat `class="landing-page"`, `about.html` hat `class="body about-page"`, `archive.html` hat `class="body archive-page"`, Projektseiten nur `class="body"`. Inkonsistente Benennung. |
| K5   | HTML               | **Lenis wird in `<head>` geladen** (hard-coded.html:21, forgetting-dreams.html:15) aber in `archive.html` und `about.html` vor dem jeweiligen Script im `<body>`. Render-blocking Script im Head ist unnötig. |
| K6   | HTML               | **SplitText wird von einem Drittanbieter-CDN geladen:** `cdn.prod.website-files.com` (Webflow CDN). Dieses CDN ist nicht unter eigener Kontrolle und könnte jederzeit offline gehen oder sich ändern. Alle anderen GSAP-Plugins kommen von `cdnjs.cloudflare.com`. |
| K7   | HTML               | **`index.html` hat nur 1 Logo-Image** in der Nav (Z.24), alle anderen Seiten haben 2 (top + bottom). Der Split-Logo-Effekt in `nav.js` klont `top` als Workaround, aber `bottom` wird auf `display: none` gesetzt, obwohl es gar nicht existiert auf der Index-Seite. |
| K8   | HTML               | **GSAP ScrollTrigger nur auf `archive.html` geladen**, aber `gsap.registerPlugin(ScrollTrigger)` wird nur dort gebraucht. Korrekt, aber im Code nicht kommentiert — sieht aus wie ein Versehen. |
| K9   | JS                 | **`isMobile` wird unterschiedlich definiert:** `index.js`: `window.matchMedia('(max-width: 991px)').matches` (einmalig), `project.js`: `const isMobile = () => window.innerWidth <= 991` (Funktion), `about.js`: `window.innerWidth <= 991` (inline), `archive.js`: `window.matchMedia('(max-width: 991px)').matches` (einmalig). Vier verschiedene Patterns. |

---

## 5. PERFORMANCE

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| P1   | `js/index.js`      | **Matter.js Engine läuft permanent.** `Runner.run(runner, engine)` — die Physics-Engine läuft in einer Endlosschleife, auch wenn alle Körper schlafen. Sollte pausiert werden wenn keine aktiven Körper vorhanden sind. |
| P2   | `js/index.js`      | **Dust-Particles Canvas läuft permanent.** 65 Partikel werden jeden Frame gerendert (Desktop), unabhängig davon ob die Landing-Page sichtbar ist. `visibilitychange` pausiert, aber Tab-Wechsel auf andere Pages (about, archive) pausiert nicht — dust canvas existiert nur auf index.html. |
| P3   | `js/index.js`      | **7 separate `resize` Event-Listener** auf `window` (invalidateMetrics, desktop-resize-handler, mobile-resize-handler, dust-canvas-resize, plus project.js adds 2 more). Keine sind debounced (außer die timer-basierten). |
| P4   | `css/custom.css`   | **`will-change` auf statische Elemente.** `.gall3ry { will-change: transform }` (Z.294) — die Gallery selbst wird nicht transformiert, nur ihre Kinder. Verschwendet GPU-Memory. `.desk-nav-cell { will-change: transform, opacity }` ist ebenfalls dauerhaft statt nur während Animation. |
| P5   | `css/custom.css`   | **Grain-Overlay: 300% Breite/Höhe Element.** `.grain::after` hat `width: 300%; height: 300%` — ein riesiges Element, das der Browser rendern muss. Auf Retina-Displays sind das 6x viewport-Pixel. |
| P6   | `js/project.js`    | **`mousemove` Listener immer aktiv.** Z.560–564: `window.addEventListener('mousemove', ...)` — feuert auf jede Mausbewegung, prüft `activeLayout !== 'layout-1-gall3ry'` und returnt. Sollte nur in Layout-1 aktiv sein. |
| P7   | `js/nav.js`        | **`fullHeight()` erzwingt Reflow.** Z.181–187: `dropdown.style.maxHeight = 'none'; const h = dropdown.scrollHeight; dropdown.style.maxHeight = prev;` — forced layout/reflow bei jedem Dropdown-Open. |

---

## 6. ACCESSIBILITY

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A1   | Alle HTML           | **Keine `lang`-Attribute auf Content.** Seiten haben `lang="en"`, aber der About-Text ist Englisch und Ausstellungsorte sind Italienisch. Mixed-language content ohne `lang`-Tags auf Absätzen. |
| A2   | `index.html`        | **Kein `<main>` Landmark.** Kein semantisches `<main>` Element — Screenreader haben keinen primären Content-Bereich. Gleiches Problem auf allen Seiten. |
| A3   | Alle HTML           | **Bilder ohne aussagekräftige `alt`-Texte.** Archive: alle 42 Bilder haben `alt=""`. Projekt-Bilder: alle haben `alt=""`. Frame-Bilder auf Index: `alt=""`. |
| A4   | Lightbox            | **Keine Keyboard-Trap-Prevention.** Lightbox öffnet sich, aber Focus wird nicht in die Lightbox gesetzt. Tab-Taste navigiert zu unsichtbaren Elementen hinter dem Overlay. |
| A5   | `about.html`        | **Akkordeon ohne ARIA.** `.about-section-title` ist ein `<span>` mit Click-Handler — kein `role="button"`, kein `aria-expanded`, kein `aria-controls`. Nicht mit Tastatur bedienbar. |
| A6   | Mob-Sheet           | **Menu-Toggle ohne ARIA.** `#mobSheetToggle` ist ein `<div>` mit Click-Handler — kein `role="button"`, kein `aria-expanded`. |
| A7   | Nav                 | **Projects-Dropdown ohne ARIA.** `.nav-dropdown-wrap` öffnet Dropdown auf Hover — kein `aria-haspopup`, kein `aria-expanded`, nicht per Tastatur erreichbar. |

---

## 7. SICHERHEIT & BEST PRACTICES

| #    | Bereich            | Beschreibung                                                                                                                                                   |
|------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| S1   | `about.html`       | **Telefonnummer im HTML.** `+39 3356093992` und E-Mail stehen als Klartext im HTML. Spam-Bots können diese scrapen. Üblich bei Portfolio-Seiten, aber erwähnenswert. |
| S2   | `js/about.js`      | **`navigator.clipboard.writeText()` ohne Permissions-Check.** Z.533: In manchen Browsern (insbes. Firefox ohne User-Gesture) wirft dies einen Fehler. Der `.catch()` handler zeigt "Copy failed", aber es gibt kein Fallback (z.B. `document.execCommand`). |
| S3   | Alle HTML           | **CDN-Dependencies ohne `integrity` (SRI).** GSAP, Lenis, Matter.js, SplitText werden von CDNs geladen ohne `integrity`-Hashes. Bei CDN-Compromise könnte Schadcode injiziert werden. |
| S4   | `js/transition.js`  | **`window.location = href` statt `window.location.href = href`.** Z.43 — funktioniert, ist aber unüblich und weniger explizit. |

---

## 8. HTML-SPEZIFISCHE PROBLEME

| #    | Datei                     | Beschreibung                                                                                                         |
|------|---------------------------|----------------------------------------------------------------------------------------------------------------------|
| H1   | `index.html`              | **`<div class="nav-bg"></div>` (Z.20)** — leeres Element, CSS setzt `display: none`. Kann entfernt werden.             |
| H2   | `hard-coded.html`         | **`<style>` im `<head>` (Z.11–15)** — inline CSS für `.info-para visibility`. Sollte in `custom.css` stehen.          |
| H3   | `forgetting-dreams.html`  | **Identischer `<style>` Block (Z.10)** — wie H2, ebenfalls inline. Duplizierung.                                      |
| H4   | Projektseiten             | **Seq-Counter Totals hardcoded** — `<span class="seq-counter-total">19</span>` in HTML, obwohl JS den Wert setzt (project.js:724). HTML und JS müssen synchron gehalten werden. |
| H5   | `about.html`              | **Doppeltes `id="italy-time"`.** Desktop hat `id="italy-time"` (Z.137), Mobile hat `id="italy-time-mob"` (Z.158). IDs sind unique, aber die Desktop-Version ist auf Mobile unsichtbar statt nicht vorhanden. |

---

## 9. CSS-SPEZIFISCHE PROBLEME

| #    | Zeile(n)        | Beschreibung                                                                                                                                                   |
|------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| C1   | 39              | **`z-index: 2147483647`** auf `.cursor` — MAX_INT als z-index. Cursor-Element existiert nicht mal, aber das ist trotzdem ein Anti-Pattern. |
| C2   | 120             | **`z-index: 9999999`** auf `.lb-overlay` — Lightbox. Keine Notwendigkeit für einen 7-stelligen z-index. |
| C3   | 131             | **`pointer-events: all`** — sollte `pointer-events: auto` sein. `all` ist kein valider Wert (wird als `auto` interpretiert in den meisten Browsern, ist aber technisch falsch laut Spec). |
| C4   | 670–678         | **`cursor: pointer` doppelt** auf `.about-section-title` (Z.676 + Z.678). Copy-paste Fehler. |
| C5   | 397             | **`padding-bottom: 89.89px`** auf `.layout-2-gall3ry` — ungewöhnlich präziser Wert, vermutlich von Webflow übernommen. Sollte gerundet werden (90px). Gleiches bei `padding: 88px 89.89px 110px` (Z.348). |
| C6   | 854–858         | **Mobile-spezifische CSS innerhalb Desktop-Regeln.** `.wrapin.index` hat `!important` — diese Klasse wird nie im HTML verwendet.                               |
| C7   | 896–901         | **Complex Mobile-Menu Selectors.** `.nav-menu>*:not(.logo-link):not(.mobile-menu-toggle)` — selektiert Elemente basierend auf `.mobile-menu-toggle`, einer Klasse die nicht im HTML existiert. Toter Selektor-Teil. |
| C8   | 909–917         | **`.main-nav.mobile-open` Styles** — `.mobile-open` wird nie per JS hinzugefügt. Gesamter Block (909–947) ist tot. |
| C9   | 457–471         | **Lenis CSS-Overrides** für Klassen die Lenis automatisch setzt — korrekt, aber nur auf Seiten mit Lenis relevant. Auf `index.html` (kein Lenis) sind diese Regeln unnötig geladen. |

---

## 10. ARCHITEKTUR-EMPFEHLUNGEN

| #    | Priorität  | Beschreibung                                                                                                                                                   |
|------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1   | Hoch       | **Nav/Footer als Include-System.** Nav + Mob-Sheet sind in 5 HTML-Dateien identisch kopiert (~70 Zeilen pro Datei). Jedes neue Projekt erfordert 5 manuelle Edits. Ein einfaches JS-Include (`fetch + insertAdjacentHTML`) oder Build-Step würde dies lösen. |
| E2   | Hoch       | **Lightbox als Shared Module.** `project.js` und `archive.js` haben jeweils ~70 Zeilen identischen Lightbox-Code. Sollte ein `js/lightbox.js` werden. |
| E3   | Mittel     | **index.js aufteilen.** 1356 Zeilen mit Desktop + Mobile Physics, Dust-Particles, Hover-Effekte, Reveal-Animation. Schwer wartbar. Mindestens 3 Module: `physics.js`, `dust.js`, `reveal.js`. |
| E4   | Mittel     | **Toter Code aufräumen.** ~250 Zeilen toter CSS (D4–D18), 3 ungenutzte JS-Dateien (D1–D3), diverse tote JS-Referenzen (D19–D22). Entfernen reduziert Dateigrößen und Verwirrung. |
| E5   | Niedrig    | **z-index Scale einführen.** Definiere CSS Custom Properties: `--z-base: 1; --z-nav: 100; --z-overlay: 1000; --z-lightbox: 2000; --z-grain: 3000; --z-transition: 4000`. Aktuell wild verteilt von 1 bis 2147483647. |
| E6   | Niedrig    | **CDN-Dependencies lokal bundlen oder SRI-Hashes hinzufügen.** GSAP, Matter.js, Lenis, SplitText — 4 externe Dependencies ohne Integrity-Checks. |

---

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

---

## ZUSAMMENFASSUNG

| Kategorie                | Anzahl |
|--------------------------|--------|
| Bugs & Fehler (kritisch) | 5      |
| Bugs & Fehler (hoch)     | 6      |
| Toter CSS-Code           | 15     |
| Tote JS-Dateien          | 3      |
| Toter JS-Code            | 4      |
| Code-Duplikation         | 5      |
| Konsistenz-Probleme      | 9      |
| Performance-Issues       | 7      |
| Accessibility-Issues     | 7      |
| Sicherheit               | 4      |
| HTML-Probleme            | 5      |
| CSS-Probleme             | 9      |
| **Gesamt**               | **79** |

### Top 5 Prioritäten

1. **B3** — `cursor` TypeError auf Projektseiten fixen (null reference)
2. **B1** — Doppelte Click-Handler auf Dropdown-Links (race condition)
3. **D1–D3** — 3 ungenutzte JS-Dateien entfernen
4. **D4–D18** — ~250 Zeilen toten CSS entfernen
5. **K1–K2** — Lenis-Versionen vereinheitlichen + Favicon auf index.html

---

## Vorherige Issues (aus altem Audit)

### Noch offen

| #    | Status   | Beschreibung                                                             |
|------|----------|--------------------------------------------------------------------------|
| R9   | Offen    | Overview-Grid: kein Tablet-Zwischenschritt (5 → 2 Spalten direkt)        |
| R10  | Erledigt | Grain auf kleinen Phones deaktiviert (`@media max-width: 479px`)         |
| R11  | Offen    | `projects.js` Mouse-Listener auf Mobile (Datei wird aber nicht mehr geladen — erledigt durch D3) |
| I11  | Offen    | ~400→600 Zeilen duplizierte Physics (Desktop/Mobile) → siehe Q1          |
| I12  | Offen    | Magic Numbers ohne benannte Konstanten → siehe Q6                        |

### Erledigt (32 aus vorherigem Audit)

FD1, HC1, A2, AB1, FD2, HC2, I1, A1, A4, AB3, AB5, I2, I3, I5, AB4, FD3, HC3, G1, G2, A3, A5, A6, A7, AB2, AB6, AB7, AB8, AB9, I4, I6, I7, I8, I9, I10, I13, FD4, FD5, HC4, HC5, HC6.
