# API Endpoints

Base URL: `${VITE_API_BASE_URL || http://localhost:5000}/api`

Related docs: [README.md](./README.md) | [Backend.md](./Backend.md) | [Frontend.md](./Frontend.md) | [Database.md](./Database.md) | [Screenshots.md](./Screenshots.md)

- Authentication: Protected routes expect `Authorization: Bearer <JWT>` from login or register.
- Content type: Write endpoints use JSON unless stated otherwise; upload routes expect a base64 data URL plus an optional `filename`.

## Health Check
- GET `/` : backend availability ping.
  Response: plain text message.

## Books (public)
- GET `/api/books` : list all books with metadata.
  Query params: none.
  Response: array of book objects.

- GET `/api/books/search` : filter books.
  Query params: `title`, `author`, `genre`, `year` (all optional).
  Response: array of matching book objects.

- GET `/api/books/:id` : fetch a single book including content and premium flag.
  Path params: `id` (number).
  Response: book object or 404 if missing.

## Authentication (public)
- POST `/api/auth/register` : create an account.
  Request body (JSON): `email`, `password`, `pseudo`, optional `name`, `dateOfBirth`, `region`, `favouriteBook`, `favouriteAuthor`, `favouriteGenres`, `role`, `subscriptionValue`, `subscriptionStart`, `subscriptionEnd`, `subscriptionAutoRenew`.
  Response: `{ token, profile }`.

- POST `/api/auth/login` : authenticate and receive a session token.
  Request body (JSON): `email`, `password`.
  Response: `{ token, profile }`.

## Account Profile (auth required)
- GET `/api/account/me` : current user profile.
  Response: `{ profile }`.

- PUT `/api/account/me` : update profile fields.
  Request body (JSON): any of `email`, `pseudo`, `name`, `dateOfBirth`, `region`, `favouriteBook`, `favouriteAuthor`, `favouriteGenres` (array or comma string), `password`.
  Response: `{ profile }` with updated fields.

- POST `/api/account/me/avatar` : upload avatar.
  Request body (JSON): `{ image: <base64 data URL> }`.
  Response: `{ profile }` with new `avatarUrl`.

- DELETE `/api/account/me` : delete the account and related data.
  Response: empty body with status 204.

## Saved Books (auth required)
- GET `/api/account/saved` : return saved book ids.
  Response: `{ savedBookIds: number[] }`.

- POST `/api/account/saved` : save a book.
  Request body (JSON): `{ bookId: number }`.
  Response: `{ bookId }`.

- DELETE `/api/account/saved/:bookId` : remove a saved book.
  Path params: `bookId` (number).
  Response: empty body with status 204.

## Reading Activity (auth required)
- GET `/api/account/reading` : list in-progress entries with book details.
  Response: `{ entries: [...] }`.

- GET `/api/account/reading/history` : list finished entries with book details.
  Response: `{ entries: [...] }`.

- GET `/api/account/reading/:bookId` : fetch reading status for a specific book.
  Path params: `bookId` (number).
  Response: `{ entry: {...} }` or `entry: null`.

- POST `/api/account/reading/:bookId/start` : start or resume reading; creates entry if absent.
  Path params: `bookId` (number).
  Response: `{ entry }` (201 when created).

- POST `/api/account/reading/:bookId/finish` : mark a book as finished.
  Path params: `bookId` (number).
  Response: `{ entry }`.

## Subscription (auth required)
- GET `/api/subscription/me` : current subscription status.
  Response: `{ subscription: { value, start, end, autoRenew, daysRemaining, isActive } }`.

- POST `/api/subscription/start` : start a subscription.
  Request body (JSON): `{ autoRenew: boolean }` (defaults to true when omitted).
  Response: `{ subscription }` with new period.

- PATCH `/api/subscription/auto-renew` : toggle auto-renew and start a period when enabling.
  Request body (JSON): `{ autoRenew: boolean }`.
  Response: `{ subscription }`.

## Recommendations (auth required)
- GET `/api/recommendations` : personalized book recommendations based on history and preferences.
  Response: array of book objects.

## Comments and Ratings
- GET `/api/comments/stats/:bookId` : public aggregate rating for a book.
  Path params: `bookId` (number).
  Response: `{ averageRating, totalComments }`.

- GET `/api/comments/book/:bookId` : public comments for a book with pagination.
  Path params: `bookId` (number).
  Query params: `limit` (number, default 10), `offset` (number, default 0).
  Response: `{ comments: [...], total }`.

- POST `/api/comments` : create comment and rating (auth required).
  Request body (JSON): `{ bookId: number, rating: integer 1-10, comment: string|null }`. Only one comment per user and book.
  Response: created comment with user info.

- PUT `/api/comments/:commentId` : update own comment (auth required).
  Path params: `commentId` (number).
  Request body (JSON): any of `rating: integer 1-10`, `comment: string|null`.
  Response: updated comment with user info.

- DELETE `/api/comments/:commentId` : delete own comment (auth required).
  Path params: `commentId` (number).
  Response: confirmation message.

## Admin (auth + admin role)
- POST `/api/admin/books` : create book.
  Request body (JSON): `title`, `author`, optional `genre`, `year`, `summary`, `coverImage`, `content`, `premium`.
  Response: created book.

- PUT `/api/admin/books/:id` : update book fields.
  Path params: `id` (number).
  Request body (JSON): any editable book fields.
  Response: updated book.

- DELETE `/api/admin/books/:id` : remove book.
  Path params: `id` (number).
  Response: empty body with status 204.

- POST `/api/admin/upload/cover` : upload cover file.
  Request body (JSON): `{ file: <base64 data URL>, filename: string }`.
  Response: `{ path, url }`.

- POST `/api/admin/upload/book` : upload book content file.
  Request body (JSON): `{ file: <base64 data URL>, filename: string }`.
  Response: `{ path, url }`.

- GET `/api/admin/comments` : list comments with user and book info for moderation.
  Query params: `limit` (number, default 50, max 100), `offset` (number, default 0), `bookId` (number, optional filter).
  Response: `{ comments: [...], total }`.

- PUT `/api/admin/comments/:id` : update any comment.
  Path params: `id` (number).
  Request body (JSON): `rating: integer 1-10`, `comment: string|null`.
  Response: updated comment with user and book info.

- DELETE `/api/admin/comments/:id` : delete any comment.
  Path params: `id` (number).
  Response: empty body with status 204.
