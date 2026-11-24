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
| 14 | Admin: the active tab scrolls into view on phones |
| 15 | Role "chat support": read-only orders and chats only, enforced in RLS (can_chat()) and RPCs; is_staff() unchanged so every write path still excludes it; edge function and Team UI accept the role (sql/06) |
| 16 | Chat KPI tracker (sql/06 chat_kpis, chat_conversations): per-conversation status/first response/resolution/message counts; per-agent chats, resolved rate, first and average response, resolution time, workload, last active; date and agent filters, daily volume chart |
| 17 | Chat availability setting (follow working hours or manual on/off) and offline notice in the store chat widget (sql/07 chat_status) |
| 18 | PDF reports bundled locally (jsPDF, Arabic font) for orders, accounting and chat KPIs; phone-friendly "ready" sheet with Download/Open buttons instead of relying on auto-download |
| 19 | PDF subtitles use plain date ranges (the helvetica font has no arrow glyph) |
| 20 | Fix: order dialog no longer throws for the view-only chat support role |
| 21 | Admin: tables without a header row (order items) stay as normal tables on phones |
| 22 | Admin Marketing page (owner/admin): strategy planner, content calendar, caption and ad-copy templates from product data, post/story image designer (canvas, downloads PNG), video shot lists and scripts, campaign tracker with ROI, discount ideas, cheap video tools list (prices from official pages, checked 2026-11-24). Templates only, no AI service. Table marketing_items (sql/08) |
| 23 | Marketing: batch content. Pick products (live list, category filter, in-stock only), number of posts, start date and spacing, language, size, theme and content mix; generates a caption and image per post, each editable, then add all to the calendar as drafts, copy all text, download all images as a ZIP or one by one. Templates only, no AI. |
| 24 | Storefront redesign step 1 (additive): css/modern.css + js/ui.js on the public pages: animated hero, scroll reveal, card hover lift and image zoom, skeleton loaders, quick view, mini-cart drawer, product image hover-zoom and lightbox with swipe, header shrink, micro-interactions, reduced-motion support. Old look: git tag old-look-before-redesign, or remove the two tags (modern.css, ui.js) from the pages. |

## 25. Facebook (Meta) Pixel + campaign attribution
- New `js/pixel.js` (storefront only, loads the Meta base code ONLY if an owner saved a numeric Pixel ID in Admin > Settings; stored in site_settings key `pixel`, no schema change).
- Events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase (value, EGP), Contact (WhatsApp/chat click).
- UTM/fbclid captured on landing (30 days, localStorage) and saved on the order in new nullable column `orders.attribution` (additive). `place_order` updated to store it; previous definition backed up in backups/place_order-before-attribution.sql.
- Admin: Pixel card (validate, save, remove, status check, Test Events steps, consent note, UTM link builder); order detail shows campaign source.
- Revert: git revert this commit; column can stay (unused).

## 26. Premium redesign step 2 + dark/light themes
- New css/premium.css, js/home.js (premium home: sliding parallax hero with designed room scenes, trust strip, shop-by-room tiles, animated counters, story, how-it-works, sample testimonials, CTA band), js/theme.js (dark/light toggle, saved, defaults to system, no-flash inline snippet in every page head).
- Real photos: edit the IMG object at the top of js/home.js. Old home: git tag old-look-before-redesign.
- pages.js: home no longer renders #cats / h-cats (home.js owns them).

## 27. Header, mobile menu, theme fixes, floating chat fix
- Mobile header: logo + AND.Furniture wordmark + cart + menu; account, language and dark/light moved into the hamburger menu. Header background uses logo tones (light cream/gold, dark espresso/gold).
- BUG FIX: premium.css redefined @keyframes pgin (with a transform), which modern.css applies to body, so body kept a transform and anchored position:fixed chat/WhatsApp buttons to the page bottom. Renamed to mainin.
- Home: testimonials removed; stats and trust strip use neutral/settings-driven values (no hardcoded delivery/support claims).

## 28. Color-tagged product images
- New nullable-safe column products.image_colors jsonb default '{}' (additive; backup of images/colors in backups/products-images-before-colortags.json). Existing products unchanged (no tags = all images shown).
- Admin product editor: each image has a color select ("All colors" or one of the product's colors). Saved as map imageUrl -> color.
- Storefront: AND.imgsFor(product, color) = that color's images first, then untagged images, fallback to all. Product page swaps gallery when a color is chosen; cards and quick view use the first color's image (quick view switches with its swatches).
- Revert: git revert; column may stay.

## 29. SEO foundation (AND.Furniture)
- New js/seo.js on every public page: canonical, absolute og:url/og:image (the old og:image was relative, which social previews ignore), Twitter card, noindex for cart/account/track, FurnitureStore + WebSite data on home (name, logo, phone and Facebook page only, no invented address or ratings).
- Product pages: Product + Offer (EGP, stock based availability) + BreadcrumbList data are added from the live product record. Sample/placeholder products are set to noindex and get no Product data, so fake items are not offered to Google.
- robots.txt (blocks admin) and sitemap.xml (home, shop, about, contact). Product URLs are added to the sitemap once real products exist.
- Limit: products are rendered by JavaScript. Google renders JS, but slower than static HTML. If organic search matters, a build step that generates one static page per product is the next step.
- seo.js also enforces one h1 per page (extra h1 on home become level-2 headings for crawlers, a hidden h1 is added where a page had none) and sets a descriptive home title (AR/EN).

## 30. Chat console for AND (step 1 of admin parity with TELEGANT)
- DB additive (sql/chat-console.sql; previous chat functions saved in backups/chat-functions-before-console.sql): chats.claimed_by/claimed_name/first_reply_at/rating/resolved/feedback, profiles.chat_alias, tables agent_presence, presence_log, agent_logins (staff read only), functions set_presence, set_my_alias, agent_login/logout, staff_list, chat_claim, chat_transfer, chat_close, chat_visitor_rate (survey by token), chat_staff_send updated (records first reply and claims the chat). Staff-only functions are not callable signed out.
- New page chat-admin.html + js/chat-console.js: queue with Active/Mine/Closed/All, search, unread counts, claim, reply with canned replies, transfer (shows agent presence), close, presence (available/break/offline), name customers see, AR/EN, dark/light, phone layout (list then conversation). Header button "Chat console" in the admin.
- Not yet: the storefront survey form after close, per-agent stats (steps 3), email alerts.

## 31. Customer satisfaction survey in the storefront chat
- When an agent closes a chat, the visitor's chat window shows a short survey (1-5 stars, solved yes/no, optional comment). Calls chat_visitor_rate (once per chat). chat_visitor_poll now also returns `rated` (additive; old version in backups/chat-visitor-poll-before-survey.sql, new in sql/chat-survey-poll.sql). AR/EN, dark/light.

## 32. Per-agent chat stats
- Chat console "Stats" tab: all chats, open, average rating, average first-reply time, and per agent: chats handled, closed, first-reply time, rating, % solved. Computed from existing chat columns, no DB change.

## 33. Analytics (AND only)
- DB additive (sql/analytics.sql; no existing object changed): table page_events (RLS, staff owner/admin read only), functions track_event (anon can only add a view/engage row, inputs length-checked), analytics_summary (owner/admin only), can_view_analytics. Channel is classified on the server: meta_paid (Meta source + paid medium, or fbclid + paid medium), meta_click (fbclid or Meta source without paid tag), meta_organic (Facebook/Instagram referrer), referral, direct.
- js/track.js on the storefront pages: first-party, no cookies, no names or IPs, random per-tab session id, UTM/fbclid kept for the whole visit, seconds on page. Writes only to this store's own Supabase project (js/config.js). Skips bots, Do-Not-Track.
- Admin > Analytics (owner/admin): visitors, page views, pages per visit, time on page, daily chart, traffic sources, top pages, devices. "Meta ads visitors per page" plus campaign table show only when a Pixel ID is saved AND ad-sourced visits exist; otherwise "No data yet. Add your Pixel ID in Marketing and run ads with UTM links".
- Honest limits shown in the page: in-app browsers and ad blockers undercount; campaign detail needs UTM-tagged links.

## 34. Email alert for new chats (AND)
- DB additive (sql/chat-alerts.sql): pg_net extension, private table chat_alert_cfg (owner only; on/off, all-or-selected recipients, sender), chats.alerted_at, chat_alert_log (owner read), AFTER INSERT trigger on chats that calls the edge function when alerts are on. No existing function was changed.
- Edge function chat-notify (supabase/functions/chat-notify/index.ts, verify_jwt off, auth handled inside): new-chat call is claimed atomically via chats.alerted_at, so one email per chat even if called twice; emails only profiles with role owner or support (never customers); content: customer name, first message, Cairo time, link to chat-admin.html. Owner-only actions: status, test email.
- Admin > Settings > "Email alert for new chats": on/off, sender, recipients (all owners+support or selected people), test email, provider status.
- Provider: Gmail SMTP (port 465) with an app password, no domain needed (secrets SMTP_USER and SMTP_PASS on the edge function, never in repo or chat); Resend is an optional fallback (RESEND_API_KEY). Verified the function reaches Gmail and only fails on credentials; nothing is sent until real credentials are added.
- Also: Meta empty-state text now points to Settings (where the Pixel ID lives).
- Admin tab order: Analytics now sits right after Dashboard (owner/admin) so it is visible without scrolling the tab bar.

## 35. Chat alert settings: provider choice and sender (AND)
- sql/chat-alerts.sql: chat_alert_cfg.provider ('gmail' default or 'resend', additive). Edge function chat-notify reads provider + sender from the owner's settings on every send, so adding a domain later needs no code change: pick Resend, enter the sender address/name, add the Supabase secret RESEND_API_KEY.
- Admin > Settings > Email alert panel: on/off, provider, sender address and name, recipients, test email, honest status ("Not connected yet" until the secret exists). The password/API key is never typed in the admin; it lives as a Supabase secret (SMTP_USER/SMTP_PASS or RESEND_API_KEY). Alert stays inactive until connected.

## 36. Real-time visitors with ad split (AND Analytics)
- DB additive (sql/analytics-live.sql): live_presence (one small row per active tab, no access for anyone except through functions), track_ping (anon, length-checked, classifies channel server-side), live_summary (owner/admin).
- js/track.js sends a heartbeat every 30s while the tab is visible. Admin > Analytics shows "Visitors right now" (last 90 seconds, refresh every 15s): on the site now, from Meta ads, organic/direct, per page with the ad count, live campaigns. With nobody online it shows "0 visitors right now". Real counts only.

- #37 Order emails (AND): table order_mail_cfg (enabled default OFF, customer, staff), orders.mailed_at, order_mail_log, trigger order_mail_new -> edge function order-notify (verify_jwt false, claims each order once). Sender/provider shared with chat_alert_cfg. Inactive until a sender is connected; Settings panel says so. Revert: drop trigger order_mail_new; delete the function.
