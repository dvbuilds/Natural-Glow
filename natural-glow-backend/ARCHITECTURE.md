# Natural Glow Beauty Parlour, Shyamnagar: Backend Architecture

## Stack
Node.js (ESM), Express 4, Mongoose 8 (MongoDB Atlas), JWT (Bearer token), bcryptjs, Zod, Cloudinary + multer (memory storage), Helmet, CORS allow-list, express-rate-limit, express-mongo-sanitize-style sanitisation (custom), Vitest + Supertest + mongodb-memory-server.

Auth choice: **Bearer JWT in the `Authorization` header** (not cookies). This avoids CSRF exposure entirely because browsers do not attach the header automatically. Trade-off: the frontend must store the token (memory or sessionStorage); XSS then becomes the main risk, so keep the admin panel free of third-party scripts.

## Folder structure
```
src/
  config/        env.js, db.js, cloudinary.js
  models/        Admin, Service, Appointment, Gallery, Testimonial, Offer, SalonSettings, ContactEnquiry
  validators/    Zod schemas per module + common.js
  middleware/    auth, validate, rateLimiters, upload, notFound, errorHandler, sanitize
  services/      business logic per module (+ cloudinary.service)
  controllers/   thin HTTP handlers
  routes/        public.routes, admin.routes, index
  utils/         ApiError, ApiResponse, asyncHandler, pagination, token
  scripts/       seedAdmin.js
  app.js         express app (no listen)
  server.js      boot, graceful shutdown
tests/
```

## Relationships
- Appointment -> Service: `service` ObjectId ref **plus snapshot** `serviceName`, `servicePrice` (copied server-side at creation).
- Offer -> Service: optional `applicableServices[]` refs.
- Gallery -> Service: optional `service` ref for filtering.
- SalonSettings: singleton document (key `"main"`).
- Admin, Testimonial, ContactEnquiry: standalone.

## Endpoints (prefix `/api/v1`)
Public: `GET /health`, `GET /services`, `GET /services/:id`, `GET /gallery`, `GET /testimonials`, `GET /offers`, `GET /settings`, `POST /appointments`, `POST /contact`.
Admin (Bearer JWT): `POST /admin/auth/login`, `GET /admin/auth/me`, `GET /admin/dashboard`, services CRUD, `GET/GET:id/PATCH status/DELETE /admin/appointments`, `GET/POST/PATCH/DELETE /admin/gallery`, testimonials CRUD, offers CRUD, `GET/PUT /admin/settings`, `GET/PATCH/DELETE /admin/enquiries`.

## Assumptions
1. Single admin role; no public registration; admin created via `npm run seed:admin`.
2. Appointments are **requests**, not reservations. No slot locking or availability is claimed.
3. Duplicate appointment = same phone + same service + same date/time with status pending/confirmed, rejected with 409.
4. Preferred time must be in the future and within the configured booking window (default 60 days). Salon time zone Asia/Kolkata.
5. All business details (phone, address, hours) are placeholders in settings defaults; no fake reviews seeded.
6. SEO fields (`seoTitle`, `seoDescription`) are stored; meta tags, canonical URLs, JSON-LD, sitemap.xml, robots.txt must be done in the frontend/deployment.
