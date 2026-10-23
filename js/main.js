(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* шапка: фон після прокрутки і ховання при русі вниз */
  var header = document.querySelector('.header');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    if (!doc.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  onScroll();

  /* мобільне меню */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = doc.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.mnav a').forEach(function (a) {
      a.addEventListener('click', function () {
        doc.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doc.classList.contains('menu-open')) burger.click();
    });
  }

  /* scroll-reveal */
  var rv = document.querySelectorAll('.rv, .rv-img');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* лічильники */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
    if (reduce) { el.textContent = to.toFixed(dec).replace('.', ','); return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec).replace('.', ',');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* магнітні кнопки (тільки миша) */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.transform = 'translate(' + x + 'px,' + (y - 2) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* підсвітка підменю послуг */
  var sub = document.querySelectorAll('.subnav a');
  if (sub.length && 'IntersectionObserver' in window) {
    var map = {};
    sub.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          sub.forEach(function (a) { a.classList.remove('on'); });
          map[en.target.id].classList.add('on');
          var a = map[en.target.id];
          a.parentNode.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.svc[id]').forEach(function (s) { sio.observe(s); });
  }

  /* рік у футері */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* GSAP: фірмові моменти */
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    document.querySelectorAll('.hero h1 .line > span').forEach(function (s) { s.style.transform = 'none'; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, function (ctx) {
    var wide = ctx.conditions.wide;

    /* герой: рядки заголовка і зуб */
    var lines = document.querySelectorAll('.hero h1 .line > span');
    if (lines.length) {
      var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from(lines, { yPercent: 110, duration: 1.1, stagger: 0.12 })
        .from('.hero__text, .hero__cta, .trust', { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, '-=0.7')
        .from('.tooth .photo', { scale: 1.25, opacity: 0, duration: 1.4, transformOrigin: '50% 50%' }, 0.1)
        .fromTo('#revealRect', { attr: { height: 0 } }, { attr: { height: function () { return document.querySelector('.tooth').viewBox.baseVal.height; } }, duration: 1.6, ease: 'power2.inOut' }, 0.45)
        .from('.chip', { scale: 0.6, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.8)' }, '-=0.6');

      if (wide) {
        gsap.to('.tooth .photo', {
          yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    }

    /* хвилі з логотипу малюються по прокрутці */
    document.querySelectorAll('.wave path').forEach(function (p) {
      var len = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: p.closest('svg'), start: 'top 90%', end: 'bottom 45%', scrub: 0.6 }
      });
    });

    /* горизонтальний шлях капи */
    var track = document.querySelector('.steps__track');
    if (track && wide) {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 40); };
      gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: '.steps__pin', start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      gsap.to('.progress i', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.steps__pin', start: 'top top', end: function () { return '+=' + dist(); }, scrub: true }
      });
    }

    /* паралакс фото */
    if (wide) {
      document.querySelectorAll('[data-parallax]').forEach(function (el) {
        gsap.fromTo(el, { yPercent: -6 }, {
          yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
