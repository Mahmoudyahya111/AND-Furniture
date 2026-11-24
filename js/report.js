/* AND.Furniture PDF reports (jsPDF + autotable, bundled locally so they work on phones with no CDN).
   ANDReport.pdf({ file, title, subtitle, lang:'ar'|'en', landscape, kpis:[[label,value,note]], sections:[{title, head:[], rows:[[]], align:['l'|'r']}] }) */
window.ANDReport = (function () {
  var P = {}, BASE = (function () { var s = document.currentScript; return s ? s.src.replace(/js\/report\.js.*$/, '') : ''; })();
  function ver() { var s = document.currentScript || [].slice.call(document.scripts).filter(function (x) { return /report\.js/.test(x.src); })[0]; var m = s && s.src.match(/\?v=([0-9a-z]+)/); return m ? '?v=' + m[1] : ''; }
  var V = ver();
  function script(src) { return P[src] || (P[src] = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = BASE + src + V; s.onload = res; s.onerror = function () { delete P[src]; rej(new Error('Could not load the report library.')); }; document.head.appendChild(s); })); }
  function libs() { return script('js/vendor/jspdf.umd.min.js').then(function () { return script('js/vendor/jspdf.plugin.autotable.min.js'); }); }   // plugin must run after jsPDF
  function b64(u) { return fetch(BASE + u + V).then(function (r) { if (!r.ok) throw new Error('Could not load the Arabic font.'); return r.arrayBuffer(); }).then(function (b) { var a = new Uint8Array(b), s = '', i; for (i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); }); }
  var FP; function fonts() { return FP || (FP = Promise.all([b64('fonts/NotoNaskhArabic_400Regular.ttf'), b64('fonts/NotoNaskhArabic_700Bold.ttf')]).catch(function (e) { FP = null; throw e; })); }
  var AR = /[\u0600-\u06FF]/, fixd = function (t) { return typeof t === 'string' && AR.test(t) ? t.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1').replace(/\s*\(\s*/g, ' - ').replace(/\s*\)/g, '') : t; };
  async function arabic(doc) { var f = await fonts(); doc.addFileToVFS('Naskh-r.ttf', f[0]); doc.addFont('Naskh-r.ttf', 'Naskh', 'normal'); doc.addFileToVFS('Naskh-b.ttf', f[1]); doc.addFont('Naskh-b.ttf', 'Naskh', 'bold'); var ot = doc.text; doc.text = function (t, x, y, o) { return ot.call(doc, Array.isArray(t) ? t.map(fixd) : fixd(t), x, y, o); }; }
  var LP; function logo() { return LP || (LP = fetch(BASE + 'img/logo-full.jpg' + V).then(function (r) { return r.blob(); }).then(function (b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { var im = new Image(); im.onload = function () { res({ data: fr.result, w: im.width, h: im.height }); }; im.src = fr.result; }; fr.readAsDataURL(b); }); }).catch(function () { return null; })); }
  /* Phones: auto-download is unreliable (iOS), so always show a sheet with real tap targets (download + open). Desktop also auto-downloads. */
  function deliver(blob, name, ar) {
    var url = URL.createObjectURL(blob), touch = matchMedia('(pointer:coarse)').matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    var m = document.createElement('div'); m.className = 'modal'; m.setAttribute('data-pdf', '1');
    m.innerHTML = '<div class="box" style="max-width:420px;height:auto;max-height:none;border-radius:16px;padding:22px;text-align:center"><h3 style="margin:0 0 6px">' + (ar ? 'التقرير جاهز' : 'Your report is ready') + '</h3><p class="help" dir="auto">' + name + '</p><div style="display:grid;gap:10px;margin-top:14px"><a class="btn gold" id="pdl" href="' + url + '" download="' + name + '">' + (ar ? 'تحميل PDF' : 'Download PDF') + '</a><a class="btn ghost" id="pop" href="' + url + '" target="_blank" rel="noopener">' + (ar ? 'فتح التقرير' : 'Open report') + '</a><button class="btn sm ghost" type="button" id="pcl">' + (ar ? 'إغلاق' : 'Close') + '</button></div></div>';
    document.body.appendChild(m); m.onclick = function (e) { if (e.target === m || e.target.id === 'pcl') { m.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 60000); } };
    if (!touch) setTimeout(function () { var d = m.querySelector('#pdl'); d && d.click(); }, 150);
  }
  var hex = function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
  async function pdf(spec) {
    var ar = spec.lang === 'ar'; await libs(); var lg = await logo(), J = window.jspdf.jsPDF;
    var doc = new J({ orientation: spec.landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' }), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 12, FN = ar ? 'Naskh' : 'helvetica';
    if (ar) await arabic(doc); doc.setFont(FN, 'normal');
    function head() { doc.setFillColor(107, 90, 76); doc.rect(0, 0, W, 28, 'F'); if (lg) { var lh = 20, lw = lh * lg.w / lg.h; doc.addImage(lg.data, 'JPEG', ar ? W - M - lw : M, 4, lw, lh); }
      var tx = ar ? M : W - M, al = { align: ar ? 'left' : 'right' }; doc.setTextColor(232, 205, 140); doc.setFont(FN, 'bold'); doc.setFontSize(15); doc.text(spec.title, tx, 13, al); doc.setFont(FN, 'normal'); doc.setFontSize(8.5); doc.setTextColor(235, 228, 215); doc.text(spec.subtitle || '', tx, 20, al); }
    head(); var y = 36;
    if (spec.kpis && spec.kpis.length) {
      var per = spec.landscape ? 4 : 3, cw = (W - 2 * M - (per - 1) * 4) / per, ch = 19;
      spec.kpis.forEach(function (k, i) { var col = i % per, x = ar ? W - M - cw - col * (cw + 4) : M + col * (cw + 4), yy = y + Math.floor(i / per) * (ch + 4), ax = ar ? x + cw - 3 : x + 3, al = { align: ar ? 'right' : 'left' };
        doc.setFillColor(250, 246, 240); doc.setDrawColor(201, 164, 92); doc.roundedRect(x, yy, cw, ch, 2, 2, 'FD');
        doc.setTextColor(107, 90, 76); doc.setFontSize(7); doc.text(ar ? String(k[0]) : String(k[0]).toUpperCase(), ax, yy + 5.5, al);
        doc.setTextColor(30, 24, 12); doc.setFont(FN, 'bold'); doc.setFontSize(12.5); doc.text(String(k[1]), ax, yy + 12.5, al);
        if (k[2]) { doc.setFont(FN, 'normal'); doc.setFontSize(6.8); doc.setTextColor(120, 120, 120); doc.text(String(k[2]), ax, yy + 16.8, al); } doc.setFont(FN, 'normal'); });
      y += Math.ceil(spec.kpis.length / per) * (ch + 4) + 4;
    }
    (spec.sections || []).forEach(function (s) {
      if (!s.rows || !s.rows.length) { if (s.empty) { if (y > H - 40) { doc.addPage(); head(); y = 36; } doc.setTextColor(30, 24, 12); doc.setFont(FN, 'bold'); doc.setFontSize(11); doc.text(s.title, ar ? W - M : M, y, { align: ar ? 'right' : 'left' }); doc.setFont(FN, 'normal'); doc.setFontSize(8.5); doc.setTextColor(130, 130, 130); doc.text(s.empty, ar ? W - M : M, y + 6, { align: ar ? 'right' : 'left' }); y += 14; } return; }
      if (y > H - 45) { doc.addPage(); head(); y = 36; }
      doc.setTextColor(30, 24, 12); doc.setFont(FN, 'bold'); doc.setFontSize(11); doc.text(s.title, ar ? W - M : M, y, { align: ar ? 'right' : 'left' }); doc.setFont(FN, 'normal');
      var rv = function (a) { return ar ? a.slice().reverse() : a; }, nc = s.head.length, cs = {}; (s.align || []).forEach(function (a, i) { if (a === 'r') cs[ar ? nc - 1 - i : i] = { halign: ar ? 'left' : 'right' }; });
      doc.autoTable({ startY: y + 3, margin: { left: M, right: M, top: 34, bottom: 16 }, head: [rv(s.head)], body: s.rows.map(function (r) { return rv(r.map(function (c) { return c == null ? '' : String(c); })); }),
        styles: { font: FN, fontSize: 8, cellPadding: 1.8, lineColor: [230, 224, 210], lineWidth: 0.1, textColor: [40, 34, 22], halign: ar ? 'right' : 'left', overflow: 'linebreak' }, headStyles: { fillColor: [201, 164, 92], textColor: [40, 30, 15], fontStyle: 'bold', halign: ar ? 'right' : 'left' },
        alternateRowStyles: { fillColor: [250, 247, 240] }, columnStyles: cs, didDrawPage: function (d) { if (d.pageNumber > 1) head(); } });
      y = doc.lastAutoTable.finalY + 10;
    });
    var n = doc.getNumberOfPages(); for (var p = 1; p <= n; p++) { doc.setPage(p); doc.setFont(FN, 'normal'); doc.setFontSize(7.5); doc.setTextColor(130, 130, 130);
      var gen = new Date().toISOString().slice(0, 10), pg = ar ? 'صفحة ' + p + ' من ' + n : 'Page ' + p + ' of ' + n;
      if (ar) { doc.text('سري · تم الإنشاء ' + gen, W - M, H - 7, { align: 'right' }); doc.text('AND.Furniture', W / 2, H - 7, { align: 'center' }); doc.text(pg, M, H - 7, { align: 'left' }); }
      else { doc.text('AND.Furniture · Confidential · generated ' + gen, M, H - 7); doc.text(pg, W - M, H - 7, { align: 'right' }); } }
    deliver(doc.output('blob'), spec.file + '.pdf', ar);
  }
  return { pdf: pdf };
})();
