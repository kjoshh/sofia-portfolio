# Code-Audit — Sofia Portfolio

Vollständiger Code-Audit aller HTML-Seiten, JS-Dateien und CSS. Geprüft auf: Bugs, toter Code, Redundanzen, Performance, Wartbarkeit, Konsistenz, Accessibility, Sicherheit.

**Datum:** 2026-03-24 (Update: 2026-03-26)
**Geprüft:** 5 HTML-Dateien, 9 JS-Dateien, 1 CSS-Datei (2668 Zeilen), ~3661 Zeilen JS

---

# OFFEN

## Bugs & Memory Leaks

| # | Schwere | Datei | Zeile | Beschreibung |
|---|---------|-------|-------|--------------|
| B12 | Kritisch | `js/about.js` | 99–247 | **WebGL-Ressourcen werden nie freigegeben.** Shader, Program und Buffer haben keinen Cleanup — `gl.deleteShader()`, `gl.deleteProgram()`, `gl.deleteBuffer()` fehlen komplett. GPU-Speicher bleibt bei wiederholten Seitenbesuchen belegt. Fix: Cleanup-Funktion in `beforeunload` / `visibilitychange`. |
| B15 | Mittel | `js/project.js` | 26–27 | **Division-by-Zero-Risiko.** `(availH - gap * (rows - 1)) / rows` — wenn `rows` 0 ist (bei `imgCount === 0`), entsteht Division durch Null. Fix: Guard-Clause `if (imgCount === 0) return;`. |
| B16 | Mittel | `js/mob-sheet.js` | 27–99 | **GSAP-Timeline-Cleanup fehlt.** Beim schnellen Öffnen/Schließen des Mobile-Sheets werden neue Timelines erstellt, ohne vorherige komplett zu killen. Kann zu Animation-Glitches führen. Fix: `.kill()` vor neuem Timeline-Start. |

## Performance

| # | Schwere | Datei | Beschreibung |
|---|---------|-------|--------------|
| P8 | Mittel | `css/custom.css` | **Kein `prefers-reduced-motion`.** Grain-Animation (`grain 2.5s steps(1) infinite`), `mobile-pill-breathe` und `aboutHintPulse` laufen auch für User die reduzierte Bewegung bevorzugen. Fix: `@media (prefers-reduced-motion: reduce) { .grain::after, .mob-pill, .about-hint { animation: none; } }` |
| P9 | Niedrig | `js/index.js` | 968–973 | **Canvas-Resize löst doppelten Reflow aus.** `canvas.width` und `canvas.height` werden sequentiell gesetzt — zwei synchrone Reflows statt einem. Fix: In `requestAnimationFrame` wrappen oder Werte erst sammeln. |
| P10 | Niedrig | `js/index.js` | 900–905 | **Image-Preload ignoriert Fehler still.** `img.onerror = resolve` — bei fehlgeschlagenem Hero-Image startet Animation mit gebrochenem Layout. Fix: Mindestens loggen, optional Fallback-Bild. |

## CSS-Qualität

| # | Schwere | Datei | Beschreibung |
|---|---------|-------|--------------|
| C10 | Mittel | `css/custom.css` | **25+ `!important`-Deklarationen.** Zeilen 7, 43, 428, 452, 468–470, 474, 497, 559–560, 573, 794, 854, 1128–1129, 1151, 1310–1313 u.a. Führt zu Specificity-Wars und erschwert Wartung. Fix: Schrittweise durch höhere Spezifität oder bessere Selektoren ersetzen. |

## SEO & Meta

| # | Schwere | Datei | Beschreibung |
|---|---------|-------|--------------|
| M1 | Hoch | alle HTML | **Fehlende `<meta name="description">`.** Keine der 5 Seiten hat eine Meta-Description. Google zeigt keinen sinnvollen Snippet-Text an. Fix: Individuelle Description pro Seite. |
| M2 | Mittel | alle HTML | **Fehlende Open-Graph- und Twitter-Card-Tags.** Kein `og:title`, `og:description`, `og:image`, `og:url`. Social-Media-Shares zeigen keine Rich-Previews. Fix: OG + Twitter-Card Meta-Tags pro Seite. |
| M3 | Niedrig | alle HTML | **Fehlender Manifest-Link.** `/favicon/site.webmanifest` existiert, ist aber in keiner Seite verlinkt. Fix: `<link rel="manifest" href="favicon/site.webmanifest">` in alle `<head>`-Bereiche. |

## HTML-Struktur

| # | Schwere | Datei | Beschreibung |
|---|---------|-------|--------------|
| H6 | Niedrig | alle HTML | **Scripts ohne `defer`.** Externe Skripte (GSAP, Matter.js, eigene JS) laden synchron und blockieren Rendering. Fix: `defer` auf alle Script-Tags (nicht `async` wegen Abhängigkeiten). |
| H7 | Niedrig | `about.html` | 138 | **Fehlender Mailto-Fallback.** E-Mail nur per JS-Copy (`data-copy`) nutzbar. Ohne JavaScript keine Interaktion möglich. Fix: `<a href="mailto:...">` als Fallback. |
| H8 | Niedrig | diverse HTML | **Inkonsistente Nav-Struktur.** `index.html` hat flache Nav, `hard-coded.html` und `forgetting-dreams.html` haben extra `<div class="header">`-Wrapper + `pro-nav`-Klasse. Unterschiedliche DOM-Tiefe erschwert CSS-Wartung. |

---

# ERLEDIGT

## Bugs & Fehler

| #    | Datei                   | Zeile    | Beschreibung                                                                 |
|------|-------------------------|----------|------------------------------------------------------------------------------|
| B1   | `js/transition.js`      | 29–47    | ✅ Transition-Links werden doppelt gebunden.                                  |
| B2   | `js/project.js`         | 56       | ✅ `isMobileLenis` einmal gesetzt, nie aktualisiert. (Mitigiert)              |
| B3   | `js/project.js`         | 44       | ✅ `cursor` Element referenziert, existiert nicht im HTML.                    |
| B4   | `js/index.js`           | 10       | ✅ `location.reload()` bei Breakpoint-Wechsel.                               |
| B5   | `js/about.js`           | 11       | ✅ WebGL auf Touch-Geräten übersprungen.                                      |
| B6   | `index.html`            | 27       | ✅ Nav-Star inline `opacity: 0` — inline style + ID entfernt, CSS-Fallback.  |
| B7   | `index.html`            | —        | ✅ Kein Favicon.                                                              |
| B8   | `hard-coded.html`       | 21       | ✅ Lenis Version 1.1.9 inkonsistent — vereinheitlicht.                        |
| B9   | `css/custom.css`        | 2017     | ✅ `transition: all 200ms ease` auf `.mob-proj-title` — gefixt.              |
| B10  | `js/nav.js`             | 326      | ✅ Navigation delay 1000ms ist zu lang.                                       |
| B11  | `js/about.js`           | 85–89    | ✅ WebGL Shader ohne Fehlerprüfung.                                           |
| B13  | `js/index.js`           | 729–752  | ✅ Race Condition im Rain-Generator — Timer-Handles gespeichert + clearRainTimers() bei Resize/Flush. |
| B14  | `js/index.js`           | 731–752  | ✅ setTimeout in Loop ohne Referenz — mit B13 zusammen gefixt.                |
| Q2   | `js/index.js`   ✅   | **Resize-Handler dupliziert.** Desktop-Resize (Z.278–359) und Mobile-Resize (Z.1172–1233) haben identische Cleanup-Logik: debris entfernen, fall-pairs entfernen, reveal-pairs entfernen, tweens killen, state resetten. |
| K4   | HTML           ✅    | **Body-Klasse inkonsistent.** `index.html` hat `class="landing-page"`, `about.html` hat `class="body about-page"`, `archive.html` hat `class="body archive-page"`, Projektseiten nur `class="body"`. Inkonsistente Benennung. |
| K9   | JS              ✅    | **`isMobile` wird unterschiedlich definiert:** `index.js`: `window.matchMedia('(max-width: 991px)').matches` (einmalig), `project.js`: `const isMobile = () => window.innerWidth <= 991` (Funktion), `about.js`: `window.innerWidth <= 991` (inline), `archive.js`: `window.matchMedia('(max-width: 991px)').matches` (einmalig). Vier verschiedene Patterns. |


## Redundanz & Code-Qualität

| #    | Datei              | Beschreibung                                                                 |
|------|--------------------|------------------------------------------------------------------------------|
| Q4   | `js/project.js` + `js/archive.js` | ✅ Lightbox-Code extrahiert nach `js/lightbox.js` als Shared Module.  |
| Q5   | CSS                | ✅ Dust/Grain Pseudo-Elemente dedupliziert (~40 Zeilen gespart).              |
| Q1   | `js/index.js`    ✅  | **~600 Zeilen duplizierte Physics-Logik.** Desktop (Z.228–727) und Mobile (Z.733–1233) haben nahezu identischen Matter.js-Code: `buildWalls()`, `swapTo()`, flush-Mechanik, resize-Handler. Unterschiede nur in Gravity, Größenverhältnissen und Touch vs. Hover. Sollte zu einer parametrisierten Klasse refactored werden. |
| K5   | HTML       ✅        | **Lenis wird in `<head>` geladen** (hard-coded.html:21, forgetting-dreams.html:15) aber in `archive.html` und `about.html` vor dem jeweiligen Script im `<body>`. Render-blocking Script im Head ist unnötig. |
| K8   | HTML      ✅ skip weil nicht wichtig         | **GSAP ScrollTrigger nur auf `archive.html` geladen**, aber `gsap.registerPlugin(ScrollTrigger)` wird nur dort gebraucht. Korrekt, aber im Code nicht kommentiert — sieht aus wie ein Versehen. |
| E3   | Mittel   ✅ skip for now weil later webflow  | **index.js aufteilen.** 1356 Zeilen mit Desktop + Mobile Physics, Dust-Particles, Hover-Effekte, Reveal-Animation. Schwer wartbar. Mindestens 3 Module: `physics.js`, `dust.js`, `reveal.js`. |
| E6   | Niedrig  ✅ nicht geeignet für webflow(bundlen)  | **CDN-Dependencies lokal bundlen oder SRI-Hashes hinzufügen.** GSAP, Matter.js, Lenis, SplitText — 4 externe Dependencies ohne Integrity-Checks. |


## Toter / Ungenutzter Code

| #    | Datei / Bereich    | Beschreibung                          |
|------|--------------------|----------------------------------------|
| D1   | `js/cursor.js`     | ✅ Entfernt.                            |
| D2   | `js/landing.js`    | ✅ Entfernt.                            |
| D3   | `js/projects.js`   | ✅ Entfernt.                            |
| D4   | `css/custom.css`   | ✅ `.cursor`-Styles entfernt.            |
| D5   | `css/custom.css`   | ✅ `.about-contact` entfernt.            |
| D6   | `css/custom.css`   | ✅ `.mobile-menu-toggle` entfernt.       |
| D7   | `css/custom.css`   | ✅ `.imgbg` + `.sofianamebg` entfernt.   |
| D8   | `css/custom.css`   | ✅ `.nav-bg` entfernt.                   |
| D9   | `css/custom.css`   | ✅ `.nav-logo-morph` etc. entfernt.      |
| D10  | `css/custom.css`   | ✅ `.sofianame` entfernt.                |
| D11  | `css/custom.css`   | ✅ `.zzz` entfernt.                      |
| D12  | `css/custom.css`   | ✅ `.wrapedu.active` entfernt.           |
| D13  | `css/custom.css`   | ✅ `.backdrop` entfernt.                 |
| D14  | `css/custom.css`   | ✅ `.arrow-container` entfernt.          |
| D15  | `css/custom.css`   | ✅ `.arrow` entfernt.                    |
| D16  | `css/custom.css`   | ✅ `.para` entfernt.                     |
| D17  | `css/custom.css`   | ✅ `.mob-sheet-dots` entfernt.           |
| D18  | `css/custom.css`   | ✅ `.mob-sheet-grid--few` entfernt.      |
| D19  | `js/nav.js`        | ✅ `dropdownItems` + `.nav-dropdown-item` entfernt. |
| D20  | `js/project.js`    | ✅ `hoverPreview`-System entfernt.       |
| D21  | `js/project.js`    | ✅ `isTablet()` entfernt.                |
| D22  | `js/project.js`    | ✅ `clearProNavActive()` entfernt.       |

## Konsistenz-Probleme

| #    | Beschreibung                          |
|------|----------------------------------------|
| K1   | ✅ Lenis-Versionen vereinheitlicht.     |
| K2   | ✅ Favicon auf `index.html` hinzugefügt. |
| K3   | ✅ `view-transition` Meta-Tag ergänzt.  |
| K5   | ✅ Lenis aus `<head>` in `<body>` verschoben (hard-coded.html, forgetting-dreams.html). |
| K6   | ✅ (skip) SplitText von Webflow-CDN — wird beim Webflow-Umzug automatisch gelöst. |
| K7   | ✅ Doppeltes Logo + Split-Swap-Effekt entfernt. Nur 1 Logo auf allen Seiten. |
| E5   | ✅ Niedrig | **z-index Scale eingeführt.** `:root`-Block mit 9 Variablen: `--z-content(10)`, `--z-page-fade(90)`, `--z-corner(100)`, `--z-particles(9996)`, `--z-scene(9997)`, `--z-nav(9998)`, `--z-lightbox(10000)`, `--z-transition(10001)`, `--z-grain(10002)`. Numerische Werte beibehalten für 100% visuelle Parität. |
| Q8   | `css/custom.css`   | viele        | ✅ **z-index Scale eingeführt.** 9 CSS Custom Properties auf `:root` definiert (`--z-content` bis `--z-grain`). 19 globale z-index-Werte ersetzt, 36 lokale (komponenten-interne) als rohe Zahlen belassen. Siehe E5. |




## Performance

| #    | Beschreibung                          |
|------|----------------------------------------|
| P1   | ✅ (skip) Matter.js Engine läuft permanent — akzeptiert.  |
| P2   | ✅ (skip) Dust-Particles Canvas läuft permanent — akzeptiert. |
| P3   | ✅ (skip) 7 separate `resize` Event-Listener — akzeptiert. |
| P4   | ✅ `will-change` auf statischen Elementen entfernt. |
| P5   | ✅ (skip) Grain-Overlay 300% Breite/Höhe — akzeptiert. |
| P6   | ✅ `mousemove` Listener entfernt (mit D20). |
| P7   | ✅ (skip) `fullHeight()` erzwingt Reflow — akzeptiert. |

## Accessibility

| #    | Beschreibung                          |
|------|----------------------------------------|
| A1   | ✅ (skip) Keine `lang`-Attribute — nur Eigennamen, kein Fließtext. |
| A2   | ✅ `<main>` Landmark auf allen 5 Seiten ergänzt. |
| A3   | ✅ (skip) Bilder `alt=""` — korrekt für dekorative Kunstbilder. |
| A4   | ✅ Focus-Trap in Lightbox + `role="dialog"` + `aria-modal`. |
| A5   | ✅ Akkordeon ARIA + Keyboard auf `.about-section-title`. |
| A6   | ✅ Mob-Sheet Menu-Toggle ARIA + Keyboard. |
| A7   | ✅ Projects-Dropdown ARIA + Keyboard. |

## Sicherheit

| #    | Beschreibung                          |
|------|----------------------------------------|
| S2   | ✅ `navigator.clipboard.writeText()` — Fehlerbehandlung verbessert. |
| S3   | ✅ SRI-Hashes auf alle CDN-Script-Tags. |
| S4   | ✅ `window.location = href` → `window.location.href`. |

## HTML-Probleme

| #    | Beschreibung                          |
|------|----------------------------------------|
| H1   | ✅ `<div class="nav-bg">` entfernt.     |
| H2   | ✅ Inline `<style>` nach custom.css verschoben. |
| H3   | ✅ Duplizierter `<style>` Block entfernt. |
| H4   | ✅ Seq-Counter Totals — JS setzt Wert dynamisch. |
| H5   | ✅ Doppeltes `id="italy-time"` — won't fix, IDs unique. |

## CSS-Probleme

| #    | Beschreibung                          |
|------|----------------------------------------|
| C1   | ✅ `z-index: 2147483647` auf `.cursor` entfernt (mit D4). |
| C2   | ✅ `z-index: 9999999` auf `.lb-overlay` korrigiert. |
| C3   | ✅ `pointer-events: all` → `auto`. |
| C4   | ✅ Doppeltes `cursor: pointer` entfernt. |
| C5   | ✅ `89.89px` gerundet. |
| C6   | ✅ `.wrapin.index` mit `!important` entfernt. |
| C7   | ✅ Toter `.mobile-menu-toggle` Selektor entfernt. |
| C8   | ✅ `.main-nav.mobile-open` Block entfernt. |
| C9   | ✅ Lenis CSS-Overrides — won't fix, ~300 Bytes. |



### Magic Numbers

| #    | Datei              | Zeilen       | Beschreibung                                                                                             |
|------|--------------------|--------------|---------------------------------------------------------------------------------------------------------|
| Q6   | `js/index.js`    ✅ skip weil gerade nicht wichtig  | viele        | **Zahlreiche unbeschriebene Konstanten:** `FLOOR_PAD_RATIO = 0.05` vs. `0.03` (mobile), `sleepThreshold: 300` vs. `30` vs. `60`, `density: 0.004` vs. `0.002` vs. `0.003`, `fr.width * 0.007`, `thick = 80` vs. `60`, Flush-Threshold `40` Swaps. Keine Benennung, schwer nachvollziehbar. |
| Q7   | `js/project.js`  ✅ skip weil gerade nicht wichtig  | 15, 31–37    | **Layout-Offsets als Magic Numbers:** `88` (nav height), `110` (pro-nav clearance), `120` (mobile bottom), `89.89px` (padding). Diese sollten benannte Konstanten sein. |




## Architektur-Empfehlungen

| #    | Beschreibung                          |
|------|----------------------------------------|
| E2   | ✅ Lightbox als Shared Module extrahiert. |
| E4   | ✅ Toter Code aufgeräumt (~250 Zeilen CSS, 3 JS-Dateien). |

## Vorherige Issues (erledigt)

R10, R11, FD1, HC1, A2, AB1, FD2, HC2, I1, A1, A4, AB3, AB5, I2, I3, I5, AB4, FD3, HC3, G1, G2, A3, A5, A6, A7, AB2, AB6, AB7, AB8, AB9, I4, I6, I7, I8, I9, I10, I13, FD4, FD5, HC4, HC5, HC6.

---

