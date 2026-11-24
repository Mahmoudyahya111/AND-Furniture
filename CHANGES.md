# AND.Furniture changes

Each change is its own commit. Undo one with `git revert <hash>`.

| # | What |
|---|------|
| 1 | Initial storefront: catalog, cart, guest checkout, tracking, bilingual layout, chat widget, SQL schema and seed |
| 2 | Admin panel (dashboard, orders, products, categories, chat console, accounting, settings with owner handover, team) |
| 3 | Connected to the new Supabase project; fixed two schema issues found in testing (ownership transfer now owner-only, order tracking matches phone by last 10 digits) |
| 4 | Admin chart bar width, chat opens the latest conversation, cart line wraps on narrow phones |
