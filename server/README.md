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

   For the Supabase Management API migration mode, set `DATABASE_URL` to the
   project's HTTPS URL and provide a short-lived, scoped `access_token` with
   database write permission. The running API still requires a PostgreSQL
   connection string in `DATABASE_URL`; use the Supabase Session pooler URL
   when starting the server.

6. Install dependencies and start the server:

   ```sh
   npm install
   npm run dev
   ```

   To add sample listings for local development only, run:

   ```sh
   npm run seed:demo
   ```

   This creates a demo lister, Nairobi location options and approved sample
   listings. The command refuses to run when `NODE_ENV=production`, and demo
   accounts cannot sign in to a production deployment.

To grant administrator access, create the intended account through the app,
then promote it from a trusted server shell:

```sh
npm run admin:promote -- admin@example.com
```

The command changes only that existing account's role. It does not set or print
a password. Sign in again after promotion so the account receives an admin token.

The API listens on `http://localhost:4000` by default. In production, set
`NODE_ENV=production`, use a randomly generated `JWT_SECRET`, and set
`CLIENT_ORIGIN` to the exact frontend origin. Multiple allowed origins can be
provided as a comma-separated value.

Email verification and email notifications are disabled. New accounts set a
password during signup and can sign in immediately. Email ownership is not
confirmed, and the app does not send password-reset emails.

`SUPABASE_ANON_KEY` may be used by a browser client, but
`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be placed in the
client application's environment or committed to source control.

The lister property form uses the Google Maps JavaScript API so listers can pin
the property and renters can open that exact point. Set
`VITE_GOOGLE_MAPS_API_KEY` and `VITE_GOOGLE_MAPS_MAP_ID` in `client/.env`; enable
the Maps JavaScript API and Maps Embed API, then restrict the browser key to the
deployed site origins. `VITE_GOOGLE_MAPS_EMBED_API_KEY` is optional if the same
key can access both APIs. The exact pin is saved with the listing and is
separate from the neighborhood's approximate center.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check that the API process is running |
| GET | `/api/health/live` | Liveness check that does not require the database |
| POST | `/api/auth/register` | Create a tenant or lister account |
| POST | `/api/auth/login` | Authenticate with email and password |
| GET | `/api/auth/me` | Return the authenticated user |
| GET | `/api/listings` | Search approved listings and return nearby recommendations |
| GET | `/api/listings/recommendations` | Get alternative recommendations for a location/budget |
| GET | `/api/listings/:listingId` | View an approved listing |
| GET | `/api/locations` | List searchable Nairobi locations |
| POST | `/api/appointments` | Request a viewing appointment without tenant signup |
| POST | `/api/reservations` | Send a no-payment reservation request for an approved listing |
| PATCH | `/api/lister/reservations/:reservationId/status` | Accept or decline a reservation |
| POST | `/api/inquiries` | Send an inquiry or question directly to a listing's lister |
| GET | `/api/inquiries/mine` | List inquiries sent by the signed-in tenant |
| GET | `/api/inquiries/lister` | List inquiries received by the authenticated lister |
| GET | `/api/saved-searches` | List saved searches for the signed-in tenant |
| POST | `/api/saved-searches` | Save a rental search for the signed-in tenant |
| DELETE | `/api/saved-searches/:searchId` | Delete a saved search |
| GET | `/api/appointments/mine` | List the signed-in tenant's appointments |
| GET | `/api/lister/listings` | List the authenticated lister's properties |
| POST | `/api/lister/listings` | Submit a property for review |
| GET | `/api/admin/listings` | List all listings for moderation (admin only) |
| PATCH | `/api/admin/listings/:listingId/status` | Approve, reject, or flag a listing (admin only) |
| GET | `/api/admin/inquiries` | List the 100 most recent inquiries (admin only) |
| GET | `/api/admin/stats` | Platform statistics and KPI overview (admin only) |

Registration accepts `fullName`, `email`, `phone`, `password`, and an optional
`role` (`tenant` or `lister`). Accounts are active immediately. Successful
registration and login return a bearer token that must be sent as
`Authorization: Bearer <token>`.

The API does not expose passwords or password hashes in responses. Database
errors are logged server-side and returned as safe API errors.

Listers set a viewing fee per property (or enter zero). Renters see that fee
before sending a viewing request. Nairent does not collect viewing fees; renters
should confirm payment arrangements directly with the lister.

## Production deployment

The repository includes a root `Dockerfile` and `infra/` Bicep templates for
Azure App Service and Azure Static Web Apps. The API container serves the
frontend build when it is present under `/public`; the separate Static Web App
is the recommended frontend host.

Before deploying, apply all migrations against the restored Supabase database,
configure the production secrets in Azure App Service settings, and set
`CLIENT_ORIGIN` to the frontend origin. Never put
`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `JWT_SECRET` in frontend
variables.

## Deploying both services on Vercel

The root `vercel.json` configures the Vercel Services beta to build `client/`
with Vite and `server/` with Express in one project. Connect the repository to
Vercel with the repository root as the project root; requests to `/api/*` go
to the server, and all other paths go to the client. The client already uses
`/api` by default, so leave `VITE_API_URL` unset when both services share the
Vercel domain.

Before deploying, apply the database migrations to the production database.
In the Vercel project settings, add these server environment variables:

- `DATABASE_URL`: the Supabase PostgreSQL connection string (use the Session
  pooler URL).
- `JWT_SECRET`: a randomly generated secret with at least 32 characters.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `CLIENT_ORIGIN`: the deployed client origin, such as `https://your-domain`.

If using Google Maps, add `VITE_GOOGLE_MAPS_API_KEY` and
`VITE_GOOGLE_MAPS_MAP_ID` as Vercel environment variables for the client build.
These `VITE_` values are public in the built client; never use that prefix for
server secrets.

## Deploying both services on Render

The root `Dockerfile` builds the Vite client and runs the Express API in one
Render Web Service. Create a Web Service from the repository's `main` branch,
select Docker, and leave the root directory blank. Set `DATABASE_URL`,
`JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLIENT_ORIGIN`
in the service's environment. Set `CLIENT_ORIGIN` to the Render service's exact
public origin after Render assigns it. Render supplies `PORT`; the Dockerfile
sets `NODE_ENV=production`. Email verification and all email notifications are
disabled, so SMTP settings are not needed.
