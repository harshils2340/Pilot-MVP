import { ObjectId } from 'mongodb';
import connectToDB from './mongodb';
import ClientModel from '../models/client';

/**
 * Resolves a client URL parameter to a MongoDB ObjectId string.
 * Tries: ObjectId → businessName → seed `id` field.
 * Uses $or to collapse 3 sequential queries into 1.
 */
export async function resolveClientId(clientParam: string): Promise<string | null> {
  await connectToDB();

  // Fast path: if it's a valid ObjectId, try direct lookup first (most common case)
  if (ObjectId.isValid(clientParam)) {
    const client = await ClientModel.findById(clientParam).select('_id').lean();
    if (client) return (client._id as ObjectId).toString();
  }

  // Fallback: single $or query instead of 2 sequential queries
  const match = await ClientModel.findOne({
    $or: [{ businessName: clientParam }, { id: clientParam }],
  }).select('_id').lean();

  return match ? (match._id as ObjectId).toString() : null;
}
