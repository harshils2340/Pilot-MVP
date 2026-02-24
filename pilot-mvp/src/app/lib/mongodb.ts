import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

const isDev = process.env.NODE_ENV === "development";

// DEV: allow self-signed certs for local MongoDB. PROD: Atlas rejects tlsAllowInvalid* — causes ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR
const devSslOptions = {
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
};

// PROD: Fix MongoDB Atlas + Vercel serverless TLS handshake (ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR)
const prodOptions = {
  autoSelectFamily: false,
};

const mongooseOptions = isDev
  ? { tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true }
  : prodOptions;

const mongoClientOptions = isDev ? devSslOptions : prodOptions;

// Mongoose connection (for connectToDB)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, mongooseOptions).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Native MongoDB client (for clientPromise)
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, mongoClientOptions);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI, mongoClientOptions);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { clientPromise };

// Also export connectToDB as default for mongoose usage
export default connectToDB;

