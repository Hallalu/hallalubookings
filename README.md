# Hallalu Bookings

A premium, fully-editable booking page — beautiful, brand-adaptable, and free to run one page.

**Live:** https://hallalubookings.coconvo.workers.dev

## What it is
A single self-contained page (no build step) that any business or individual can make their own:

- **3 layout templates** — Editorial (banner + profile), Showcase (a photo per service), Portrait (photo-led split). Switch live in the Style panel.
- **Fully editable** — turn on *Edit page* to rewrite any text, swap photos, and change service names & prices inline. Changes persist in the browser (localStorage).
- **Brand-adaptable** — accent colour, background colour (default white `#FFFFFF`), highlight, corner roundness, ambient light, and currency (£ $ € ₦ ¥ ₹ R Fr) — all live.
- **Multi-step booking flow** — choose service → pick a time (real calendar) → details → deposit → confirmation, with subtle gold confetti.
- **Honest by design** — deposit copy reflects verified industry data (no fabricated "57%" claim); no fake-scarcity widgets; white-label with "your client list stays yours".

## Deploy
Static assets on Cloudflare Workers — no server code.

```bash
npx wrangler deploy
```

## Structure
```
public/index.html   → the entire page (HTML + CSS + JS, self-contained)
wrangler.jsonc      → Cloudflare Workers static-assets config
```
