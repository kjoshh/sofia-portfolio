function applyFontStagger(el) {
  if (el.dataset.staggerApplied) return;
  el.dataset.staggerApplied = "true";
  const original = el.textContent.trim();
  el.style.display = "inline-block";
  // We no longer lock the width, as "Sybil Sometimes" is longer than "Sofia Cartuccia"
  // el.style.width = el.offsetWidth + "px";
  el.style.textAlign = "center";
  el.style.whiteSpace = "nowrap";
  el.style.overflow = "visible";
  el.textContent = "";
  
  const charWrappers = original.split("").map((ch, i) => {
    const wrapper = document.createElement("span");
    wrapper.className = "char-wrapper";
    // Inline styles that will be moved to CSS, but added here for safety
    wrapper.style.display = "inline-block";
    wrapper.style.position = "relative";
    wrapper.style.overflow = "hidden";
    wrapper.style.verticalAlign = "bottom";

    const topSpan = document.createElement("span");
    topSpan.className = "char-top";
    topSpan.textContent = ch === " " ? "\u00A0" : ch;
    
    const bottomSpan = document.createElement("span");
    bottomSpan.className = "char-bottom post-font";
    bottomSpan.style.position = "absolute";
    bottomSpan.style.top = "100%";
    bottomSpan.style.left = "0";
    bottomSpan.style.width = "100%";
    bottomSpan.style.textAlign = "center";
    bottomSpan.textContent = ch === " " ? "\u00A0" : ch;

    wrapper.appendChild(topSpan);
    wrapper.appendChild(bottomSpan);
    el.appendChild(wrapper);
    return wrapper;
  });

  function animateEl(isHover) {
    charWrappers.forEach((wrapper, i) => {
      const topSpan = wrapper.querySelector('.char-top');
      const bottomSpan = wrapper.querySelector('.char-bottom');

      gsap.killTweensOf([topSpan, bottomSpan]);

      if (isHover) {
        gsap.to([topSpan, bottomSpan], {
          yPercent: -100,
          duration: 0.3,
          delay: i * 0.03,
          ease: "power4.out",
          onComplete: () => gsap.set(topSpan, { opacity: 0 }),
          onUpdate: function() { if (this.progress() > 0.91) gsap.set(topSpan, { opacity: 0 }); }
        });
      } else {
        gsap.set(topSpan, { opacity: 1 });
        gsap.to([topSpan, bottomSpan], {
          yPercent: 0,
          duration: 0.3,
          delay: i * 0.03,
          ease: "power1.out",
        });
      }
    });
  }

  el._staggerOff = () => animateEl(false);
  el._staggerOn  = () => animateEl(true);
  el.addEventListener("mouseenter", () => { if (!el.classList.contains("active")) animateEl(true); });
  el.addEventListener("mouseleave", () => { if (!el.classList.contains("active")) animateEl(false); });
}


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

  // Set active/notactive on top nav links (excluding pro/layout nav)
  document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item)').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === path) {
      link.classList.add('active');
      link.classList.remove('notactive');
    } else {
      link.classList.add('notactive');
      link.classList.remove('active');
    }
  });

  // Set active/notactive on logo
  document.querySelectorAll('.logo-link').forEach(logo => {
    const href = (logo.getAttribute('href') || '').split('/').pop() || 'index.html';
    if (href === path) {
      logo.classList.add('active');
      logo.classList.remove('notactive');
    } else {
      logo.classList.add('notactive');
      logo.classList.remove('active');
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

  // Apply font stagger + cross-hover to top nav links (exclude logo-link — it uses images, not text)
  const topEls = [
    ...document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item):not(.logo-link)'),
  ].filter(Boolean);

  topEls.forEach(el => {
    el._isCurrentPage = el.classList.contains('active');
    applyFontStagger(el);
  });

  // Dropdown items get the same font stagger (no active state management)
  document.querySelectorAll('.nav-dropdown-item').forEach(el => applyFontStagger(el));

  // ── Logo image toggle ──
  const logoLink = document.querySelector('.main-nav .logo-link');
  if (logoLink) {
    const top    = logoLink.querySelector('.nav-logo-top');    // Sofia (default visible)
    const bottom = logoLink.querySelector('.nav-logo-bottom'); // Sybil
    const isIndex = ['', 'index.html'].includes(window.location.pathname.split('/').pop());

    if (isIndex && top && bottom) {
      // Index only: swap between the two logos. Incoming rises from below; outgoing exits top.
      gsap.set(bottom, { yPercent: 100 });

      let sybilShowing = false;

      logoLink.addEventListener('mouseenter', () => {
        if (!sybilShowing) {
          gsap.set(bottom, { yPercent: 100 });
          gsap.to(top,    { yPercent: -100, duration: 0.6, ease: 'power3.inOut' });
          gsap.to(bottom, { yPercent: 0,    duration: 0.6, ease: 'power3.inOut' });
          sybilShowing = true;
        } else {
          gsap.set(top, { yPercent: 100 });
          gsap.to(bottom, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' });
          gsap.to(top,    { yPercent: 0,    duration: 0.6, ease: 'power3.inOut' });
          sybilShowing = false;
        }
      });
    } else if (!isIndex && top) {
      // Other pages: hide the second logo entirely, simple opacity dip on the main logo
      if (bottom) gsap.set(bottom, { display: 'none' });
      logoLink.addEventListener('mouseenter', () => gsap.to(top, { opacity: 0.8, duration: 0.2, ease: 'power2.out' }));
      logoLink.addEventListener('mouseleave', () => gsap.to(top, { opacity: 1,   duration: 0.3, ease: 'power2.out' }));
    }
  }

  // ── Project Dropdown — Quechua-inspired reveal (desktop only) ──
  const dropdownWrap = document.querySelector('.nav-dropdown-wrap');
  const dropdown = document.getElementById('projects-dropdown');
  const deskCells = dropdown ? [...dropdown.querySelectorAll('.desk-nav-cell')] : [];
  const deskCellImgs = dropdown ? [...dropdown.querySelectorAll('.desk-nav-cell-img')] : [];
  const deskLabels = dropdown ? [...dropdown.querySelectorAll('.desk-nav-label')] : [];
  const dropdownItems = dropdown ? [...dropdown.querySelectorAll('.nav-dropdown-item')] : [];

  if (dropdownWrap && dropdown) {
    let openTl = null;
    let closeTl = null;

    const fullHeight = () => {
      const prev = dropdown.style.maxHeight;
      dropdown.style.maxHeight = 'none';
      const h = dropdown.scrollHeight;
      dropdown.style.maxHeight = prev;
      return h;
    };

    const openDropdown = () => {
      if (closeTl) { closeTl.kill(); closeTl = null; }

      dropdownWrap.classList.add('is-open');

      openTl = gsap.timeline();

      // Container expand
      openTl.to(dropdown, {
        maxHeight: fullHeight(),
        duration: 0.5,
        ease: 'expo.out',
      }, 0);

      // Cards stagger in with scale overshoot
      openTl.fromTo(deskCells, {
        scale: 0.85,
        yPercent: 15,
        opacity: 0,
      }, {
        scale: 1,
        yPercent: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.07,
        ease: 'back.out(1.4)',
      }, 0.05);

      // Image zoom settle
      openTl.fromTo(deskCellImgs, {
        scale: 1.15,
      }, {
        scale: 1,
        duration: 0.6,
        stagger: 0.07,
        ease: 'power2.out',
      }, 0.05);

      // Labels fade in
      openTl.fromTo(deskLabels, {
        opacity: 0,
        yPercent: 8,
      }, {
        opacity: 1,
        yPercent: 0,
        duration: 0.3,
        ease: 'power2.out',
      }, 0.15);

      // Dropdown text items (font-stagger links)
      openTl.to(dropdownItems, {
        opacity: 1,
        duration: 0.2,
        stagger: 0.06,
        ease: 'power2.out',
      }, 0.05);
    };

    const closeDropdown = () => {
      if (openTl) { openTl.kill(); openTl = null; }

      dropdownWrap.classList.remove('is-open');

      closeTl = gsap.timeline();

      // Cards shrink out fast
      closeTl.to(deskCells, {
        opacity: 0,
        scale: 0.9,
        yPercent: 10,
        duration: 0.25,
        stagger: 0.03,
        ease: 'power2.in',
      }, 0);

      // Labels fade out
      closeTl.to(deskLabels, {
        opacity: 0,
        duration: 0.15,
        ease: 'power2.in',
      }, 0);

      // Dropdown text items
      closeTl.to(dropdownItems, {
        opacity: 0,
        duration: 0.15,
        ease: 'power2.in',
      }, 0);

      // Container collapse
      closeTl.to(dropdown, {
        maxHeight: 0,
        duration: 0.35,
        ease: 'expo.inOut',
      }, 0.08);
    };

    dropdownWrap.addEventListener('mouseenter', openDropdown);

    const mainNavWrapper = document.querySelector('.main-nav');
    if (mainNavWrapper) mainNavWrapper.addEventListener('mouseleave', closeDropdown);

    document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item)').forEach(link => {
      if (!link.closest('.nav-dropdown-wrap')) {
        link.addEventListener('mouseenter', closeDropdown);
      }
    });
  }

})();
