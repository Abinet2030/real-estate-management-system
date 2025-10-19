import express from 'express';
import mongoose from 'mongoose';
import Property from '../models/Property.js';

const router = express.Router();

// GET /api/properties - list with optional filters
router.get('/', async (req, res) => {
  try {

    if (mongoose.connection.readyState !== 1) {
      const env = (process.env.NODE_ENV || 'development').toLowerCase();
      if (env !== 'production') return res.json([]);
    }
    const { ownerId, agentId, status } = req.query || {};
    const filter = {};
    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) filter.ownerId = new mongoose.Types.ObjectId(ownerId);
    if (agentId && mongoose.Types.ObjectId.isValid(agentId)) filter.agentId = new mongoose.Types.ObjectId(agentId);
    if (status) filter.status = status;
    const items = await Property.find(filter).sort({ createdAt: -1 });
    res.json(items.map(mapProperty));
  } catch (err) {
    console.error('GET /properties error:', err);
    
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/properties/published - public list for Home page
router.get('/published', async (_req, res) => {
  try {

    if (mongoose.connection.readyState !== 1) {
      return res.json([])
    }
    let items = await Property.find({ status: 'published' }).sort({ createdAt: -1 }).limit(40);
    // Fallback: if there are no published properties yet, surface recent ones of any status
    if (!items || items.length === 0) {
      items = await Property.find({}).sort({ createdAt: -1 }).limit(12);
    }
    res.json(items.map(mapProperty));
  } catch (err) {
    
    console.error('[GET] /api/properties/published failed', {
      name: err && err.name,
      message: err && err.message,
      stack: err && err.stack,
    });

    return res.json([]);
  }
});

// POST /api/properties - create a property (seller)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const required = ['title', 'price'];
    for (const k of required) {
      if (!body[k] && body[k] !== 0) return res.status(400).json({ error: `${k} is required` });
    }
    const doc = await Property.create({
      title: body.title,
      description: body.description || '',
      price: Number(body.price),
      currency: body.currency || 'USD',
      type: body.type || 'house',
      bedrooms: Number(body.bedrooms || 0),
      bathrooms: Number(body.bathrooms || 0),
      areaSqm: Number(body.areaSqm || 0),
      location: body.location || {},
      images: Array.isArray(body.images) ? body.images : [],
      ownerId: body.ownerId || null,
      agentId: body.agentId || null,
      status: body.publish === true ? 'published' : 'pending',
    });
    res.status(201).json({ property: mapProperty(doc) });
  } catch (err) {
    console.error('POST /properties error:', err);
    // Database unavailable → 503 for clarity
    const msg = (err && err.message ? err.message : '').toLowerCase();
    const isDbUnavailable =
      (err && (err.name === 'MongoServerSelectionError' || err.name === 'MongooseError')) ||
      msg.includes('failed to connect') ||
      msg.includes('timed out') ||
      msg.includes('buffering');
    if (isDbUnavailable) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    }
    // Validation errors
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return res.status(500).json({ error: 'Internal Server Error', name: err?.name || 'Error', message: err?.message || '' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/properties/by-owner?ownerId=xxx
router.get('/by-owner', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const env = (process.env.NODE_ENV || 'development').toLowerCase();
      if (env !== 'production') return res.json([]);
    }
    const { ownerId } = req.query || {};
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });
    if (!mongoose.Types.ObjectId.isValid(ownerId)) return res.status(400).json({ error: 'ownerId is invalid' });
    const items = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }).sort({ createdAt: -1 });
    res.json(items.map(mapProperty));
  } catch (err) {
    console.error('GET /properties/by-owner error:', err);
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/properties/:id - get single property by id (keep after specific routes)
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const env = (process.env.NODE_ENV || 'development').toLowerCase();
      if (env !== 'production') return res.status(404).json({ error: 'Property not found' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'id is invalid' });
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(mapProperty(property));
  } catch (err) {
    console.error('GET /properties/:id error:', err);
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function mapProperty(p) {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    price: p.price,
    currency: p.currency,
    type: p.type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    areaSqm: p.areaSqm,
    location: p.location,
    images: p.images,
    ownerId: p.ownerId,
    agentId: p.agentId,
    status: p.status,
    createdAt: p.createdAt,
  };
}

export default router;
