(function() {
  var sheet = document.getElementById('mobSheet');
  var sheetToggle = document.getElementById('mobSheetToggle');
  if (!sheet || !sheetToggle) return;

  var logo = sheet.querySelector('.mob-sheet-logo');
  var icon = sheet.querySelector('.mob-sheet-icon');
  var iconWrap = sheet.querySelector('.mob-sheet-header-right');
  var headerLinks = sheet.querySelector('.mob-sheet-header-links');
  var linkItems = headerLinks.querySelectorAll('.mob-sheet-link');
  gsap.set(linkItems, { opacity: 0 });

  var sheetTl = null; // track active timeline so we can kill on re-toggle

  document.addEventListener('click', function(e) {
    if (sheet.classList.contains('is-open') && !sheet.contains(e.target)) {
      sheetToggle.click();
    }
  });

  // Keyboard: Enter/Space toggles the menu
  sheetToggle.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sheetToggle.click();
    }
  });

  sheetToggle.addEventListener('click', function() {
    var isOpen = sheet.classList.toggle('is-open');
    sheetToggle.setAttribute('aria-expanded', isOpen);
    var body = sheet.querySelector('.mob-sheet-body');
    var cells = body.querySelectorAll('.mob-sheet-cell');
    var cellImgs = body.querySelectorAll('.mob-sheet-cell-img');
    var cellLabels = body.querySelectorAll('.mob-sheet-cell-label');
    var sectionLabel = body.querySelector('.mob-sheet-section-label');

    // Kill any in-flight timeline before starting a new one
    if (sheetTl) { sheetTl.kill(); sheetTl = null; }

    if (isOpen) {
      // Calculate how far left the star needs to travel
      var iconRect = icon.getBoundingClientRect();
      var headerRect = sheetToggle.getBoundingClientRect();
      var targetX = (headerRect.left + 18) - iconRect.left;

      sheetTl = gsap.timeline();
      // Star+label slide to the left; star spins independently
      sheetTl.to(iconWrap, { x: targetX, duration: 0.85, ease: 'power4.inOut' }, 0.15);
      sheetTl.to(icon, { rotation: 130, duration: 0.85, ease: 'power4.inOut' }, 0.15);
      // Erase the logo
      sheetTl.to(logo, { opacity: 0, x: -20, duration: 0.25, ease: 'power4.out' }, 0.45);
      // Links stagger in after star finishes
      sheetTl.fromTo(linkItems,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out', stagger: 0.09 }, 0.55
      );
      // Slide body open
      sheetTl.fromTo(body,
        { height: 0 },
        { height: 'auto', duration: 0.45, ease: 'power4.out', overflow: 'hidden',
          onComplete: function() { body.style.overflow = ''; } }, 0
      );
      // Cells stagger in with scale overshoot
      sheetTl.fromTo(cells,
        { scale: 0.85, yPercent: 15, opacity: 0 },
        { scale: 1, yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)' }, 0.15
      );
      // Image zoom settle
      sheetTl.fromTo(cellImgs,
        { scale: 1.15 },
        { scale: 1, duration: 0.55, stagger: 0.06, ease: 'power2.out' }, 0.15
      );
      // Labels fade in after cells start
      sheetTl.fromTo(cellLabels,
        { opacity: 0, yPercent: 8 },
        { opacity: 1, yPercent: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, 0.3
      );
      // Section label fades in
      if (sectionLabel) {
        sheetTl.fromTo(sectionLabel,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.15
        );
      }
    } else {
      sheetTl = gsap.timeline();
      // Links fade out immediately
      sheetTl.to(linkItems, { opacity: 0, x: -6, duration: 0.18, ease: 'power2.in', stagger: 0.05 }, 0);
      // Cells shrink out
      sheetTl.to(cells, { opacity: 0, scale: 0.9, yPercent: 10, duration: 0.2, stagger: 0.03, ease: 'power2.in' }, 0);
      // Labels fade out
      sheetTl.to(cellLabels, { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0);
      // Section label out
      if (sectionLabel) sheetTl.to(sectionLabel, { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0);
      // Collapse body
      sheetTl.to(body, { height: 0, duration: 0.35, ease: 'power3.inOut' }, 0.1);
      // Star+label slide back to the right; star spins back
      sheetTl.to(iconWrap, { x: 0, duration: 0.5, ease: 'power3.inOut' }, 0.12);
      sheetTl.to(icon, { rotation: 0, duration: 0.5, ease: 'power3.inOut' }, 0.12);
      // Restore logo
      sheetTl.to(logo, { opacity: 0.92, x: 0, duration: 0.3, ease: 'power2.out' }, 0.35);
    }
  });

  // Drag-to-scroll on the project grid
  var grid = sheet.querySelector('.mob-sheet-grid');
  var isDragging = false;
  var startX, scrollStart;

  grid.addEventListener('pointerdown', function(e) {
    isDragging = true;
    startX = e.clientX;
    scrollStart = grid.scrollLeft;
  });

  grid.addEventListener('pointermove', function(e) {
    if (!isDragging) return;
    // Only capture pointer + show drag state once actual movement starts
    if (!grid.classList.contains('is-dragging')) {
      grid.classList.add('is-dragging');
      grid.setPointerCapture(e.pointerId);
    }
    grid.scrollLeft = scrollStart - (e.clientX - startX);
  });

  grid.addEventListener('pointerup', function(e) {
    isDragging = false;
    grid.classList.remove('is-dragging');
  });

  grid.addEventListener('pointercancel', function(e) {
    isDragging = false;
    grid.classList.remove('is-dragging');
  });

  // Prevent click-through when it was a drag
  grid.addEventListener('click', function(e) {
    if (Math.abs(grid.scrollLeft - scrollStart) > 4) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
})();
