# AND.Furniture

Bilingual (Arabic RTL / English) furniture store with admin panel and live customer chat. Static site (GitHub Pages) plus Supabase backend.

- `index.html`, `shop.html`, `product.html`, `cart.html` (guest checkout), `track.html`, `account.html`, `contact.html`, `about.html`
- `admin.html` admin panel (orders, products, categories, accounting, chat, settings, team)
- `sql/01-schema.sql`, `sql/02-seed.sql` run once in the Supabase SQL editor
- `js/config.js` holds the Supabase URL and publishable key
- Placeholder product images (`img/ph/*.svg`) are generated drawings, not photos. Replace them in admin > Products.
- `CHANGES.md` logs every change with its commit.
