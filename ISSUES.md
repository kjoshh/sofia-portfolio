# Known Issues

## Critical

### ~~1. Null reference crashes in `js/project.js`~~ ✅
~~`textContainer.style` and `.gall3ry-container` accessed without null checks.~~

### ~~2. `activeLayout` used before declaration in `js/project.js`~~ ✅
~~Event listeners reference `activeLayout` (via `typeof` check) but it's declared much later in the file. Works by accident but fragile.~~

### ~~3. Lightbox button null refs in `js/lightbox.js`~~ ✅
~~The code checks if `overlay` and `lbImg` exist, but then unconditionally calls `addEventListener` on `lb-close`, `lb-prev`, `lb-next` without null checks — will crash if any are missing.~~

## High Priority

### ~~4. No timeout on Sanity API in `build.js`~~ ✅
~~If the Sanity API hangs, the build hangs forever. No timeout or abort controller.~~

### ~~5. Image preload has no error/timeout fallback~~ ✅ (false positive)
~~Already handled: `transition.js` has a 4s safety timeout (line 34) and error listeners on images (line 83).~~

### ~~6. CDN dependency on SplitText~~ ✅
~~If the Webflow CDN fails, `new SplitText()` throws a ReferenceError, breaking project page info sections entirely.~~

## Medium Priority

### ~~7. Inline z-index `99999` vs CSS variable `--z-loader: 10003`~~ ✅ (non-issue)
~~Intentional: inline style ensures loader covers everything before CSS loads. `custom.css` overrides it once parsed.~~

### ~~8. WebGL breakpoint mismatch in `js/about.js`~~ ✅
~~Hardcoded `768px` check for disabling WebGL, but CSS breakpoints use `991px`. WebGL may load on tablets where it shouldn't.~~

### ~~9. Touch double-fire in `js/index.js`~~ ✅
~~The 500ms guard between `touchend` and `click` isn't bulletproof and can cause double character swaps on mobile.~~

## Low Priority

### 10. Hardcoded Sanity project ID in `build.js`
Should use env vars for flexibility, though since this is a public dataset read it's not a security risk.

### 11. Lenis resize called multiple times without debouncing in `js/project.js`
Could cause frame drops during rapid layout changes.
