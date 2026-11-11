# WEDA — Sainik School & RMS Landing Page

One-page landing site for **WEDA – The Winning Edge Defence Academy**, promoting Sainik School
and Rashtriya Military School entrance preparation for Class 6th and Class 9th.

Built to match the branding of `thewinningedge.co.in` — the palette, type and layout language
were read directly off the live site (red `#e11d2e`, ink `#0c0c0e`, warm paper `#f8f5ef`;
Anton / Archivo / IBM Plex Mono).

---

## What it is

| | |
|---|---|
| **Frontend** | One static `index.html`. No build step, no framework, no bundler. |
| **Backend** | Three serverless functions in `api/` (Node 18+, Vercel-style). |
| **Payment** | Razorpay Checkout, with the order created and the signature verified **on the server**. |
| **Weight** | One HTML file + Google Fonts. Razorpay's script loads only when a parent opens the registration form, never on page load. |

The spec asked for React + Tailwind "if supported by the existing project". There was no existing
project, and the traffic is Meta/Instagram/WhatsApp ads on mobile — so a single static page that
needs no hydration and no build is both faster and easier for the academy to edit. Everything the
spec needed from components is handled by one design-token block at the top of the stylesheet.

---

## 1. Configure (5 minutes)

### Contact details, video and social links

Open `index.html`, find the `const WEDA = { … }` block near the bottom. Everything is there:

```js
whatsapp:     "917417656633",          // country code, no "+", no spaces
whatsappShow: "+91 74176 56633",
phone:        "+917417920356",
phoneDisplay: "+91 74179 20356",
youtubeUrl:   "[INSERT YOUTUBE VIDEO URL]",   // <- Col Amardeep SM (Retd)'s video
privacyUrl:   "#",  termsUrl: "#",  refundUrl: "#",
waMessages:   { admission: "...", "6th": "...", "9th": "..." }
```

Both numbers and all social links were read off `thewinningedge.co.in`, so they match the main
site. `waMessages` holds the text each WhatsApp button pre-fills — edit these and your counsellor
sees exactly which button the parent pressed.

The video is **never embedded**: no iframe, no player, no YouTube script. The card is static and
opens YouTube in a new tab. Until a real URL is set, clicking it says so rather than opening a
dead link.

### Photographs

Drop these four files into `assets/`. Each slot shows a designed dark placeholder with the WEDA
mark until its file exists, so the page never shows a broken image and never looks unfinished.

| File | Where | Suggested size |
|---|---|---|
| `assets/hero-cadets.webp` | Hero, right side | 1600 × 1200 |
| `assets/video-thumb.webp` | Video thumbnail | present (from the YouTube video) |
| `assets/sainik-cadets.webp` | Sainik School section | 1500 × 1000 |
| `assets/rms-cadets.webp` | RMS section | 1500 × 1000 |

Export as WebP (or AVIF) at ~75% quality. Nothing else needs to change — the page detects the file
and swaps it in automatically.

---

## 2. Razorpay

The site uses a **Razorpay Payment Page**. Every REGISTER NOW button opens it in a new tab:

```js
razorpayPageUrl: "https://pages.razorpay.com/pl_TyPZxID6cmOkJb/view"
```

That link is public and holds no secret, so there is nothing to configure and no keys to set.
Razorpay runs the form, the payment, the receipt and the refund from their dashboard. **The site
needs no backend at all** — it is three HTML pages, one stylesheet and three images.

To point the buttons at a different Payment Page, change that one line.

### What this means in practice

- The parent completes payment on Razorpay's own page, so the payment itself is handled and
  verified by Razorpay. Nothing can be spoofed on our side because our side does nothing.
- **The landing page never learns whether a payment succeeded.** There is no confirmation screen
  and no record on your side — Razorpay's dashboard and its receipt email are the record.
- **You only capture the fields your Payment Page asks for.** If target class and learning mode
  matter to you, add them as custom fields on the Payment Page in Razorpay.

### The server-verified alternative is still in this repo

`api/` and `test/` hold the original integration: server-created orders, HMAC signature
verification, webhooks, idempotency and a ₹500 amount locked server-side. Nothing on the page
calls it now. Use it instead of the Payment Page when you want the registration recorded on your
own side with a confirmation screen and a reference number. `.env.example` lists the variables it
needs. `npm test` still exercises it (18 checks).

## 3. Deploy

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Then add the same environment variables under **Vercel → Project → Settings → Environment
Variables**, and set `ALLOWED_ORIGIN` to your real domain.

Any host that runs Node 18 serverless functions works the same way. For a plain static host with no
backend, the page still functions — the forms fall back to a pre-filled WhatsApp message, and the
payment step says plainly that online payment is not enabled rather than faking a success screen.

---

## 4. Test

```bash
npm test
```

18 checks covering input validation, the fixed ₹500 amount, Razorpay checkout-signature
verification (including tampered order ids, tampered payment ids and wrong secrets) and raw-body
webhook-signature verification.

Then test the payment path end to end with Razorpay in Test Mode — card `4111 1111 1111 1111`,
any future expiry, any CVV. Check:

- [ ] Sticky nav, smooth scrolling, every CTA
- [ ] Every APPLY FOR ADMISSION button opens WhatsApp with the message pre-filled
- [ ] ENQUIRE FOR CLASS 6 / 9 open WhatsApp naming the right class
- [ ] REGISTER NOW opens the modal, not WhatsApp
- [ ] Demo registration → payment → verified confirmation with a reference
- [ ] Cancel the Razorpay window mid-payment → honest "not completed" message, no false success
- [ ] The video card opens YouTube in a new tab
- [ ] Mobile: no horizontal scroll, sticky bottom Register bar, forms usable one-handed

---

## Structure

```
index.html                  the whole page — config block near the bottom
assets/                     hero-cadets · sainik-cadets · rms-cadets (+ col-amardeep when supplied)
api/
  create-order.js           STEP 1  server-created order, amount fixed at ₹500
  verify-payment.js         STEP 2  HMAC signature verification, idempotent
  razorpay-webhook.js       reliable confirmation, raw-body signature, de-duplicated
  _lib/config.js            env, mode switch, fixed amount, CORS
  _lib/store.js             memory | file | upstash + notify webhook + reference codes
  _lib/validate.js          server-side validation of the registration
test/selftest.js            18 checks
vercel.json  .env.example  package.json
```

### Two actions, nothing else

The page asks the visitor to do one of two things:

| Button | Where | Goes to |
|---|---|---|
| **Apply for Admission** | nav, hero, admission section, final CTA, mobile bar | WhatsApp, pre-filled |
| **Enquire for Class 6 / 9** | course cards | WhatsApp, pre-filled with the class |
| **Register Now — ₹500** | nav, hero, demo section, final CTA, mobile bar | Razorpay |

There is **no enquiry form and no Contact Us button**. Nothing on the page collects details except
the demo registration, which exists only to take the ₹500 through Razorpay.

> **Worth knowing:** every admission lead now arrives only as a WhatsApp message. Nothing is
> written to a database or a sheet. If nobody answers, there is no record the lead existed.

### What the page does not claim

No success percentages, selection counts, achievements or testimonials appear anywhere: the brief
ruled them out and none were supplied. Trust is carried by the structure of the programme, the
Col Amardeep SM (Retd) video and the demo offer. The ₹500 fee is stated as refundable *as per
applicable demo registration and refund terms* — no refund window or condition has been invented.
The demo is never described as free.
