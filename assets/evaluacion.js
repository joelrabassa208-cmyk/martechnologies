/* Evaluación de IA: precios en pesos para Argentina y en dólares para el resto (se puede cambiar a mano). */
(function () {
  var box = document.getElementById('precios');
  if (!box) return;
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var cur = tz.indexOf('America/Argentina') === 0 || tz === 'America/Buenos_Aires' ? 'ars' : 'usd';
  function show(c) {
    cur = c;
    box.querySelectorAll('[data-usd]').forEach(function (el) { el.textContent = el.getAttribute('data-' + c); });
    box.querySelectorAll('.moneda button').forEach(function (b) {
      var on = b.getAttribute('data-moneda') === c;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.style.background = on ? 'rgba(76,141,255,0.22)' : 'transparent';
      b.style.color = on ? '#F4F7FB' : '#AAB7CA';
    });
    var nota = document.getElementById('nota-moneda');
    if (nota) nota.textContent = c === 'ars' ? 'Precios en pesos argentinos, para empresas de Argentina.' : 'Precios en dólares estadounidenses (USD), para empresas fuera de Argentina.';
  }
  box.querySelectorAll('.moneda button').forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-moneda')); });
  });
  show(cur);
})();
