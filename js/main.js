(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- шапка ---- */
  var header = document.querySelector('.header');
  var fab = document.querySelector('.fab');
  var hero = document.querySelector('.hero');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    var limit = hero ? hero.offsetHeight - 80 : 10;
    header.classList.toggle('solid', y > limit);
    if (!root.classList.contains('open')) {
      if (y > 500 && y > lastY + 4) header.classList.add('hide');
      else if (y < lastY - 4) header.classList.remove('hide');
    }
    if (fab) fab.classList.toggle('on', y > 400);
    lastY = y;
  }
  var tick = false;
  window.addEventListener('scroll', function () {
    if (!tick) { requestAnimationFrame(function () { onScroll(); tick = false; }); tick = true; }
  }, { passive: true });
  onScroll();

  /* ---- мобільне меню ---- */
  var burger = document.querySelector('.burger');
  function closeMenu() { root.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  if (burger) {
    burger.addEventListener('click', function () {
      var o = root.classList.toggle('open');
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      document.body.style.overflow = o ? 'hidden' : '';
    });
    document.querySelectorAll('.mnav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) closeMenu(); });
  }

  /* ---- scroll-reveal ---- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---- стрічки: перетягування мишею, свайп, кнопки ---- */
  document.querySelectorAll('[data-rail]').forEach(function (box) {
    var rail = box.querySelector('.rail');
    var bar = box.querySelector('.rail-bar i');
    var prev = box.querySelector('.prev');
    var next = box.querySelector('.next');
    function update() {
      var max = rail.scrollWidth - rail.clientWidth;
      var vis = rail.clientWidth / rail.scrollWidth;
      if (bar) {
        bar.style.width = (vis * 100) + '%';
        bar.style.transform = 'translateX(' + (max > 0 ? (rail.scrollLeft / max) * ((1 - vis) / vis) * 100 : 0) + '%)';
      }
      if (prev) prev.disabled = rail.scrollLeft < 4;
      if (next) next.disabled = rail.scrollLeft > max - 4;
    }
    function stepBy(dir) {
      var item = rail.children[0];
      var w = item ? item.getBoundingClientRect().width + 20 : 320;
      rail.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { stepBy(-1); });
    if (next) next.addEventListener('click', function () { stepBy(1); });
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    /* перетягування мишею з інерцією */
    var down = false, moved = false, startX = 0, startL = 0, lastX = 0, lastT = 0, v = 0, raf;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = lastX = e.clientX; startL = rail.scrollLeft; lastT = performance.now(); v = 0;
      cancelAnimationFrame(raf);
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; rail.classList.add('drag'); }
      if (moved) {
        rail.scrollLeft = startL - dx;
        var now = performance.now();
        v = (e.clientX - lastX) / Math.max(1, now - lastT);
        lastX = e.clientX; lastT = now;
      }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (!moved) return;
      var vel = v * 16;
      (function glide() {
        if (Math.abs(vel) < 0.5) { rail.classList.remove('drag'); return; }
        rail.scrollLeft -= vel; vel *= 0.92;
        raf = requestAnimationFrame(glide);
      })();
    });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* ---- фото-підказка над списком послуг ---- */
  var peek = document.querySelector('.peek');
  if (peek && fine && !reduce) {
    var imgs = peek.querySelectorAll('img');
    var mx = 0, my = 0, px = 0, py = 0, running = false;
    function loop() {
      px += (mx - px) * 0.14; py += (my - py) * 0.14;
      var rot = Math.max(-8, Math.min(8, (mx - px) * 0.05));
      peek.style.transform = 'translate3d(' + (px - 150) + 'px,' + (py - 187) + 'px,0) rotate(' + rot + 'deg) scale(' + (peek.classList.contains('on') ? 1 : .7) + ')';
      if (running) requestAnimationFrame(loop);
    }
    document.querySelectorAll('.srow a').forEach(function (a) {
      a.addEventListener('mouseenter', function (e) {
        var k = a.getAttribute('data-k');
        imgs.forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-k') === k); });
        if (!running) { px = mx = e.clientX + 40; py = my = e.clientY; running = true; loop(); }
        peek.classList.add('on');
      });
      a.addEventListener('mousemove', function (e) { mx = e.clientX + 200; my = e.clientY; });
    });
    var list = document.querySelector('.slist');
    list.addEventListener('mouseleave', function () { peek.classList.remove('on'); setTimeout(function () { if (!peek.classList.contains('on')) running = false; }, 500); });
  }

  /* ---- магнітні кнопки ---- */
  if (fine && !reduce) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.16 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.25 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- GSAP ---- */
  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  /* герой: заголовок */
  var lines = document.querySelectorAll('.hero h1 .ln > span');
  if (lines.length) {
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from(lines, { yPercent: 115, duration: 1.15, stagger: 0.12 })
      .from('.hero__p, .hero__cta, .hero__addr', { y: 22, opacity: 0, duration: 0.9, stagger: 0.1 }, '-=0.75')
      .from('.hero__svg image', { scale: 1.12, duration: 1.8, ease: 'power2.out', transformOrigin: '50% 40%' }, 0);
  }

  /* герой: кадр перетворюється на зуб під час прокрутки (без фіксації сторінки) */
  var clip = document.getElementById('toothShape');
  var mark = document.getElementById('toothLines');
  if (clip && mark) {
    var base = clip.getAttribute('data-base');
    var cx = +clip.getAttribute('data-cx'), cy = +clip.getAttribute('data-cy');
    var S0 = 7;
    function setScale(s) {
      var t = 'translate(' + cx + ' ' + cy + ') scale(' + s + ') translate(' + (-cx) + ' ' + (-cy) + ') ' + base;
      clip.setAttribute('transform', t);
      mark.setAttribute('transform', t);
      mark.style.opacity = Math.max(0, Math.min(1, (2.2 - s) / 1.2)) * 0.6;
    }
    setScale(S0);
    gsap.matchMedia().add('(min-width: 901px)', function () {
      var st = ScrollTrigger.create({
        trigger: '.hero', start: 'top top', end: 'top -38%', scrub: 0.5,
        onUpdate: function (self) { var e = 1 - Math.pow(1 - self.progress, 2); setScale(S0 + (1 - S0) * e); }
      });
      var tw = gsap.to('.hero__svg', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      return function () { st.kill(); tw.scrollTrigger.kill(); tw.kill(); setScale(S0); gsap.set('.hero__svg', { clearProps: 'transform' }); };
    });
  }

  /* маніфест: слова проявляються по прокрутці */
  var mani = document.querySelector('.mani__text');
  if (mani) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (/^\s+$/.test(part) || part === '') frag.appendChild(document.createTextNode(part));
            else { var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(mani);
    gsap.fromTo(mani.querySelectorAll('.w'), { opacity: 0.16 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: mani, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  }

  /* легкий паралакс фото */
  gsap.matchMedia().add('(min-width: 901px)', function () {
    document.querySelectorAll('[data-par]').forEach(function (el) {
      gsap.fromTo(el, { y: +el.getAttribute('data-par') }, {
        y: -el.getAttribute('data-par'), ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
