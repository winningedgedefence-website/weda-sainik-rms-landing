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
| **Backend** | None. Four HTML pages, one stylesheet, images. |
| **Leads** | Every call-to-action opens the WEDA CRM enquiry form, so the lead is recorded in the CRM. |
| **Weight** | One HTML file + Google Fonts. No payment script, no form library, nothing third-party on load. |

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
youtubeUrl:   "https://www.youtube.com/watch?v=v-j4gvd49oA",
crmFormUrl:   "https://crm.thewinningedge.co.in/form.html",
privacyUrl:   "privacy.html",  termsUrl: "terms.html",  refundUrl: "refund.html",
waMessages:   { admission: "..." }     // pre-fills the footer WhatsApp chat
```

Both numbers and all social links were read off `thewinningedge.co.in`, so they match the main
site.

The video is a click-to-load facade: no iframe, no player and no YouTube request until the visitor
clicks the card, and then it plays in place.

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

## 2. The CRM enquiry form

Every **Enquire**, **Apply for Admission** and **Register Now** button opens one link in a new tab:

```js
crmFormUrl: "https://crm.thewinningedge.co.in/form.html"
```

That is the public enquiry form of the WEDA CRM (`weda-crm`). The parent fills in name, phone,
email, date of birth and what they are interested in, and the lead is written straight into the
CRM with the source `Enquiry Form`. To point every button somewhere else, change that one line.

**No payment is taken on this site.** There is no Razorpay link, no checkout and no payment
code — the ₹500 demo registration fee is collected by the academy off the page, after the
counsellor has spoken to the parent.

The only WhatsApp link left is the number in the footer, which opens a chat with the admission
message already typed.

---

## 3. Deploy

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Nothing needs environment variables: the site is static and has no serverless functions. Any
static host works the same way.

---

## 4. Test

Open the page and check:

- [ ] Sticky nav, smooth scrolling, every CTA
- [ ] Every APPLY FOR ADMISSION button opens the CRM enquiry form in a new tab
- [ ] ENQUIRE FOR CLASS 6 / 9 open the same CRM form
- [ ] REGISTER NOW opens the same CRM form — no payment page anywhere
- [ ] The footer WhatsApp link opens WhatsApp with the message pre-filled
- [ ] The video card plays the video in place on the first click
- [ ] Mobile: no horizontal scroll, sticky bottom bar, both buttons usable one-handed

---

## Structure

```
index.html                  the whole page — config block near the bottom
privacy.html  terms.html  refund.html
assets/                     hero-cadets · sainik-cadets · rms-cadets · video-thumb
vercel.json  package.json
```

### One destination, nothing else

| Button | Where | Goes to |
|---|---|---|
| **Apply for Admission** | nav, hero, admission section, final CTA, mobile bar | CRM enquiry form |
| **Enquire for Class 6 / 9** | course cards | CRM enquiry form |
| **Register Now** | nav, hero, demo section, final CTA, mobile bar | CRM enquiry form |
| WhatsApp number | footer | WhatsApp, pre-filled |

There is no enquiry form on the page itself and no Contact Us button: the page collects nothing,
it hands the visitor to the CRM form.

> **Worth knowing:** the Razorpay payment page and the server-side payment code (`api/`, `test/`,
> `.env.example`) were removed on the `crm-form-ctas` branch. They are still in the history of
> `sainik-rms-2026` if online payment is ever wanted back.

### What the page does not claim

No success percentages, selection counts, achievements or testimonials appear anywhere: the brief
ruled them out and none were supplied. Trust is carried by the structure of the programme, the
Col Amardeep SM (Retd) video and the demo offer. The ₹500 fee is stated as refundable *as per
applicable demo registration and refund terms* — no refund window or condition has been invented.
The demo is never described as free.
