// Page transition — based on T.RICKS technique
// Replicates Webflow IX2 behavior for later porting
(function () {
  var overlay = document.querySelector('.page-transition');
  if (!overlay) return;

  // --- Transition In (page just loaded) ---
  // Overlay starts visible (inline style: display:block; opacity:1)
  // Hide cursor during entrance transition
  document.body.classList.add('is-transitioning');
  setTimeout(function () {
    overlay.style.transition = 'opacity 1500ms cubic-bezier(0.455, 0.03, 0.515, 0.955)';
    overlay.style.opacity = '0';
  }, 250);

  overlay.addEventListener('transitionend', function handler() {
    if (overlay.style.opacity === '0') {
      overlay.style.display = 'none';
      document.body.classList.remove('is-transitioning');
      overlay.removeEventListener('transitionend', handler);
    }
  });

  // --- Transition Out (link clicked) ---
  function isInternal(link) {
    return link.host === window.location.host && link.href.indexOf('#') === -1;
  }

  document.querySelectorAll('a').forEach(function (a) {
    if (isInternal(a)) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var href = a.getAttribute('href');
        document.body.classList.add('is-transitioning');
        overlay.style.display = 'block';
        overlay.style.transition = 'none';
        overlay.style.opacity = '0';
        // Force reflow
        void overlay.offsetWidth;
        overlay.style.transition = 'opacity 500ms cubic-bezier(0.455, 0.03, 0.515, 0.955)';
        overlay.style.opacity = '1';
        setTimeout(function () {
          window.location.href = href;
        }, 1000);
      });
    }
  });
})();
