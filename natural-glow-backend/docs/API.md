# Natural Glow Beauty Parlour — API Reference

Base URL: `http://localhost:5000/api/v1` (local) · `https://<your-service>.onrender.com/api/v1` (Render)

## Conventions

**Success**
```json
{ "success": true, "message": "OK", "data": { }, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasNextPage": true } }
```
`meta` appears on paginated lists only. IDs are Mongo `_id` strings.

**Error**
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR",
  "errors": [ { "field": "body.phone", "message": "Invalid phone number" } ] }
```
`errors` appears for validation failures only. Stack traces and database messages are never returned.

| Status | Meaning |
|---|---|
| 200 / 201 | OK / created |
| 400 | Validation or booking-rule failure |
| 401 | Missing, invalid or expired token; bad credentials |
| 403 | CORS origin not allowed |
| 404 | Not found |
| 409 | Duplicate request / invalid status transition |
| 413 | Body or image too large |
| 429 | Rate limited, account temporarily locked, too many pending requests |
| 502 / 503 | Image storage failure / not configured, or DB down (health) |

**Authentication:** admin routes need `Authorization: Bearer <token>` from `POST /admin/auth/login`.

**Pagination:** `?page=1&limit=20` (limit max 100). **Sorting:** `?sort=field` or `?sort=-field`; allowed fields are listed per endpoint (anything else → 400). **Search:** `?search=text` (case-insensitive, escaped).

**Dates/times:** appointment `preferredDate` (`YYYY-MM-DD`) and `preferredTime` (`HH:mm`) are interpreted as **India Standard Time (Asia/Kolkata)**. Stored timestamps are UTC ISO strings.

---

## Health

### `GET /health` — public
`200` `{ "success": true, "message": "OK", "data": { "status": "ok", "uptimeSeconds": 1234 } }`
`503` when MongoDB is not connected (`status: "degraded"`).

---

## Public endpoints (no auth, published content only)

### `GET /services`
Active services. Query: `category` (`hair|skin|makeup|bridal|nails|waxing|spa|other`), `featured` (`true|false`), `search`, `sort` (`displayOrder` default, `price`, `-price`, `name`, `-name`, `createdAt`, `-createdAt`), `page`, `limit`.
```json
{ "success": true, "message": "OK", "data": [
  { "_id": "64b7…", "name": "<service name>", "slug": "service-name", "category": "skin",
    "description": "…", "price": 800, "priceType": "fixed", "durationMinutes": 45,
    "imageUrl": "", "isActive": true, "isFeatured": false, "displayOrder": 0,
    "seoTitle": "", "seoDescription": "", "createdAt": "…", "updatedAt": "…" } ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false } }
```

### `GET /services/:id`
One active service (404 if inactive/unknown, 400 if `id` is not a valid ObjectId).

### `GET /gallery`
Published images. Query: `category`, `serviceId`, `sort` (`displayOrder`, `-displayOrder`, `createdAt`, `-createdAt`), `page`, `limit`.
```json
{ "data": [ { "_id": "…", "title": "", "caption": "", "category": "bridal",
  "image": { "url": "https://res.cloudinary.com/…", "width": 1200, "height": 800, "format": "webp", "bytes": 91234 },
  "isPublished": true, "displayOrder": 0 } ] }
```
(`image.publicId` is not exposed publicly.) Use Cloudinary URL transformations (e.g. `/upload/f_auto,q_auto,w_800/`) on the frontend for responsive images.

### `GET /testimonials`
Published testimonials only. Query: `rating` (1–5), `sort` (`displayOrder`, `createdAt`, `-createdAt`, `rating`, `-rating`), `page`, `limit`.
No reviews are seeded: the list is empty until the admin adds and publishes real ones.

### `GET /offers` · `GET /offers/:id`
Active offers/bridal packages **currently inside their validity window** (`validFrom`/`validUntil` optional). Query: `type` (`offer|bridal_package`), `featured`, `sort` (`displayOrder`, `offerPrice`, `-offerPrice`, `createdAt`, `-createdAt`, `validUntil`), `page`, `limit`.
```json
{ "data": [ { "_id": "…", "title": "…", "slug": "…", "type": "bridal_package",
  "description": "…", "inclusions": ["…"], "originalPrice": 10000, "offerPrice": 7500,
  "discountPercent": 25, "validFrom": null, "validUntil": "2027-01-31T18:29:59.000Z",
  "applicableServices": ["64b7…"], "imageUrl": "", "isFeatured": true } ] }
```

### `GET /settings`
Public salon details. Unknown details are empty strings until the admin fills them in.
```json
{ "data": { "salonName": "Natural Glow Beauty Parlour", "tagline": "", "phone": "", "whatsappNumber": "",
  "email": "", "address": { "line1": "", "area": "", "city": "Shyamnagar", "state": "", "postalCode": "", "landmark": "" },
  "mapUrl": "", "workingHours": [ { "day": "monday", "open": "10:00", "close": "20:00", "isClosed": false } ],
  "social": { "facebook": "", "instagram": "", "youtube": "" },
  "bookingNotice": "Appointment requests are confirmed by the salon. Submitting a request does not reserve a slot.",
  "seoTitle": "", "seoDescription": "" } }
```
The frontend can build the WhatsApp CTA from `whatsappNumber` (`https://wa.me/<digits>?text=…`).

### `POST /appointments` — rate limited (10/hour/IP)
Creates a **pending request**. It does **not** reserve a slot or check availability; the salon contacts the customer to confirm.

Request:
```json
{ "customerName": "Priya Sharma", "phone": "+91 90000 00000", "email": "optional@example.com",
  "serviceId": "64b7f0f2a1b2c3d4e5f60718", "preferredDate": "2027-03-05", "preferredTime": "11:00",
  "notes": "optional, max 500 chars" }
```
Response `201`:
```json
{ "success": true,
  "message": "Appointment request received. It is pending and not yet confirmed — the salon will contact you to confirm.",
  "data": { "_id": "…", "serviceName": "<snapshot>", "servicePrice": 800, "preferredAt": "2027-03-05T05:30:00.000Z", "status": "pending" } }
```
Rules: service must exist and be active · time at least 60 min ahead and within `BOOKING_WINDOW_DAYS` · if working hours are configured, the time must fall within them on an open day · max 3 pending requests per phone · identical phone+service+time while active → `409 DUPLICATE_APPOINTMENT`. Any client-sent `status`, `price`, `servicePrice` or `serviceName` is ignored. Do not render a hidden `website` field with a value — it is a honeypot (non-empty → 400).

### `POST /contact` — rate limited (10/hour/IP)
```json
{ "name": "Visitor", "email": "v@example.com", "phone": "", "subject": "Bridal makeup", "message": "At least 10 characters." }
```
Provide `email` or `phone`. Response `201`: `{ "success": true, "message": "Thank you! Your message has been received.", "data": { "_id": "…" } }`

---

## Admin endpoints (all except login require a Bearer token)

### `POST /admin/auth/login` — rate limited (10 / 15 min / IP)
```json
{ "email": "owner@example.com", "password": "…" }
```
`200`:
```json
{ "success": true, "message": "Login successful",
  "data": { "token": "<jwt>", "tokenType": "Bearer", "expiresIn": "8h",
            "admin": { "_id": "…", "name": "…", "email": "…", "role": "admin", "isActive": true } } }
```
`401 INVALID_CREDENTIALS` (same message for wrong password and unknown email). After 5 consecutive failures the account is locked for 15 minutes (`429 ACCOUNT_LOCKED`). There is **no register endpoint**; create the admin with `npm run seed:admin`.

### `GET /admin/auth/me`
Returns the current admin (`data` = admin object).

### `GET /admin/dashboard`
```json
{ "data": {
  "appointments": { "total": 12, "byStatus": { "pending": 4, "confirmed": 5, "rescheduled": 0, "completed": 2, "cancelled": 1 },
                    "pendingRequests": 4, "upcoming": 9, "today": 2 },
  "services": { "active": 8, "inactive": 1 }, "offers": { "active": 3, "inactive": 0 },
  "testimonials": { "published": 5, "unpublished": 1 }, "gallery": { "total": 24 },
  "enquiries": { "new": 3 },
  "recent": { "appointments": [ ], "enquiries": [ ] } } }
```

### Services — `/admin/services`
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/services` | Query as public + `isActive`. Includes inactive. |
| POST | `/admin/services` | Create → `201` |
| GET | `/admin/services/:id` | |
| PATCH | `/admin/services/:id` | Partial update, ≥1 field |
| DELETE | `/admin/services/:id` | Existing appointments keep their name/price snapshot |

Create body (`name`, `category`, `price` required):
```json
{ "name": "<service name>", "category": "skin", "description": "…", "price": 800, "priceType": "starting_from",
  "durationMinutes": 45, "imageUrl": "https://…", "isActive": true, "isFeatured": false, "displayOrder": 0,
  "seoTitle": "", "seoDescription": "" }
```
`priceType`: `fixed | starting_from`. `slug` is generated automatically and kept unique.

### Appointments — `/admin/appointments`
- `GET /admin/appointments` — Query: `status` (`pending|confirmed|rescheduled|completed|cancelled`), `serviceId`, `from`/`to` (`YYYY-MM-DD`, IST, filters the preferred time), `search` (name/phone/service), `sort` (`-createdAt` default, `createdAt`, `preferredAt`, `-preferredAt`), `page`, `limit`.
- `GET /admin/appointments/:id` — includes `statusHistory`, `adminNotes`.
- `PATCH /admin/appointments/:id/status`

```json
{ "status": "confirmed", "note": "Called customer", "adminNotes": "optional internal note" }
```
Reschedule (both fields required):
```json
{ "status": "rescheduled", "newDate": "2027-03-08", "newTime": "15:30", "note": "Customer asked to move" }
```
Allowed transitions: `pending → confirmed|rescheduled|cancelled` · `confirmed → rescheduled|completed|cancelled` · `rescheduled → confirmed|completed|cancelled` · `completed`/`cancelled` are final. Anything else → `409 INVALID_STATUS_TRANSITION`. Cancelled/completed requests release their duplicate lock.

### Gallery — `/admin/gallery`
- `GET /admin/gallery` — Query as public + `isPublished`.
- `POST /admin/gallery` — **multipart/form-data**: file field `image` (JPEG/PNG/WebP, ≤ `MAX_UPLOAD_MB`, signature-checked) plus optional text fields `title`, `caption`, `category`, `serviceId`, `isPublished`, `displayOrder`. `201` returns the item incl. `image.publicId`. `503 STORAGE_NOT_CONFIGURED` until Cloudinary variables are set.
  ```bash
  curl -X POST $API/admin/gallery -H "Authorization: Bearer $TOKEN" \
       -F image=@bridal.jpg -F category=bridal -F title="Bridal look"
  ```
- `PATCH /admin/gallery/:id` — update metadata (`title`, `caption`, `category`, `serviceId`, `isPublished`, `displayOrder`).
- `DELETE /admin/gallery/:id` — deletes the Cloudinary file first, then the record (if Cloudinary fails → `502`, record kept so you can retry).

### Testimonials — `/admin/testimonials`
Same CRUD shape as services (`GET` list with `isPublished`/`search`, `POST`, `GET/PATCH/DELETE /:id`).
```json
{ "customerName": "<real customer>", "rating": 5, "message": "At least 10 characters.", "serviceName": "", "isPublished": true, "displayOrder": 0 }
```
New testimonials are **unpublished by default**.

### Offers & bridal packages — `/admin/offers`
Same CRUD shape. `title` and `offerPrice` required.
```json
{ "title": "<offer title>", "type": "bridal_package", "description": "…", "inclusions": ["…", "…"],
  "originalPrice": 10000, "offerPrice": 7500, "validFrom": "2027-01-01T00:00:00+05:30",
  "validUntil": "2027-01-31T23:59:59+05:30", "applicableServices": ["64b7…"], "imageUrl": "",
  "isActive": true, "isFeatured": false, "displayOrder": 0 }
```
`discountPercent` is computed server-side. `offerPrice` may not exceed `originalPrice`; `validUntil` must follow `validFrom`. Send `null` for `validFrom`/`validUntil`/`originalPrice` to clear them.

### Settings — `/admin/settings`
- `GET /admin/settings`
- `PUT /admin/settings` — partial: omitted top-level fields are unchanged; `address`, `social` and `workingHours` are replaced as a whole when sent.
```json
{ "phone": "+91XXXXXXXXXX", "whatsappNumber": "91XXXXXXXXXX", "email": "salon@example.com",
  "address": { "line1": "…", "area": "…", "city": "Shyamnagar", "state": "…", "postalCode": "…", "landmark": "…" },
  "mapUrl": "https://maps.google.com/…",
  "workingHours": [ { "day": "monday", "open": "10:00", "close": "20:00" }, { "day": "sunday", "isClosed": true } ],
  "social": { "instagram": "https://instagram.com/…" },
  "seoTitle": "…", "seoDescription": "…" }
```
Once `workingHours` are saved, appointment requests outside them are rejected.

### Contact enquiries — `/admin/enquiries`
- `GET /admin/enquiries` — Query: `status` (`new|read|replied|archived`), `search`, `sort` (`-createdAt`, `createdAt`), `page`, `limit`.
- `GET /admin/enquiries/:id`
- `PATCH /admin/enquiries/:id/status` — `{ "status": "read" }`
- `DELETE /admin/enquiries/:id`
