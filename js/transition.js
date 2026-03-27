// Page transition — spinning star loader with smart page-ready detection
// Replicates Webflow IX2 behavior for later porting
(function () {
  var overlay = document.querySelector('.page-transition');
  if (!overlay) return;

  // --- Transition In (page just loaded) ---
  document.body.classList.add('is-transitioning');

  var fading = false;

  function fadeOverlay() {
    if (fading) return;
    fading = true;
    overlay.style.transition = 'opacity 1500ms ease-out';
    overlay.style.opacity = '0';
    overlay.addEventListener('transitionend', function handler() {
      if (overlay.style.opacity === '0') {
        overlay.style.visibility = 'hidden';
        document.body.classList.remove('is-transitioning');
        overlay.removeEventListener('transitionend', handler);
      }
    });
  }

  // Safety timeout — never wait longer than 4s
  var safetyTimer = setTimeout(fadeOverlay, 4000);

  function readyFade() {
    clearTimeout(safetyTimer);
    fadeOverlay();
  }

  // --- Per-page ready detection ---

  var isLanding = document.body.classList.contains('landing-page');
  var isArchive = document.body.classList.contains('archive-page');
  var isAbout   = document.body.classList.contains('about-page');
  var heroWrap  = document.getElementById('img100');

  if (isLanding) {
    // Landing page controls its own reveal via index.js
    window.__revealOverlay = readyFade;

  } else if (isArchive) {
    // Archive: poll until first grid item has been revealed (opacity > 0)
    var archivePoll = setInterval(function () {
      var items = document.querySelectorAll('.archive-grid-item');
      for (var i = 0; i < items.length; i++) {
        if (getComputedStyle(items[i]).opacity > 0) {
          clearInterval(archivePoll);
          readyFade();
          return;
        }
      }
    }, 100);

  } else if (heroWrap) {
    // Project pages: wait for hero image to load
    var heroImg = heroWrap.querySelector('img');
    if (heroImg && heroImg.complete && heroImg.naturalHeight > 0) {
      readyFade();
    } else if (heroImg) {
      heroImg.addEventListener('load', readyFade, { once: true });
      heroImg.addEventListener('error', readyFade, { once: true });
    } else {
      readyFade();
    }

  } else if (isAbout) {
    // About page: wait for fonts + short delay for layout
    document.fonts.ready.then(function () {
      setTimeout(readyFade, 150);
    });

  } else {
    // Unknown page type: fade after a brief paint delay
    setTimeout(readyFade, 300);
  }

  // --- Firefox bfcache handling ---
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      overlay.style.transition = 'none';
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      document.body.classList.remove('is-transitioning');
      fading = true;
    }
  });

  // --- Transition Out (link clicked) ---
  function isInternal(link) {
    return link.host === window.location.host && link.href.indexOf('#') === -1;
  }

  document.querySelectorAll('a').forEach(function (a) {
    // Skip links handled by nav.js dropdown (they manage their own transition)
    if (a.closest('.nav-dropdown-wrap') || a.closest('.desk-nav-cell') || a.closest('.nav-dropdown')) return;
    if (isInternal(a)) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var href = a.getAttribute('href');
        document.body.classList.add('is-transitioning');
        overlay.style.visibility = 'visible';
        overlay.style.transition = 'none';
        overlay.style.opacity = '0';
        // Force reflow
        void overlay.offsetWidth;
        overlay.style.transition = 'opacity 500ms cubic-bezier(0.455, 0.03, 0.515, 0.955)';
        overlay.style.opacity = '1';
        setTimeout(function () {
          window.location.href = href;
        }, 500);
      });
    }
  });
})();
