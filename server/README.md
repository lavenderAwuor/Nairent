# Nairent API

The API is a Node.js REST service backed by PostgreSQL. It currently provides the
authentication foundation required by the tenant and lister flows.

## Local setup

1. Create a PostgreSQL database named `nairent`.
2. Copy `.env.example` to `.env` if it does not already exist.
3. For Supabase, copy the **Session pooler** PostgreSQL connection string from
   Supabase Dashboard → Connect into `DATABASE_URL`. It includes the database
   password and is separate from `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Replace `JWT_SECRET` with a random value of at least 32 characters.
5. Apply the migrations:

   ```sh
   npm run migrate
   ```

6. Install dependencies and start the server:

   ```sh
   npm install
   npm run dev
   ```

   To add safe local/demo listings for exercising the tenant flow, run:

   ```sh
   npm run seed:demo
   ```

   This creates an explicitly labelled demo lister, Nairobi location options and
   approved demo listings ranging from KSh 10,000 per month.
   Do not use the demo password in production.

The API listens on `http://localhost:4000` by default.

`SUPABASE_ANON_KEY` may be used by a browser client, but
`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be placed in the
client application's environment or committed to source control.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check that the API process is running |
| POST | `/api/auth/register` | Create a tenant or lister account |
| POST | `/api/auth/login` | Authenticate with email and password |
| GET | `/api/auth/me` | Return the authenticated user |
| GET | `/api/listings` | Search approved listings |
| GET | `/api/listings/:listingId` | View an approved listing |
| GET | `/api/locations` | List searchable Nairobi locations |
| POST | `/api/appointments` | Request a free viewing appointment without tenant signup |
| POST | `/api/reservations` | Send a no-payment reservation request for an approved listing |
| GET | `/api/appointments/mine` | List the signed-in tenant's appointments |
| GET | `/api/lister/listings` | List the authenticated lister's properties |
| POST | `/api/lister/listings` | Submit a property for review |

Registration accepts `fullName`, `email`, `password`, and an optional `role`
(`tenant` or `lister`). Authentication returns a bearer token that must be sent
as `Authorization: Bearer <token>`.

The API does not expose passwords or password hashes in responses. Database
errors are logged server-side and returned as safe API errors.

Viewing appointments are always free. Nairent does not charge a booking fee,
and listers may not charge tenants a viewing fee through this platform.
