import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let cached = global._mongooseCached || { conn: null, promise: null };
let memServer = global._mongooseMemServer || null;

global._mongooseCached = cached;
global._mongooseMemServer = memServer;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  const forceMem = (process.env.USE_IN_MEMORY_DB || '').toLowerCase() === 'true';
  let uri = process.env.MONGODB_URI;
  if (forceMem) {
    // Explicitly force in-memory DB (even in production, with warning)
    if (!memServer) {
      memServer = await MongoMemoryServer.create();
      global._mongooseMemServer = memServer;
    }
    uri = memServer.getUri();
    const prodNote = env === 'production' ? ' (WARNING: production environment)' : '';
    console.warn('[DB] Forcing in-memory MongoDB via USE_IN_MEMORY_DB=true' + prodNote);
  } else if (!uri) {
    // Fallback to in-memory MongoDB in non-production if URI is missing
    if (env !== 'production') {
      if (!memServer) {
        memServer = await MongoMemoryServer.create();
        global._mongooseMemServer = memServer;
      }
      uri = memServer.getUri();
      console.warn('[DB] Using in-memory MongoDB instance for development/testing');
    } else {
      throw new Error('Missing MONGODB_URI in environment');
    }
  }

  if (!cached.promise) {
    const resolvedUri = uri;
    cached.promise = mongoose
      .connect(resolvedUri, {
        dbName: process.env.MONGODB_DB || undefined,
        // poolSize and other options auto-managed in Mongoose 8
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected');
        return mongooseInstance;
      })
      .catch((err) => {
        // Safer logging: avoid leaking credentials; show cluster host and db name
        const dbName = process.env.MONGODB_DB || '(default)';
        let clusterHost = '';
        try {
          // rough parse: take text after '@' up to next '/'
          const atIdx = (resolvedUri || '').indexOf('@');
          if (atIdx >= 0) {
            const after = resolvedUri.slice(atIdx + 1);
            const slash = after.indexOf('/');
            clusterHost = slash >= 0 ? after.slice(0, slash) : after;
          } else if (resolvedUri?.startsWith('mongodb://') || resolvedUri?.startsWith('mongodb+srv://')) {
            // no credentials pattern; extract host between '://' and next '/'
            const start = resolvedUri.indexOf('://') + 3;
            const after = resolvedUri.slice(start);
            const slash = after.indexOf('/');
            clusterHost = slash >= 0 ? after.slice(0, slash) : after;
          }
        } catch {}
        const name = err?.name || 'Error';
        const message = err?.message || String(err);
        const reason = err?.reason?.message || '';
        console.error('[DB] MongoDB connection error:', {
          name,
          message,
          reason,
          env,
          dbName,
          clusterHost,
        });
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB disconnected');
  }
  if (memServer) {
    await memServer.stop();
    memServer = null;
    global._mongooseMemServer = null;
    console.log('In-memory MongoDB stopped');
  }
}
