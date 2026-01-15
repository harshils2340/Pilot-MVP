import { clientPromise } from './mongodb';

export const mockClients = [
  {
    id: '1',
    businessName: 'Riverside Coffee Co.',
    jurisdiction: 'Portland, OR',
    activePermits: 4,
    status: 'action-required',
    lastActivity: '2 hours ago',
    completionRate: 75,
  },
  {
    id: '2',
    businessName: 'Pacific Manufacturing LLC',
    jurisdiction: 'Seattle, WA',
    activePermits: 7,
    status: 'submitted',
    lastActivity: '1 day ago',
    completionRate: 100,
  },
  {
    id: '3',
    businessName: 'Urban Eats Restaurant Group',
    jurisdiction: 'San Francisco, CA',
    activePermits: 12,
    status: 'draft',
    lastActivity: '3 hours ago',
    completionRate: 45,
  },
  {
    id: '4',
    businessName: 'GreenTech Solutions Inc.',
    jurisdiction: 'Austin, TX',
    activePermits: 3,
    status: 'approved',
    lastActivity: '5 days ago',
    completionRate: 100,
  },
  {
    id: '5',
    businessName: 'Mountain View Brewery',
    jurisdiction: 'Denver, CO',
    activePermits: 8,
    status: 'submitted',
    lastActivity: '12 hours ago',
    completionRate: 90,
  },
];

// 🔹 Used by layout, API routes, dashboard, etc.
export function getClientById(clientsId: string) {
  return mockClients.find(client => client.id === clientsId);
}

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
