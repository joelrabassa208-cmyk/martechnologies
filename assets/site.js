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
