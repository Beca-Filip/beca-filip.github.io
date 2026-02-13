(function () {
  'use strict';

  /* -----------------------------------------------------------
     Scroll Reveal — elements fade + slide up on enter
     ----------------------------------------------------------- */
  function initReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var els = document.querySelectorAll('.hero, .entry, .pub, .scholar-link');
    els.forEach(function (el) { el.classList.add('reveal'); });

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) {
          return a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top;
        });

      visible.forEach(function (entry, i) {
        setTimeout(function () { entry.target.classList.add('revealed'); }, i * 100);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    /* Double-rAF ensures the browser has painted the hidden state (opacity:0)
       before the observer fires, so the transition actually plays. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        els.forEach(function (el) { observer.observe(el); });
      });
    });
  }

  /* -----------------------------------------------------------
     Scroll UI — progress bar + active nav
     ----------------------------------------------------------- */
  function initScrollUI() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var navLinks = document.querySelectorAll('.nav a[href^="#"]');
    var tracked = [];
    navLinks.forEach(function (a) {
      var el = document.querySelector(a.getAttribute('href'));
      if (el) tracked.push(el);
    });

    var ticking = false;

    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';

      var pos = window.scrollY + window.innerHeight * 0.25;
      var current = '';
      tracked.forEach(function (s) {
        if (s.offsetTop <= pos) current = s.id;
      });
      navLinks.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* -----------------------------------------------------------
     Dark Mode Toggle
     ----------------------------------------------------------- */
  function initDarkMode() {
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.innerHTML =
      '<svg class="sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="5"/>' +
      '<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>' +
      '</svg>' +
      '<svg class="moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
      '</svg>';

    document.querySelector('.nav').appendChild(btn);

    btn.addEventListener('click', function () {
      document.documentElement.classList.add('theme-transition');
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (dark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
      setTimeout(function () {
        document.documentElement.classList.remove('theme-transition');
      }, 500);
    });
  }

  /* -----------------------------------------------------------
     Header shadow on scroll
     ----------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('.header');
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:100%;pointer-events:none';
    document.body.prepend(sentinel);

    new IntersectionObserver(function (e) {
      header.classList.toggle('scrolled', !e[0].isIntersecting);
    }).observe(sentinel);
  }

  /* -----------------------------------------------------------
     Back to Top
     ----------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btn);

    var hero = document.querySelector('.hero');
    new IntersectionObserver(function (entries) {
      btn.classList.toggle('visible', !entries[0].isIntersecting);
    }).observe(hero);

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* -----------------------------------------------------------
     Copy Email on Click
     ----------------------------------------------------------- */
  function initCopyEmail() {
    var link = document.querySelector('.contact-row a[href^="mailto:"]');
    if (!link || !navigator.clipboard) return;

    var originalText = link.textContent;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      var email = link.href.replace('mailto:', '');
      navigator.clipboard.writeText(email).then(function () {
        link.textContent = 'Copied!';
        link.classList.add('copied');
        setTimeout(function () {
          link.textContent = originalText;
          link.classList.remove('copied');
        }, 2000);
      });
    });
  }

  /* -----------------------------------------------------------
     Publication Filter by Year
     ----------------------------------------------------------- */
  function initPubFilter() {
    var pubList = document.querySelector('.pub-list');
    if (!pubList) return;

    var pubs = pubList.querySelectorAll('.pub');
    var years = [];
    pubs.forEach(function (pub) {
      var y = pub.querySelector('.pub-year').textContent.trim();
      if (years.indexOf(y) === -1) years.push(y);
    });

    if (years.length < 2) return;

    var filterBar = document.createElement('div');
    filterBar.className = 'pub-filters';

    var allBtn = document.createElement('button');
    allBtn.className = 'pub-filter-btn active';
    allBtn.textContent = 'All';
    allBtn.setAttribute('data-year', 'all');
    filterBar.appendChild(allBtn);

    years.forEach(function (y) {
      var btn = document.createElement('button');
      btn.className = 'pub-filter-btn';
      btn.textContent = y;
      btn.setAttribute('data-year', y);
      filterBar.appendChild(btn);
    });

    var countEl = document.createElement('span');
    countEl.className = 'pub-filter-count';
    filterBar.appendChild(countEl);

    pubList.parentNode.insertBefore(filterBar, pubList);

    function updateCount(n) {
      countEl.textContent = n + ' of ' + pubs.length;
    }
    updateCount(pubs.length);

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.pub-filter-btn');
      if (!btn) return;

      var year = btn.getAttribute('data-year');

      filterBar.querySelectorAll('.pub-filter-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });

      var shown = 0;
      pubs.forEach(function (pub) {
        var pubYear = pub.querySelector('.pub-year').textContent.trim();
        var match = year === 'all' || pubYear === year;
        pub.classList.toggle('pub-hidden', !match);
        if (match) shown++;
      });

      updateCount(shown);
    });
  }

  /* -----------------------------------------------------------
     Mobile Hamburger Menu
     ----------------------------------------------------------- */
  function initMobileMenu() {
    var nav = document.querySelector('.nav');
    var headerInner = document.querySelector('.header-inner');

    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Toggle navigation menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    headerInner.appendChild(btn);

    function close() {
      nav.classList.remove('open');
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      btn.classList.toggle('active');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !btn.contains(e.target)) close();
    });
  }

  /* -----------------------------------------------------------
     Boot
     ----------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initScrollUI();
    initDarkMode();
    initHeader();
    initBackToTop();
    initCopyEmail();
    initPubFilter();
    initMobileMenu();
  });
})();
