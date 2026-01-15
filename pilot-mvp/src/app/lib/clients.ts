import { clientPromise } from './mongodb';
import { ObjectId } from 'mongodb';

export async function getClientById(clientsId: string) {
  try {
    const client = await clientPromise;
    const db = client.db('pilotClients');

    // Support both ObjectId and string IDs
    const query = ObjectId.isValid(clientsId)
      ? { _id: new ObjectId(clientsId) }
      : { id: clientsId };

    return await db.collection('clients').findOne(query);
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return null;
  }
}
