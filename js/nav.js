function applyFontStagger(el) {
  if (el.dataset.staggerApplied) return;
  el.dataset.staggerApplied = "true";
  const original = el.textContent.trim();
  el.style.display = "inline-block";
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
          duration: 0.35,
          delay: i * 0.03,
          ease: "power2.inOut",
        });
      }
    });
  }

  el._staggerOff = () => animateEl(false);
  el._staggerOn  = () => animateEl(true);
  el.addEventListener("mouseenter", () => { if (!el.classList.contains("active")) animateEl(true); });
  el.addEventListener("mouseleave", () => {
    // If this link is inside the dropdown wrap, don't reverse while dropdown is open
    if (el.closest('.nav-dropdown-wrap.is-open')) return;
    if (!el.classList.contains("active")) animateEl(false);
  });
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
    if (top) {
      if (bottom) gsap.set(bottom, { display: 'none' });

      // Split logo into two clip-path halves to animate the gap on hover
      const setupSplit = () => {
        const w = top.offsetWidth || top.naturalWidth * (20 / top.naturalHeight);
        const h = 20; // CSS height

        const splitWrap = document.createElement('div');
        splitWrap.style.cssText = `position:relative;width:${w}px;height:${h}px;display:block;`;

        const leftHalf = top.cloneNode(true);
        const rightHalf = top.cloneNode(true);

        const baseStyle = `position:absolute;top:0;left:0;height:${h}px;width:auto;display:block;opacity:0.92;`;
        leftHalf.style.cssText  = baseStyle + 'clip-path:inset(0 60% 0 0);';
        rightHalf.style.cssText = baseStyle + 'clip-path:inset(0 0 0 30%);';

        top.parentNode.insertBefore(splitWrap, top);
        splitWrap.appendChild(leftHalf);
        splitWrap.appendChild(rightHalf);
        top.style.display = 'none';

        logoLink.addEventListener('mouseenter', () => {
          gsap.to(leftHalf,  { x: 2.5,   duration: 0.8, ease: 'power3.out' });
          gsap.to(rightHalf, { x: -2.5, duration: 0.8, ease: 'power3.out' });
        });
        logoLink.addEventListener('mouseleave', () => {
          gsap.to(leftHalf,  { x: 0, duration: 0.7, ease: 'power3.out' });
          gsap.to(rightHalf, { x: 0, duration: 0.7, ease: 'power3.out' });
        });
      };

      if (top.complete) setupSplit();
      else top.addEventListener('load', setupSplit);
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
      // Already open — don't re-trigger (prevents flash on re-hover)
      if (dropdownWrap.classList.contains('is-open')) return;

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

      // Reverse font stagger on the Projects link
      const projLink = dropdownWrap.querySelector('.nav-link');
      if (projLink && projLink._staggerOff && !projLink.classList.contains('active')) {
        projLink._staggerOff();
      }

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

    // Close dropdown on item click (animate out before navigating)
    const transitionOverlay = document.querySelector('.page-transition');
    [...dropdownItems, ...deskCells].forEach(item => {
      item.addEventListener('click', (e) => {
        const link = item.closest('a') || item.querySelector('a');
        const href = link ? link.getAttribute('href') : null;
        if (href) {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeDropdown();
          // Trigger page-transition overlay (same as transition.js)
          if (transitionOverlay) {
            document.body.classList.add('is-transitioning');
            transitionOverlay.style.display = 'block';
            transitionOverlay.style.transition = 'none';
            transitionOverlay.style.opacity = '0';
            void transitionOverlay.offsetWidth;
            transitionOverlay.style.transition = 'opacity 500ms cubic-bezier(0.455, 0.03, 0.515, 0.955)';
            transitionOverlay.style.opacity = '1';
          }
          setTimeout(() => { window.location.href = href; }, 1000);
        }
      });
    });

    // Card hover — lift + image zoom + label brighten (GSAP so it composites with stagger transforms)
    deskCells.forEach(cell => {
      const img = cell.querySelector('.desk-nav-cell-img');
      const label = cell.querySelector('.desk-nav-cell-label');

      cell.addEventListener('mouseenter', () => {
        gsap.to(cell, { y: -2, duration: 0.3, ease: 'power2.out' });
        if (img) gsap.to(img, { scale: 1.04, duration: 0.4, ease: 'power2.out' });
        if (label) gsap.to(label, { color: 'rgba(233, 229, 221, 1)', duration: 0.25, ease: 'power2.out' });
      });

      cell.addEventListener('mouseleave', () => {
        gsap.to(cell, { y: 0, duration: 0.3, ease: 'power2.out' });
        if (img) gsap.to(img, { scale: 1, duration: 0.4, ease: 'power2.out' });
        if (label) gsap.to(label, { color: 'rgba(233, 229, 221, 0.92)', duration: 0.3, ease: 'power2.out' });
      });
    });
  }

})();
