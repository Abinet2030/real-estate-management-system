import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'database', 'data.json');

async function load() {
  try {
    const txt = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(txt);
  } catch (err) {
    return { properties: [], users: [], inquiries: [], inquiryMessages: [], offers: [] };
  }
}

async function save(state) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(state, null, 2), 'utf8');
}

function genId(prefix = '') {
  return prefix + crypto.randomBytes(6).toString('hex');
}

function matchFilter(item, filter = {}) {
  for (const k of Object.keys(filter)) {
    const v = filter[k];
    if (v === undefined) continue;
    if (typeof v === 'object' && v !== null) {
      // simple $in support
      if (v.$in && !v.$in.includes(item[k])) return false;
      continue;
    }
    if (String(item[k]) !== String(v)) return false;
  }
  return true;
}

export async function find(collection, filter = {}) {
  const state = await load();
  const arr = state[collection] || [];
  return arr.filter((i) => matchFilter(i, filter));
}

export async function findOne(collection, filter = {}) {
  const items = await find(collection, filter);
  return items[0] || null;
}

export async function findById(collection, id) {
  const state = await load();
  const arr = state[collection] || [];
  return arr.find((i) => String(i._id || i.id) === String(id)) || null;
}

export async function create(collection, data) {
  const state = await load();
  const arr = state[collection] || (state[collection] = []);
  const now = new Date().toISOString();
  const item = { _id: genId(collection + '-'), ...data, createdAt: now, updatedAt: now };
  arr.unshift(item);
  await save(state);
  return item;
}

export async function updateById(collection, id, update) {
  const state = await load();
  const arr = state[collection] || [];
  const idx = arr.findIndex((i) => String(i._id || i.id) === String(id));
  if (idx === -1) return null;
  const now = new Date().toISOString();
  arr[idx] = { ...arr[idx], ...update, updatedAt: now };
  await save(state);
  return arr[idx];
}

export async function deleteById(collection, id) {
  const state = await load();
  const arr = state[collection] || [];
  const idx = arr.findIndex((i) => String(i._id || i.id) === String(id));
  if (idx === -1) return null;
  const removed = arr.splice(idx, 1)[0];
  await save(state);
  return removed;
}

export default { load, save, genId, find, findOne, findById, create, updateById, deleteById };
