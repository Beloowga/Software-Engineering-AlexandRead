# Software-Engineering-AlexandRead

## Overview

This project aims at creating an online library system experience called **AlexandRead**.
The goal of the project is to regroup open-source references all in one place.
We aim to make the references easily accessible so that readers can save their favorites and give feedback on them (ratings and comments).
The platform is available on desktop web-browsing.

## Credits

Kiran Kumar GANESAN, Marie-Lou JODET, Romain LEFEBVRE and Isabella LEWIS
Students of ESILV in Year 4

---

## Backend environment

Create a `backend/.env` file with your Supabase information:

```
PORT=5000
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_ACCOUNT_TABLE=account
SUPABASE_AVATAR_BUCKET=avatars
SUPABASE_READING_TABLE=acc_reading
SUPABASE_SAVED_BOOKS_TABLE=saved_books
JWT_SECRET=replace-this-secret
JWT_EXPIRES_IN=7d
# optional: override avatar size limit (bytes)
AVATAR_MAX_FILE_BYTES=3145728
```

### Account table

The backend uses the existing Supabase table `account` (set another name via `SUPABASE_ACCOUNT_TABLE`). Make sure it includes the authentication columns below. If a column is missing you can add it through Supabase SQL:

| column            | type        | notes                                                 |
| ----------------- | ----------- | ----------------------------------------------------- |
| id                | bigint/int4 | primary key                                           |
| email             | text        | unique                                                |
| password          | text        | bcrypt hash is stored here                            |
| pseudo            | text        | display name                                          |
| role              | text        | default `reader`                                      |
| sub_value         | numeric     | optional subscription info                            |
| start_sub_date    | date        | optional                                              |
| end_sub_date      | date        | optional                                              |
| name              | text        | optional, for account page                            |
| date_of_birth     | date        | optional                                              |
| region            | text        | optional                                              |
| favourite_book    | text        | optional                                              |
| favourite_author  | text        | optional                                              |
| favourite_genres  | text[]      | optional (Supabase array)                             |
| avatar_url        | text        | optional                                              |
| created_at        | timestamptz | default `now()`                                       |

### Auth & Account endpoints

- `POST /api/auth/register` – creates a profile and returns `{ token, profile }`.
- `POST /api/auth/login` – checks credentials and returns `{ token, profile }`.
- `GET /api/account/me` – requires `Authorization: Bearer <token>` and returns `{ profile }`.
- `PUT /api/account/me` – updates profile fields (email, pseudo, password, preferences, etc.).
- `POST /api/account/me/avatar` – accepts a base64 image payload (`{ "image": "data:image/png;base64,..." }`) and stores it inside the Supabase storage bucket defined in `SUPABASE_AVATAR_BUCKET`.
- `DELETE /api/account/me` – removes the currently authenticated account (plus its avatar).
- `GET /api/account/saved` – lists the current user's saved book IDs.
- `POST /api/account/saved` – body `{ "bookId": 123 }`, adds the book to the saved list.
- `DELETE /api/account/saved/:bookId` – removes a saved book.

The `token` is a JWT signed with `JWT_SECRET` and must be supplied in the `Authorization` header to access account routes.

### Saved books table

Your current schema already contains `account`, `books`, and `acc_reading`. To power the “My Library” UI, create a junction table (default name `saved_books`, override via `SUPABASE_SAVED_BOOKS_TABLE`) with:

| column       | type        | notes                                                         |
| ------------ | ----------- | ------------------------------------------------------------- |
| id           | bigint/int4 | primary key                                                   |
| account_id   | bigint      | `references account(id) on delete cascade`                    |
| book_id      | bigint      | `references books(id) on delete cascade`                      |
| created_at   | timestamptz | default `now()`                                               |
| status       | text        | optional (`saved`, `reading`, `finished`, etc.)               |
| notes        | text        | optional                                                       |

Add a unique constraint on `(account_id, book_id)` so a book cannot be saved twice. After adding the table you can extend the backend with endpoints to manage it and surface the data in the “My Library” section.

### Cascade deletion tips

The backend attempts to clean related tables (`acc_reading`, `saved_books`) before removing an account. For stronger guarantees, declare your foreign keys with `ON DELETE CASCADE` inside Supabase:

```sql
alter table acc_reading
  drop constraint if exists acc_reading_user_id_fkey,
  add constraint acc_reading_user_id_fkey
    foreign key (user_id) references account(id) on delete cascade;

alter table saved_books
  drop constraint if exists saved_books_account_id_fkey,
  add constraint saved_books_account_id_fkey
    foreign key (account_id) references account(id) on delete cascade;
```

With cascade in place, profile deletions automatically remove the child rows, and the backend’s cleanup calls act as a safety net.
