(function () {
  // Set Webflow modifier classes expected by webflow.css
  const html = document.documentElement;
  html.classList.add('w-mod-js');
  if ('ontouchstart' in window) html.classList.add('w-mod-touch');
  // w-mod-ix3 tells forgetting-dreams.html that interactions are handled, making .info-para visible
  html.classList.add('w-mod-ix3');

  // Mark active nav link based on current URL
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.w-nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === path) {
      link.classList.add('w--current');
    } else {
      link.classList.remove('w--current');
    }
  });

  // Mobile navbar collapse
  const breakpoints = { medium: 991, small: 767, tiny: 479, all: Infinity };

  document.querySelectorAll('.w-nav[data-collapse]').forEach(nav => {
    const collapse = nav.getAttribute('data-collapse');
    const bp = breakpoints[collapse] || 0;
    const menu = nav.querySelector('.w-nav-menu');
    if (!menu) return;

    // Create hamburger button (matches webflow.css .w-nav-button styles)
    const btn = document.createElement('div');
    btn.className = 'w-nav-button';
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<div class="w-icon-nav-menu"></div>';
    nav.appendChild(btn);

    const isMobile = () => window.innerWidth <= bp;

    function openMenu() {
      menu.setAttribute('data-nav-menu-open', '');
      btn.classList.add('w--open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      menu.removeAttribute('data-nav-menu-open');
      btn.classList.remove('w--open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', () => {
      btn.classList.contains('w--open') ? closeMenu() : openMenu();
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });

    menu.querySelectorAll('.w-nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (!isMobile()) closeMenu();
    });
  });
})();
