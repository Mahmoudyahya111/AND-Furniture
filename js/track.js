/* First-party visit analytics for the AND.Furniture store only.
   Sends: page, referrer host, UTM tags, whether a Meta click id (fbclid) was present, device type, a random per-tab session id,
   and seconds on page. No names, no IPs, no cookies, no third party. Writes only to this store's own Supabase project (js/config.js).
   Limits: in-app browsers (Facebook/Instagram), ad blockers and "do not track" settings can hide some visits, so counts are a minimum. */
(function () {
  var C = window.AND_CFG; if (!C || !C.url || !C.key) return;
  try {
    if (localStorage.getItem('and_qa') !== '1') {
      if (/bot|crawl|spider|headless|lighthouse|preview/i.test(navigator.userAgent) || navigator.webdriver || navigator.doNotTrack === '1') return;
    }
  } catch (e) { }
  var q = new URLSearchParams(location.search), ss = sessionStorage, sid = ss.getItem('and_sid');
  if (!sid) { sid = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, '').slice(0, 32); ss.setItem('and_sid', sid); }
  var att = null; try { att = JSON.parse(ss.getItem('and_att')); } catch (e) { }
  if (!att) {
    var rh = ''; try { rh = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; if (rh === location.hostname) rh = ''; } catch (e) { }
    att = { s: q.get('utm_source') || '', m: q.get('utm_medium') || '', c: q.get('utm_campaign') || '', n: q.get('utm_content') || '', t: q.get('utm_term') || '', f: !!q.get('fbclid'), r: rh };
    ss.setItem('and_att', JSON.stringify(att));
  }
  var file = location.pathname.split('/').pop() || 'index.html', key = file;
  if (file === 'product.html' && q.get('id')) key += '?id=' + q.get('id').slice(0, 40);
  var ua = navigator.userAgent, device = /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : /iPad|Tablet/i.test(ua) ? 'tablet' : 'desktop', inapp = /FBAN|FBAV|FB_IAB|Instagram/i.test(ua);
  function send(ev, secs, keep) {
    var b = { p_session: sid, p_event: ev, p_path: key, p_title: document.title.slice(0, 120), p_secs: secs || 0, p_ref: att.r, p_source: att.s, p_medium: att.m, p_campaign: att.c, p_content: att.n, p_term: att.t, p_fbclid: att.f, p_device: device, p_inapp: inapp };
    try { fetch(C.url + '/rest/v1/rpc/track_event', { method: 'POST', keepalive: !!keep, headers: { apikey: C.key, Authorization: 'Bearer ' + C.key, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); } catch (e) { }
  }
  send('view');
  function ping() { if (document.visibilityState !== 'visible') return; var b = { p_session: sid, p_path: key, p_ref: att.r, p_source: att.s, p_medium: att.m, p_campaign: att.c, p_fbclid: att.f, p_device: device }; try { fetch(C.url + '/rest/v1/rpc/track_ping', { method: 'POST', headers: { apikey: C.key, Authorization: 'Bearer ' + C.key, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); } catch (e) { } }
  ping(); setInterval(ping, 30000); document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') ping(); });
  var vis = 0, t0 = document.visibilityState === 'visible' ? Date.now() : 0, sent = false;
  function stop() { if (t0) { vis += Date.now() - t0; t0 = 0; } }
  function flush() { stop(); var s = Math.round(vis / 1000); if (s >= 1 && !sent) { sent = true; send('engage', s, true); } }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); else { t0 = Date.now(); sent = false; vis = 0; } });
  window.addEventListener('pagehide', flush);
})();
