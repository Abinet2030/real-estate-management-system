# Relstate

Relstate is a React/Vite frontend and an Express API backed by PostgreSQL. It is configured to deploy as one Vercel project: the web app is served at `/` and the API at `/api`.

## Technology stack

### Frontend

- **React 19** for the user interface
- **Vite 7** for development and production builds
- **React Router 6** for client-side routing
- **CSS** for styling

### Server

- **Node.js 22** runtime
- **Express 4** REST API
- **PostgreSQL** database, connected through Vercel's Neon Postgres integration
- **node-postgres (`pg`)** for database queries and connection pooling
- **JSON Web Tokens (`jsonwebtoken`)** for administrator authentication
- **bcryptjs** for password hashing
- **Multer** for image-upload handling in local development
- **serverless-http** to run Express as a Vercel Function

## Database

Use the **Neon Postgres** integration from the Vercel Marketplace. Vercel Postgres itself is no longer available for new projects; the integration creates a managed Postgres database and adds its connection variables to the linked Vercel project.

The server accepts either `POSTGRES_URL` (provided by most Vercel/Neon integrations) or `DATABASE_URL` (useful for a manually supplied connection string). It never needs MongoDB or Render.

After connecting the database, run the SQL in `server/database/relstate.sql` once in the database provider's SQL editor. Then create the administrator with:

```powershell
vercel env pull server/.env.local --environment=production
$env:DATABASE_URL = (Get-Content server/.env.local | Where-Object { $_ -match '^POSTGRES_URL=' } | ForEach-Object { $_.Substring(13) })
$env:ADMIN_NAME = 'Administrator'
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'use-a-strong-password'
npm --prefix server run db:seed-admin
```

Alternatively, set `DATABASE_URL`, `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` temporarily and run `npm --prefix server run db:seed-admin` locally. Do not commit any `.env` files.

## Vercel deployment

Set these environment variables for both **Production** and **Preview** in the Vercel project:

- `JWT_SECRET` — a long random value.
- `POSTGRES_URL` or `DATABASE_URL` — supplied by the Vercel Postgres integration.
- `PGSSL=true` if the connection string does not already enforce SSL.

Leave `VITE_API_URL` unset: the frontend calls the same deployment at `/api`.

Deploy from the repository root:

```powershell
vercel --prod
```

Verify the deployment at `/api/health`. A healthy response reports `"postgres":"configured"`.

## Local development

Create `server/.env` with `DATABASE_URL`, `JWT_SECRET`, and optionally `PGSSL=true`, then run:

```powershell
npm run dev:server
npm run dev:frontend
```

Vercel Functions have an ephemeral read-only filesystem. Existing images in `server/uploads` can be served when included in the deployment, but new image uploads need object storage (for example Vercel Blob) before enabling them in production.
