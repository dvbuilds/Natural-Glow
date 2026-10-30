# Natural Glow Beauty Parlour — Backend API

Node.js · Express · MongoDB Atlas (Mongoose) · JWT · Cloudinary · Zod. See `ARCHITECTURE.md` for the design and `docs/API.md` for every endpoint.

```
src/
  config/       env (validated at boot), db, cloudinary
  models/       Admin, Service, Appointment, Gallery, Testimonial, Offer, SalonSettings, ContactEnquiry
  validators/   Zod schemas (body, query, params)
  middleware/   auth, validate, sanitize, rateLimiters, upload, notFound, errorHandler
  services/     business logic (crud.service.js is shared by services/testimonials/offers)
  controllers/  thin HTTP handlers
  routes/       public.routes.js, admin.routes.js, index.js
  utils/        ApiError, response, asyncHandler, pagination, text, time, token, logger
  scripts/      seedAdmin.js
  app.js        Express app (no listen — testable)
  server.js     boot + graceful shutdown
tests/          vitest + supertest
```

## Local setup

Requires Node.js ≥ 18.18 and a MongoDB Atlas cluster (free M0 is fine).

```bash
cd natural-glow-backend
npm install
cp .env.example .env            # Windows PowerShell: Copy-Item .env.example .env
```

Edit `.env`:

1. `MONGODB_URI` — Atlas → *Connect* → *Drivers*. Create a database user, add your IP under *Network Access*, URL-encode special characters in the password.
2. `JWT_SECRET` — generate one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. `CORS_ORIGINS` — your frontend origin(s), e.g. `http://localhost:5173` (Vite).
4. `CLOUDINARY_*` — from the Cloudinary dashboard. Without them the API runs, but gallery uploads return `503`.

Create the first (and only) admin, then run:

```bash
# macOS/Linux
ADMIN_NAME="Owner" ADMIN_EMAIL="owner@example.com" ADMIN_PASSWORD="ChangeThis-Str0ng-Pass" npm run seed:admin
# Windows PowerShell
$env:ADMIN_NAME="Owner"; $env:ADMIN_EMAIL="owner@example.com"; $env:ADMIN_PASSWORD="ChangeThis-Str0ng-Pass"; npm run seed:admin
# later: reset a forgotten password
npm run seed:admin -- --reset-password

npm run dev        # http://localhost:5000  (auto-restart)   |   npm start for production mode
```
Password policy: ≥ 12 characters with upper-case, lower-case and a digit. Don't leave `ADMIN_PASSWORD` in `.env` afterwards.

### Try it
```bash
API=http://localhost:5000/api/v1
curl $API/health
TOKEN=$(curl -s -X POST $API/admin/auth/login -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"ChangeThis-Str0ng-Pass"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")

# add a service (use your real name/price)
curl -X POST $API/admin/services -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"<service name>","category":"skin","price":500}'
curl $API/services
```
The seed script creates no services, offers or reviews. Add real content through the admin endpoints; unknown business details (phone, address, hours) stay blank until you `PUT /admin/settings`.

## Tests
```bash
npm test
```
- `validation.test.js`, `protectedRoutes.test.js` — need no database.
- `auth.test.js`, `appointments.test.js` — use `mongodb-memory-server`, which **downloads a MongoDB binary on first run** (needs internet access to `fastdl.mongodb.org`). To use a local `mongod` instead: `MONGOMS_SYSTEM_BINARY=/path/to/mongod npm test`.

## Deploy to Render + MongoDB Atlas

1. **Atlas:** create the cluster and database user. Render's free tier has no fixed outbound IP, so under *Network Access* allow `0.0.0.0/0` and rely on a strong, unique DB password (or use a paid Render plan with static outbound IPs and allow-list only those).
2. Push this folder to a GitHub repo (`.env` is git-ignored).
3. Render → *New* → *Blueprint* (uses `render.yaml`) or *Web Service* with: Build `npm ci`, Start `npm start`, Health check path `/api/v1/health`.
4. Set environment variables in Render: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (the blueprint can generate one), `CORS_ORIGINS=https://<your-frontend-domain>` (exact origin, no trailing slash; comma-separate several), `TRUST_PROXY=1`, `CLOUDINARY_*`.
5. Create the admin once, from your own machine, pointing at the production DB (don't expose this as an HTTP route):
   ```bash
   MONGODB_URI="<atlas uri>" JWT_SECRET="<any 32+ chars>" ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run seed:admin
   ```
   (or use Render's Shell tab with the variables set temporarily).
6. Free-tier services sleep when idle (first request can take ~30–60 s). Point the frontend at `https://<service>.onrender.com/api/v1`.

Graceful shutdown: on `SIGTERM`/`SIGINT` (what Render sends on redeploy) the server stops accepting connections, drains in-flight requests, closes MongoDB, then exits (hard stop after 10 s).

## Security notes
- **Auth:** short-lived (default 8 h) HS256 JWT in the `Authorization: Bearer` header. Passwords are bcrypt-hashed (12 rounds) and never selected or serialised; login is rate-limited, constant-time for unknown emails, and locks an account for 15 min after 5 failed attempts. No registration route exists.
- **Cookies/CSRF:** cookies are *not* used, so the API has no CSRF exposure — browsers don't attach a bearer header on their own. The trade-off is that the admin UI must hold the token (memory or `sessionStorage`); keep third-party scripts out of the admin app to limit XSS impact. If you later switch to cookies you must use `HttpOnly; Secure; SameSite=None` (cross-site frontend/API) or `Lax/Strict` (same site), add CSRF protection (double-submit token or `Origin` check on mutating requests), and keep CORS `credentials: true` limited to the exact origin.
- **Input:** every body/query/param is parsed by Zod (types, lengths, enums, ObjectIds); unknown fields are dropped; `$`-prefixed/dotted keys are stripped (NoSQL injection); HTML tags and control characters are removed from text fields; JSON bodies are capped at 100 kb.
- **Business integrity:** appointment status is always `pending` on creation; service name and price are read from the database and snapshotted; client-sent price/status is ignored.
- **Uploads:** admin-only, JPEG/PNG/WebP, size-capped, content signature checked, held in memory (nothing written to disk), sent to Cloudinary only after authentication; orphaned files are cleaned up if the DB write fails.
- **Transport/headers:** Helmet defaults, CORS allow-list from `CORS_ORIGINS`, `x-powered-by` removed, trust-proxy aware rate limiting (600 req/15 min general, 10 login/15 min, 10 form posts/hour per IP). Rate-limit counters are in memory, so run a single instance or move them to Redis if you scale out.
- **Errors:** one central handler. Unknown errors return `{"message":"Internal server error"}`; details are logged server-side only. Duplicate-key and Cast errors are mapped to generic 409/400.
- **Secrets:** all configuration comes from the environment, validated at start-up (the process refuses to boot on placeholders or short secrets). `.env` is git-ignored.

## Booking behaviour (what it does and does not do)
`POST /appointments` records a **request** for a service and time. There is no live availability or slot reservation: two customers may request the same time, and the admin resolves it by confirming, rescheduling or cancelling. Duplicate submissions by the same phone for the same service/time are rejected, including under concurrent requests (unique index). The frontend should say "request", not "booked", and can offer a WhatsApp CTA alongside it using `whatsappNumber` from `GET /settings`.

## SEO — what the backend does and doesn't do
The API stores editable `seoTitle`/`seoDescription` for services, offers and the salon, and returns only published content with stable `slug`s. It does **not** serve HTML, so these need frontend/deployment work:
- Page `<title>`/meta tags, Open Graph tags and **canonical URLs** — set per route in React (e.g. `react-helmet-async`) from the API fields. Because a Vite SPA renders client-side, consider pre-rendering or SSR (e.g. `vite-plugin-ssr`/Next.js) for the public pages so crawlers see the content.
- **JSON-LD** (`HairSalon`/`BeautySalon` + `LocalBusiness`) — build in the frontend from `GET /settings` (name, address, phone, hours, social links) once those are filled in.
- **sitemap.xml** and **robots.txt** — generate at build time in the frontend (list static pages plus service/offer URLs from the API) and serve them from the frontend host; they can't live under `/api/v1`.
- Image `alt` text: use gallery `title`/`caption`; use Cloudinary transformations (`f_auto,q_auto,w_…`) for fast LCP.
