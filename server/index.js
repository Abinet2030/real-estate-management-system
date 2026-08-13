import app from './app.js';
import pool from "./database/db.js";
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

// Optional: basic signal handling for local dev
process.on('SIGINT', () => {
  console.log('SIGINT received. Closing server...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => process.exit(0));
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      postgres: "connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      postgres: "connection failed"
    });
  }
});