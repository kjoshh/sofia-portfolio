# Site Audit

Code-Audit aller HTML-Seiten, JS und CSS — Bugs, toter Code, Redundanzen.

---

## Offene Issues

### Optional (Refactoring)

| #    | Seite | Typ     | Beschreibung                                    | Aufwand |
|------|-------|---------|-------------------------------------------------|---------|
| I11  | Index | Quality | ~400 Zeilen near-duplicate Physics (Desktop/Mobile) | 30+ min |
| I12  | Index | Quality | Magic Numbers ohne benannte Konstanten           | 10 min  |

---

## Responsive Audit

Vollständiger Responsive-Check aller Seiten. Geprüft: CSS Media Queries, feste Breiten/Höhen, Viewport-Units, JS-Breakpoints, Touch-Events.

### Kritisch (P0)

| #    | Bereich           | Typ         | Beschreibung                                                     | Datei                    |
|------|-------------------|-------------|------------------------------------------------------------------|--------------------------|
| ~~R2~~   | Index (Mobile)    | Overflow    | ~~`.imgbg` nutzt `width: 100vw` innerhalb ≤991px Block (hat bereits `inset: 0`)~~ | ✅ done     |
| ~~R3~~   | Projekt-Seiten    | Overflow    | ~~`.gall3ry.layout-0-gall3ry` nutzt `width: 100vw`~~               | ✅ done     |
| ~~R4~~   | Projekt-Seiten    | Overflow    | ~~`.gall3ry.layout-1-gall3ry` nutzt `width: 100vw`~~               | ✅ done     |
| ~~R5~~   | Archive           | Layout      | ~~Grid springt von 6 auf 3 Spalten bei 991px — zu harter Sprung~~   | ✅ done |

*R1 und R6 waren in `css/landing.css` — Datei wurde gelöscht (I8), Issues damit erledigt.*

### Hoch (P1)

| #    | Bereich           | Typ         | Beschreibung                                                     | Datei                    |
|------|-------------------|-------------|------------------------------------------------------------------|--------------------------|
| ~~R7~~   | Global (Mobile)   | Safe Area   | ~~`.mob-sheet` fehlt `env(safe-area-inset-bottom)` → überdeckt von Home-Indicator~~ | ✅ done     |
| ~~R8~~   | About (Tablet)    | Layout      | ~~Padding-Werte (24px) auf Tablets (768-991px) zu eng~~              | ✅ done |
| R9   | Projekt-Seiten    | Layout      | Overview-Grid geht von 5 Spalten direkt auf 2 — kein Tablet-Zwischenschritt | `css/custom.css:363-374` |

### Mittel (P2)

| #    | Bereich           | Typ         | Beschreibung                                                     | Datei                    |
|------|-------------------|-------------|------------------------------------------------------------------|--------------------------|
| R10  | Global            | Performance | Grain-Animation auf kleinen Phones (<479px) unnötig — CPU/Batterie | `css/custom.css`         |
| R11  | Projekt-Liste     | JS          | `projects.js` Parallax läuft auf Mobile (keine Maus-Events) → unnötige Listener | `js/projects.js`         |

### Detailbeschreibungen

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

### Verifizierte Nicht-Probleme

| Gemeldeter Fund                          | Warum kein Problem                                              |
|------------------------------------------|-----------------------------------------------------------------|
| About 768-991px Layout fehlt             | Schaltet bei 991px auf Mobile — funktioniert korrekt            |
| JS Breakpoint-Inkonsistenz (767 vs 991)  | Absichtlich: 767 = Cursor, 991 = Layout-Switch — verschiedene Concerns |
| Archive Hover-Wipe ohne Touch            | Akzeptable Degradation — Tap öffnet direkt Lightbox             |
| Nav Dropdown ohne Touch-Fallback         | Desktop-Nav wird auf Mobile per `display: none` ausgeblendet    |
| Logo-Split Hover ohne Touch              | Nur auf Desktop-Nav sichtbar                                    |
| matchMedia-Listener fehlen in JS         | Edge-case (Resize über Breakpoints) — niedrige Priorität        |

---

## Erledigte Issues (Zusammenfassung)

32 Issues gefixed: FD1, HC1, A2, AB1, FD2, HC2, I1, A1, A4, AB3, AB5, I2, I3, I5, AB4, FD3, HC3, G1, G2, A3, A5, A6, A7, AB2, AB6, AB7, AB8, AB9, I4, I6, I7, I8, I9, I10, I13, FD4, FD5, HC4, HC5, HC6.
