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

  document.addEventListener('click', function(e) {
    if (sheet.classList.contains('is-open') && !sheet.contains(e.target)) {
      sheetToggle.click();
    }
  });

  sheetToggle.addEventListener('click', function() {
    var isOpen = sheet.classList.toggle('is-open');
    var body = sheet.querySelector('.mob-sheet-body');
    var cells = body.querySelectorAll('.mob-sheet-cell');
    var cellImgs = body.querySelectorAll('.mob-sheet-cell-img');
    var cellLabels = body.querySelectorAll('.mob-sheet-cell-label');
    var sectionLabel = body.querySelector('.mob-sheet-section-label');

    if (isOpen) {
      // Calculate how far left the star needs to travel
      var iconRect = icon.getBoundingClientRect();
      var headerRect = sheetToggle.getBoundingClientRect();
      var targetX = (headerRect.left + 18) - iconRect.left;

      // Erase the logo
      gsap.to(logo, { opacity: 0, x: -20, duration: 0.25, ease: 'power4.out', delay: 0.45 });
      // Star+label slide to the left; star spins independently
      gsap.to(iconWrap, { x: targetX, duration: 0.85, ease: 'power4.inOut', delay: 0.15 });
      gsap.to(icon, { rotation: 130, duration: 0.85, ease: 'power4.inOut', delay: 0.15 });

      // Links stagger in after star finishes
      gsap.fromTo(linkItems,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out', stagger: 0.09, delay: 0.55 }
      );

      // Slide body open
      gsap.fromTo(body,
        { height: 0 },
        { height: 'auto', duration: 0.45, ease: 'power4.out', overflow: 'hidden',
          onComplete: function() { body.style.overflow = ''; } }
      );
      // Cells stagger in with scale overshoot
      gsap.fromTo(cells,
        { scale: 0.85, yPercent: 15, opacity: 0 },
        { scale: 1, yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)', delay: 0.15 }
      );
      // Image zoom settle
      gsap.fromTo(cellImgs,
        { scale: 1.15 },
        { scale: 1, duration: 0.55, stagger: 0.06, ease: 'power2.out', delay: 0.15 }
      );
      // Labels fade in after cells start
      gsap.fromTo(cellLabels,
        { opacity: 0, yPercent: 8 },
        { opacity: 1, yPercent: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out', delay: 0.3 }
      );
      // Section label fades in
      if (sectionLabel) {
        gsap.fromTo(sectionLabel,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', delay: 0.15 }
        );
      }
    } else {
      // Links fade out immediately
      gsap.to(linkItems, { opacity: 0, x: -6, duration: 0.18, ease: 'power2.in', stagger: 0.05 });
      // Restore logo
      gsap.to(logo, { opacity: 0.92, x: 0, duration: 0.3, ease: 'power2.out', delay: 0.15 });
      // Star+label slide back to the right; star spins back
      gsap.to(iconWrap, { x: 0, duration: 0.5, ease: 'power3.inOut', delay: 0.12 });
      gsap.to(icon, { rotation: 0, duration: 0.5, ease: 'power3.inOut', delay: 0.12 });

      // Cells shrink out
      gsap.to(cells, { opacity: 0, scale: 0.9, yPercent: 10, duration: 0.2, stagger: 0.03, ease: 'power2.in' });
      // Labels fade out
      gsap.to(cellLabels, { opacity: 0, duration: 0.15, ease: 'power2.in' });
      // Section label out
      if (sectionLabel) gsap.to(sectionLabel, { opacity: 0, duration: 0.15, ease: 'power2.in' });
      // Collapse body
      gsap.to(body, { height: 0, duration: 0.35, ease: 'power3.inOut', delay: 0.1 });
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
    grid.classList.add('is-dragging');
    grid.setPointerCapture(e.pointerId);
  });

  grid.addEventListener('pointermove', function(e) {
    if (!isDragging) return;
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
