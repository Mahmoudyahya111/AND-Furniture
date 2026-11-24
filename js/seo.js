/* SEO helper: canonical, absolute social tags, Organization data, and Product data for real (non-sample) products. */
(function () {
  var B = 'https://mahmoudyahya111.github.io/AND-Furniture/', d = document, page = (location.pathname.split('/').pop() || 'index.html');
  var priv = /^(cart|account|track|admin)\.html$/.test(page);
  function meta(attr, name, val) { var m = d.querySelector('meta[' + attr + '="' + name + '"]'); if (!m) { m = d.createElement('meta'); m.setAttribute(attr, name); d.head.appendChild(m); } m.setAttribute('content', val); }
  var url = B + page + (page === 'product.html' ? location.search.replace(/[?&]x=[^&]*/, '').replace(/^&/, '?') : '');
  if (!d.querySelector('link[rel=canonical]')) { var l = d.createElement('link'); l.rel = 'canonical'; l.href = url; d.head.appendChild(l); }
  if (priv) meta('name', 'robots', 'noindex,follow');
  var desc = (d.querySelector('meta[name=description]') || {}).content || '';
  meta('property', 'og:type', 'website'); meta('property', 'og:site_name', 'AND.Furniture'); meta('property', 'og:url', url);
  meta('property', 'og:title', d.title); meta('property', 'og:description', desc); meta('property', 'og:image', B + 'img/logo-512.png');
  meta('name', 'twitter:card', 'summary'); meta('name', 'twitter:title', d.title); meta('name', 'twitter:description', desc); meta('name', 'twitter:image', B + 'img/logo-512.png');
  function ld(o) { var s = d.createElement('script'); s.type = 'application/ld+json'; s.text = JSON.stringify(o); d.head.appendChild(s); return s; }
  if (page === 'index.html' || page === '') {
    ld({ '@context': 'https://schema.org', '@type': 'FurnitureStore', name: 'AND.Furniture', url: B, logo: B + 'img/logo-512.png', telephone: '+201226071020', sameAs: ['https://www.facebook.com/AND.Furniture26'], areaServed: 'EG' });
    ld({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'AND.Furniture', url: B, inLanguage: ['ar', 'en'] });
  }
  window.ANDSEO = {
    product: function (p, name, desc, imgs) {
      d.querySelectorAll('script[data-seo-p]').forEach(function (x) { x.remove(); });
      if (p.is_placeholder) { meta('name', 'robots', 'noindex,follow'); return; } // sample products: do not index
      var abs = function (u) { return /^http/.test(u) ? u : B + String(u).replace(/^\.?\//, ''); };
      var s = ld({ '@context': 'https://schema.org', '@type': 'Product', name: name, description: desc || name, image: (imgs || []).map(abs), sku: p.sku || String(p.id), brand: { '@type': 'Brand', name: 'AND.Furniture' },
        offers: { '@type': 'Offer', url: url, priceCurrency: 'EGP', price: String(p.price), availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' } });
      s.setAttribute('data-seo-p', '1');
      ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: B }, { '@type': 'ListItem', position: 2, name: 'Shop', item: B + 'shop.html' }, { '@type': 'ListItem', position: 3, name: name, item: url }] }).setAttribute('data-seo-p', '1');
      meta('property', 'og:title', d.title); meta('property', 'og:description', (desc || name).slice(0, 200)); if (imgs && imgs[0]) meta('property', 'og:image', abs(imgs[0])); meta('property', 'og:type', 'product'); meta('name', 'twitter:title', d.title);
    }
  };
})();
