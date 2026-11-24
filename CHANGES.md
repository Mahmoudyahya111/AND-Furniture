# AND.Furniture changes

Each change is its own commit. Undo one with `git revert <hash>`.

| # | What |
|---|------|
| 1 | Initial storefront: catalog, cart, guest checkout, tracking, bilingual layout, chat widget, SQL schema and seed |
| 2 | Admin panel (dashboard, orders, products, categories, chat console, accounting, settings with owner handover, team) |
| 3 | Connected to the new Supabase project; fixed two schema issues found in testing (ownership transfer now owner-only, order tracking matches phone by last 10 digits) |
| 4 | Admin chart bar width, chat opens the latest conversation, cart line wraps on narrow phones |
| 5 | Bundled the Supabase library in the repo (no CDN dependency) and added version query strings to scripts and styles so phones never keep an old cached config.js (the cause of "not connected to the database" on the first phone visit) |
