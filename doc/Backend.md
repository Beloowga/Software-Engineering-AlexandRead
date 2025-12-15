# AlexandRead Backend (Express API)

This document summarizes the server-side stack, structure, and how to run it locally.

## Stack
- Node.js + Express for HTTP routing and middleware.
- Supabase client for Postgres queries and storage (books, comments, accounts, files).
- JWT-based authentication with custom middleware for `requireAuth` and `requireAdmin` guards.
- CORS enabled; JSON bodies limited to ~6MB to support base64 uploads.

## Project Layout
- `server.js` : Express bootstrap, CORS/JSON config, route mounting under `/api/*`.
- `routes/` : per-domain routers:
  - `bookRoutes.js` : public books search/list/detail.
  - `authRoutes.js` : register/login.
  - `accountRoutes.js` : profile CRUD and avatar upload.
  - `savedBookRoutes.js` : save/remove book for a user.
  - `subscriptionRoutes.js` : start, read, and toggle subscription.
  - `commentRoutes.js` : public stats/comments plus authenticated create/update/delete.
  - `readingRoutes.js` : track current/finished reading entries.
  - `recommendationRoutes.js` : personalized recommendations.
  - `adminRoutes.js` : admin-only book CRUD, uploads, and comment moderation.
- `controllers/` : handlers with validation and Supabase I/O (matching the route names above).
- `middleware/` : `authMiddleware.js` implements JWT verification and admin role check.
- `db.js` : Supabase client initialization (env-driven config).

## Related Docs
- Overview and setup: [README.md](./README.md)
- API reference: [API.md](./API.md)
- Frontend notes: [Frontend.md](./Frontend.md)
- Database schema and storage: [Database.md](./Database.md)
- Screenshots and walkthroughs: [Screenshots.md](./Screenshots.md)

## Running Locally
```bash
cd backend
npm install
npm run dev   # or npm start
```
API will listen on `http://localhost:${PORT || 5000}` with routes under `/api`.

## Notes
- File uploads use base64 data URLs and are stored in Supabase buckets; responses return both bucket path and public URL.
- Admin routes are guarded by both auth and role checks.
- Error responses are JSON with an `error` message; empty 204 bodies for deletions where appropriate.
