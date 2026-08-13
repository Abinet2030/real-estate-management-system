# relstate-management

A full-stack project scaffold using Laravel (API backend), React (Vite) frontend, and MongoDB Atlas for data.

## Prerequisites
- PHP 8.2+ (CLI)
- Composer
- Node.js 18+ and npm
- Git
- A MongoDB Atlas cluster (or a reachable MongoDB URI)

## Quick Start

1) Install prerequisites above and ensure they are available in PATH:
```powershell
php -v
composer -V
node -v
npm -v
git --version
```

2) Backend: create Laravel app in `backend/` and add MongoDB support
```powershell
# from project root
composer create-project laravel/laravel backend

# enter backend and install MongoDB Laravel package (official)
cd backend
composer require mongodb/laravel

# generate app key and copy env
copy .env.example .env
php artisan key:generate

# set your MongoDB connection (see .env section below)
```

3) Frontend: create React app (Vite) in `frontend/`
```powershell
# from project root
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

4) Configure environment variables
- Backend: edit `backend/.env` and set `APP_URL` and `MONGODB_URI`.
- Frontend: if you need environment variables, create `frontend/.env` (Vite uses `VITE_` prefix).

5) Run the apps
```powershell
# backend
cd backend
php artisan serve --host 127.0.0.1 --port 8000

# frontend (in a new terminal)
cd frontend
npm run dev -- --host --port 5173
```

Then open:
- API: http://127.0.0.1:8000
- Web: http://127.0.0.1:5173

## CORS
If calling the API from the React app, allow the origin in `backend/config/cors.php` after install. Example allowed origins during local dev: `http://127.0.0.1:5173`.

## MongoDB Atlas Setup (summary)
- Create a free/shared cluster in Atlas.
- Create a database user and network access rule (allow your IP or 0.0.0.0/0 for dev).
- Get your connection string and paste into `MONGODB_URI`.

Example `MONGODB_URI`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority&appName=<appName>
```

## Repository layout
```
relstate-management/
  backend/   # Laravel app (to be created by composer)
  frontend/  # React Vite app (to be created by npm create vite)
  README.md
```

## Next Steps
- Run the scaffold commands above when ready.
- After backend install, create a sample model/controller and routes for APIs.
- Wire frontend to call `http://127.0.0.1:8000/api/...` endpoints.

## Vercel Deployment Checklist
- Ensure the root `vercel.json` is present and includes the frontend static build plus `server/api/[...all].js` for the backend.
- Set Vercel environment variables in the project dashboard:
  - `DATABASE_URL` = your PostgreSQL connection string
  - `PGSSL` = `true` if your Postgres server requires SSL (`false` otherwise)
  - `JWT_SECRET` = a strong token secret for auth
  - Optional admin user vars: `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Confirm `server/package.json` has `serverless-http` and `server/src/app.js` exports the Express app.
- Use `vercel deploy --prod --yes` from the repository root to deploy both frontend and backend.
- If using the frontend separately, set `VITE_API_URL` in frontend env vars to the deployed backend API base URL (example: `https://your-backend.vercel.app`).
- If deploying this monorepo root as a single Vercel project, do not set `VITE_API_URL` and allow the app to use the local `/api` proxy path.
 
