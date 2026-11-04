/* Diagnóstico gratis de MAR Technologies: preguntas → recomendación con rango de precio → reunión por Google Meet. */
(function () {
  'use strict';
  var root = document.getElementById('dq');
  if (!root) return;

  // Link de la agenda de citas de Google Calendar (con Meet). Si está vacío, coordinamos por correo.
  var BOOKING_URL = '';
  var FORM_URL = 'https://formsubmit.co/ajax/info@martechnologies.ar';

  var SERVICES = {
    whatsapp: { name: 'Asistente de WhatsApp con IA', before: 800, from: 400, monthly: 80, weeks: '2 a 4 semanas', oferta: 'asistente-whatsapp',
      what: 'Responde las consultas repetidas a toda hora y te pasa la conversación cuando hace falta una persona.' },
    turnos: { name: 'Turnos online con recordatorios', before: 1000, from: 500, monthly: 40, weeks: '3 a 5 semanas', oferta: 'turnos',
      what: 'Tus clientes reservan solos y reciben un recordatorio por WhatsApp. Menos ausencias y menos llamadas.' },
    catalogo: { name: 'Catálogo con pedidos online', before: 2500, from: 1250, monthly: 60, weeks: '5 a 10 semanas', oferta: 'catalogo',
      what: 'Lista de precios siempre al día, stock visible y pedidos ordenados sin cargarlos a mano.' },
    cotizador: { name: 'Cotizador automático', before: 1200, from: 600, monthly: 40, weeks: '3 a 6 semanas', oferta: 'cotizador',
      what: 'Presupuestos en minutos con tus precios y recordatorios para que ninguna venta quede sin seguimiento.' },
    web: { name: 'Sitio web profesional', before: 800, from: 400, monthly: 30, weeks: '2 a 5 semanas', oferta: 'sitio-web',
      what: 'Un sitio rápido y claro, pensado para que quien entra te escriba. Se ve perfecto en el celular.' },
    medida: { name: 'Automatización a medida', before: 0, from: 250, monthly: 0, weeks: 'piloto de 2 a 4 semanas', oferta: 'a-medida',
      what: 'Conectamos tus planillas y sistemas para que los datos no se carguen dos veces. Arrancamos con un piloto chico.' }
  };

  var Q = [
    { id: 'rubro', title: '¿A qué se dedica tu negocio?', type: 'one', options: [
      ['comercio', 'Comercio o tienda'], ['distribuidora', 'Distribuidora o mayorista'], ['turnos', 'Servicios con turnos (salud, estética, talleres)'],
      ['estudio', 'Estudio profesional (contable, legal, otros)'], ['inmobiliaria', 'Inmobiliaria'], ['otro', 'Otro rubro']] },
    { id: 'equipo', title: '¿Cuántas personas trabajan?', type: 'one', options: [
      ['1', 'Solo yo'], ['2-5', 'De 2 a 5'], ['6-20', 'De 6 a 20'], ['20+', 'Más de 20']] },
    { id: 'dolor', title: '¿Dónde se les va más tiempo?', hint: 'Podés elegir más de una.', type: 'many', options: [
      ['consultas', 'Responder consultas por WhatsApp o redes'], ['turnos', 'Coordinar turnos y agenda'], ['pedidos', 'Tomar pedidos y pasar precios'],
      ['presupuestos', 'Armar presupuestos'], ['datos', 'Cargar datos en planillas o sistemas'], ['clientes', 'Conseguir clientes nuevos o mostrarse online']] },
    { id: 'herramientas', title: '¿Qué usan hoy para trabajar?', hint: 'Podés elegir más de una.', type: 'many', options: [
      ['whatsapp', 'WhatsApp'], ['planillas', 'Planillas (Excel o Google)'], ['sistema', 'Un sistema de gestión'], ['papel', 'Papel o cuaderno'], ['web', 'Una página web']] },
    { id: 'urgencia', title: '¿Para cuándo lo necesitás?', type: 'one', options: [
      ['ya', 'Ya, nos está costando plata'], ['pronto', 'En 1 a 3 meses'], ['averiguando', 'Estoy averiguando']] },
    { id: 'presupuesto', title: '¿Qué inversión imaginás?', type: 'one', options: [
      ['-500', 'Menos de USD 500'], ['500-1500', 'Entre USD 500 y 1.500'], ['1500+', 'Más de USD 1.500'], ['nose', 'No sé todavía']] }
  ];

  var A = { dolor: [], herramientas: [] };
  var step = 0;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function usd(n) { return 'USD ' + n.toLocaleString('es-AR'); }
  function label(q, v) { var o = q.options.filter(function (x) { return x[0] === v; })[0]; return o ? o[1] : v; }
  function qById(id) { return Q.filter(function (q) { return q.id === id; })[0]; }

  function progress() {
    var total = Q.length + 1, p = el('div', 'dq-progress');
    var bar = el('div', 'dq-bar'), fill = el('i');
    fill.style.width = Math.round(100 * Math.min(step, total) / total) + '%';
    bar.appendChild(fill);
    p.appendChild(el('span', null, step < total ? 'Paso ' + (step + 1) + ' de ' + total : 'Resultado'));
    p.appendChild(bar);
    return p;
  }

  function render() {
    root.innerHTML = '';
    root.appendChild(progress());
    if (step < Q.length) return renderQuestion(Q[step]);
    if (step === Q.length) return renderContact();
    renderResult();
  }

  function nav(canNext, onNext, nextText) {
    var row = el('div', 'dq-nav');
    if (step > 0) {
      var back = el('button', 'dq-back', '← Atrás'); back.type = 'button';
      back.onclick = function () { step--; render(); };
      row.appendChild(back);
    }
    var next = el('button', 'dq-next', nextText || 'Siguiente →'); next.type = 'button'; next.disabled = !canNext;
    next.onclick = onNext;
    row.appendChild(next);
    return { row: row, next: next };
  }

  function renderQuestion(q) {
    var h = el('h2', 'dq-title', q.title); root.appendChild(h);
    if (q.hint) root.appendChild(el('p', 'dq-hint', q.hint));
    var grid = el('div', 'dq-options');
    var controls;
    q.options.forEach(function (o) {
      var b = el('button', 'dq-opt', o[1]); b.type = 'button';
      var on = q.type === 'one' ? A[q.id] === o[0] : A[q.id].indexOf(o[0]) >= 0;
      if (on) b.classList.add('on');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.onclick = function () {
        if (q.type === 'one') { A[q.id] = o[0]; step++; render(); return; }
        var i = A[q.id].indexOf(o[0]);
        if (i >= 0) A[q.id].splice(i, 1); else A[q.id].push(o[0]);
        b.classList.toggle('on'); b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
        controls.next.disabled = !A[q.id].length;
      };
      grid.appendChild(b);
    });
    root.appendChild(grid);
    controls = nav(q.type === 'one' ? !!A[q.id] : A[q.id].length > 0, function () { step++; render(); });
    if (q.type === 'one' && !A[q.id]) controls.next.hidden = true;
    root.appendChild(controls.row);
    h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
  }

  function field(lbl, input, help) {
    var w = el('label', 'dq-field'); w.appendChild(el('span', null, lbl)); w.appendChild(input);
    if (help) w.appendChild(el('small', null, help));
    return w;
  }
  function input(name, type, ph, value) {
    var i = el('input'); i.name = name; i.type = type || 'text'; if (ph) i.placeholder = ph; if (value) i.value = value; return i;
  }

  function renderContact() {
    root.appendChild(el('h2', 'dq-title', '¡Listo! ¿A quién le mandamos el resultado?'));
    root.appendChild(el('p', 'dq-hint', 'Te lo mostramos ya mismo en pantalla y te lo enviamos por correo.'));
    var f = el('div', 'dq-form');
    var nombre = input('nombre', 'text', 'Tu nombre', A.nombre), empresa = input('empresa', 'text', 'Nombre del negocio', A.empresa);
    var email = input('email', 'email', 'nombre@empresa.com', A.email), wa = input('whatsapp', 'tel', '+54 9 …', A.whatsapp);
    var problema = el('textarea'); problema.name = 'problema'; problema.rows = 3; problema.placeholder = 'Ej.: los pedidos llegan por WhatsApp y los pasamos a mano a una planilla.'; problema.value = A.problema || '';
    var honey = input('_honey', 'text'); honey.className = 'dq-honey'; honey.tabIndex = -1; honey.setAttribute('autocomplete', 'off');
    f.appendChild(field('Nombre', nombre)); f.appendChild(field('Negocio', empresa));
    f.appendChild(field('Correo', email)); f.appendChild(field('WhatsApp (opcional)', wa));
    var full = field('Contanos el problema en una frase (opcional)', problema); full.classList.add('dq-full'); f.appendChild(full);
    f.appendChild(honey);
    root.appendChild(f);
    var err = el('p', 'dq-err'); err.setAttribute('role', 'alert'); root.appendChild(err);
    var c = nav(true, function () {
      A.nombre = nombre.value.trim(); A.empresa = empresa.value.trim(); A.email = email.value.trim(); A.whatsapp = wa.value.trim(); A.problema = problema.value.trim();
      if (A.nombre.length < 2) { err.textContent = 'Escribí tu nombre.'; nombre.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(A.email)) { err.textContent = 'Escribí un correo válido, por ejemplo nombre@empresa.com.'; email.focus(); return; }
      if (honey.value) return;
      step++; render(); send();
    }, 'Ver mi diagnóstico →');
    root.appendChild(c.row);
  }

  function recommend() {
    var score = { whatsapp: 0, turnos: 0, catalogo: 0, cotizador: 0, web: 0, medida: 0 };
    var map = { consultas: 'whatsapp', turnos: 'turnos', pedidos: 'catalogo', presupuestos: 'cotizador', datos: 'medida', clientes: 'web' };
    A.dolor.forEach(function (d) { score[map[d]] += 10; });
    var sector = { comercio: ['whatsapp', 'web'], distribuidora: ['catalogo', 'cotizador'], turnos: ['turnos', 'whatsapp'], estudio: ['turnos', 'medida'], inmobiliaria: ['whatsapp', 'web'], otro: [] }[A.rubro] || [];
    sector.forEach(function (s, i) { score[s] += 3 - i; });
    if (A.herramientas.indexOf('web') < 0) score.web += 1;
    if (A.herramientas.indexOf('planillas') >= 0 || A.herramientas.indexOf('papel') >= 0) { score.medida += 1; score.catalogo += 1; }
    var order = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
    return { main: order[0], second: score[order[1]] >= 10 ? order[1] : null };
  }

  function why(key) {
    var d = A.dolor, r = {
      whatsapp: d.indexOf('consultas') >= 0 ? 'nos contaste que se les va tiempo respondiendo consultas' : 'en tu rubro las consultas repetidas suelen ocupar mucho tiempo',
      turnos: d.indexOf('turnos') >= 0 ? 'coordinar turnos y agenda les lleva tiempo' : 'en tu rubro la agenda suele manejarse a mano',
      catalogo: d.indexOf('pedidos') >= 0 ? 'tomar pedidos y pasar precios les consume horas' : 'trabajan con listas de precios y pedidos',
      cotizador: d.indexOf('presupuestos') >= 0 ? 'armar presupuestos les lleva tiempo' : 'cotizar rápido suele definir la venta en tu rubro',
      web: d.indexOf('clientes') >= 0 ? 'quieren conseguir clientes nuevos y mostrarse mejor online' : 'hoy no tienen una página que traiga consultas',
      medida: 'cargan los mismos datos en planillas o sistemas'
    };
    return r[key];
  }

  function summaryText(rec) {
    var lines = [
      'Rubro: ' + label(qById('rubro'), A.rubro),
      'Equipo: ' + label(qById('equipo'), A.equipo),
      'Pierden tiempo en: ' + A.dolor.map(function (v) { return label(qById('dolor'), v); }).join('; '),
      'Usan hoy: ' + A.herramientas.map(function (v) { return label(qById('herramientas'), v); }).join('; '),
      'Urgencia: ' + label(qById('urgencia'), A.urgencia),
      'Inversión: ' + label(qById('presupuesto'), A.presupuesto),
      'Recomendación: ' + SERVICES[rec.main].name + (rec.second ? ' + ' + SERVICES[rec.second].name : '')
    ];
    if (A.problema) lines.push('Problema: ' + A.problema);
    return lines.join('\n');
  }

  var sent = false;
  function send() {
    if (sent) return; sent = true;
    var rec = recommend();
    var data = {
      _subject: 'Diagnóstico web: ' + (A.empresa || A.nombre) + ' — ' + SERVICES[rec.main].name,
      _template: 'table', _captcha: 'false',
      nombre: A.nombre, empresa: A.empresa || '-', email: A.email, whatsapp: A.whatsapp || '-',
      diagnostico: summaryText(rec), origen: 'Diagnóstico gratis (martechnologies.ar/diagnostico)'
    };
    fetch(FORM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
      .catch(function () { sent = false; });
  }

  function serviceCard(key, main) {
    var s = SERVICES[key], c = el('div', 'dq-rec' + (main ? ' main' : ''));
    c.appendChild(el('p', 'dq-kicker', main ? 'LO QUE MÁS TE CONVIENE' : 'TAMBIÉN TE PUEDE SERVIR'));
    c.appendChild(el('h3', null, s.name));
    c.appendChild(el('p', 'dq-why', 'Porque ' + why(key) + '. ' + s.what));
    var price = el('p', 'dq-price');
    if (s.before) price.appendChild(el('s', null, usd(s.before)));
    price.appendChild(el('span', null, (s.before ? ' Desde ' : 'Desde ') + usd(s.from)));
    c.appendChild(price);
    c.appendChild(el('p', 'dq-meta', (s.monthly ? '+ mantenimiento desde ' + usd(s.monthly) + '/mes · ' : '') + 'Listo en ' + s.weeks + (s.before ? ' · 50% off de lanzamiento' : '')));
    return c;
  }

  function renderResult() {
    var rec = recommend(), s = SERVICES[rec.main];
    root.appendChild(el('h2', 'dq-title', (A.nombre ? A.nombre.split(' ')[0] + ', este' : 'Este') + ' es tu diagnóstico'));
    root.appendChild(serviceCard(rec.main, true));
    if (rec.second) root.appendChild(serviceCard(rec.second, false));
    if (A.presupuesto === '-500' && s.from > 500) {
      root.appendChild(el('p', 'dq-note', 'Si preferís arrancar con menos inversión, podemos hacer un piloto chico desde USD 250 y crecer después.'));
    }
    var next = el('div', 'dq-next-step');
    next.appendChild(el('h3', null, 'Siguiente paso: una reunión de 30 minutos por Google Meet'));
    next.appendChild(el('p', null, 'Nos contás tu caso, te hacemos algunas preguntas para entender el problema real y después te mandamos un presupuesto cerrado por escrito. Sin costo y sin compromiso.'));
    if (BOOKING_URL) {
      var a = el('a', 'dq-cta', 'Elegir día y hora →'); a.href = BOOKING_URL; a.target = '_blank'; a.rel = 'noopener';
      next.appendChild(a);
    } else {
      next.appendChild(el('p', 'dq-ok', '✓ Ya recibimos tus respuestas. Te escribimos a ' + A.email + ' dentro de las próximas 24 horas hábiles con días y horarios para la reunión.'));
    }
    var more = el('a', 'dq-link', 'Ver todas las ofertas'); more.href = '../ofertas/';
    next.appendChild(more);
    root.appendChild(next);
    var again = el('button', 'dq-back', 'Hacer el diagnóstico de nuevo'); again.type = 'button';
    again.onclick = function () { A = { dolor: [], herramientas: [] }; step = 0; sent = false; render(); };
    root.appendChild(again);
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  render();
})();
