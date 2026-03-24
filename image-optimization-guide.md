# Bild-Optimierung für Webflow Upload

Empfohlene maximale Pixelgröße (längste Kante) für jedes Bild, basierend auf der tatsächlichen Display-Größe im CSS + Retina 2x.

**Webflow-Tipp:** Nur die Maximal-Version hochladen — Webflow generiert automatisch responsive Varianten.

---

## Logos & Navigation

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `SofiaFullname.png` | Nav-Logo | **500px** (passt bereits) |
| `sybilnew-1.png` | Nav-Logo Hover-Swap | **700px** (passt bereits) |
| `starbright.png` | Stern-Separator | **50px** |
| `cross.png` | Lightbox Close-Button | **50px** |
| `arrownoly.png` | Lightbox Pfeile | **50px** |

## Landing Page

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `0017_17A.jpg` | Hero-Foto Sofia (background cover) | **2600px** |
| `Sybilbg.jpg` | Hero-Foto Sybil (background cover) | **1600px** |
| `frame.png` | Desktop-Rahmen Overlay | **2000px** |
| `framemobile.png` | Mobile-Rahmen | **1500px** (passt bereits) |
| `backgroundbd.png` | Frame-Hintergrund | **1200px** |
| Buchstaben (`a.png` – `y.png`) | Letter-Animation | **170px** |

## About Page

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `yoPietro Galvani.jpg` | Hero-Vollbild (object-fit cover) | **2880px** |

## Projekt-Thumbnails (Nav-Dropdown)

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `Hard-Coded-1.jpg` (als Thumbnail) | Nav-Dropdown 110×147px | **300px** |
| `Forgettingdreams-1.jpg` (als Thumbnail) | Nav-Dropdown 110×147px | **300px** |

## Projekt-Galerie: Hard-Coded (19 Bilder)

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `Hard-Coded-1.jpg` bis `Hard-Coded-19.jpg` | Sequence-View (70vw) + Lightbox (88vw) | **2400px** |

## Projekt-Galerie: Forgetting Dreams (10 Bilder)

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `Forgettingdreams-1.jpg` bis `Forgettingdreams-10.jpg` | Sequence-View (70vw) + Lightbox (88vw) | **2400px** |

## Archiv-Galerie (42 Bilder)

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `sofia_archive-1.jpg` bis `sofia_archive-42.jpg` | Grid-Ansicht + Lightbox | **2400px** |

Webflow erstellt automatisch kleinere Versionen für das Grid (~800px Spaltenbreite).

## Texturen & Overlays

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `BGDust.png` | Staub-Overlay (background cover) | **2000px** |
| `Noise.png` | Grain-Textur (300×300px Kachel, repeat) | **600px** |
| `grain.jpg` | Grain-Textur (200–300px Kachel, repeat) | **600px** |

## Sonstige

| Bild | Verwendung | Empfehlung |
|------|-----------|------------|
| `rolle.png` | Deko-Element in Projekten | **400px** |
| `favicon.ico` | Browser-Tab | **32px** |
| `webclip.png` | Apple Touch Icon | **180px** |

## Vermutlich nicht benötigt

| Bild | Hinweis |
|------|---------|
| `full-name-1.png` (40MB!) | Nicht aktiv eingebunden — weglassen |
| `neu42.png` (4.3MB) | Nicht aktiv eingebunden — prüfen |

---

## Zusammenfassung nach Kategorie

| Kategorie | Max. längste Kante |
|-----------|-------------------|
| Icons & Buttons | **50px** |
| Buchstaben-Animation | **170px** |
| Favicon | **32px** |
| Apple Touch Icon | **180px** |
| Nav-Thumbnails | **300px** |
| Deko-Elemente | **400px** |
| Logos | **500–700px** (bleiben) |
| Grain/Noise-Texturen | **600px** |
| Rahmen-Elemente | **1200–2000px** |
| Sybil-Hintergrund | **1600px** |
| Staub-Overlay | **2000px** |
| Projekt-Fotos & Archiv (Galerie + Lightbox) | **2400px** |
| Hero-Fotos (Vollbild) | **2600–2880px** |
