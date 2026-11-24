/* dark/light toggle. Choice is saved; defaults to the system preference. Initial class is set by the inline snippet in <head> (no flash). */
(function () {
  var R = document.documentElement, ar = (localStorage.getItem('and_lang') !== 'en'), K = 'and_theme';
  var sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>', moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>';
  function cur() { return R.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function paint() { var d = cur() === 'dark'; [].forEach.call(document.querySelectorAll('.themebtn'), function (b) { b.innerHTML = d ? sun : moon; b.setAttribute('aria-label', d ? (ar ? 'الوضع الفاتح' : 'Light mode') : (ar ? 'الوضع الداكن' : 'Dark mode')); b.title = b.getAttribute('aria-label'); }); var r2 = document.getElementById('themebtn2'); if (r2) { r2.textContent = d ? (ar ? 'الوضع الفاتح' : 'Light mode') : (ar ? 'الوضع الداكن' : 'Dark mode'); r2.onclick = function () { set(cur() === 'dark' ? 'light' : 'dark'); }; } var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = d ? '#16110d' : '#6b5a4c'; }
  function set(v) { R.setAttribute('data-theme', v); try { localStorage.setItem(K, v); } catch (e) { } paint(); }
  function mount() {
    if (document.querySelector('.themebtn')) return;
    var b = document.createElement('button'); b.className = 'themebtn'; b.type = 'button'; b.onclick = function () { set(cur() === 'dark' ? 'light' : 'dark'); };
    var bar = document.querySelector('header.top .bar'), cart = bar && bar.querySelector('a[href="cart.html"]');
    if (cart) cart.parentNode.insertBefore(b, cart); else { var tb = document.querySelector('.adm-top .wrap'); if (tb) tb.appendChild(b); else return; }
    paint();
  }
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', mount); mount(); paint();
  window.matchMedia && matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) { if (!localStorage.getItem(K)) { R.setAttribute('data-theme', e.matches ? 'dark' : 'light'); paint(); } });
})();
