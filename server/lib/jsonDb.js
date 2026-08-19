import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'database', 'data.json');

let _state = null;

async function loadState() {
  if (_state) return _state;
  try {
    const txt = await fs.readFile(dataPath, 'utf8');
    _state = JSON.parse(txt);
  } catch (err) {
    _state = { properties: [], users: [] };
    await saveState();
  }
  return _state;
}

async function saveState() {
  if (!_state) return;
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(_state, null, 2), 'utf8');
}

function genId() {
  return crypto.randomBytes(8).toString('hex');
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function parseMaybeJson(val) {
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

function makeRows(rows) {
  return { rows: rows.map(clone) };
}

function matchWhereConditions(item, conditions, values) {
  for (const cond of conditions) {
    const c = cond.trim();

    // status = 'published' (literal)
    const mLit = c.match(/status\s*=\s*'([^']+)'/i);
    if (mLit) {
      if (String(item.status) !== mLit[1]) return false;
      continue;
    }

    // LOWER(type) = LOWER($n)
    const mType = c.match(/LOWER\(([^)]+)\)\s*=\s*LOWER\(\$([0-9]+)\)/i);
    if (mType) {
      const col = mType[1].trim();
      const idx = Number(mType[2]) - 1;
      const val = String(values[idx] || '').toLowerCase();
      if (String(item[col] || '').toLowerCase() !== val) return false;
      continue;
    }

    // LOWER(location->>'city') LIKE LOWER($n)
    const mCity = c.match(/LOWER\(location->>\'city\'\)\s+LIKE\s+LOWER\(\$([0-9]+)\)/i);
    if (mCity) {
      const idx = Number(mCity[1]) - 1;
      const raw = String(values[idx] || '');
      const needle = raw.replace(/%/g, '').toLowerCase();
      const city = String((item.location && item.location.city) || '').toLowerCase();
      if (!city.includes(needle)) return false;
      continue;
    }

    // created_by = $n
    const mOwner = c.match(/created_by\s*=\s*\$([0-9]+)/i);
    if (mOwner) {
      const idx = Number(mOwner[1]) - 1;
      if (String(item.created_by) !== String(values[idx])) return false;
      continue;
    }

    // Generic equality with param: col = $n
    const mEq = c.match(/([a-zA-Z0-9_]+)\s*=\s*\$([0-9]+)/);
    if (mEq) {
      const col = mEq[1];
      const idx = Number(mEq[2]) - 1;
      if (String(item[col]) !== String(values[idx])) return false;
      continue;
    }

    // Fallback: unsupported condition - ignore (do not filter out)
  }
  return true;
}

export default function createJsonDb() {
  return {
    query: async (sql, values = []) => {
      const state = await loadState();
      const tbl = 'properties';

      const sqlU = (sql || '').trim();

      // SELECT single by id
      if (/SELECT\s+\*\s+FROM\s+properties[\s\S]*WHERE[\s\S]*id\s*=\s*\$1/i.test(sqlU) || /SELECT\s+\*\s+FROM\s+properties[\s\S]*WHERE\s+id\s*=\s*\$1\s+LIMIT\s+1/i.test(sqlU)) {
        const id = values[0];
        const found = state.properties.find((p) => String(p.id) === String(id));
        return makeRows(found ? [found] : []);
      }

      // SELECT list with optional WHERE/ORDER/LIMIT
      if (/SELECT\s+\*\s+FROM\s+properties/i.test(sqlU)) {
        // Extract WHERE clause if present
        const whereMatch = sqlU.match(/WHERE\s+([\s\S]*?)(ORDER BY|LIMIT|$)/i);
        const conditions = whereMatch ? whereMatch[1].split(/\s+AND\s+/i).filter(Boolean) : [];
        let rows = state.properties.filter((p) => matchWhereConditions(p, conditions, values));

        // ORDER BY featured DESC, created_at DESC (common pattern)
        if (/ORDER BY\s+featured\s+DESC/i.test(sqlU)) {
          rows = rows.sort((a, b) => {
            if (Boolean(b.featured) - Boolean(a.featured)) return Boolean(b.featured) - Boolean(a.featured);
            const da = new Date(a.created_at || 0).getTime();
            const db = new Date(b.created_at || 0).getTime();
            return db - da;
          });
        }

        const limitMatch = sqlU.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) rows = rows.slice(0, Number(limitMatch[1]));

        return makeRows(rows);
      }

      // INSERT INTO properties ... RETURNING *
      if (/INSERT\s+INTO\s+properties/i.test(sqlU)) {
        // Values correspond to a known order used by the app
        const [
          title, description, price, currency, type, bedrooms, bathrooms, area_sqm, locationRaw, imagesRaw, featured, status, created_by,
        ] = values;

        const prop = {
          id: genId(),
          title: title || '',
          description: description || '',
          price: Number(price || 0),
          currency: currency || 'USD',
          type: type || 'house',
          bedrooms: Number(bedrooms || 0),
          bathrooms: Number(bathrooms || 0),
          area_sqm: Number(area_sqm || 0),
          location: parseMaybeJson(locationRaw) || {},
          images: Array.isArray(parseMaybeJson(imagesRaw)) ? parseMaybeJson(imagesRaw) : [],
          featured: Boolean(featured),
          status: status || 'draft',
          created_by: created_by || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        state.properties.unshift(prop);
        await saveState();
        return makeRows([prop]);
      }

      // UPDATE properties SET ... WHERE id = $n RETURNING *
      if (/UPDATE\s+properties\s+SET/i.test(sqlU)) {
        // Extract set clause up to WHERE
        const setMatch = sqlU.match(/UPDATE\s+properties\s+SET\s+([\s\S]*?)\s+WHERE\s+id\s*=\s*\$([0-9]+)/i);
        if (!setMatch) return makeRows([]);
        const setClause = setMatch[1];
        const idParamIndex = Number(setMatch[2]) - 1;
        const id = values[idParamIndex];

        const assignments = setClause.split(',').map((s) => s.trim()).filter(Boolean);
        const updates = {};
        // values for updates are the first N values (excluding the id param at the end)
        const updateValues = values.slice(0, values.length - 1);
        let vi = 0;
        for (const a of assignments) {
          // column = $n (::jsonb)?
          const m = a.match(/([a-zA-Z0-9_]+)\s*=\s*\$([0-9]+)/);
          if (!m) continue;
          const col = m[1];
          const val = updateValues[vi++];
          if (col === 'images' || col === 'location') {
            updates[col] = parseMaybeJson(val);
          } else {
            updates[col] = val;
          }
        }

        const idx = state.properties.findIndex((p) => String(p.id) === String(id));
        if (idx === -1) return makeRows([]);
        const existing = state.properties[idx];
        const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
        state.properties[idx] = updated;
        await saveState();
        return makeRows([updated]);
      }

      // DELETE FROM properties WHERE id = $1 RETURNING *
      if (/DELETE\s+FROM\s+properties/i.test(sqlU)) {
        const id = values[0];
        const idx = state.properties.findIndex((p) => String(p.id) === String(id));
        if (idx === -1) return makeRows([]);
        const removed = state.properties.splice(idx, 1);
        await saveState();
        return makeRows(removed);
      }

      // Unsupported SQL - return empty result
      return { rows: [] };
    },

    connect: async () => {
      // Return an object that supports `query()` and `release()` to mimic pg client
      const adapter = await createJsonDb();
      return {
        query: adapter.query,
        release: () => {},
      };
    },
  };
}
