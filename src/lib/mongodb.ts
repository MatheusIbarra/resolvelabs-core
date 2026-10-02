import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Cache global: sobrevive ao hot reload (dev) e a invocações reaproveitadas (serverless),
// evitando abrir uma nova conexão a cada requisição e esgotar o pool.
const cached: MongooseCache = (globalThis.mongoose ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não definida.");

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // permite nova tentativa na próxima requisição
    throw err;
  }
  return cached.conn;
}
