import express from 'express';
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import { requireAdmin } from '../middleware/auth.js';
import { getPostgresPool } from '../lib/postgres.js';

const router = express.Router();

// GET /api/properties - list with optional filters
router.get('/', async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const values = [];
      const conditions = ["status = 'published'"];
      if (req.query?.type) { values.push(String(req.query.type)); conditions.push(`LOWER(type) = LOWER($${values.length})`); }
      if (req.query?.city) { values.push(`%${String(req.query.city)}%`); conditions.push(`LOWER(location->>'city') LIKE LOWER($${values.length})`); }
      const { rows } = await getPostgresPool().query(
        `SELECT * FROM properties WHERE ${conditions.join(' AND ')} ORDER BY featured DESC, created_at DESC LIMIT 100`,
        values,
      );
      return res.json(rows.map(mapPostgresProperty));
    }

    if (mongoose.connection.readyState !== 1) {
      const env = (process.env.NODE_ENV || 'development').toLowerCase();
      if (env !== 'production') return res.json([]);
    }
    const filter = { status: 'published' };
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
    if (process.env.DATABASE_URL) {
      const { rows } = await getPostgresPool().query(
        `SELECT * FROM properties WHERE status = 'published'
         ORDER BY featured DESC, created_at DESC LIMIT 40`,
      );
      return res.json(rows.map(mapPostgresProperty));
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json([])
    }
    const items = await Property.find({ status: 'published' }).sort({ featured: -1, createdAt: -1 }).limit(40);
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

// GET /api/properties/manage - complete listing queue for the administrator dashboard.
router.get('/manage', requireAdmin, async (_req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const { rows } = await getPostgresPool().query('SELECT * FROM properties ORDER BY created_at DESC');
      return res.json(rows.map(mapPostgresProperty));
    }
    const items = await Property.find({}).sort({ createdAt: -1 });
    return res.json(items.map(mapProperty));
  } catch {
    return res.status(500).json({ error: 'Unable to load properties' });
  }
});

// Property publishing is administrator-only.
router.post('/', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const required = ['title', 'price'];
    for (const k of required) {
      if (!body[k] && body[k] !== 0) return res.status(400).json({ error: `${k} is required` });
    }
    if (process.env.DATABASE_URL) {
      const { rows } = await getPostgresPool().query(
        `INSERT INTO properties
          (title, description, price, currency, type, bedrooms, bathrooms, area_sqm, location, images, featured, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13)
         RETURNING *`,
        [
          body.title,
          body.description || '',
          Number(body.price),
          body.currency || 'USD',
          body.type || 'house',
          Number(body.bedrooms || 0),
          Number(body.bathrooms || 0),
          Number(body.areaSqm || 0),
          JSON.stringify(body.location || {}),
          JSON.stringify(Array.isArray(body.images) ? body.images : []),
          body.featured === true,
          body.publish === true ? 'published' : 'draft',
          req.user.sub,
        ],
      );
      return res.status(201).json({ property: mapPostgresProperty(rows[0]) });
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
      featured: body.featured === true,
      status: body.publish === true ? 'published' : 'draft',
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

// PATCH /api/properties/:id - admin may edit and publish/unpublish a listing.
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const body = req.body || {};
      const fields = [];
      const values = [];
      if (typeof body.featured === 'boolean') { values.push(body.featured); fields.push(`featured = $${values.length}`); }
      if (Array.isArray(body.images)) { values.push(JSON.stringify(body.images)); fields.push(`images = $${values.length}::jsonb`); }
      const editable = [
        ['title', 'title'], ['description', 'description'], ['price', 'price'], ['currency', 'currency'],
        ['type', 'type'], ['bedrooms', 'bedrooms'], ['bathrooms', 'bathrooms'], ['areaSqm', 'area_sqm'],
      ];
      for (const [input, column] of editable) {
        if (body[input] !== undefined) {
          values.push(['price', 'bedrooms', 'bathrooms', 'areaSqm'].includes(input) ? Number(body[input]) : body[input]);
          fields.push(`${column} = $${values.length}`);
        }
      }
      if (body.location !== undefined) { values.push(JSON.stringify(body.location || {})); fields.push(`location = $${values.length}::jsonb`); }
      if (body.status !== undefined) {
        if (!['draft', 'pending', 'published'].includes(body.status)) return res.status(400).json({ error: 'Invalid listing status' });
        values.push(body.status); fields.push(`status = $${values.length}`);
      }
      if (!fields.length) return res.status(400).json({ error: 'No supported property changes provided' });
      values.push(req.params.id);
      const { rows } = await getPostgresPool().query(
        `UPDATE properties SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values,
      );
      if (!rows[0]) return res.status(404).json({ error: 'Property not found' });
      return res.json({ property: mapPostgresProperty(rows[0]) });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'id is invalid' });
    const allowed = ['title', 'description', 'price', 'currency', 'type', 'bedrooms', 'bathrooms', 'areaSqm', 'location', 'images', 'status', 'featured'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if (updates.price !== undefined) updates.price = Number(updates.price);
    for (const key of ['bedrooms', 'bathrooms', 'areaSqm']) if (updates[key] !== undefined) updates[key] = Number(updates[key]);
    if (updates.status && !['draft', 'pending', 'published'].includes(updates.status)) return res.status(400).json({ error: 'Invalid listing status' });
    const property = await Property.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    return res.json({ property: mapProperty(property) });
  } catch (err) { return res.status(500).json({ error: 'Unable to update property' }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  if (process.env.DATABASE_URL) {
    try {
      const { rowCount } = await getPostgresPool().query('DELETE FROM properties WHERE id = $1', [req.params.id]);
      if (!rowCount) return res.status(404).json({ error: 'Property not found' });
      return res.json({ ok: true });
    } catch (err) {
      console.error('DELETE /properties PostgreSQL error:', err);
      return res.status(500).json({ error: 'Unable to delete property' });
    }
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'id is invalid' });
  const property = await Property.findByIdAndDelete(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  return res.json({ ok: true });
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
    if (process.env.DATABASE_URL) {
      const { rows } = await getPostgresPool().query('SELECT * FROM properties WHERE id = $1 AND status = $2', [req.params.id, 'published']);
      if (!rows[0]) return res.status(404).json({ error: 'Property not found' });
      return res.json(mapPostgresProperty(rows[0]));
    }
    if (mongoose.connection.readyState !== 1) {
      const env = (process.env.NODE_ENV || 'development').toLowerCase();
      if (env !== 'production') return res.status(404).json({ error: 'Property not found' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'id is invalid' });
    const property = await Property.findById(id)
      .populate('ownerId', 'name email phone profileImageUrl role')
      .populate('agentId', 'name email phone profileImageUrl role');
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
    featured: Boolean(p.featured),
    ownerId: p.ownerId?._id || p.ownerId,
    agentId: p.agentId?._id || p.agentId,
    owner: p.ownerId?.name ? {
      id: p.ownerId._id,
      name: p.ownerId.name,
      email: p.ownerId.email,
      phone: p.ownerId.phone,
      profileImageUrl: p.ownerId.profileImageUrl,
      role: p.ownerId.role,
    } : undefined,
    agent: p.agentId?.name ? {
      id: p.agentId._id,
      name: p.agentId.name,
      email: p.agentId.email,
      phone: p.agentId.phone,
      profileImageUrl: p.agentId.profileImageUrl,
      role: p.agentId.role,
    } : undefined,
    status: p.status,
    createdAt: p.createdAt,
  };
}

function mapPostgresProperty(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    currency: String(p.currency || '').trim(),
    type: p.type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    areaSqm: Number(p.area_sqm),
    location: p.location || {},
    images: Array.isArray(p.images) ? p.images : [],
    featured: Boolean(p.featured),
    ownerId: p.created_by,
    status: p.status,
    createdAt: p.created_at,
  };
}

export default router;
