# Nairent web client

## Local development

1. Configure the API using `server/.env.example`, then apply the database
   migrations and optionally add demo listings. See [`server/README.md`](../server/README.md).
2. Start the API from `server/` with `npm run dev` (default port `4000`).
3. In a second terminal, run `npm install` and `npm run dev` from `client/`.

Vite forwards `/api` requests to the local API. The browser therefore uses the
same API path in local development as the production build.

## Production build

Run `npm run build` from `client/`. Set `VITE_API_URL` to the deployed API's
`/api` URL when the frontend and API use different origins. Never place database
credentials, JWT secrets, or the Supabase service-role key in frontend variables.

Copy `.env.example` to `.env.local` to configure client environment variables.
Property details include a Google Maps link for the approximate neighborhood.
To show an embedded map preview, create a browser key in Google Cloud, enable the
[Maps Embed API](https://developers.google.com/maps/documentation/embed/get-api-key),
and set `VITE_GOOGLE_MAPS_EMBED_API_KEY` before the production build. Restrict the
key to the deployed website origins and Maps Embed API. New listings require the
lister to provide a searchable property address; existing listings without one
continue to show their neighborhood area. The external
[Google Maps link](https://developers.google.com/maps/documentation/urls/get-started)
works without an API key.
