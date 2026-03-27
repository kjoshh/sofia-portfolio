// Page transition — spinning star loader with smart page-ready detection
// Replicates Webflow IX2 behavior for later porting
(function () {
  var overlay = document.querySelector('.page-transition');
  if (!overlay) return;

  // --- Transition In (page just loaded) ---
  document.body.classList.add('is-transitioning');

  var fading = false;
  var startTime = Date.now();
  var MIN_DISPLAY = 800; // minimum ms the loader stays visible

  function fadeOverlay() {
    if (fading) return;
    var elapsed = Date.now() - startTime;
    if (elapsed < MIN_DISPLAY) {
      setTimeout(fadeOverlay, MIN_DISPLAY - elapsed);
      return;
    }
    fading = true;
    overlay.style.transition = 'opacity 1500ms ease-out';
    overlay.style.opacity = '0';
    overlay.addEventListener('transitionend', function handler() {
      if (overlay.style.opacity === '0') {
        overlay.style.display = 'none';
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
    // Project pages: wait for first visible project images to load
    var projectImgs = document.querySelectorAll('.imgholder img');
    var imgCount = Math.min(projectImgs.length, 3); // wait for first 3 images max

    if (imgCount === 0) {
      readyFade();
    } else {
      var loaded = 0;
      function onImgReady() {
        loaded++;
        if (loaded >= imgCount) readyFade();
      }
      for (var i = 0; i < imgCount; i++) {
        if (projectImgs[i].complete && projectImgs[i].naturalHeight > 0) {
          onImgReady();
        } else {
          projectImgs[i].addEventListener('load', onImgReady, { once: true });
          projectImgs[i].addEventListener('error', onImgReady, { once: true });
        }
      }
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
      overlay.style.display = 'none';
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
        overlay.style.display = 'flex';
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
