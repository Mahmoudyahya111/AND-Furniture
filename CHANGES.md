# AND.Furniture changes

Each change is its own commit. Undo one with `git revert <hash>`.

| # | What |
|---|------|
| 1 | Initial storefront: catalog, cart, guest checkout, tracking, bilingual layout, chat widget, SQL schema and seed |
| 2 | Admin panel (dashboard, orders, products, categories, chat console, accounting, settings with owner handover, team) |
| 3 | Connected to the new Supabase project; fixed two schema issues found in testing (ownership transfer now owner-only, order tracking matches phone by last 10 digits) |
| 4 | Admin chart bar width, chat opens the latest conversation, cart line wraps on narrow phones |
| 5 | Bundled the Supabase library in the repo (no CDN dependency) and added version query strings to scripts and styles so phones never keep an old cached config.js (the cause of "not connected to the database" on the first phone visit) |
| 6 | Furniture fields in the database (SKU, W/D/H, weight, assembly, warranty, origin, care, lead time, low-stock threshold) plus realistic sample values (sql/03, sql/04). Additive only, backup taken first |
| 7 | Admin product editor rebuilt: sections, stock stepper, low-stock alert, image upload/replace/reorder/main, furniture specs; product list search, Low/Out badges and filter |
| 8 | Store: product page specification table and "only N left" using each product threshold; mobile-first admin (stacked cards, full-screen editor, wrapping top bar) |
| 9 | Admin sign-in / create-account redesigned: separate modes with their own forms (confirm password, validation, friendly errors incl. email rate limit, back-to-sign-in); same redesign on the customer account page |
| 10 | Roles owner/admin/staff (sql/05), team-admin edge function (owner only, service role kept server-side), Admin > Team: create members with a set password, change role, reset password, remove |
| 11 | Sample products: structured dimensions replace the free-text size; admin table cells wrap long emails |
| 12 | Audit fixes (store): English colour names, compare-at price wraps inside cards, no repeated placeholder note on cards, footer links tap size and clearance for floating buttons, smaller hero logo on phones |
| 13 | Audit fixes: chat panel fits phones, WhatsApp floating button hidden where the page already has a WhatsApp button, cart shows translated colour names |
