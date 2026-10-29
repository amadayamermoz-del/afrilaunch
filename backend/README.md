# AfriLaunch backend

NestJS REST API backed by PostgreSQL and Prisma. All routes are prefixed with
`/api`; authenticated routes require `Authorization: Bearer <accessToken>`.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a private,
   randomly generated `JWT_SECRET` of at least 32 characters.
3. Create/update the database with
   `npm run prisma:migrate:dev -- --name init`.
4. Start the API with `npm run start:dev`.

Run `npm run prisma:generate` after installing dependencies and before building.
The database migration requires a reachable PostgreSQL instance. Uploaded files are stored outside the public web root in
`DOCUMENT_STORAGE_DIR` (default `storage/documents`) and are excluded from git.
Uploads are limited to 10 MiB and PDF, Word, JPEG, or PNG files.

## Main routes

| Area | Routes |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, authenticated `POST /auth/change-password` |
| Profiles | `GET /profile`, `PATCH /profile` |
| Categories | `GET /categories`; admin: `GET /categories/admin`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` |
| Projects | public: `GET /projects/public`, `GET /projects/public/:id`; authenticated: `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `POST /projects/:id/submit`; admin: `GET /projects/admin`, `PATCH /projects/:id/status` |
| Opportunities | `GET /opportunities`, `GET /opportunities/:id`; admin: `GET /opportunities/admin`, `POST /opportunities`, `PATCH /opportunities/:id` |
| Applications | authenticated: `GET /applications`, `POST /applications/opportunity/:opportunityId`, `POST /applications/:id/withdraw`; admin: `GET /applications/admin`, `PATCH /applications/:id/status` |
| Documents | authenticated: `GET/POST /documents`, `GET /documents/:id/download`, `DELETE /documents/:id` (`POST` expects multipart field `file` and optional `projectId`) |
| Notifications | authenticated: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`; admin: `POST /notifications/users/:userId` |
| Administration | admin: `GET /admin/users`, `PATCH /admin/users/:id` |

New accounts receive the `USER` role. After creating an account, grant the
first administrator role with `npm run admin:promote -- user@example.com`;
the API never accepts a role during public registration.

If you cannot sign in because you forgot the email address, from `backend/`
run `npm run admin:email:update -- new-address@example.com` with the correct
database configured in `.env`. This updates the email only when exactly one
active administrator exists; otherwise it stops without making changes.
Confirm that `DATABASE_URL` points to the intended database before running it.

## Checks

Run `npm run typecheck`, `npm run lint`, and `npm test`. Prisma schema
validation and generated-client checks are available as `npm run prisma:validate`
and `npm run prisma:generate`.
