# Natural Glow Beauty Parlour — Frontend

React 18 · Vite · Tailwind CSS 3 · React Router 6. No UI library. Talks to the `natural-glow-backend` API (`/api/v1`).

## Run it

```bash
cd natural-glow-frontend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev                 # http://localhost:5173
```

The backend must be running (default `http://localhost:5000`) and its `.env` must allow this origin:
`CORS_ORIGINS=http://localhost:5173`. Admin panel: **http://localhost:5173/admin** (create the admin first with `npm run seed:admin` in the backend; there is no sign-up screen).

## Your images

Nothing is hard-coded: every image area shows a labelled placeholder until you provide the picture.

| Where | How to fill it |
|---|---|
| Home hero banner (full width, text on the left) | `public/images/hero.jpg` (≈1920×1000, keep the subject on the right) |
| Home "About" image, About page | `public/images/about-main.jpg`, `public/images/about-secondary.jpg` |
| Location map background | `public/images/map.jpg`, or paste a Google Maps **embed** URL in Admin → Settings |
| Service cards | Admin → Services → *Image URL* |
| Offer cards | Admin → Offers → *Image URL* |
| Gallery (Home + Gallery page) | Admin → Gallery → *Upload image* (stored on Cloudinary) |

File names/paths are listed in `src/config/images.js`. The hero text has no background box; a soft gradient is applied to the image only so dark text stays readable. Change or remove it with `HERO_OVERLAY` in the same file.

## Structure

```
src/
  api/          client.js (fetch wrapper, Bearer token, error mapping), public.js, admin.js
  context/      ToastContext, AuthContext, SettingsContext, ServicesContext
  hooks/        useApi, useListQuery, useDebounce, usePageMeta
  lib/          constants (mirror backend enums), format (₹, IST dates, Cloudinary URLs), validate
  config/       env.js, images.js
  components/   ui/ (ImageSlot, Form, Modal, Feedback, Icon) · layout/ · home/ · services/ · offers/ · booking/
  pages/        Home, About, Services, Pricing, Gallery, Contact, NotFound
  admin/        AdminApp, layout, route guard, pages/ (Login, Dashboard, Appointments, Services, Offers, Gallery, Testimonials, Enquiries, Settings)
```
Settings and the services list are fetched once (contexts) and shared by every public page. The admin bundle is lazy-loaded, so visitors never download it.

## How every backend feature is used

| Backend feature | Frontend |
|---|---|
| `GET /services` (category, search, sort, pagination) | Services page filters + pagination; Home preview; Pricing grouped by category |
| `GET /gallery` (category, pagination) | Gallery page with category chips, pagination, lightbox; Home preview |
| `GET /testimonials` (published only) | Home/About section, **hidden when there are none** (no placeholder reviews) |
| `GET /offers` (active + inside validity dates, type filter) | Home preview, Pricing page with type filter; "Enquire"/"Book" buttons |
| `GET /settings` | Contact details, hours, map link, social, booking notice, WhatsApp CTA, JSON-LD, footer |
| `POST /appointments` | Booking form: sends only user fields (never status/price); honeypot; offers only valid time slots inside saved working hours (IST), min 60 min ahead, max 60 days ahead; maps every backend error code (duplicate, too soon, closed, outside hours, too many pending, rate limit); success screen says **pending / not reserved** |
| `POST /contact` | Enquiry form: email **or** phone required, honeypot, prefilled subject from offers |
| WhatsApp CTA | Floating button, hero, contact page, booking success, admin "WhatsApp customer" — all appear only once a WhatsApp number is saved |
| `POST /admin/auth/login`, `/me` | Login page (shows lock-out / rate-limit messages), session check, 401 → signed out |
| `/admin/dashboard` | Dashboard stats, status breakdown, recent requests/enquiries |
| `/admin/appointments` | Filters (status, service, date range, search, sort), pagination, detail + history, **only allowed status transitions** offered, reschedule with new date/time, internal notes, one-click confirm |
| `/admin/services`, `/offers`, `/testimonials` | Full CRUD, quick active/featured/published switches, SEO fields, offer inclusions + applicable services + validity (IST) |
| `/admin/gallery` | Multipart upload with type/size check and preview, metadata edit, publish toggle, delete |
| `/admin/enquiries` | List/filter/search, opening marks as read, status chips, delete |
| `/admin/settings` | Contact, address, working hours, social, booking notice, SEO |

The admin token lives in `sessionStorage` (gone when the tab closes) and is sent as a Bearer header, never a cookie.

## SEO

- `usePageMeta` sets `<title>`, meta description, canonical URL (needs `VITE_SITE_URL`) and `noindex` for admin pages.
- `JsonLd` injects schema.org `BeautySalon` data built only from what you save in Admin → Settings.
- `npm run build` writes `public/robots.txt` (admin disallowed) and, when `VITE_SITE_URL` is set, `public/sitemap.xml`.
- A Vite SPA renders in the browser. Google handles that, but other crawlers/social previews may not; for best results pre-render the public pages (e.g. a prerender plugin or moving to Next.js later).

## Deploy (Vercel)

1. Import the repo; framework preset **Vite**; build `npm run build`; output `dist`.
2. Environment variables: `VITE_API_URL=https://<your-render-service>.onrender.com/api/v1`, `VITE_SITE_URL=https://<your-domain>`, `VITE_BOOKING_WINDOW_DAYS` and `VITE_MAX_UPLOAD_MB` matching the backend.
3. `vercel.json` already rewrites all routes to `index.html` (needed for `/admin`, `/services`, …). For Netlify/Render static, `public/_redirects` does the same.
4. In the backend (Render), set `CORS_ORIGINS=https://<your-domain>` (exact origin, no trailing slash).

## Things to edit

- About page copy (`src/pages/About.jsx`) and "What you can expect" are deliberately generic: replace them with your real story. No years, awards or staff claims are made anywhere.
- Hero heading text is in `src/components/home/Hero.jsx`.
