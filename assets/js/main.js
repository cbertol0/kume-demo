/* Küme — demo de rediseño
   Animaciones: GSAP + ScrollTrigger, scroll suave con Lenis.
   Todo lo visual se degrada bien: sin JS, sin librerías o con
   "reducir movimiento" el sitio se ve completo y sin animaciones. */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animate = hasGSAP && !reduceMotion;

  const header = $('.site-header');
  const nav = $('#site-nav');
  const menuBtn = $('.menu-btn');
  let lenis = null;

  /* ------------------------------------------------------------------
     Scroll suave (Lenis) conectado al ticker de GSAP
     ------------------------------------------------------------------ */
  if (animate && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* Enlaces internos (#seccion) */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: -8 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    history.pushState(null, '', id);
  });

  /* ------------------------------------------------------------------
     Header: se oculta al bajar y reaparece al subir
     ------------------------------------------------------------------ */
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const goingDown = y > lastY;
    if (!nav.classList.contains('is-open')) {
      header.classList.toggle('is-hidden', goingDown && y > 240);
    }
    lastY = y;
  }, { passive: true });

  /* ------------------------------------------------------------------
     Menú móvil
     ------------------------------------------------------------------ */
  function closeMenu() {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menú';
    if (lenis) lenis.start();
    else document.body.style.overflow = '';
  }
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Cerrar' : 'Menú';
    header.classList.remove('is-hidden');
    if (lenis) open ? lenis.stop() : lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      menuBtn.focus();
    }
  });

  /* ------------------------------------------------------------------
     Formulario (demo: valida, pero no envía nada)
     ------------------------------------------------------------------ */
  const form = $('#form-contacto');
  if (form) {
    const status = $('.form__status', form);
    const messages = {
      nombre: 'Escribí tu nombre.',
      email: 'Escribí un email válido, por ejemplo nombre@dominio.com.',
      mensaje: 'Contanos en qué te podemos ayudar.'
    };
    const showError = (field, on) => {
      field.setAttribute('aria-invalid', on ? 'true' : 'false');
      const slot = $(`[data-error-for="${field.name}"]`, form);
      if (slot) slot.textContent = on ? messages[field.name] : '';
    };
    $$('input, textarea', form).forEach((f) => {
      f.addEventListener('input', () => { if (f.validity.valid) showError(f, false); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = '';
      let firstInvalid = null;
      $$('input, textarea', form).forEach((f) => {
        const bad = !f.validity.valid;
        showError(f, bad);
        if (bad && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      status.textContent = 'Demo: en el sitio final este mensaje llegaría a info@kume.com.ar.';
      form.reset();
    });
  }

  /* Si no se anima, dejamos todo estático y listo */
  if (!animate) {
    document.documentElement.classList.add('no-motion');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Barra de progreso: si el navegador no soporta scroll-driven animations, la hace GSAP */
  if (!CSS.supports('animation-timeline: scroll()')) {
    gsap.to('.progress', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.2 }
    });
  }

  /* ------------------------------------------------------------------
     Hero: el lema "La elección de los que eligen" en tipografía variable
     - Al cargar: las letras suben y engordan desde el peso más fino.
     - Con mouse: cada letra se engorda al acercarse el cursor
       (del Thin del logo fino al peso del logo bold).
     - En pantallas táctiles: una onda suave de peso, en bucle.
     - El mosaico de tiles entra escalonado y se desplaza en paralaje.
     ------------------------------------------------------------------ */
  const hero = $('.hero');
  const slogan = $('.hero__slogan');

  slogan.setAttribute('aria-label', slogan.textContent.replace(/\s+/g, ' ').trim());
  $$('.hero__line', slogan).forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    Array.from(text).forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'l';
      span.textContent = ch === ' ' ? '\u00a0' : ch;
      line.appendChild(span);
    });
  });

  const letters = $$('.l', slogan);
  const BASE = 200;
  const PEAK = 700;
  const state = letters.map(() => ({ w: 100, tw: BASE, shown: -1 }));
  let live = false;

  const paint = () => {
    letters.forEach((el, i) => {
      const s = state[i];
      if (Math.abs(s.w - s.shown) > 0.2) {
        el.style.setProperty('--w', s.w.toFixed(1));
        s.shown = s.w;
      }
    });
  };

  gsap.set(letters, { yPercent: 115 });
  paint();
  gsap.ticker.add(() => {
    if (live && finePointer) {
      state.forEach((s) => { s.w += (s.tw - s.w) * 0.14; });
    }
    paint();
  });

  const intro = gsap.timeline({ onComplete: () => { live = true; startIdle(); } });
  intro
    .to(letters, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.03 }, 0.1)
    .to(state, { w: BASE, duration: 1.4, ease: 'power3.out', stagger: 0.03 }, 0.2)
    .from('.mosaic .tile', {
      scale: 0.82, autoAlpha: 0, duration: 0.9, ease: 'power3.out',
      stagger: { amount: 0.9, from: 'random' }
    }, 0.2);

  if (finePointer) {
    hero.addEventListener('pointermove', (e) => {
      if (!live) return;
      const radius = Math.max(200, window.innerWidth * 0.16);
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
        const k = near * near * (3 - 2 * near); // smoothstep
        state[i].tw = BASE + (PEAK - BASE) * k;
      });
    });
    hero.addEventListener('pointerleave', () => {
      state.forEach((s) => { s.tw = BASE; });
    });
  }

  function startIdle() {
    if (finePointer) return;
    state.forEach((s, i) => {
      gsap.to(s, {
        w: 560, duration: 1.4, ease: 'sine.inOut',
        yoyo: true, repeat: -1, delay: i * 0.09
      });
    });
  }

  /* Mosaico: cada columna se mueve a distinta velocidad al scrollear */
  const speeds = [-70, 60, -110];
  $$('.mosaic__col').forEach((col, i) => {
    gsap.to(col, {
      y: speeds[i], ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  /* ------------------------------------------------------------------
     Botones "magnéticos" y cursor personalizado (solo con mouse)
     ------------------------------------------------------------------ */
  if (finePointer) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });

    const cursor = $('.cursor');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      cursor.classList.add('is-visible');
      cx(e.clientX);
      cy(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('is-active', !!e.target.closest('a, button, [data-cursor]'));
    });
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));

    /* Paneles de producto: la silueta y la foto se mueven un poco en sentido contrario al mouse */
    $$('.panel').forEach((panel) => {
      const parts = [
        { el: $('.panel__deco', panel), k: 36 },
        { el: $('.panel__photo', panel), k: 12 }
      ].filter((p) => p.el).map((p) => ({
        x: gsap.quickTo(p.el, 'x', { duration: 0.9, ease: 'power3' }),
        y: gsap.quickTo(p.el, 'y', { duration: 0.9, ease: 'power3' }),
        k: p.k
      }));
      panel.addEventListener('pointermove', (e) => {
        const r = panel.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        parts.forEach((m) => { m.x(-nx * m.k * 2); m.y(-ny * m.k * 2); });
      });
      panel.addEventListener('pointerleave', () => parts.forEach((m) => { m.x(0); m.y(0); }));
    });
  }

  /* ------------------------------------------------------------------
     Scrollytelling: la ramita crece a medida que se lee (sección fijada)
     ------------------------------------------------------------------ */
  const story = $('.story');
  const steps = $$('.step', story);
  const drawables = $$('.draw', story);
  const groups = $$('[data-group]', story).map((g) => $$('.leaf', g));
  const stem = $('.stem', story);

  drawables.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  gsap.set($$('.leaf', story), { fillOpacity: 0 });
  story.classList.add('is-pinned');
  gsap.set(steps.slice(1), { autoAlpha: 0, y: 28 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: story,
      start: 'top top',
      end: () => '+=' + Math.round(window.innerHeight * 3.2),
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  tl.to(stem, { strokeDashoffset: 0, duration: 3 }, 0);
  steps.forEach((step, i) => {
    if (i > 0) tl.to(step, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' }, i + 0.02);
    tl.to(groups[i], { strokeDashoffset: 0, duration: 0.7, stagger: 0.12 }, i + 0.05);
    tl.to(groups[i], { fillOpacity: (idx, el) => (el.classList.contains('leaf--top') ? 1 : 0.9), duration: 0.25 }, i + 0.7);
    if (i < steps.length - 1) {
      tl.to(step, { autoAlpha: 0, y: -28, duration: 0.2, ease: 'power2.in' }, i + 0.82);
    }
  });
  tl.to({}, { duration: 0.15 }); // pausa final con todo visible

  /* ------------------------------------------------------------------
     Profesionales: los nombres se deslizan en sentido opuesto
     ------------------------------------------------------------------ */
  gsap.matchMedia().add('(min-width: 800px)', () => {
    const trig = { trigger: '.pros__names', start: 'top bottom', end: 'bottom top', scrub: true };
    gsap.fromTo('.pros__line--a', { xPercent: 9 }, { xPercent: -9, ease: 'none', scrollTrigger: trig });
    gsap.fromTo('.pros__line--b', { xPercent: -12 }, { xPercent: 6, ease: 'none', scrollTrigger: trig });
  });

  /* Recalcular posiciones cuando termina de cargar la tipografía */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
