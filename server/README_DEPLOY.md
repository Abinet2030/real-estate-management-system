# Server deployment (Render)

This service runs the Node/Express API found in `server/`.

## Required environment variables (Render → relstate-api)

- MONGODB_URI: Your MongoDB Atlas connection string (required)
- MONGODB_DB: Database name (e.g., `realestate`)
- NODE_VERSION: `20`
- Optional admin seed on first boot:
  - ADMIN_NAME
  - ADMIN_EMAIL
  - ADMIN_PASSWORD

Health check path: `/api/health`

Start command: `npm start` → `node src/index.js`

## Notes
- Do not use the in-memory MongoDB server in production. Provide a real `MONGODB_URI`.
- If you set admin seed variables the first time, remove them after the first successful boot to avoid accidental re-seeding.
