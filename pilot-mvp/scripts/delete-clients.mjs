#!/usr/bin/env node
/**
 * Delete clients from MongoDB by business name.
 * Usage: node scripts/delete-clients.mjs
 * Loads .env.local from pilot-mvp/ for MONGODB_URI
 */

import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const envPath = resolve(__dirname, '../.env.local');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
} catch (e) {
  console.error('Could not load .env.local:', e.message);
  process.exit(1);
}

const NAMES_TO_DELETE = [
  'Tiger cafe',
  'Riverside company',
  'Convenience Store Co.',
  'katana',
  'more',
  'more 2 co.',
  'more 3',
  'more 4',
  'more 5',
  'more 7',
  'more 7 co.',
  'more 6',
  'more 8',
  'Harshils2340',
  'Shahmeet8210',
  'bob',
  'Anastasia Morrison, LMFT',
  'Anands Consulting Company',
  'test client',
].map((n) => n.trim().toLowerCase());

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri, { autoSelectFamily: false });
  try {
    await client.connect();
    const db = client.db();
    const clientsColl = db.collection('clients');
    // Mongoose default: PermitManagement -> permitmanagements, DiscoveredPermit -> discoveredPermits (from schema)
    const permitsColl = db.collection('permitmanagements');
    const discoveredColl = db.collection('discoveredPermits');

    const all = await clientsColl.find({}).toArray();
    const toDelete = all.filter((c) =>
      NAMES_TO_DELETE.includes((c.businessName || '').trim().toLowerCase())
    );

    if (toDelete.length === 0) {
      console.log('No matching clients found.');
      return;
    }

    console.log(`Found ${toDelete.length} client(s) to delete:`);
    toDelete.forEach((c) => console.log(`  - ${c.businessName} (${c._id})`));

    const ids = toDelete.map((c) => c._id);
    const idStrings = ids.map((id) => id.toString());

    const permRes = await permitsColl.deleteMany({ clientId: { $in: idStrings } });
    console.log(`Deleted ${permRes.deletedCount} permit management entries`);

    const discRes = await discoveredColl.deleteMany({ clientId: { $in: idStrings } });
    console.log(`Deleted ${discRes.deletedCount} discovered permit entries`);

    const clientRes = await clientsColl.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${clientRes.deletedCount} client(s)`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
