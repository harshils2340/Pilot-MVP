import { clientPromise } from './mongodb';
// Re-export mock data so existing imports from seedClients still work
export { mockClients, getClientById } from './mockClients';
import { mockClients } from './mockClients';

// 🔹 One-time DB seeding (unchanged behavior)
export async function seedClients() {
  try {
    const client = await clientPromise;
    const db = client.db('pilotClients');
    const collection = db.collection('clients');

    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany(mockClients);
      console.log('✅ Mock clients inserted into the database');
    } else {
      console.log('ℹ️ Clients already exist in the database');
    }
  } catch (err) {
    console.error('Failed to seed clients:', err);
  }
}
