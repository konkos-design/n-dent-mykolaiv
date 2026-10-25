(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header: solid on scroll, hide on scroll down */
  const hdr = d.querySelector('.hdr');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 30);
    if (!root.classList.contains('menu-open')) hdr.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
    if (y < lastY - 4) hdr.classList.remove('is-hidden');
    lastY = y;
    const mc = d.querySelector('.mcall');
    if (mc) mc.classList.toggle('is-on', y > innerHeight * 0.7);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu */
  const burger = d.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = root.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      d.body.style.overflow = open ? 'hidden' : '';
    });
    d.querySelectorAll('.mmenu a').forEach(a => a.addEventListener('click', () => {
      root.classList.remove('menu-open'); d.body.style.overflow = '';
    }));
  }

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  d.querySelectorAll('.rv,.clip').forEach(el => io.observe(el));

  /* today's hours highlight */
  const day = new Date().toLocaleString('en-US', { weekday: 'short', timeZone: 'America/Vancouver' });
  d.querySelectorAll('[data-day]').forEach(r => { if (r.dataset.day === day) r.classList.add('today'); });

  /* draggable strips (mouse drag + native touch scroll + arrows) */
  d.querySelectorAll('.strip').forEach(strip => {
    let down = false, sx = 0, sl = 0, moved = false;
    strip.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; strip.classList.add('is-drag'); }
      strip.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { down = false; setTimeout(() => strip.classList.remove('is-drag'), 0); });
    strip.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
    strip.addEventListener('dragstart', e => e.preventDefault());
    const nav = d.querySelector(`[data-strip="${strip.id}"]`);
    if (nav) nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const step = strip.querySelector('.strip__item').offsetWidth + 16;
      strip.scrollBy({ left: (b.dataset.dir === 'next' ? 1 : -1) * step * 2, behavior: reduce ? 'auto' : 'smooth' });
    }));
  });

  /* hexagon light field (echoes the shop's hex LED ceiling) */
  const cv = d.querySelector('.hero canvas');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let W, H, R, cells = [], mx = -999, my = -999, raf, vis = true;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    const build = () => {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = W < 700 ? 30 : 46;
      const w = Math.sqrt(3) * R, h = 1.5 * R; cells = [];
      for (let r = -1; r * h < H + R; r++) for (let c = -1; c * w < W + w; c++) {
        cells.push({ x: c * w + (r % 2 ? w / 2 : 0), y: r * h, a: 0, p: Math.random() * 6.28 });
      }
    };
    const hex = (x, y, r) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const t = Math.PI / 180 * (60 * i - 30); ctx.lineTo(x + r * Math.cos(t), y + r * Math.sin(t)); }
      ctx.closePath();
    };
    let t0 = performance.now();
    const draw = now => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const c of cells) {
        const dist = Math.hypot(c.x - mx, c.y - my);
        const near = Math.max(0, 1 - dist / (R * 4.2));
        const ambient = fine || c.y > H * 0.4 ? 0 : Math.max(0, Math.sin(t * 0.8 + c.p + c.x * 0.004)) * 0.22 * (1 - c.y / (H * 0.4));
        const target = Math.max(near, ambient) * (c.y < H * 0.75 ? 1 : 0.4);
        c.a += (target - c.a) * 0.08;
        if (c.a < 0.01) continue;
        hex(c.x, c.y, R * 0.86);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(233,242,255,${c.a * 0.85})`;
        ctx.shadowColor = 'rgba(205,225,255,.9)'; ctx.shadowBlur = 14 * c.a;
        ctx.stroke();
      }
      if (vis) raf = requestAnimationFrame(draw);
    };
    build(); addEventListener('resize', build);
    const hero = d.querySelector('.hero');
    hero.addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; });
    hero.addEventListener('pointerleave', () => { mx = my = -999; });
    new IntersectionObserver(([e]) => {
      vis = e.isIntersecting; cancelAnimationFrame(raf); if (vis) raf = requestAnimationFrame(draw);
    }).observe(hero);
  }

  /* gallery filter + lightbox */
  const gal = d.querySelector('.gal');
  if (gal) {
    const items = [...gal.querySelectorAll('.gal__item')];
    d.querySelectorAll('.filters .chip').forEach(ch => ch.addEventListener('click', () => {
      d.querySelectorAll('.filters .chip').forEach(c => { c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false'); });
      ch.classList.add('is-on'); ch.setAttribute('aria-pressed', 'true');
      const f = ch.dataset.f;
      items.forEach(it => it.classList.toggle('is-out', f !== 'all' && !it.dataset.cat.includes(f)));
    }));
    const lb = d.querySelector('.lb'), lbImg = lb.querySelector('img');
    let idx = 0;
    const vis = () => items.filter(i => !i.classList.contains('is-out'));
    const show = i => { const v = vis(); idx = (i + v.length) % v.length; const im = v[idx].querySelector('img'); lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt; };
    items.forEach(it => it.addEventListener('click', () => { show(vis().indexOf(it)); lb.classList.add('is-open'); d.body.style.overflow = 'hidden'; lb.querySelector('.x').focus(); }));
    const close = () => { lb.classList.remove('is-open'); d.body.style.overflow = ''; };
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.pv').addEventListener('click', () => show(idx - 1));
    lb.querySelector('.nx').addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* services chips: highlight current group */
  const groups = d.querySelectorAll('.menu-grp');
  if (groups.length) {
    const chips = d.querySelectorAll('.chips .chip');
    const gio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) chips.forEach(c => c.classList.toggle('is-on', c.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    groups.forEach(g => gio.observe(g));
  }

  /* GSAP: gentle parallax inside framed photos (never pins or hijacks scroll) */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      gsap.utils.toArray('.px img').forEach(img => {
        gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none',
          scrollTrigger: { trigger: img.closest('.px'), start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      const hi = d.querySelector('.hero__img');
      if (hi) gsap.to(hi, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
  }
})();
