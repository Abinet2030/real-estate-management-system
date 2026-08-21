import { getPostgresPool } from '../lib/postgres.js';

function mapRowToProperty(p) {
  if (!p) return null;
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
    videos: Array.isArray(p.videos) ? p.videos : [],
    featured: Boolean(p.featured),
    ownerId: p.created_by,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

const Property = {
  unsupported: false,

  // Basic find with optional filters: { status, type, city, ownerId, limit }
  find: async (filters = {}) => {
    const values = [];
    const conditions = [];
    if (filters.status) { values.push(String(filters.status)); conditions.push(`status = $${values.length}`); }
    if (filters.type) { values.push(String(filters.type)); conditions.push(`LOWER(type) = LOWER($${values.length})`); }
    if (filters.city) { values.push(`%${String(filters.city)}%`); conditions.push(`LOWER(location->>'city') LIKE LOWER($${values.length})`); }
    if (filters.ownerId) { values.push(String(filters.ownerId)); conditions.push(`created_by = $${values.length}`); }
    const limit = Number(filters.limit || 100);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const q = `SELECT * FROM properties ${where} ORDER BY featured DESC, created_at DESC LIMIT ${Math.min(limit, 1000)}`;
    const { rows } = await getPostgresPool().query(q, values);
    return rows.map(mapRowToProperty);
  },

  findById: async (id) => {
    const { rows } = await getPostgresPool().query('SELECT * FROM properties WHERE id = $1 LIMIT 1', [id]);
    return mapRowToProperty(rows[0]);
  },

  create: async (data = {}, createdBy) => {
    const client = getPostgresPool();
     const { rows } = await client.query(
      `INSERT INTO properties
        (title, description, price, currency, type, bedrooms, bathrooms, area_sqm, location, images, videos, featured, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14)
        RETURNING *`,
      [
        data.title,
        data.description || '',
        Number(data.price || 0),
        data.currency || 'USD',
        data.type || 'house',
        Number(data.bedrooms || 0),
        Number(data.bathrooms || 0),
        Number(data.areaSqm || 0),
        JSON.stringify(data.location || {}),
        JSON.stringify(Array.isArray(data.images) ? data.images : []),
        JSON.stringify(Array.isArray(data.videos) ? data.videos : []),
        data.featured === true,
        data.status || (data.publish === true ? 'published' : 'draft'),
        createdBy || null,
      ],
    );
    return mapRowToProperty(rows[0]);
  },

  findByIdAndUpdate: async (id, update = {}) => {
    const fields = [];
    const values = [];
    const setNumber = (val) => { values.push(val); return `$${values.length}`; };

    const editable = ['title', 'description', 'price', 'currency', 'type', 'bedrooms', 'bathrooms', 'areaSqm', 'featured', 'status'];
    for (const key of editable) {
      if (update[key] !== undefined) {
        if (['price', 'bedrooms', 'bathrooms', 'areaSqm'].includes(key)) {
          fields.push(`${key === 'areaSqm' ? 'area_sqm' : key} = ${setNumber(Number(update[key]))}`);
        } else {
          fields.push(`${key === 'areaSqm' ? 'area_sqm' : key} = ${setNumber(update[key])}`);
        }
      }
    }
    if (update.location !== undefined) { fields.push(`location = ${setNumber(JSON.stringify(update.location || {}))}::jsonb`); }
    if (Array.isArray(update.images)) { fields.push(`images = ${setNumber(JSON.stringify(update.images))}::jsonb`); }
    if (Array.isArray(update.videos)) { fields.push(`videos = ${setNumber(JSON.stringify(update.videos))}::jsonb`); }

    if (!fields.length) return null;
    values.push(id);
    const q = `UPDATE properties SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    const { rows } = await getPostgresPool().query(q, values);
    return mapRowToProperty(rows[0]);
  },

  findByIdAndDelete: async (id) => {
    const { rows } = await getPostgresPool().query('DELETE FROM properties WHERE id = $1 RETURNING *', [id]);
    return mapRowToProperty(rows[0]);
  },
};

export default Property;
