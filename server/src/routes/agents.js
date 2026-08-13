import express from 'express';

const router = express.Router();

// Agents endpoints relied on MongoDB/Mongoose. MongoDB has been removed from this
// project. Implement Postgres-backed queries (using `getPostgresPool`) if you
// need equivalent functionality. For now, return 501.
router.use((req, res) => res.status(501).json({ error: 'Agents endpoints removed (MongoDB removed). Implement Postgres queries.' }));

export default router;
