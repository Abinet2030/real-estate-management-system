import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
app.use('/api/properties', propertiesRouter);
import propertiesRouter from './routes/properties.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({
        status: "ok",
        message: "API is running"
    });
});

export default app;