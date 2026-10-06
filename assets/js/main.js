/* küme — sitio
   Animaciones: GSAP + ScrollTrigger, scroll suave con Lenis.
   Todo lo visual se degrada bien: sin JS, sin librerías o con
   "reducir movimiento" el sitio se ve completo y sin animaciones.
   Este archivo lo usan la portada (index.html) y "Sobre küme":
   cada bloque se activa solo si existen sus elementos. */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animate = hasGSAP && !reduceMotion;

  const root = document.documentElement;
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

  const lockScroll = () => { if (lenis) lenis.stop(); root.classList.add('is-locked'); };
  const unlockScroll = () => { if (lenis) lenis.start(); root.classList.remove('is-locked'); };

  /* Enlaces internos (#seccion) de la misma página */
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
    unlockScroll();
  }
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Cerrar' : 'Menú';
    header.classList.remove('is-hidden');
    open ? lockScroll() : unlockScroll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      menuBtn.focus();
    }
  });

  /* ------------------------------------------------------------------
     Formulario de contacto: valida y envía a contacto.php (que manda el mail a info@kume.com.ar)
     ------------------------------------------------------------------ */
  const form = $('#form-contacto');
  if (form) {
    const status = $('.form__status', form);
    const messages = {
      nombre: 'Escriba su nombre.',
      email: 'Escriba un email válido, por ejemplo nombre@dominio.com.',
      mensaje: 'Cuéntenos en qué podemos ayudarle.'
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
      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      status.textContent = 'Enviando…';
      fetch(form.getAttribute('action') || 'contacto.php', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then((r) => r.json().catch(() => ({ ok: false })).then((d) => ({ ok: r.ok && d.ok, d })))
        .then(({ ok, d }) => {
          if (ok) {
            status.textContent = 'Gracias, recibimos su consulta. Le responderemos a la brevedad.';
            form.reset();
          } else {
            status.textContent = (d && d.error) || 'No se pudo enviar. Escríbanos a info@kume.com.ar.';
          }
        })
        .catch(() => { status.textContent = 'No se pudo enviar. Escríbanos a info@kume.com.ar.'; })
        .finally(() => { btn.disabled = false; });
    });
  }

  /* ------------------------------------------------------------------
     Imágenes remotas con respaldo (fotos que se cargan desde kume.com.ar)
     - data-fallback-src: si falla, usa otra imagen local
     - data-fallback-initials: si falla, muestra un bloque de color con iniciales
     ------------------------------------------------------------------ */
  const applyFallback = (img) => {
    if (img.dataset.fallbackSrc && !img.dataset.fellBack) {
      img.dataset.fellBack = '1';
      img.removeAttribute('referrerpolicy');
      img.src = img.dataset.fallbackSrc;
      return;
    }
    if (img.dataset.fallbackInitials && img.parentNode) {
      const span = document.createElement('span');
      span.className = 'photo-fallback';
      span.textContent = img.dataset.fallbackInitials;
      span.setAttribute('role', 'img');
      span.setAttribute('aria-label', img.alt || '');
      img.replaceWith(span);
    }
  };
  $$('img[data-fallback-src], img[data-fallback-initials]').forEach((img) => {
    img.addEventListener('error', () => applyFallback(img));
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) applyFallback(img);
  });

  /* ------------------------------------------------------------------
     Panel lateral de detalle de producto (<dialog>)
     - Se abre desde los paneles de la portada (data-detalle="id").
     - Botones para cambiar de producto sin cerrar.
     - Enlace directo: index.html#producto-gatos
     - Cierra con Esc, con el botón o tocando el fondo.
     ------------------------------------------------------------------ */
  const dialog = $('#detalle');
  if (dialog && typeof dialog.showModal === 'function') {
    const items = $$('.detail__item', dialog);
    const navBtns = $$('[data-producto]', dialog);
    const scroller = $('.detail__scroll', dialog);
    const ids = items.map((it) => it.id.replace('det-', ''));
    let opener = null;

    const show = (id) => {
      items.forEach((it) => { it.hidden = it.id !== 'det-' + id; });
      navBtns.forEach((b) => b.setAttribute('aria-current', String(b.dataset.producto === id)));
      dialog.setAttribute('aria-labelledby', `det-${id}-t`);
      scroller.scrollTop = 0;
      history.replaceState(null, '', '#producto-' + id);
    };

    const open = (id, trigger) => {
      if (!ids.includes(id)) return;
      opener = trigger || null;
      show(id);
      if (!dialog.open) {
        dialog.showModal();
        lockScroll();
      }
    };

    const close = () => {
      if (!dialog.open || dialog.classList.contains('is-closing')) return;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        dialog.classList.remove('is-closing');
        dialog.close();
      };
      dialog.classList.add('is-closing');
      dialog.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, 600);
    };

    dialog.addEventListener('close', () => {
      unlockScroll();
      history.replaceState(null, '', location.pathname + location.search);
      if (opener) opener.focus();
    });
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
    $('.detail__close', dialog).addEventListener('click', close);
    navBtns.forEach((b) => b.addEventListener('click', () => show(b.dataset.producto)));

    $$('[data-detalle]').forEach((a) => {
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        open(a.dataset.detalle, a);
      });
    });

    const m = location.hash.match(/^#producto-(.+)$/);
    if (m) open(m[1], null);
  }


  /* ------------------------------------------------------------------
     Grupos de chips con rol radiogroup: clic y flechas del teclado.
     onPick(valor) se llama cada vez que cambia la selección.
     ------------------------------------------------------------------ */
  function radioGroup(group, onPick) {
    if (!group) return null;
    const btns = $$('.chip', group);
    const pick = (btn) => {
      btns.forEach((b) => {
        const on = b === btn;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      onPick(btn.dataset.valor);
    };
    btns.forEach((b, i) => {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', () => pick(b));
      b.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const next = btns[(i + d + btns.length) % btns.length];
        next.focus();
        pick(next);
      });
    });
    return { pick };
  }

  /* ------------------------------------------------------------------
     Guía rápida: mascota + objetivo → producto recomendado
     El resultado ya viene resuelto en el HTML (perro + diario),
     así que sin JS la sección se lee igual.
     ------------------------------------------------------------------ */
  const guia = $('.guia');
  if (guia) {
    const PRODUCTOS = {
      'perros': {
        color: 'naranja', img: 'assets/img/pack-perros.webp',
        label: 'Alimento holístico', title: 'Perros',
        text: 'Un único alimento para todas las etapas de la vida, razas y tamaños. Con componentes herbales naturales y croquetas standard o pequeñas.',
        pres: '3 kg y 15 kg'
      },
      'gatos': {
        color: 'verde', img: 'assets/img/pack-gatos.webp',
        label: 'Alimento holístico', title: 'Gatos',
        text: 'Grain free, libre de granos, con componentes herbales naturales. Con control de bolas de pelo y cuidado del tracto urinario.',
        pres: '1,5 kg y 10 kg'
      },
      'omegas': {
        color: 'gris', img: 'assets/img/pack-omegas.webp',
        label: 'Suplemento dietario', title: 'Omegas 3 y 6',
        text: 'Aceite de pescados azules de mares fríos con vitamina E. Favorece una piel humectada y elástica, con el pelo suave y brillante.',
        pres: '250 ml y 500 ml'
      },
      'muscular-plus': {
        color: 'violeta', img: 'assets/img/pack-muscular-plus.webp',
        label: 'Concentrado proteico en polvo', title: 'Muscular Plus',
        text: 'El suplemento proteico para el desarrollo y regeneración muscular - alta competencia -',
        pres: '250 g'
      },
      'recovery-forte': {
        color: 'violeta', img: 'assets/img/pack-recovery-forte.webp',
        label: 'Concentrado proteico en polvo', title: 'Recovery Forte',
        text: 'Cuando hay razones específicas para reforzar la alimentación y la recuperación en adultos y cachorros.',
        pres: '250 g'
      }
    };

    /* objetivo → producto; 'diario' depende de la mascota */
    const ELECCION = {
      diario: { perro: 'perros', gato: 'gatos' },
      pelo: { perro: 'omegas', gato: 'omegas' },
      muscular: { perro: 'muscular-plus', gato: 'muscular-plus' },
      recuperacion: { perro: 'recovery-forte', gato: 'recovery-forte' }
    };

    const PARA = {
      diario: { perro: 'Para su perro, todos los días', gato: 'Para su gato, todos los días' },
      pelo: { perro: 'Para la piel y el pelo de su perro', gato: 'Para la piel y el pelo de su gato' },
      muscular: { perro: 'Para el desarrollo muscular de su perro', gato: 'Para el desarrollo muscular de su gato' },
      recuperacion: { perro: 'Para la recuperación de su perro', gato: 'Para la recuperación de su gato' }
    };

    const out = $('#guia-resultado');
    const els = {
      img: $('#guia-img'), para: $('.guia__para', out), label: $('#guia-label'),
      title: $('#guia-title'), text: $('#guia-text'), pres: $('#guia-pres'), cta: $('#guia-detalle')
    };
    let mascota = 'perro';
    let objetivo = 'diario';

    const render = () => {
      const id = ELECCION[objetivo][mascota];
      const pr = PRODUCTOS[id];
      out.className = 'guia__out guia__out--' + pr.color;
      els.img.src = pr.img;
      els.img.alt = '';
      els.para.textContent = PARA[objetivo][mascota];
      els.label.textContent = pr.label;
      els.title.textContent = pr.title;
      els.text.textContent = pr.text;
      els.pres.textContent = pr.pres;
      els.cta.dataset.detalle = id;
      els.cta.setAttribute('href', '#producto-' + id);
      if (animate) gsap.fromTo(out, { autoAlpha: .35 }, { autoAlpha: 1, duration: .35, ease: 'power2.out' });
    };

    radioGroup($('[data-grupo="mascota"]', guia), (v) => { mascota = v; render(); });
    radioGroup($('[data-grupo="objetivo"]', guia), (v) => { objetivo = v; render(); });
  }

  /* ------------------------------------------------------------------
     Dónde comprar: filtro por zona (sin JS se ve el listado completo)
     ------------------------------------------------------------------ */
  const stores = $('.stores');
  if (stores && $('#stores-empty')) {
    const list = $$('.store', stores);
    const vacio = $('#stores-empty');
    radioGroup($('[data-grupo="zona"]', stores), (zona) => {
      let visibles = 0;
      list.forEach((li) => {
        const on = zona === 'todas' || li.dataset.zona === zona;
        li.hidden = !on;
        if (on) visibles++;
      });
      vacio.hidden = visibles > 0;
      if (animate) ScrollTrigger.refresh();
    });
  }


  /* ------------------------------------------------------------------
     v3 · Carrusel de productos (celular y tablet)
     El carrusel es CSS puro (scroll-snap); esto suma el contador,
     la barra, las flechas y el producto activo. Funciona también
     con "reducir movimiento".
     ------------------------------------------------------------------ */
  const panelsEl = $('#panels');
  const carouselMQ = matchMedia('(hover: none), (max-width: 1199.98px)');
  if (panelsEl) {
    const cards = $$('.panel', panelsEl);
    const count = $('.panels-nav__count b');
    const bar = $('.panels-nav__bar i');
    const [prev, next] = $$('.panels-nav__btn');
    let current = -1;

    const setActive = (i) => {
      if (i === current) return;
      current = i;
      cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
      if (count) count.textContent = String(i + 1).padStart(2, '0');
      if (bar) bar.style.transform = `scaleX(${(i + 1) / cards.length})`;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === cards.length - 1;
    };

    const nearest = () => {
      const left = panelsEl.getBoundingClientRect().left + parseFloat(getComputedStyle(panelsEl).scrollPaddingInlineStart || 0);
      let best = 0, dist = Infinity;
      cards.forEach((c, k) => {
        const d = Math.abs(c.getBoundingClientRect().left - left);
        if (d < dist) { dist = d; best = k; }
      });
      // al final del recorrido, el último queda activo aunque no llegue a alinearse
      if (panelsEl.scrollLeft + panelsEl.clientWidth >= panelsEl.scrollWidth - 4) best = cards.length - 1;
      return best;
    };

    let raf = 0;
    panelsEl.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(nearest()));
    }, { passive: true });

    const go = (dir) => {
      const target = cards[Math.max(0, Math.min(cards.length - 1, current + dir))];
      panelsEl.scrollTo({ left: target.offsetLeft - panelsEl.offsetLeft - parseFloat(getComputedStyle(panelsEl).paddingLeft), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));

    setActive(0);

    /* Pista de "deslizá": la primera vez que el carrusel entra en pantalla, se asoma el siguiente */
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting || !carouselMQ.matches) return;
          io.disconnect();
          if (panelsEl.scrollLeft > 0) return;
          setTimeout(() => {
            panelsEl.scrollTo({ left: 70, behavior: 'smooth' });
            setTimeout(() => panelsEl.scrollTo({ left: 0, behavior: 'smooth' }), 550);
          }, 350);
        });
      }, { threshold: 0.6 });
      io.observe(panelsEl);
    }
  }

  /* Si no se anima, dejamos todo estático y listo */
  if (!animate) {
    root.classList.add('no-motion');
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
     - Con mouse: cada letra se engorda al acercarse el cursor.
     - En pantallas táctiles: una onda suave de peso, en bucle.
     - El mosaico de tiles entra escalonado y se desplaza en paralaje.
     ------------------------------------------------------------------ */
  const hero = $('.hero');
  if (hero) {
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
  }

  /* ------------------------------------------------------------------
     Botones "magnéticos" (solo con mouse)
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


    /* Paneles de producto: la silueta y la foto se mueven un poco en sentido contrario al mouse */
    $$('.panel').forEach((panel) => {
      const parts = [
        { el: $('.panel__deco', panel), k: 36 },
        { el: $('.panel__pack', panel), k: 14 }
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

  /* Alimento holístico: los textos entran al aparecer; la flor se anima sola en loop (CSS) */
  if ($('.story')) {
    gsap.from($$('.story .step'), {
      y: 32, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .14,
      scrollTrigger: { trigger: '.story__steps', start: 'top 82%' }
    });
  }

  /* ------------------------------------------------------------------
     Profesionales (portada): los nombres se deslizan en sentido opuesto
     ------------------------------------------------------------------ */
  if ($('.pros__names')) {
    gsap.matchMedia().add('(min-width: 800px)', () => {
      const trig = { trigger: '.pros__names', start: 'top bottom', end: 'bottom top', scrub: true };
      gsap.fromTo('.pros__line--a', { xPercent: 9 }, { xPercent: -9, ease: 'none', scrollTrigger: trig });
      gsap.fromTo('.pros__line--b', { xPercent: -12 }, { xPercent: 6, ease: 'none', scrollTrigger: trig });
    });
  }

  /* ------------------------------------------------------------------
     Sobre küme
     ------------------------------------------------------------------ */
  if ($('.about-hero')) {
    gsap.from('.about-hero__copy > *', {
      y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.12, delay: 0.1
    });
    gsap.from('.about-hero__fig', { scale: 0.92, autoAlpha: 0, duration: 1.2, ease: 'expo.out', delay: 0.25 });

    gsap.from('.strip .tile', {
      y: 60, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: '.strip', start: 'top 88%' }
    });

    $$('.person').forEach((person) => {
      const photo = $('.person__photo', person);
      const img = $('img', photo);
      if (img) {
        gsap.fromTo(img, { yPercent: -7, scale: 1.14 }, {
          yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
      gsap.from($$('.person__info > *', person), {
        y: 36, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: person, start: 'top 72%' }
      });
    });
  }


  /* ------------------------------------------------------------------
     Entrada de las secciones agregadas (sobria: sube y aparece)
     ------------------------------------------------------------------ */
  if ($('.guia')) {
    gsap.from('.guia__head > *, .guia__group, .guia__out', {
      y: 34, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .07,
      scrollTrigger: { trigger: '.guia', start: 'top 78%' }
    });
  }

  if ($('.voces')) {
    gsap.from('.voce', {
      y: 48, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .12,
      scrollTrigger: { trigger: '.voces__list', start: 'top 82%' }
    });
  }

  if ($('.store')) {
    gsap.from('.store', {
      y: 26, autoAlpha: 0, duration: .6, ease: 'power3.out', stagger: .05,
      scrollTrigger: { trigger: '.stores__list', start: 'top 85%' }
    });
  }


  /* ==================================================================
     v3 · Más ritmo
     ================================================================== */

  /* Cintas cruzadas: marquesina infinita; el scroll la acelera y la da vuelta */
  const ticker = $('.ticker');
  if (ticker) {
    ticker.classList.add('is-js');
    const loops = $$('.ticker__track', ticker).map((track, i) => {
      const dir = i === 0 ? -1 : 1;
      gsap.set(track, { xPercent: dir === -1 ? 0 : -50 });
      return gsap.to(track, {
        xPercent: dir === -1 ? -50 : 0,
        duration: i === 0 ? 38 : 30,
        ease: 'none',
        repeat: -1
      });
    });
    let boost = { v: 1 };
    ScrollTrigger.create({
      trigger: ticker,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        const sign = v < 0 ? -1 : 1;
        const k = sign * Math.min(9, 1 + Math.abs(v) / 180);
        gsap.to(boost, {
          v: k, duration: .25, overwrite: true,
          onUpdate: () => loops.forEach((l) => l.timeScale(boost.v)),
          onComplete: () => gsap.to(boost, {
            v: sign, duration: 1.2, ease: 'power2.out',
            onUpdate: () => loops.forEach((l) => l.timeScale(boost.v))
          })
        });
      }
    });
    gsap.from($$('.ticker__band', ticker), {
      xPercent: (i) => (i ? 18 : -18), autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: .1,
      scrollTrigger: { trigger: ticker, start: 'top 90%' }
    });
  }

  /* Títulos: entran palabra por palabra al aparecer */
  const splitWords = (el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$('.wi', el);
  };
  $$('.products__intro h2, .guia__head h2, .pros__title, .voces__head h2, .news h2, .stores__head h2, .contact__lead h2').forEach((h) => {
    const words = splitWords(h);
    gsap.from(words, {
      yPercent: 115, duration: 1, ease: 'expo.out', stagger: .045,
      scrollTrigger: { trigger: h, start: 'top 86%' }
    });
  });

  /* Escena de la línea: los envases suben al frente, perro y gato entran de los costados,
     los ingredientes flotan a distinta velocidad con el scroll (y con el mouse en PC) */
  const escena = $('.escena');
  if (escena) {
    const prods = $$('.escena__prod', escena);
    const ings = $$('.escena__ing', escena);
    const perro = $('.escena__perro', escena);
    const gato = $('.escena__gato', escena);
    const tl = gsap.timeline({ scrollTrigger: { trigger: escena, start: 'top 80%' } });
    tl.fromTo([perro, gato], { autoAlpha: 0, xPercent: (i) => (i ? 18 : -18) }, { autoAlpha: 1, xPercent: 0, duration: 1.4, ease: 'expo.out' })
      .fromTo(prods, { autoAlpha: 0, yPercent: 22 }, { autoAlpha: 1, yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .08 }, .15)
      .fromTo(ings, { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: 1.1, ease: 'power3.out', stagger: { each: .04, from: 'center' } }, .35);
    /* parallax con el scroll: cada capa se mueve según su profundidad (data-depth) */
    $$('.escena__capa', escena).forEach((el) => {
      const d = parseFloat(el.dataset.depth) || .3;
      gsap.fromTo(el, { y: d * 70 }, {
        y: d * -70, ease: 'none',
        scrollTrigger: { trigger: escena, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    /* PC: con el mouse la escena gana profundidad; los envases se destacan al pasar por encima */
    if (finePointer) {
      const capas = $$('.escena__capa', escena).map((el) => ({
        x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3' }),
        d: parseFloat(el.dataset.depth) || .3
      }));
      escena.addEventListener('pointermove', (e) => {
        const r = escena.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        capas.forEach((c) => c.x(-nx * c.d * 60));
      });
      escena.addEventListener('pointerleave', () => capas.forEach((c) => c.x(0)));
      prods.forEach((el) => {
        el.addEventListener('pointerenter', () => gsap.to(el, { scale: 1.05, duration: .5, ease: 'power3.out' }));
        el.addEventListener('pointerleave', () => gsap.to(el, { scale: 1, duration: .6, ease: 'power3.out' }));
      });
    }
  }

  /* Paneles de producto: entrada escalonada (en PC); en carrusel, entran de costado */
  if (panelsEl) {
    const mm = gsap.matchMedia();
    mm.add('(hover: hover) and (min-width: 1200px)', () => {
      gsap.from($$('.panel', panelsEl), {
        yPercent: 18, clipPath: 'inset(100% 0% 0% 0%)', duration: 1.1, ease: 'expo.out', stagger: .09,
        scrollTrigger: { trigger: panelsEl, start: 'top 82%' }
      });
      gsap.fromTo($$('.panel__pack img', panelsEl), { y: 120 }, {
        y: 0, clearProps: 'transform', duration: 1.3, ease: 'expo.out', stagger: .09, delay: .15,
        scrollTrigger: { trigger: panelsEl, start: 'top 82%' }
      });
    });
    mm.add('(hover: none), (max-width: 1199.98px)', () => {
      gsap.from($$('.panel', panelsEl).slice(0, 3), {
        x: 120, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .08,
        scrollTrigger: { trigger: panelsEl, start: 'top 85%' }
      });
    });
  }

  /* küme en números: cuentan hasta su valor y engordan de fino a bold (tipografía variable) */
  const stats = $$('.stat__n');
  if (stats.length) {
    stats.forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      const o = { n: 0, w: 100 };
      el.setAttribute('aria-label', pre + end + suf);
      const paintStat = () => {
        el.textContent = pre + Math.round(o.n) + suf;
        el.style.setProperty('--w', o.w.toFixed(0));
      };
      paintStat();
      gsap.to(o, {
        n: end, w: 800, duration: end > 9 ? 1.8 : 1.2, ease: 'power3.out', onUpdate: paintStat,
        scrollTrigger: { trigger: '.stats', start: 'top 75%' }
      });
    });
    gsap.from('.stat', {
      y: 40, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: '.stats', start: 'top 80%' }
    });
  }

  /* Recalcular posiciones cuando termina de cargar la tipografía */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
