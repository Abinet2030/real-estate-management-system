// MongoDB models removed. This file provides a safe stub so imports do not crash.
const stub = {
  unsupported: true,
  find: async () => { throw new Error('MongoDB removed; use Postgres (DATABASE_URL) instead'); },
  findById: async () => null,
  create: async () => { throw new Error('MongoDB removed; use Postgres (DATABASE_URL) instead'); },
  findByIdAndUpdate: async () => null,
  findByIdAndDelete: async () => null,
};

export default stub;
