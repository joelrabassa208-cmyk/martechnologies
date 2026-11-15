/* MAR Technologies — interacciones del sitio */
(function () {
  'use strict';
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Menú móvil */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    var close = function (focusBtn) {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menú');
      if (focusBtn) btn.focus();
    };
    btn.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open) { var a = nav.querySelector('a'); if (a) a.focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) close(true);
    });
  }

  /* Brillo y núcleo 3D que siguen al mouse */
  if (fine && !calm) {
    document.querySelectorAll('[data-spot]').forEach(function (el) {
      var hero = el.getAttribute('data-spot') === 'hero';
      var raf = 0, ev = null;
      el.addEventListener('pointermove', function (e) {
        ev = e;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          var x = ev.clientX - r.left, y = ev.clientY - r.top;
          if (hero) {
            el.style.setProperty('--mx', x + 'px');
            el.style.setProperty('--my', y + 'px');
            el.style.setProperty('--sx', ((x / r.width - 0.5) * 70) + 'px');
            el.style.setProperty('--tx', ((x / r.width - 0.5) * 36) + 'deg');
            el.style.setProperty('--ty', (-14 - (y / r.height - 0.5) * 24) + 'deg');
          } else {
            el.style.setProperty('--gx', x + 'px');
            el.style.setProperty('--gy', y + 'px');
          }
        });
      });
    });
  }

  /* Demo: Comercio / Servicios / Taller */
  var ON = 'linear-gradient(135deg,#4C8DFF,#3DD6F5)';
  document.querySelectorAll('[data-scn]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var k = tab.getAttribute('data-scn');
      document.querySelectorAll('[data-scn]').forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-pressed', String(on));
        t.style.background = on ? ON : 'transparent';
        t.style.color = on ? '#05070C' : '#AAB7CA';
        t.style.boxShadow = on ? '0 0 20px rgba(76,141,255,0.4)' : 'none';
        t.style.fontWeight = on ? '600' : '500';
      });
      document.querySelectorAll('[data-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-panel') !== k;
      });
    });
  });

  /* Formulario de contacto (envío real vía FormSubmit) */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('button[type="submit"]');
    var params = new URLSearchParams(location.search);
    if (params.get('interes') === 'alianza') {
      var r = form.querySelector('input[name="interes"][value="Alianza o inversión"]');
      if (r) r.checked = true;
    }
    var OFERTAS = {
      'asistente-whatsapp': 'Asistente de WhatsApp con IA',
      'turnos': 'Turnos online con recordatorios',
      'catalogo': 'Catálogo con pedidos online',
      'sitio-web': 'Sitio web profesional',
      'cotizador': 'Cotizador automático',
      'a-medida': 'un proyecto a medida'
    };
    var oferta = OFERTAS[params.get('oferta')];
    if (oferta) {
      var msg = form.elements.mensaje;
      if (msg && !msg.value) msg.value = 'Hola, me interesa la oferta de lanzamiento: ' + oferta + '. ';
      var subj = form.querySelector('input[name="_subject"]');
      if (subj) subj.value = 'Consulta por oferta: ' + oferta;
    }
    var rules = {
      nombre: function (v) { return v.trim().length >= 2 ? '' : 'Escribí tu nombre.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Escribí un correo válido, por ejemplo nombre@empresa.com.'; },
      mensaje: function (v) { return v.trim().length >= 10 ? '' : 'Contanos un poco más (al menos 10 caracteres).'; }
    };
    var check = function (name) {
      var input = form.elements[name];
      var msg = rules[name](input.value);
      var err = document.getElementById('e-' + name);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    };
    Object.keys(rules).forEach(function (n) {
      form.elements[n].addEventListener('blur', function () { if (this.value) check(n); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).filter(function (n) { return !check(n); });
      if (bad.length) { form.elements[bad[0]].focus(); return; }
      if (form.elements._honey.value) return;
      submit.disabled = true;
      submit.textContent = 'Enviando…';
      status.className = 'form-status';
      status.textContent = '';
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().then(function (j) { return { ok: res.ok, j: j }; });
      }).then(function (r) {
        if (r.ok && (r.j.success === true || r.j.success === 'true')) {
          status.className = 'form-status ok';
          status.textContent = '¡Gracias! Recibimos tu consulta y te vamos a responder por correo.';
          form.reset();
        } else {
          throw new Error((r.j && r.j.message) || 'Error');
        }
      }).catch(function () {
        status.className = 'form-status fail';
        status.innerHTML = 'No pudimos enviar tu consulta. Probá de nuevo o escribinos a <a href="mailto:info@martechnologies.ar">info@martechnologies.ar</a>.';
      }).then(function () {
        submit.disabled = false;
        submit.textContent = 'Enviar consulta →';
      });
    });
  }

  // Barrido tipo radar: se aplica a toda tarjeta con borde y esquinas redondeadas (cortar el negro de fondo).
  function beamCards() {
    var n = 0;
    document.querySelectorAll('main div, main article, main section, main li, main a, main aside, main figure, main form').forEach(function (el) {
      if (el.closest('.beam-border') || el.classList.contains('mar-beam')) return;
      if (/^(A|BUTTON)$/.test(el.tagName) && el.offsetHeight < 120) return;
      var cs = getComputedStyle(el);
      var bw = parseFloat(cs.borderTopWidth) || 0, r = parseFloat(cs.borderTopLeftRadius) || 0;
      if (bw < 0.5 || bw > 3 || r < 12 || cs.borderTopStyle === 'none') return;
      if (el.offsetWidth < 200 || el.offsetHeight < 110) return;
      if (getComputedStyle(el, '::before').content !== 'none' || getComputedStyle(el, '::after').content !== 'none') return;
      if (el.parentElement && el.parentElement.closest('.mar-beam')) return;
      if (cs.position === 'static') el.style.position = 'relative';
      el.style.setProperty('--bw', bw + 'px');
      el.style.setProperty('--bi', cs.overflow === 'visible' ? (-bw) + 'px' : '0px');
      el.style.setProperty('--beam-delay', (-(n * 0.9) % 4.5).toFixed(1) + 's');
      el.classList.add('mar-beam'); n++;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', beamCards); else beamCards();
})();

/* ---------- Scroll y animación (2026-11) ---------- */
(function () {
  'use strict';
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* Barra de progreso de lectura */
  var bar = document.createElement('div');
  bar.className = 'scroll-bar';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var hero = document.getElementById('inicio');
  var story = document.getElementById('en-accion');
  var phone = story && story.querySelector('.phone');
  /* Tarjetas de cualquier página: invisibles abajo, visibles al llegar al centro de la pantalla.
     Lo que ya se ve al abrir la página queda quieto. */
  var cards = [];
  if (!calm) {
    var cand = document.querySelectorAll('main [style*="grid-template-columns"] > *, main [style*="border-radius"][style*="border: 1px"], main [style*="border-radius"][style*="border:1px"], main .dq-card, main .res-card, main img');
    var small = matchMedia('(max-width:900px)').matches;
    var picked = [];
    for (var j = 0; j < cand.length; j++) {
      var el = cand[j], r0 = el.getBoundingClientRect();
      if (el.closest('#inicio') || el.closest('header') || el.closest('.story-stage')) continue;
      if (r0.height < 56 || r0.width < 120) continue;
      if (r0.top + scrollY < innerHeight * 0.9) continue;   // ya visible al abrir
      picked.push(el);
    }
    if (small) picked = picked.concat(Array.prototype.slice.call(document.querySelectorAll('.story .step')));
    cards = picked.filter(function (c, i, a) {   // sin repetidos y solo la tarjeta de afuera
      if (a.indexOf(c) !== i) return false;
      for (var q = c.parentElement; q; q = q.parentElement) if (a.indexOf(q) !== -1) return false;
      return true;
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = root.scrollHeight - innerHeight;
      bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
      if (calm) return;
      if (hero) {   // el núcleo del inicio se aleja suave al bajar
        var h = Math.min(1, scrollY / (hero.offsetHeight || 1));
        hero.style.setProperty('--hy', (h * 120).toFixed(1));
        hero.style.setProperty('--hs', (h * 0.12).toFixed(3));
      }
      for (var i = 0; i < cards.length; i++) {   // tarjetas: invisibles abajo, visibles al llegar al centro
        var c = cards[i], top = c.getBoundingClientRect().top;
        var k = Math.max(0, Math.min(1, (innerHeight - top) / (innerHeight * 0.5)));
        if (c._k === k) continue;
        c._k = k;
        c.style.opacity = k.toFixed(3);
        c.style.translate = '0 ' + ((1 - k) * 48).toFixed(1) + 'px';
      }
      if (phone) {  // el celular gira a medida que avanzás por la historia
        var r = story.getBoundingClientRect();
        var t = Math.max(0, Math.min(1, (innerHeight - r.top) / (r.height + innerHeight)));
        phone.style.setProperty('--ry', (-22 + t * 40).toFixed(1) + 'deg');
        phone.style.setProperty('--rx', (10 - t * 14).toFixed(1) + 'deg');
        phone.style.setProperty('--rz', (3 - t * 6).toFixed(1) + 'deg');
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!('IntersectionObserver' in window)) return;

  /* Aparición suave de títulos, textos y tarjetas */
  if (!calm) {
    var targets = Array.prototype.filter.call(document.querySelectorAll('main h2, main h2 + p, main h3, .story-head p'), function (el) {
      if (el.closest('#inicio') || el.closest('.story-stage')) return false;
      for (var i = 0; i < cards.length; i++) if (cards[i].contains(el)) return false;   // las tarjetas ya tienen su efecto
      return el.getBoundingClientRect().top + scrollY > innerHeight * 0.9;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    targets.forEach(function (el, i) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', (Math.min(sib, 5) * 0.08) + 's');
      el.classList.add('rv');
      io.observe(el);
    });
  }

  /* Historia: cada paso cambia la pantalla del celular */
  if (story) {
    var shots = story.querySelectorAll('.shot');
    var steps = story.querySelectorAll('.step');
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var k = e.target.getAttribute('data-shot');
        story.setAttribute('data-shot', k);
        steps.forEach(function (s) { s.classList.toggle('on', s === e.target); });
        shots.forEach(function (s, i) { s.classList.toggle('on', String(i) === k); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { so.observe(s); });
    story.setAttribute('data-shot', '0');
  }

  /* Números que cuentan hasta su valor */
  var co = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      var end = +e.target.getAttribute('data-count');
      if (calm) { e.target.textContent = end; return; }
      var t0 = 0, from = end === 4 ? 0 : 60;   // las 4 h suben; los 3 min bajan desde 60
      (function tick(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 1400), ease = 1 - Math.pow(1 - k, 3);
        e.target.textContent = Math.round(from + (end - from) * ease);
        if (k < 1) requestAnimationFrame(tick);
      })(performance.now());
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (n) { co.observe(n); });
})();
