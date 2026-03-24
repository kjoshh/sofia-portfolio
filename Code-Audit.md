# Site Audit

Code-Audit aller HTML-Seiten, JS und CSS — Bugs, toter Code, Redundanzen.

---

## Gesamtübersicht nach Schwere

### Kritisch / Hoch

| #   | Seite             | Typ        | Beschreibung                                    | Aufwand |
|-----|-------------------|------------|-------------------------------------------------|---------|
| ~~FD1~~ | Forgetting Dreams | Bug    | ~~Doppelte `id="seqCounter"` — zweiter Counter tot~~ | ✅ done |
| ~~HC1~~ | Hard-Coded        | Bug    | ~~Doppelte `id="seqCounter"` — zweiter Counter tot~~ | ✅ done |
| ~~A2~~  | Archive           | Bug    | ~~`transition.js` doppelt → doppelte Navigation~~    | ✅ done |
| ~~AB1~~ | About             | Bug    | ~~`transition.js` doppelt → doppelte Navigation~~    | ✅ done |
| ~~FD2~~ | Forgetting Dreams | Bug    | ~~`transition.js` doppelt → doppelte Navigation~~    | ✅ done |
| ~~HC2~~ | Hard-Coded        | Bug    | ~~`transition.js` doppelt → doppelte Navigation~~    | ✅ done |
| ~~I1~~  | Index         | Bug        | ~~Doppelte Nav bei Dropdown-Klick (nav.js + transition.js) — fix: nav.js triggert Overlay selbst + stopImmediatePropagation~~ | ✅ done |

### Mittel

| #   | Seite             | Typ           | Beschreibung                                    | Aufwand |
|-----|-------------------|---------------|-------------------------------------------------|---------|
| ~~A1~~  | Archive           | Bug           | ~~`ScrollTrigger.min.js` doppelt geladen~~           | ✅ done   |
| ~~A4~~  | Archive           | Bug           | ~~CSS `transition` kollidiert mit GSAP-Animation~~   | ✅ done   |
| ~~AB3~~ | About             | Bug           | ~~WebGL `revealDone = true` widerspricht Reveal-Gating~~ | ✅ done |
| ~~AB5~~ | About             | Bug           | ~~Clipboard-API ohne `.catch()` Handler~~            | ✅ done |
| ~~I2~~  | Index             | Bug           | ~~Mobile Flush: Sofia-Buchstaben fliegen seitlich raus~~ | ✅ done |
| ~~I3~~  | Index             | Bug           | ~~`sceneEl` vor Deklaration referenziert (TDZ-Risiko)~~ | ✅ done |
| ~~I5~~  | Index             | Performance   | ~~`getLetterMetrics()` 60x/s → Layout-Recalc pro Frame~~ | ✅ done |
| ~~AB4~~ | About             | Performance   | ~~Lenis RAF-Loop läuft endlos (kein Visibility-Check)~~ | ✅ done |
| FD3 | Forgetting Dreams | Accessibility | 10 Bilder ohne `alt`-Attribut                    | 2 min   |
| HC3 | Hard-Coded        | Accessibility | 19 Bilder ohne `alt`-Attribut                    | 2 min   |

### Niedrig / Trivial

| #    | Seite             | Typ           | Beschreibung                                    | Aufwand |
|------|-------------------|---------------|-------------------------------------------------|---------|
| G1   | Global            | Cleanup       | `<meta name="generator" content="Webflow">` überall | 2 min |
| G2   | Global            | Bug           | `cursor: default` auf Lightbox-Buttons statt `pointer` | 1 min |
| A3   | Archive           | Toter Code    | `.archive-grid-item.visible` wird nie gesetzt    | 1 min   |
| A5   | Archive           | Toter Code    | 6× `--rot: 0deg` Regeln — redundant mit Fallback | 1 min  |
| A6   | Archive           | Toter Code    | `.lb-progress` ausgeblendet aber JS berechnet    | 2 min   |
| A7   | Archive           | Redundanz     | Hardcoded Counter-Total `42` wird sofort überschrieben | 1 min |
| AB2  | About             | Toter Code    | `page-enter` Inline-Style wird nie aktiviert     | 1 min   |
| AB6  | About             | Fragil        | Bild-Dateiname mit Leerzeichen                   | 2 min   |
| AB7  | About             | Minor Bug     | `contentSection` ohne Null-Check                 | 1 min   |
| AB8  | About (Global)    | Toter Code    | `js/cursor.js` wird nirgends geladen             | 1 min   |
| AB9  | About             | Kosmetisch    | `setInterval` für Uhr wird nie aufgeräumt        | 2 min   |
| ~~I4~~   | Index             | Bug           | ~~Variable Shadowing in `getLetterMetrics()`~~       | ✅ done |
| I6   | Index             | Performance   | Dust-Canvas rAF läuft endlos ohne Visibility-Check | 3 min |
| I7   | Index             | Toter Code    | nav.js: `w-nav-link`/`w-nav` Selektoren → ~80 Zeilen tot | 2 min |
| I8   | Index             | Toter Code    | `css/landing.css` (272 Zeilen) von keiner Seite geladen | 1 min |
| I9   | Index             | Toter Code    | `object-fit: contain` auf Div wirkungslos        | 1 min   |
| I10  | Index             | Cleanup       | Recovery-Kommentarblock in custom.css             | 1 min   |
| I13  | Index             | Cleanup       | Kommentierter Code in nav.js                     | 1 min   |
| FD4  | Forgetting Dreams | Accessibility | Film-Roll `alt=""` — als dekorativ markiert      | 1 min   |
| FD5  | Forgetting Dreams | Kosmetisch    | Doppelte Leerzeichen in HTML-Attributen          | 2 min   |
| HC4  | Hard-Coded        | Accessibility | Film-Roll `alt=""` — als dekorativ markiert      | 1 min   |
| HC5  | Hard-Coded        | Bug           | `hover-preview` mit `src=""` → Phantom-Request   | 1 min   |
| HC6  | Hard-Coded        | Kosmetisch    | Trailing Spaces in CSS-Klassen                   | 1 min   |

### Optional (Refactoring)

| #    | Seite | Typ     | Beschreibung                                    | Aufwand |
|------|-------|---------|-------------------------------------------------|---------|
| I11  | Index | Quality | ~400 Zeilen near-duplicate Physics (Desktop/Mobile) | 30+ min |
| I12  | Index | Quality | Magic Numbers ohne benannte Konstanten           | 10 min  |

---

## Globale Issues

*(Betrifft mehrere/alle Seiten)*

### G1. `<meta content="Webflow" name="generator">`
Die Seite wird nicht mehr von Webflow generiert. Überall entfernen.

### G2. `cursor: default` auf Lightbox-Buttons
**Datei:** `css/custom.css` Zeile 149 — `.lb-btn { cursor: default; }` → `cursor: pointer`.

---

## Archive (`archive.html`)

Dateien: `archive.html`, `js/archive.js`, `css/custom.css`

### A1. ScrollTrigger.min.js doppelt geladen — Bug
**Datei:** `archive.html` Zeile 152–153
Exakt dasselbe Script zweimal. **Fix:** Zweite Zeile löschen.

### A2. transition.js doppelt geladen — Bug (Hoch)
**Datei:** `archive.html` Zeile 17 (`<head>`) und Zeile 158 (`</body>`)
IIFE bindet sich zweimal → jeder Link-Klick feuert doppelt.
**Fix:** Eine Einbindung entfernen (nur im `<head>` behalten).

### A3. CSS `.archive-grid-item.visible` nie verwendet — Toter Code
**Datei:** `css/custom.css` Zeile 277–280
Kein JS setzt `.visible` — Reveal läuft über GSAP inline Styles. **Fix:** Regel entfernen.

### A4. CSS Transition kollidiert mit GSAP — Bug
**Datei:** `css/custom.css` Zeile 267–275
`translateY(10px)` + `transition` auf `.archive-grid-item` kollidiert mit GSAP (`scale` + `opacity`). Die `translateY(10px)` wird nie zurückgesetzt → dauerhafter 10px Offset.
**Fix:** `transform: translateY(10px)` und `transition` entfernen, GSAP den initialen State überlassen.

### A5. `--rot` Custom Properties alle `0deg` — Toter Code
**Datei:** `css/custom.css` Zeile 243–265
Sechs `nth-child`-Regeln setzen alle `--rot: 0deg` — redundant mit `var(--rot, 0deg)` Fallback. **Fix:** Alle löschen.

### A6. `.lb-progress` unsichtbar aber JS berechnet — Toter Code
**Datei:** `css/custom.css` Zeile 134 (`display: none`), `js/archive.js` Zeile 79–80
**Fix:** Entweder sichtbar machen oder Element + JS komplett entfernen.

### A7. Hardcoded Counter-Total — Redundanz
**Datei:** `archive.html` Zeile 144 (`42`), `js/archive.js` Zeile 77 (überschreibt sofort)
**Fix:** HTML-Wert leer lassen oder `--` als Placeholder.

| #   | Typ        | Schwere | Aufwand |
|-----|------------|---------|---------|
| A1  | Bug        | Mittel  | 1 min   |
| A2  | Bug        | Hoch    | 1 min   |
| A3  | Toter Code | Niedrig | 1 min   |
| A4  | Bug        | Mittel  | 2 min   |
| A5  | Toter Code | Niedrig | 1 min   |
| A6  | Toter Code | Niedrig | 2 min   |
| A7  | Redundanz  | Niedrig | 1 min   |

---

## Index (`index.html`)

Dateien: `index.html`, `js/index.js`, `js/nav.js`, `js/transition.js`, `js/mob-sheet.js`, `css/custom.css`

### I1. Doppelte Navigation bei Dropdown-Link-Klick — Bug (Hoch)
**Dateien:** `js/transition.js` Zeile 29–45, `js/nav.js` Zeile 366–377
`transition.js` navigiert nach 1000ms, `nav.js` nach 400ms — beide feuern.
**Fix:** In nav.js `e.stopImmediatePropagation()` statt nur `e.preventDefault()`.

### I2. Mobile Flush: Sofia-Buchstaben fliegen seitlich raus — Bug (Mittel)
**Datei:** `js/index.js` Zeile 1003–1009 vs 507–524
Desktop-Flush hat `sofiaLeftWall` + `sofiaRightWall`, Mobile nur `sofiaFloor`.
**Fix:** Seitenwände auch im Mobile-Flush erstellen.

### I3. `sceneEl` vor Deklaration referenziert — Bug (Mittel)
**Datei:** `js/index.js` Zeile 74, 79 vs 700
`hoverIn()`/`hoverOut()` nutzen `sceneEl`, Deklaration erst Zeile 700 (Temporal Dead Zone Risiko).
**Fix:** `const sceneEl = document.getElementById('scene');` nach oben verschieben.

### I4. Variable Shadowing in `getLetterMetrics()` — Bug (Niedrig)
**Datei:** `js/index.js` Zeile 97, 100
`const fw` wird doppelt deklariert (outer + inner `if`). **Fix:** Inneres `const fw` löschen.

### I5. `getLetterMetrics()` bei jedem Physics-Frame — Performance
**Datei:** `js/index.js` Zeile 423, 455, 923
`getBoundingClientRect()` ~60x/s im `afterUpdate`-Callback.
**Fix:** Metrics einmal pro `afterUpdate` cachen oder globalen Cache mit Resize-Invalidierung.

### I6. Dust-Canvas rAF ohne Visibility-Check — Performance
**Datei:** `js/index.js` Zeile 1170–1255
`requestAnimationFrame(tick)` stoppt nie. **Fix:** `visibilitychange`-Listener zum Pausieren.

### I7. nav.js: Webflow-Selektoren greifen ins Leere — Toter Code
**Datei:** `js/nav.js` Zeile 90–97, 126–170
`w-nav-link`/`w-nav[data-collapse]` existieren im HTML nicht → ~80 Zeilen toter Code. **Fix:** Löschen.

### I8. Orphaned `css/landing.css` — Toter Code
272 Zeilen, von keiner HTML-Seite geladen. Überbleibsel früherer Landing-Version. **Fix:** Löschen.

### I9. `object-fit: contain` auf Div — Toter Code
**Datei:** `css/custom.css` Zeile 2255
`.frame-bg-hover` ist ein `<div>`, `object-fit` wirkt nur auf replaced elements. **Fix:** Entfernen.

### I10. Recovery-Kommentar in custom.css — Cleanup
**Datei:** `css/custom.css` Zeile 2411–2414
4-Zeilen-Kommentarblock aus Recovery-Session. **Fix:** Löschen.

### I11. ~400 Zeilen near-duplicate Physics-Code — Quality (Optional)
**Datei:** `js/index.js` Zeile 219–695 (Desktop) vs 702–1137 (Mobile)
Unterschiede nur Konfigurationswerte. **Fix:** Shared Logic in parametrisierte Funktionen extrahieren.

### I12. Magic Numbers — Quality (Optional)
`80`/`60`/`0.007`/`40`/`4000`/`0.4`/`800` etc. ohne Namen. **Fix:** Named Constants definieren.

### I13. Kommentierter Code in nav.js — Cleanup
**Datei:** `js/nav.js` Zeile 6–7. **Fix:** Optional löschen.

### Verifizierte Nicht-Probleme (Index)

| Gemeldeter Fund | Warum kein Problem |
|---|---|
| `.dusti` CSS-Klasse nicht in index.html | Wird von anderen Seiten genutzt — shared CSS |
| `js/cursor.js` nicht geladen | Global dokumentiert unter AB8 |
| `js/landing.js` nicht geladen | Orphaned File, nicht index-spezifisch |
| `js/projects.js` nicht geladen | Gleiche Situation |
| Matter.js Runner läuft endlos | Matter.js pausiert sleeping bodies automatisch, rAF throttelt im Hintergrund |

| #    | Typ         | Schwere  | Aufwand |
|------|-------------|----------|---------|
| I1   | Bug         | Hoch     | 1 min   |
| I2   | Bug         | Mittel   | 5 min   |
| I3   | Bug         | Mittel   | 1 min   |
| I4   | Bug         | Niedrig  | 1 min   |
| I5   | Performance | Mittel   | 5 min   |
| I6   | Performance | Niedrig  | 3 min   |
| I7   | Toter Code  | Niedrig  | 2 min   |
| I8   | Toter Code  | Niedrig  | 1 min   |
| I9   | Toter Code  | Trivial  | 1 min   |
| I10  | Cleanup     | Trivial  | 1 min   |
| I11  | Quality     | —        | 30+ min |
| I12  | Quality     | —        | 10 min  |
| I13  | Cleanup     | Trivial  | 1 min   |

---

## About (`about.html`)

Dateien: `about.html`, `js/about.js`, `css/custom.css`

### AB1. transition.js doppelt geladen — Bug (Hoch)
**Datei:** `about.html` Zeile 16 (`<head>`) und Zeile 172 (`</body>`)
IIFE bindet sich doppelt → doppelte Navigation.
**Fix:** `<head>`-Einbindung entfernen, nur am Ende des `<body>` behalten.

### AB2. Tote `page-enter` Inline-Style-Regel — Toter Code
**Datei:** `about.html` Zeile 15
`html.page-enter` wird nie per JS gesetzt. Referenziert auch `.bg-img`/`.cursor` die hier nicht existieren.
**Fix:** Gesamten `<style>`-Block löschen.

### AB3. WebGL `revealDone` auf `true` initialisiert — Bug (Mittel)
**Datei:** `js/about.js` Zeile 76, 79
Sofort `true` gesetzt, obwohl Entrance-Animation noch läuft → WebGL startet zu früh bei Hover.
**Fix:** Zeile 76 → `let revealDone = false;`, Zeile 79 → `window._webglRevealDone = false;`.

### AB4. Lenis RAF-Loop endlos — Performance
**Datei:** `js/about.js` Zeile 2–3
rAF-Loop pausiert nie. **Fix:** Ersetzen durch:
```js
const lenis = new Lenis();
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### AB5. Clipboard-API ohne Error Handler — Bug (Mittel)
**Datei:** `js/about.js` Zeile 525
Kein `.catch()` → bei Fehler kein Feedback.
**Fix:** `.catch(() => { rotate('Copy failed', false); })` hinzufügen.

### AB6. Bild-Dateiname mit Leerzeichen — Fragil
**Datei:** `about.html` Zeile 26 — `yoPietro Galvani.jpg`
**Fix:** Datei umbenennen auf `yoPietro-Galvani.jpg`, `src` anpassen.

### AB7. `contentSection` ohne Null-Check — Minor Bug
**Datei:** `js/about.js` Zeile 319, 402
GSAP ignoriert `null` stillschweigend, aber unsauber.
**Fix:** `if (contentSection)` Guard hinzufügen.

### AB8. `js/cursor.js` wird nirgends geladen — Toter Code (Global)
53 Zeilen, kein `<script>`-Tag, kein `#cursor`-Element im DOM. **Fix:** Datei löschen.

### AB9. `setInterval` für Uhr nie aufgeräumt — Kosmetisch
**Datei:** `js/about.js` Zeile 469
Bei Full-Page-Navigation kein Problem. **Fix:** Optional `visibilitychange`-Listener.

### Verifizierte Nicht-Probleme (About)

| Gemeldeter Fund | Warum kein Problem |
|---|---|
| IntersectionObserver nie disconnected | Full-Page-Navigation räumt auf |
| WebGL-Kontext ohne Fallback | `if (!gl) return;` lässt Original-`<img>` sichtbar |
| Mobile Early-Return im WebGL-IIFE | Korrekte Performance-Optimierung |
| `window._webglPause/Resume` als Globals | Nötig für IIFE-Kommunikation |

| #   | Typ        | Schwere  | Aufwand |
|-----|------------|----------|---------|
| AB1 | Bug        | Hoch     | 1 min   |
| AB2 | Toter Code | Mittel   | 1 min   |
| AB3 | Bug        | Mittel   | 1 min   |
| AB4 | Performance| Mittel   | 2 min   |
| AB5 | Bug        | Mittel   | 1 min   |
| AB6 | Fragil     | Niedrig  | 2 min   |
| AB7 | Minor Bug  | Niedrig  | 1 min   |
| AB8 | Toter Code | Niedrig  | 1 min   |
| AB9 | Kosmetisch | Trivial  | 2 min   |

---

## Forgetting Dreams (`forgetting-dreams.html`)

Dateien: `forgetting-dreams.html`, `js/project.js`, `css/custom.css`

### FD1. Doppelte `id="seqCounter"` — Bug (Kritisch)
**Datei:** `forgetting-dreams.html` Zeile 94–103
Zweites Element wird nie aktualisiert, hängt als verwaister Counter im DOM.
**Fix:** Zeile 99–103 entfernen.

### FD2. transition.js doppelt geladen — Bug (Hoch)
**Datei:** `forgetting-dreams.html` Zeile 17 (`<head>`) und Zeile 172 (`</body>`)
**Fix:** Zeile 172 entfernen.

### FD3. 10 Bilder ohne `alt`-Attribut — Accessibility (Mittel)
**Datei:** `forgetting-dreams.html` Zeile 83–92
**Fix:** `alt=""` (dekorativ) oder beschreibende Texte.

### FD4. Film-Roll `alt=""` als dekorativ markiert — Accessibility (Niedrig)
**Datei:** `forgetting-dreams.html` Zeile 81
Funktionales Bild braucht beschreibenden Text. **Fix:** `alt="Film roll"`.

### FD5. Doppelte Leerzeichen in HTML-Attributen — Kosmetisch
**Datei:** `forgetting-dreams.html` Zeile 81, 86, 88, 90–92
**Fix:** Auf einzelne Leerzeichen normalisieren.

### Verifizierte Nicht-Probleme (Forgetting Dreams)

| Gemeldeter Fund | Warum kein Problem |
|---|---|
| `grain.jpg` Pfad kaputt | `brand_assets/grain.jpg` existiert |
| `isTablet()` dead code | Wird auf Zeile 329 benutzt |
| `.info-para` visibility unnötig | Progressive Enhancement Pattern |
| `--overview-cell-h` Fallback unnötig | Defensive Programmierung |
| Lenis immer instantiiert | Wird auf Desktop und Mobile gebraucht |

| #   | Typ           | Schwere    | Aufwand |
|-----|---------------|------------|---------|
| FD1 | Bug           | Kritisch   | 1 min   |
| FD2 | Bug           | Hoch       | 1 min   |
| FD3 | Accessibility | Mittel     | 2 min   |
| FD4 | Accessibility | Niedrig    | 1 min   |
| FD5 | Kosmetisch    | Trivial    | 2 min   |

---

## Hard-Coded (`hard-coded.html`)

Dateien: `hard-coded.html`, `js/project.js`, `css/custom.css`

### HC1. Doppelte `id="seqCounter"` — Bug (Kritisch)
**Datei:** `hard-coded.html` Zeile 128–137
Identisch mit FD1. **Fix:** Zeile 133–137 entfernen.

### HC2. transition.js doppelt geladen — Bug (Hoch)
**Datei:** `hard-coded.html` Zeile 23 (`<head>`) und Zeile 213 (`</body>`)
**Fix:** Zeile 213 entfernen.

### HC3. 19 Bilder ohne `alt`-Attribut — Accessibility (Mittel)
**Datei:** `hard-coded.html` Zeile 89–126
**Fix:** `alt=""` oder beschreibende Texte.

### HC4. Film-Roll `alt=""` als dekorativ — Accessibility (Niedrig)
**Datei:** `hard-coded.html` Zeile 87
**Fix:** `alt="Film roll"`.

### HC5. `hover-preview` mit `src=""` — Bug (Niedrig)
**Datei:** `hard-coded.html` Zeile 85 *(auch in `forgetting-dreams.html` Zeile 79)*
`src=""` löst Phantom-Request auf die aktuelle Seite aus.
**Fix:** `src` weglassen oder transparenten Pixel-Platzhalter verwenden.

### HC6. Trailing Spaces in CSS-Klassen — Kosmetisch
**Datei:** `hard-coded.html` Zeile 68, 89
**Fix:** Trailing Spaces entfernen.

### Template-Bugs (identisch mit Forgetting Dreams)

| Issue | HC | FD | Beschreibung |
|-------|----|----|--------------|
| Doppelte seqCounter ID | HC1 | FD1 | Beide Seiten |
| transition.js 2x | HC2 | FD2 | Beide Seiten |
| Bilder ohne alt | HC3 | FD3 | 19 bzw. 10 Bilder |
| rolle.png alt leer | HC4 | FD4 | Beide Seiten |
| hover-preview src="" | HC5 | — | Beide Seiten (FD Zeile 79) |

| #   | Typ           | Schwere    | Aufwand |
|-----|---------------|------------|---------|
| HC1 | Bug           | Kritisch   | 1 min   |
| HC2 | Bug           | Hoch       | 1 min   |
| HC3 | Accessibility | Mittel     | 2 min   |
| HC4 | Accessibility | Niedrig    | 1 min   |
| HC5 | Bug           | Niedrig    | 1 min   |
| HC6 | Kosmetisch    | Trivial    | 1 min   |

---

## Responsive Audit

Vollständiger Responsive-Check aller Seiten. Geprüft: CSS Media Queries, feste Breiten/Höhen, Viewport-Units, JS-Breakpoints, Touch-Events.

### Responsive — Gesamtübersicht nach Schwere

#### Kritisch (P0)

| #    | Bereich           | Typ         | Beschreibung                                                     | Datei                    |
|------|-------------------|-------------|------------------------------------------------------------------|--------------------------|
| R1   | Global            | Overflow    | `.dusti` in landing.css nutzt `width: 100vw` → horizontaler Overflow auf Mobile | `css/landing.css:89-97`  |
| R2   | Index (Mobile)    | Overflow    | `.imgbg` nutzt `width: 100vw` innerhalb ≤991px Block (hat bereits `inset: 0`) | `css/custom.css:841`     |
| R3   | Projekt-Seiten    | Overflow    | `.gall3ry.layout-0-gall3ry` nutzt `width: 100vw`               | `css/custom.css:331`     |
| R4   | Projekt-Seiten    | Overflow    | `.gall3ry.layout-1-gall3ry` nutzt `width: 100vw`               | `css/custom.css:367`     |
| R5   | Archive           | Layout      | Grid springt von 6 auf 3 Spalten bei 991px — zu harter Sprung   | `css/custom.css:224-241` |

#### Hoch (P1)

| #    | Bereich           | Typ         | Beschreibung                                                     | Datei                    |
|------|-------------------|-------------|------------------------------------------------------------------|--------------------------|
| R6   | Landing           | Layout      | `padding-top: 60vh` drückt Content auf kurzen Phones zu weit runter | `css/landing.css:111`    |
| R7   | Global (Mobile)   | Safe Area   | `.mob-sheet` fehlt `env(safe-area-inset-bottom)` → überdeckt von Home-Indicator | `css/custom.css:994`     |
| R8   | About (Tablet)    | Layout      | Padding-Werte (24px) auf Tablets (768-991px) zu eng              | `css/custom.css:2503-2529` |
| R9   | Projekt-Seiten    | Layout      | Overview-Grid geht von 5 Spalten direkt auf 2 — kein Tablet-Zwischenschritt | `css/custom.css:363-374` |

#### Mittel (P2)

| #    | Bereich           | Typ         | Beschreibung                                                     | Datei                    |
|------|-------------------|-------------|------------------------------------------------------------------|--------------------------|
| R10  | Global            | Performance | Grain-Animation auf kleinen Phones (<479px) unnötig — CPU/Batterie | `css/custom.css`         |
| R11  | Projekt-Liste     | JS          | `projects.js` Parallax läuft auf Mobile (keine Maus-Events) → unnötige Listener | `js/projects.js`         |

### Responsive — Detailbeschreibungen

#### R1. `.dusti` Overflow in landing.css
**Datei:** `css/landing.css:89-97`
`width: 100vw; height: 100vh` schließt die Scrollbar nicht ein. In `custom.css:67-74` ist `.dusti` bereits korrekt mit `inset: 0` definiert — landing.css überschreibt das mit der fehlerhaften Version.
**Fix:** `width: 100vw; height: 100vh;` durch `inset: 0;` ersetzen.

#### R2. `.imgbg` redundante `width: 100vw`
**Datei:** `css/custom.css:838-844` (innerhalb `@media (max-width: 991px)`)
Hat bereits `inset: 0`, die `width: 100vw` ist redundant und erzeugt potentiellen Overflow.
**Fix:** `width: 100vw;` entfernen.

#### R3 + R4. Gallery-Container `100vw`
**Dateien:** `css/custom.css:331` (layout-0) und `css/custom.css:367` (layout-1)
Beide Gallery-Layouts nutzen `width: 100vw` statt `100%`.
**Fix:** `width: 100vw` → `width: 100%` in beiden Regeln.

#### R5. Archive Grid-Sprung 6→3→2
**Datei:** `css/custom.css:224-241`
Aktuell: `columns: 6` (Desktop) → `columns: 3` (≤991px) → `columns: 2` (≤767px).
Der Sprung von 6 auf 3 ist visuell zu hart.
**Fix:** Neuen Breakpoint bei 1200px einfügen: `columns: 4`.

#### R6. Landing `padding-top: 60vh` auf Mobile
**Datei:** `css/landing.css:111`
Auf einem iPhone SE (568px Höhe) sind 60vh = 340px — es bleibt fast kein Platz für Name + Enter-Link.
**Fix:** Im `@media (max-width: 767px)` Block auf `45vh` reduzieren. Zusätzlich `@media (max-height: 600px)` Block mit `35vh`.

#### R7. Mob-Sheet ohne Safe-Area-Inset
**Datei:** `css/custom.css:994`
`.mob-sheet { bottom: 24px }` — auf iPhones mit Home-Indicator kann der Sheet-Button teilweise verdeckt werden.
**Fix:** `bottom: calc(24px + env(safe-area-inset-bottom, 0px))`.

#### R8. About Page Tablet-Padding
**Datei:** `css/custom.css:2503-2529`
Das About-Layout schaltet bei 991px korrekt auf die Mobile-Ansicht. Aber `left: 24px` auf `.about-greeting` und Padding 24px auf `.cornern` sind für Tablet-Breiten (768-991px) zu eng.
**Fix:** Neuer `@media (min-width: 768px) and (max-width: 991px)` Block mit `left: 48px` und `padding: 0 48px`.

#### R9. Overview-Grid kein Tablet-Zwischenschritt
**Datei:** `css/custom.css:363-374`
Desktop: `grid-template-columns: repeat(5, 1fr)`, Mobile: `repeat(2, 1fr)`. Kein Zwischenschritt.
**Fix:** Im Tablet-Block `repeat(3, 1fr)` setzen.

#### R10. Grain auf kleinen Phones
**Datei:** `css/custom.css`
Die Grain-Animation (300% Offset, `steps(1)`) ist CPU-intensiv. Bei ≤991px wird bereits Opacity reduziert und Animation verlangsamt.
**Fix:** Bei `@media (max-width: 479px)` die Animation komplett deaktivieren: `animation: none`.

#### R11. projects.js Mobile-Gate
**Datei:** `js/projects.js`
Mousemove-Parallax und Hover-Listener laufen auch auf Mobile, wo sie keinen Effekt haben.
**Fix:** In `matchMedia('(max-width: 991px)')` Check wrappen.

### Responsive — Verifizierte Nicht-Probleme

| Gemeldeter Fund                          | Warum kein Problem                                              |
|------------------------------------------|-----------------------------------------------------------------|
| About 768-991px Layout fehlt             | Schaltet bei 991px auf Mobile — funktioniert korrekt            |
| JS Breakpoint-Inkonsistenz (767 vs 991)  | Absichtlich: 767 = Cursor, 991 = Layout-Switch — verschiedene Concerns |
| Archive Hover-Wipe ohne Touch            | Akzeptable Degradation — Tap öffnet direkt Lightbox             |
| Nav Dropdown ohne Touch-Fallback         | Desktop-Nav wird auf Mobile per `display: none` ausgeblendet    |
| Logo-Split Hover ohne Touch              | Nur auf Desktop-Nav sichtbar                                    |
| matchMedia-Listener fehlen in JS         | Edge-case (Resize über Breakpoints) — niedrige Priorität        |

### Responsive — Breakpoint-Abdeckung

```
Viewport-Breite:
0px ─── 479px ─── 767px ─── 991px ─── 1200px ─── 1440px+
         tiny      small     medium                desktop

CSS Coverage:
├── max-width: 479px ────┤  (landing font, grain disable [NEU])
├── max-width: 767px ──────────┤  (mobile layout, cursor hide, archive 2-col)
├── max-width: 991px ────────────────┤  (tablet/mobile, nav switch, mob-sheet)
├── max-width: 1200px ─────────────────────┤  (archive 4-col [NEU])
                              ├── 768-991px ┤  (tablet-only [ERWEITERT])
```
