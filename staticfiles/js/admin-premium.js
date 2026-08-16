/* Portfolio Studio — premium admin interactions (vanilla, dependency-free) */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bg = document.querySelector('.premium-bg');

  /* Ambient drifting particles behind the admin chrome */
  function buildParticles() {
    if (!bg || reduced) return;
    var count = 14;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.className = 'prebg-particle';
      var x = Math.random() * 100;
      var y = 60 + Math.random() * 40;
      var dur = 26 + Math.random() * 26;
      var delay = -Math.random() * 30;
      var scale = 0.6 + Math.random() * 0.9;
      p.style.left = x + '%';
      p.style.top = y + '%';
      p.style.width = (2 * scale) + 'px';
      p.style.height = (2 * scale) + 'px';
      p.style.animationDuration = dur + 's';
      p.style.animationDelay = delay + 's';
      frag.appendChild(p);
    }
    bg.appendChild(frag);
  }

  /* Elevate the header with a shadow once the page scrolls */
  function initHeaderShadow() {
    var header = document.getElementById('header');
    if (!header || reduced) return;
    var ticking = false;
    var apply = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      header.classList.toggle('is-scrolled', y > 8);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
    }, { passive: true });
    apply();
  }

  /* Off-canvas nav drawer for small screens.
     Django 6 hides the sidebar + toggle entirely below 768px, so we re-enable
     them as a premium drawer. Django's nav_sidebar.js listener runs first on
     the same button, so we also revert its #main.shifted toggle and
     localStorage writes on every open/close to keep the mobile drawer's state
     consistent without touching the desktop sidebar behaviour. */
  function initMobileNav() {
    var toggle = document.getElementById('toggle-nav-sidebar');
    if (!toggle) return;

    var mq = window.matchMedia('(max-width: 767px)');
    var backdrop = null;

    function syncState(opened) {
      var main = document.getElementById('main');
      if (main) main.classList.remove('shifted');
      var sidebar = document.getElementById('nav-sidebar');
      if (sidebar) sidebar.setAttribute('aria-expanded', opened ? 'true' : 'false');
      try { localStorage.removeItem('django.admin.navSidebarIsOpen'); } catch (err) {}
    }

    function close() {
      document.body.classList.remove('premium-nav-open');
      if (backdrop) {
        backdrop.remove();
        backdrop = null;
      }
      syncState(false);
    }

    function open() {
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'premium-nav-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', close);
      }
      document.body.classList.add('premium-nav-open');
      syncState(true);
    }

    function onToggle(e) {
      if (!mq.matches) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (document.body.classList.contains('premium-nav-open')) {
        close();
      } else {
        open();
      }
    }

    toggle.addEventListener('click', onToggle);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('premium-nav-open')) {
        close();
      }
    });
    var sidebar = document.getElementById('nav-sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', function (e) {
        if (e.target.closest('a')) close();
      });
    }
    mq.addEventListener('change', function (e) {
      if (!e.matches) close();
    });
  }

  /* Guard against double init */
  if (!document.documentElement.hasAttribute('data-premium-admin')) {
    document.documentElement.setAttribute('data-premium-admin', '1');
    buildParticles();
    initHeaderShadow();
    initMobileNav();
  }
})();
